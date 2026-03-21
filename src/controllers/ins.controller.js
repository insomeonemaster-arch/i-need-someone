const openai = require('../lib/openai');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = require('../lib/prisma');

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are INS (I Need Someone), a smart assistant for a services marketplace. You help users CREATE service requests/jobs/projects, READ their existing data, and UPDATE records — all through natural conversation.

RESPONSE FORMAT — Always return ONLY valid JSON, nothing else:
{
  "message": "concise reply, max 3 sentences",
  "intent": "create|read|update|general",
  "fetch_action": "list_service_requests|list_jobs|list_projects|get_earnings|none",
  "quick_replies": ["label 1", "label 2"],
  "collected_data": null,
  "is_complete": false,
  "update_proposal": null
}

EFFICIENCY RULES:
- NEVER ask for one field at a time — ask for ALL required fields in ONE message.
- Keep replies short and direct (2–3 sentences max).
- Always include 2–3 relevant quick_replies for follow-up actions.

INTENT DETECTION:
- "create" → user wants to post something new
- "read"   → user wants to see/view/list/show their data or earnings
- "update" → user wants to change/edit something
- "general" → help, questions, other

READ → set fetch_action:
- service requests / local services / my requests → "list_service_requests"
- jobs / job postings / my jobs → "list_jobs"
- projects / my projects → "list_projects"
- earnings / income / how much have I earned → "get_earnings"
- informational only → "none"

=== CREATE: LOCAL SERVICES ===
Required: title, description, category (plumbing|electrical|painting|cleaning|landscaping|hvac), addressLine1, city, state (2-letter), postalCode
Optional: urgency (low|medium|high|emergency), budgetMin, budgetMax (numbers)
→ Ask ALL required fields in one message: "What work do you need? Tell me: what it is, the service type (plumbing/electrical/painting/cleaning/landscaping/hvac), and your full address including zip code."

=== CREATE: JOBS ===
Required: title, description, category (administrative|sales-marketing|customer-service|technology), employmentType (full_time|part_time|contract|temporary), workLocation (on_site|remote|hybrid)
Optional: salaryMin, salaryMax (numbers, annual)
→ Ask ALL in one message: "Tell me about the role: job title, full description, category, employment type (full-time/part-time/contract/temporary), and work location (on-site/remote/hybrid)."

=== CREATE: PROJECTS ===
Required: title, description, category (web-development|mobile-development|graphic-design|content-writing|video-animation)
Optional: budgetMin, budgetMax (numbers), deadline (ISO date)
→ Ask ALL in one message: "Describe the project: title, what you need delivered, and which category fits (web/mobile dev, graphic design, content writing, video/animation)."

COLLECTED DATA RULES:
- Carry ALL collected fields forward in every response — never reset collected_data
- Keep collected_data null until you have at least title + description
- Set is_complete: true only when ALL required fields are present and confirmed
- Before is_complete: true, give one confirmation sentence: "Got it — [summary]. Shall I post this?"

UPDATE FLOW:
When the user wants to edit a record and provides an entity_id, return:
{
  "update_proposal": {
    "entity_type": "service_request|job|project",
    "entity_id": "the UUID from the conversation",
    "fields": { "fieldName": "newValue" }
  }
}
Only include fields the user explicitly asked to change. Never invent IDs.`;

// ---------------------------------------------------------------------------
// DATA FETCH HELPERS
// ---------------------------------------------------------------------------
const fetchServiceRequests = async (userId, limit = 5) => {
  const [items, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, status: true, urgency: true,
        city: true, state: true, budgetMin: true, budgetMax: true, createdAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.serviceRequest.count({ where: { clientId: userId } }),
  ]);
  return { items, total, hasMore: total > limit };
};

const fetchJobs = async (userId, limit = 5) => {
  const [items, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where: { employerId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, status: true, employmentType: true, workLocation: true,
        salaryMin: true, salaryMax: true, createdAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.jobPosting.count({ where: { employerId: userId } }),
  ]);
  return { items, total, hasMore: total > limit };
};

const fetchProjects = async (userId, limit = 5) => {
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, status: true,
        budgetMin: true, budgetMax: true, deadline: true, createdAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.project.count({ where: { clientId: userId } }),
  ]);
  return { items, total, hasMore: total > limit };
};

const fetchEarnings = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalResult, monthResult, pendingResult] = await Promise.all([
    prisma.transaction.aggregate({
      where: { payeeId: userId, status: 'completed' },
      _sum: { providerEarnings: true },
    }),
    prisma.transaction.aggregate({
      where: { payeeId: userId, status: 'completed', createdAt: { gte: startOfMonth } },
      _sum: { providerEarnings: true },
    }),
    prisma.transaction.aggregate({
      where: { payeeId: userId, status: 'pending' },
      _sum: { providerEarnings: true },
    }),
  ]);
  return {
    totalEarnings: Number(totalResult._sum.providerEarnings || 0),
    thisMonthEarnings: Number(monthResult._sum.providerEarnings || 0),
    pendingPayouts: Number(pendingResult._sum.providerEarnings || 0),
  };
};

// Whitelisted fields per entity type — prevents mass-assignment attacks
const ALLOWED_UPDATE_FIELDS = {
  service_request: ['title', 'description', 'urgency', 'budgetMin', 'budgetMax', 'addressLine1', 'city', 'state', 'postalCode'],
  job: ['title', 'description', 'employmentType', 'workLocation', 'salaryMin', 'salaryMax'],
  project: ['title', 'description', 'budgetMin', 'budgetMax', 'deadline'],
};

const applyEntityUpdate = async (userId, entityType, entityId, fields) => {
  const allowed = ALLOWED_UPDATE_FIELDS[entityType];
  if (!allowed) return null;
  const safe = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
  if (Object.keys(safe).length === 0) return null;
  if (safe.deadline) safe.deadline = new Date(safe.deadline);

  if (entityType === 'service_request') {
    const existing = await prisma.serviceRequest.findFirst({ where: { id: entityId, clientId: userId } });
    if (!existing) return null;
    return prisma.serviceRequest.update({ where: { id: entityId }, data: safe });
  }
  if (entityType === 'job') {
    const existing = await prisma.jobPosting.findFirst({ where: { id: entityId, employerId: userId } });
    if (!existing) return null;
    return prisma.jobPosting.update({ where: { id: entityId }, data: safe });
  }
  if (entityType === 'project') {
    const existing = await prisma.project.findFirst({ where: { id: entityId, clientId: userId } });
    if (!existing) return null;
    return prisma.project.update({ where: { id: entityId }, data: safe });
  }
  return null;
};

// ---------------------------------------------------------------------------
// HANDLERS
// ---------------------------------------------------------------------------
const startConversation = async (req, res, next) => {
  try {
    const { conversationType, category, mode } = req.body;

    const conversation = await prisma.insConversation.create({
      data: {
        userId: req.user.id,
        conversationType: conversationType || 'assistant',
        category: category || null,
        mode: mode || 'client',
      },
    });

    const greeting = "Hi! I'm INS. I can help you create service requests, jobs, or projects — and show or edit your existing ones. What do you need?";

    await prisma.insMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: greeting, aiModel: 'gpt-4o' },
    });

    return success(res, { conversation, greeting }, 201);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content, inputMethod = 'text' } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return error(res, 'Message content required', 400, 'VALIDATION_ERROR');
    }

    const conversation = await prisma.insConversation.findFirst({
      where: { id: req.params.id, userId: req.user.id, status: 'active' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) return error(res, 'Conversation not found', 404, 'NOT_FOUND');

    // Save user message
    await prisma.insMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: content.trim(), inputMethod },
    });

    // Use last 8 messages to keep token usage low
    const recentMessages = conversation.messages.slice(-8);
    const history = recentMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    // Inject in-progress collected data as a system context note (cheaper than re-stating in chat)
    const systemMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (conversation.collectedData && Object.keys(conversation.collectedData).length > 0) {
      systemMessages.push({
        role: 'system',
        content: `[Active create flow — data collected so far: ${JSON.stringify(conversation.collectedData)}]`,
      });
    }

    history.push({ role: 'user', content: content.trim() });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [...systemMessages, ...history],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { message: responseText, intent: 'general', fetch_action: 'none', quick_replies: [], collected_data: null, is_complete: false };
    }

    // Fetch real DB data when AI signals a read action
    let dataPayload = null;
    const fetchAction = parsed.fetch_action || 'none';
    try {
      if (fetchAction === 'list_service_requests') {
        const result = await fetchServiceRequests(req.user.id);
        dataPayload = { type: 'list', entityType: 'service_request', ...result };
      } else if (fetchAction === 'list_jobs') {
        const result = await fetchJobs(req.user.id);
        dataPayload = { type: 'list', entityType: 'job', ...result };
      } else if (fetchAction === 'list_projects') {
        const result = await fetchProjects(req.user.id);
        dataPayload = { type: 'list', entityType: 'project', ...result };
      } else if (fetchAction === 'get_earnings') {
        const result = await fetchEarnings(req.user.id);
        dataPayload = { type: 'stats', ...result };
      }
    } catch (fetchErr) {
      console.error('[INS] Data fetch error:', fetchErr.message);
    }

    // Apply update_proposal if AI returns one — always verify ownership before writing
    let updateResult = null;
    if (
      parsed.update_proposal?.entity_id &&
      parsed.update_proposal?.entity_type &&
      parsed.update_proposal?.fields &&
      typeof parsed.update_proposal.fields === 'object'
    ) {
      try {
        const entity = await applyEntityUpdate(
          req.user.id,
          parsed.update_proposal.entity_type,
          parsed.update_proposal.entity_id,
          parsed.update_proposal.fields,
        );
        if (entity) updateResult = { entityType: parsed.update_proposal.entity_type, entity };
      } catch (updateErr) {
        console.error('[INS] Update error:', updateErr.message);
      }
    }

    // Save assistant message
    const assistantMessage = await prisma.insMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: parsed.message || '',
        aiModel: 'gpt-4o',
        tokensUsed: completion.usage?.total_tokens,
      },
    });

    // Merge collected_data
    const existing = conversation.collectedData || {};
    const mergedData = parsed.collected_data
      ? { ...existing, ...parsed.collected_data }
      : existing;

    await prisma.insConversation.update({
      where: { id: conversation.id },
      data: {
        lastInteractionAt: new Date(),
        ...(Object.keys(mergedData).length > 0 && { collectedData: mergedData }),
        ...(parsed.is_complete && { status: 'completed', completedAt: new Date() }),
      },
    });

    return success(res, {
      message: assistantMessage,
      isComplete: parsed.is_complete || false,
      collectedData: parsed.collected_data || null,
      quickReplies: Array.isArray(parsed.quick_replies) ? parsed.quick_replies.slice(0, 4) : [],
      dataPayload,
      updateResult,
    });
  } catch (err) {
    next(err);
  }
};

// Direct entity update endpoint (from interactive card buttons in the chat UI)
const updateEntity = async (req, res, next) => {
  try {
    const { entity_type, entity_id, update_fields } = req.body;
    if (!entity_type || !entity_id || !update_fields || typeof update_fields !== 'object') {
      return error(res, 'entity_type, entity_id, and update_fields are required', 400, 'VALIDATION_ERROR');
    }

    const entity = await applyEntityUpdate(req.user.id, entity_type, entity_id, update_fields);
    if (!entity) return error(res, 'Entity not found or no valid fields to update', 404, 'NOT_FOUND');

    return success(res, { entity_type, entity });
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

    // Infer type from conversation.category, then fall back to collected data signals
    const cat = conversation.category;
    const isLocalServices = cat === 'local-services' || ['plumbing','electrical','painting','cleaning','landscaping','hvac'].includes(data.category);
    const isJob = cat === 'jobs' || data.employmentType;
    const isProject = cat === 'projects' || ['web-development','mobile-development','graphic-design','content-writing','video-animation'].includes(data.category);

    if (isLocalServices && !isJob) {
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
    } else if (isJob) {
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
    } else if (isProject) {
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

module.exports = { startConversation, sendMessage, updateEntity, getConversations, getMessages, transcribeVoice, synthesizeVoice, submitConversation, deleteConversation };
