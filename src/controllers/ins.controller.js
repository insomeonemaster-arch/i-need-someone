const openai = require('../lib/openai');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = require('../lib/prisma');

const SYSTEM_PROMPT = `You are INS (I Need Someone), an AI assistant for a services marketplace. You help users create service requests, job postings, and projects through friendly conversation.

CRITICAL RULES:
1. ALWAYS respond ONLY with valid JSON — no other text: {"message":"your message","collected_data":null,"is_complete":false}
2. Include ALL data collected SO FAR in every "collected_data" field — carry forward previous answers, do not reset
3. Keep "collected_data" as null until you have at least a title and description
4. Set "is_complete": true only when ALL required fields are present

=== LOCAL SERVICES (category: local-services) ===
Required fields in collected_data:
- title: brief title, e.g. "Fix leaking kitchen pipe"
- description: detailed description of the work needed
- category: MUST be exactly one of: plumbing, electrical, painting, cleaning, landscaping, hvac
- addressLine1: street address where work is needed
- city, state (2-letter), postalCode
Optional: urgency ("low"|"medium"|"high"|"emergency"), budgetMin, budgetMax (numbers)

=== JOBS (category: jobs) ===
Required fields in collected_data:
- title: job title
- description: full job description with responsibilities and requirements
- category: MUST be exactly one of: administrative, sales-marketing, customer-service, technology
- employmentType: "full_time"|"part_time"|"contract"|"temporary"
- workLocation: "on_site"|"remote"|"hybrid"
Optional: salaryMin, salaryMax (numbers, annual)

=== PROJECTS (category: projects) ===
Required fields in collected_data:
- title: project title
- description: project scope and deliverables
- category: MUST be exactly one of: web-development, mobile-development, graphic-design, content-writing, video-animation
Optional: budgetMin, budgetMax (numbers), deadline (ISO date string, e.g. "2025-06-30")

Guidelines:
- Ask for 1-2 pieces of information at a time, conversationally
- Before setting is_complete:true, summarize what you collected and confirm with the user
- Never invent UUIDs or database IDs — use the exact category name strings listed above`;

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
      model: 'gpt-4o',
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

    // Always update lastInteractionAt; merge collected_data whenever AI provides it;
    // and update status to completed when AI signals is_complete (even if no new data batch)
    const existing = conversation.collectedData || {};
    const mergedData = parsed.collected_data
      ? { ...existing, ...parsed.collected_data }
      : existing;
    const updatePayload = {
      lastInteractionAt: new Date(),
      ...(Object.keys(mergedData).length > 0 && { collectedData: mergedData }),
      ...(parsed.is_complete && { status: 'completed', completedAt: new Date() }),
    };
    await prisma.insConversation.update({ where: { id: conversation.id }, data: updatePayload });

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

// Resolve a categoryId from the DB by matching the AI-provided category name/slug.
// Falls back to the first active category for the module if no exact match found.
const resolveCategoryId = async (categoryHint, module) => {
  if (categoryHint) {
    const slug = categoryHint.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const cat = await prisma.category.findFirst({
      where: {
        module,
        isActive: true,
        OR: [
          { slug },
          { slug: { contains: slug } },
          { name: { contains: categoryHint, mode: 'insensitive' } },
        ],
      },
    });
    if (cat) return cat.id;
  }
  // Fallback: first active category for the module
  const fallback = await prisma.category.findFirst({
    where: { module, isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
  return fallback?.id || null;
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
      const categoryId = data.categoryId || await resolveCategoryId(data.category, 'local-services');
      if (!categoryId) return error(res, 'Could not determine service category', 400, 'VALIDATION_ERROR');
      entity = await prisma.serviceRequest.create({
        data: {
          clientId: req.user.id,
          categoryId,
          title: data.title || 'Service Request',
          description: data.description || '',
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
      const categoryId = data.categoryId || await resolveCategoryId(data.category, 'jobs');
      if (!categoryId) return error(res, 'Could not determine job category', 400, 'VALIDATION_ERROR');
      entity = await prisma.jobPosting.create({
        data: {
          employerId: req.user.id,
          title: data.title || 'Job Posting',
          description: data.description || '',
          categoryId,
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
      const categoryId = data.categoryId || await resolveCategoryId(data.category, 'projects');
      if (!categoryId) return error(res, 'Could not determine project category', 400, 'VALIDATION_ERROR');
      entity = await prisma.project.create({
        data: {
          clientId: req.user.id,
          title: data.title || 'Project',
          description: data.description || '',
          categoryId,
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
