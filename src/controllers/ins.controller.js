const { PrismaClient } = require('@prisma/client');
const openai = require('../lib/openai');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = new PrismaClient();

const SYSTEM_PROMPT = `You are INS (I Need Someone), a helpful AI assistant for a services marketplace platform. 
You help clients describe what they need (local services, jobs, projects) and guide them through posting requests.
You help providers set up their profiles and find work.
Be conversational, friendly, and collect necessary information step by step.
When you have enough information, return a JSON object with the key "collected_data" containing all the structured data collected.
Always respond in JSON format: {"message": "your response", "collected_data": null_or_object, "is_complete": false_or_true}`;

const startConversation = async (req, res, next) => {
  try {
    const { conversationType, category, mode } = req.body;

    const conversation = await prisma.insConversation.create({
      data: {
        userId: req.user.id,
        conversationType: conversationType || 'intake',
        category, mode,
      },
    });

    // Initial greeting
    const greeting = mode === 'provider'
      ? "Hi! I'm INS. I'll help you set up your provider profile. What type of services do you offer?"
      : `Hi! I'm INS. I'll help you post your ${category || 'service'} request. What do you need help with today?`;

    await prisma.insMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: greeting, aiModel: 'gpt-4' },
    });

    return success(res, { conversation, greeting }, 201);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content, inputMethod = 'text' } = req.body;
    if (!content) return error(res, 'Message content required', 400, 'VALIDATION_ERROR');

    const conversation = await prisma.insConversation.findFirst({
      where: { id: req.params.id, userId: req.user.id, status: 'active' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) return error(res, 'Conversation not found', 404, 'NOT_FOUND');

    // Save user message
    await prisma.insMessage.create({
      data: { conversationId: conversation.id, role: 'user', content, inputMethod },
    });

    // Build message history for OpenAI
    const history = conversation.messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
    history.push({ role: 'user', content });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { message: responseText, collected_data: null, is_complete: false };
    }

    // Save assistant message
    const assistantMessage = await prisma.insMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: parsed.message,
        aiModel: 'gpt-4',
        tokensUsed: completion.usage?.total_tokens,
      },
    });

    // Update conversation collected data
    if (parsed.collected_data) {
      const existing = conversation.collectedData || {};
      await prisma.insConversation.update({
        where: { id: conversation.id },
        data: {
          collectedData: { ...existing, ...parsed.collected_data },
          lastInteractionAt: new Date(),
          status: parsed.is_complete ? 'completed' : 'active',
          completedAt: parsed.is_complete ? new Date() : null,
        },
      });
    }

    return success(res, {
      message: assistantMessage,
      isComplete: parsed.is_complete || false,
      collectedData: parsed.collected_data || null,
    });
  } catch (err) {
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [conversations, total] = await Promise.all([
      prisma.insConversation.findMany({
        where: { userId: req.user.id },
        skip, take: perPage,
        orderBy: { lastInteractionAt: 'desc' },
      }),
      prisma.insConversation.count({ where: { userId: req.user.id } }),
    ]);
    return paginated(res, conversations, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const conversation = await prisma.insConversation.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!conversation) return error(res, 'Conversation not found', 404, 'NOT_FOUND');

    const messages = await prisma.insMessage.findMany({
      where: { conversationId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    return success(res, messages);
  } catch (err) {
    next(err);
  }
};

// Transcribe voice to text
const transcribeVoice = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Audio file required', 400, 'VALIDATION_ERROR');

    const transcription = await openai.audio.transcriptions.create({
      file: req.file.buffer,
      model: 'whisper-1',
    });
    return success(res, { text: transcription.text });
  } catch (err) {
    next(err);
  }
};

const submitConversation = async (req, res, next) => {
  try {
    const conversation = await prisma.insConversation.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!conversation) return error(res, 'Conversation not found', 404, 'NOT_FOUND');
    if (!conversation.collectedData) return error(res, 'No data collected yet', 400, 'VALIDATION_ERROR');

    const data = conversation.collectedData;
    let entityType, entity;

    if (conversation.category === 'local-services' && conversation.mode === 'client') {
      entity = await prisma.serviceRequest.create({
        data: {
          clientId: req.user.id,
          categoryId: data.categoryId,
          title: data.title,
          description: data.description,
          urgency: data.urgency,
          addressLine1: data.addressLine1 || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          budgetType: data.budgetType,
          createdVia: 'ins',
          insConversationId: conversation.id,
          insCollectedData: data,
        },
      });
      entityType = 'service_request';
    } else if (conversation.category === 'jobs' && conversation.mode === 'client') {
      entity = await prisma.jobPosting.create({
        data: {
          employerId: req.user.id,
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          employmentType: data.employmentType || 'full_time',
          workLocation: data.workLocation || 'on_site',
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          createdVia: 'ins',
          insConversationId: conversation.id,
          insCollectedData: data,
        },
      });
      entityType = 'job';
    } else if (conversation.category === 'projects' && conversation.mode === 'client') {
      entity = await prisma.project.create({
        data: {
          clientId: req.user.id,
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          budgetType: data.budgetType,
          deadline: data.deadline ? new Date(data.deadline) : null,
          createdVia: 'ins',
          insConversationId: conversation.id,
          insCollectedData: data,
        },
      });
      entityType = 'project';
    } else {
      return error(res, 'Cannot determine what to create from this conversation', 400, 'VALIDATION_ERROR');
    }

    await prisma.insConversation.update({
      where: { id: conversation.id },
      data: { status: 'completed', completedAt: new Date(), createdEntityType: entityType, createdEntityId: entity.id },
    });

    return success(res, { entityType, entity });
  } catch (err) {
    next(err);
  }
};

const synthesizeVoice = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return error(res, 'Text required', 400, 'VALIDATION_ERROR');

    const mp3 = await openai.audio.speech.create({ model: 'tts-1', voice: 'alloy', input: text });
    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    await prisma.insConversation.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    return success(res, { message: 'Conversation deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { startConversation, sendMessage, getConversations, getMessages, transcribeVoice, synthesizeVoice, submitConversation, deleteConversation };
