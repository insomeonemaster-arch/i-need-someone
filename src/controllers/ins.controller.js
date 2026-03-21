const openai = require('../lib/openai');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = require('../lib/prisma');

// ---------------------------------------------------------------------------
// SYSTEM PROMPTS — compact for reads, full for create flows (saves tokens)
// ---------------------------------------------------------------------------
const BASE_SYSTEM_PROMPT = `You are INS, a smart assistant for a services marketplace. Help users CREATE service requests/jobs/projects, READ their data, UPDATE records, and take ACTIONS (cancel, accept, reject) — all through natural conversation.

RESPONSE FORMAT — Always return ONLY valid JSON:
{
  "message": "concise reply, max 2 sentences",
  "intent": "create|read|update|action|general",
  "fetch_action": "none",
  "fetch_entity_id": null,
  "page": 1,
  "quick_replies": ["label 1", "label 2"],
  "collected_data": null,
  "is_complete": false,
  "update_proposal": null,
  "action_proposal": null
}

RULES:
- Keep replies to 1–2 sentences. Always include 2–3 quick_replies.
- NEVER ask for one field at a time — ask for ALL required fields in ONE message.

INTENT DETECTION:
- "create" → post/create something new
- "read" → see/view/list/show data or earnings
- "update" → change/edit a record
- "action" → cancel, close, accept, reject, shortlist
- "general" → help, questions, other

READ → set fetch_action + page (default 1). Set fetch_entity_id when a UUID is referenced:
- service requests / my requests → "list_service_requests"
- jobs / my jobs → "list_jobs"
- projects / my projects → "list_projects"
- earnings / income → "get_earnings"
- quotes for a request → "list_quotes" + fetch_entity_id = request UUID
- applications for a job → "list_applications" + fetch_entity_id = job UUID
- proposals for a project → "list_proposals" + fetch_entity_id = project UUID
- transactions / payments → "list_transactions"
- "show more" / "older" / "next page" → same fetch_action as before, page + 1
- none → "none"

ACTION → set action_proposal:
{
  "action_proposal": {
    "action": "cancel_request|close_job|cancel_project|accept_quote|reject_quote|accept_proposal|reject_proposal|shortlist_application|reject_application",
    "entity_id": "UUID from conversation",
    "confirm": false
  }
}
First request: set confirm:false, ask user to confirm.
After user says yes: set confirm:true to execute.
Never invent IDs.

UPDATE → set update_proposal:
{
  "update_proposal": {
    "entity_type": "service_request|job|project",
    "entity_id": "UUID",
    "fields": { "fieldName": "newValue" }
  }
}
Only include fields the user explicitly asked to change. Never invent IDs.`;

const CREATE_ADDENDUM = `

=== CREATE: LOCAL SERVICES ===
Required: title, description, category (plumbing|electrical|painting|cleaning|landscaping|hvac), addressLine1, city, state (2-letter), postalCode
Optional: urgency (low|medium|high|emergency), budgetMin, budgetMax (numbers)
→ Ask ALL required fields in one message.

=== CREATE: JOBS ===
Required: title, description, category (administrative|sales-marketing|customer-service|technology), employmentType (full_time|part_time|contract|temporary), workLocation (on_site|remote|hybrid)
Optional: salaryMin, salaryMax (numbers, annual)
→ Ask ALL in one message.

=== CREATE: PROJECTS ===
Required: title, description, category (web-development|mobile-development|graphic-design|content-writing|video-animation)
Optional: budgetMin, budgetMax (numbers), deadline (ISO date)
→ Ask ALL in one message.

COLLECTED DATA RULES:
- Carry ALL collected fields forward — never reset collected_data.
- Keep collected_data null until you have at least title + description.
- Set is_complete:true only when ALL required fields are present and confirmed.
- Before is_complete:true, confirm: "Got it — [summary]. Shall I post this?"`;

// ---------------------------------------------------------------------------
// DATA FETCH HELPERS
// ---------------------------------------------------------------------------
const fetchServiceRequests = async (userId, page = 1, limit = 5) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, title: true, status: true, urgency: true,
        city: true, state: true, budgetMin: true, budgetMax: true, createdAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.serviceRequest.count({ where: { clientId: userId } }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return { items, total, page, totalPages, hasMore: page < totalPages };
};

const fetchJobs = async (userId, page = 1, limit = 5) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.jobPosting.findMany({
      where: { employerId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, title: true, status: true, employmentType: true, workLocation: true,
        salaryMin: true, salaryMax: true, createdAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.jobPosting.count({ where: { employerId: userId } }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return { items, total, page, totalPages, hasMore: page < totalPages };
};

const fetchProjects = async (userId, page = 1, limit = 5) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, title: true, status: true,
        budgetMin: true, budgetMax: true, deadline: true, createdAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.project.count({ where: { clientId: userId } }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return { items, total, page, totalPages, hasMore: page < totalPages };
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

// ---------------------------------------------------------------------------
// NEW FETCH HELPERS (quotes, applications, proposals, transactions)
// ---------------------------------------------------------------------------
const fetchQuotes = async (userId, serviceRequestId, page = 1, limit = 5) => {
  const request = await prisma.serviceRequest.findFirst({
    where: { id: serviceRequestId, clientId: userId },
    select: { id: true },
  });
  if (!request) return null;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.serviceQuote.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, price: true, message: true, status: true,
        estimatedHours: true, availabilityDate: true, createdAt: true,
        provider: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.serviceQuote.count({ where: { serviceRequestId } }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return { items, total, page, totalPages, hasMore: page < totalPages };
};

const fetchApplications = async (userId, jobPostingId, page = 1, limit = 5) => {
  const job = await prisma.jobPosting.findFirst({
    where: { id: jobPostingId, employerId: userId },
    select: { id: true },
  });
  if (!job) return null;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { jobPostingId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, status: true, coverLetter: true, expectedSalary: true,
        availableFrom: true, createdAt: true,
        applicant: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.jobApplication.count({ where: { jobPostingId } }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return { items, total, page, totalPages, hasMore: page < totalPages };
};

const fetchProposals = async (userId, projectId, page = 1, limit = 5) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: userId },
    select: { id: true },
  });
  if (!project) return null;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.projectProposal.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, proposedPrice: true, coverLetter: true, status: true,
        estimatedDuration: true, createdAt: true,
        provider: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.projectProposal.count({ where: { projectId } }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return { items, total, page, totalPages, hasMore: page < totalPages };
};

const fetchTransactions = async (userId, page = 1, limit = 5) => {
  const skip = (page - 1) * limit;
  const where = { OR: [{ payerId: userId }, { payeeId: userId }] };
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, amount: true, currency: true, status: true,
        contextType: true, platformFee: true, providerEarnings: true, createdAt: true,
      },
    }),
    prisma.transaction.count({ where }),
  ]);
  const totalPages = Math.ceil(total / limit);
  return { items, total, page, totalPages, hasMore: page < totalPages };
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
// ACTION HANDLER — cancel, close, accept, reject, shortlist
// ---------------------------------------------------------------------------
const executeAction = async (userId, actionProposal) => {
  const { action, entity_id, confirm } = actionProposal;
  if (!confirm || !entity_id) return { needsConfirmation: true, action };

  switch (action) {
    case 'cancel_request': {
      const entity = await prisma.serviceRequest.findFirst({ where: { id: entity_id, clientId: userId } });
      if (!entity) return { error: 'Service request not found' };
      if (entity.status === 'completed' || entity.status === 'cancelled')
        return { error: `Cannot cancel a ${entity.status} request` };
      const updated = await prisma.serviceRequest.update({
        where: { id: entity_id }, data: { status: 'cancelled', cancelledAt: new Date() },
      });
      return { success: true, action, entityType: 'service_request', entity: updated };
    }
    case 'close_job': {
      const entity = await prisma.jobPosting.findFirst({ where: { id: entity_id, employerId: userId } });
      if (!entity) return { error: 'Job posting not found' };
      const updated = await prisma.jobPosting.update({
        where: { id: entity_id }, data: { status: 'closed', closedAt: new Date() },
      });
      return { success: true, action, entityType: 'job', entity: updated };
    }
    case 'cancel_project': {
      const entity = await prisma.project.findFirst({ where: { id: entity_id, clientId: userId } });
      if (!entity) return { error: 'Project not found' };
      if (entity.status === 'completed' || entity.status === 'cancelled')
        return { error: `Cannot cancel a ${entity.status} project` };
      const updated = await prisma.project.update({
        where: { id: entity_id }, data: { status: 'cancelled' },
      });
      return { success: true, action, entityType: 'project', entity: updated };
    }
    case 'accept_quote': {
      const quote = await prisma.serviceQuote.findUnique({
        where: { id: entity_id },
        include: { serviceRequest: { select: { clientId: true, id: true } } },
      });
      if (!quote || quote.serviceRequest.clientId !== userId) return { error: 'Quote not found' };
      if (quote.status !== 'pending') return { error: `Quote is already ${quote.status}` };
      await prisma.$transaction([
        prisma.serviceQuote.update({ where: { id: entity_id }, data: { status: 'accepted', acceptedAt: new Date() } }),
        prisma.serviceQuote.updateMany({
          where: { serviceRequestId: quote.serviceRequestId, id: { not: entity_id } },
          data: { status: 'rejected', rejectedAt: new Date() },
        }),
        prisma.serviceRequest.update({
          where: { id: quote.serviceRequestId },
          data: { status: 'assigned', assignedProviderId: quote.providerId },
        }),
      ]);
      return { success: true, action, entityType: 'quote', entity: { id: entity_id, status: 'accepted' } };
    }
    case 'reject_quote': {
      const quote = await prisma.serviceQuote.findUnique({
        where: { id: entity_id },
        include: { serviceRequest: { select: { clientId: true } } },
      });
      if (!quote || quote.serviceRequest.clientId !== userId) return { error: 'Quote not found' };
      const updated = await prisma.serviceQuote.update({
        where: { id: entity_id }, data: { status: 'rejected', rejectedAt: new Date() },
      });
      return { success: true, action, entityType: 'quote', entity: updated };
    }
    case 'accept_proposal': {
      const proposal = await prisma.projectProposal.findUnique({
        where: { id: entity_id },
        include: { project: { select: { clientId: true, id: true } } },
      });
      if (!proposal || proposal.project.clientId !== userId) return { error: 'Proposal not found' };
      if (proposal.status !== 'pending') return { error: `Proposal is already ${proposal.status}` };
      await prisma.$transaction([
        prisma.projectProposal.update({ where: { id: entity_id }, data: { status: 'accepted', acceptedAt: new Date() } }),
        prisma.projectProposal.updateMany({
          where: { projectId: proposal.projectId, id: { not: entity_id } },
          data: { status: 'rejected', rejectedAt: new Date() },
        }),
        prisma.project.update({
          where: { id: proposal.projectId },
          data: { status: 'in_progress', assignedProviderId: proposal.providerId, startedAt: new Date() },
        }),
      ]);
      return { success: true, action, entityType: 'proposal', entity: { id: entity_id, status: 'accepted' } };
    }
    case 'reject_proposal': {
      const proposal = await prisma.projectProposal.findUnique({
        where: { id: entity_id },
        include: { project: { select: { clientId: true } } },
      });
      if (!proposal || proposal.project.clientId !== userId) return { error: 'Proposal not found' };
      if (proposal.status !== 'pending') return { error: `Proposal is already ${proposal.status}` };
      const updated = await prisma.projectProposal.update({
        where: { id: entity_id }, data: { status: 'rejected', rejectedAt: new Date() },
      });
      return { success: true, action, entityType: 'proposal', entity: updated };
    }
    case 'shortlist_application': {
      const app = await prisma.jobApplication.findUnique({
        where: { id: entity_id },
        include: { jobPosting: { select: { employerId: true } } },
      });
      if (!app || app.jobPosting.employerId !== userId) return { error: 'Application not found' };
      const updated = await prisma.jobApplication.update({
        where: { id: entity_id }, data: { status: 'shortlisted', reviewedAt: new Date() },
      });
      return { success: true, action, entityType: 'application', entity: updated };
    }
    case 'reject_application': {
      const app = await prisma.jobApplication.findUnique({
        where: { id: entity_id },
        include: { jobPosting: { select: { employerId: true } } },
      });
      if (!app || app.jobPosting.employerId !== userId) return { error: 'Application not found' };
      const updated = await prisma.jobApplication.update({
        where: { id: entity_id }, data: { status: 'rejected', reviewedAt: new Date() },
      });
      return { success: true, action, entityType: 'application', entity: updated };
    }
    default:
      return { error: `Unknown action: ${action}` };
  }
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
    if (content.length > 4000) {
      return error(res, 'Message too long (max 4000 characters)', 400, 'VALIDATION_ERROR');
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

    // Determine if in a create flow → use full prompt + stronger model
    const inCreateFlow = !!(
      (conversation.collectedData && Object.keys(conversation.collectedData).length > 0
        && Object.keys(conversation.collectedData).some(k => k !== '_fetchMeta')) ||
      conversation.category
    );
    const model = inCreateFlow ? 'gpt-4o' : 'gpt-4o-mini';
    const historyLimit = inCreateFlow ? 8 : 4;

    const recentMessages = conversation.messages.slice(-historyLimit);
    const history = recentMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const prompt = inCreateFlow ? BASE_SYSTEM_PROMPT + CREATE_ADDENDUM : BASE_SYSTEM_PROMPT;
    const systemMessages = [{ role: 'system', content: prompt }];

    // Inject in-progress collected data as context
    if (conversation.collectedData && Object.keys(conversation.collectedData).length > 0) {
      const { _fetchMeta, ...createData } = conversation.collectedData;
      if (Object.keys(createData).length > 0) {
        systemMessages.push({
          role: 'system',
          content: `[Active create flow — data so far: ${JSON.stringify(createData)}]`,
        });
      }
      if (_fetchMeta) {
        systemMessages.push({
          role: 'system',
          content: `[Last data shown: ${_fetchMeta.action}, page ${_fetchMeta.page} of ${_fetchMeta.totalPages}]`,
        });
      }
    }

    history.push({ role: 'user', content: content.trim() });

    const completion = await openai.chat.completions.create({
      model,
      messages: [...systemMessages, ...history],
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('INS JSON parse error:', parseErr.message, '| Raw:', responseText?.slice(0, 200));
      parsed = { message: responseText, intent: 'general', fetch_action: 'none', quick_replies: [], collected_data: null, is_complete: false };
    }

    // ----- Fetch data when AI signals a read action -----
    let dataPayload = null;
    const fetchAction = parsed.fetch_action || 'none';
    const page = Math.max(1, parseInt(parsed.page, 10) || 1);
    const fetchEntityId = parsed.fetch_entity_id || null;
    try {
      if (fetchAction === 'list_service_requests') {
        const result = await fetchServiceRequests(req.user.id, page);
        dataPayload = { type: 'list', entityType: 'service_request', ...result };
      } else if (fetchAction === 'list_jobs') {
        const result = await fetchJobs(req.user.id, page);
        dataPayload = { type: 'list', entityType: 'job', ...result };
      } else if (fetchAction === 'list_projects') {
        const result = await fetchProjects(req.user.id, page);
        dataPayload = { type: 'list', entityType: 'project', ...result };
      } else if (fetchAction === 'get_earnings') {
        const result = await fetchEarnings(req.user.id);
        dataPayload = { type: 'stats', ...result };
      } else if (fetchAction === 'list_quotes' && fetchEntityId) {
        const result = await fetchQuotes(req.user.id, fetchEntityId, page);
        if (result) dataPayload = { type: 'list', entityType: 'quote', ...result };
      } else if (fetchAction === 'list_applications' && fetchEntityId) {
        const result = await fetchApplications(req.user.id, fetchEntityId, page);
        if (result) dataPayload = { type: 'list', entityType: 'application', ...result };
      } else if (fetchAction === 'list_proposals' && fetchEntityId) {
        const result = await fetchProposals(req.user.id, fetchEntityId, page);
        if (result) dataPayload = { type: 'list', entityType: 'proposal', ...result };
      } else if (fetchAction === 'list_transactions') {
        const result = await fetchTransactions(req.user.id, page);
        dataPayload = { type: 'list', entityType: 'transaction', ...result };
      }
    } catch (fetchErr) {
      console.error('[INS] Data fetch error:', fetchErr.message);
    }

    // ----- Apply update_proposal -----
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

    // ----- Execute action_proposal -----
    let actionResult = null;
    if (parsed.action_proposal?.action && parsed.action_proposal?.entity_id) {
      try {
        actionResult = await executeAction(req.user.id, parsed.action_proposal);
      } catch (actionErr) {
        console.error('[INS] Action error:', actionErr.message);
        actionResult = { error: 'Failed to execute action' };
      }
    }

    // Save assistant message
    const assistantMessage = await prisma.insMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: parsed.message || '',
        aiModel: model,
        tokensUsed: completion.usage?.total_tokens,
      },
    });

    // Merge collected_data + track pagination state
    const existing = conversation.collectedData || {};
    const mergedData = parsed.collected_data
      ? { ...existing, ...parsed.collected_data }
      : { ...existing };

    if (dataPayload && dataPayload.type === 'list') {
      mergedData._fetchMeta = { action: fetchAction, page, totalPages: dataPayload.totalPages, entityId: fetchEntityId };
    }

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
      actionResult,
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
