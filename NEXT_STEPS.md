# Next Steps: High-Priority Fixes

## Overview
After fixing 12 critical issues, the codebase still has ~76 medium/high priority items to address before production release.

---

## IMMEDIATE (Next 1-2 days)

### 1. Race Condition Fixes - Database Transactions

**Priority**: CRITICAL  
**Impact**: Data integrity, prevents duplicate processing

#### Issue 1A: Quote Acceptance Race
**File**: `src/controllers/localServices.controller.js` - acceptQuote function  
**Problem**: Two simultaneous requests can both accept the same quote

**Fix**:
```javascript
const acceptQuote = async (req, res) => {
  try {
    const { quoteId } = req.params;
    
    await prisma.$transaction(async (tx) => {
      // Fetch the quote with lock
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        include: { localService: true }
      });
      
      if (quote.status !== 'pending') {
        throw new Error('Quote already accepted or expired');
      }
      
      // Update quote status atomically
      await tx.quote.update({
        where: { id: quoteId },
        data: { 
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedById: req.user.id
        }
      });
      
      // Reject all other quotes for same service
      await tx.quote.updateMany({
        where: {
          localServiceId: quote.localServiceId,
          id: { not: quoteId }
        },
        data: { status: 'rejected' }
      });
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
```

#### Issue 1B: Job Application Duplicate
**File**: `src/controllers/jobs.controller.js` - applyJob function  
**Problem**: Developer can submit two applications simultaneously

**Fix Pattern**: Same as above, wrap in `prisma.$transaction`

#### Issue 1C: Payout Processing
**File**: `src/workers/payout.worker.js` - handlePayoutJob  
**Problem**: Same payout could be processed twice if worker runs concurrently

**Fix Pattern**: Add unique constraint + check in transaction

---

### 2. Input Validation - Add Across All Controllers

**Priority**: CRITICAL  
**Impact**: Security, prevents invalid data storage

Create validation helper:
```javascript
// src/lib/validators.js
export const validateBudget = (min, max) => {
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new Error('Budget must be numbers');
  }
  if (min < 0 || max < 0) {
    throw new Error('Budget cannot be negative');
  }
  if (min > max) {
    throw new Error('Min budget cannot exceed max');
  }
  return true;
};

export const validatePhoneNumber = (phone) => {
  const pattern = /^(\+1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
  if (!pattern.test(phone)) {
    throw new Error('Invalid phone number format');
  }
  return true;
};
```

**Apply to**:
- `localServices.create()` - validate budgetMin/Max positive
- `projects.create()` - validate budget positive  
- `support.createTicket()` - validate priority is enum
- `payments.addPaymentMethod()` - validate card fields

---

## SHORT-TERM (Next sprint)

### 3. Checkr Background Check Integration

**File**: `src/controllers/verification.controller.js` line 91  

**Current**: Just saves document without verification  
**Needed**: Call Checkr API to verify background check

```javascript
// Around line 91:
if (documentType === 'background_check') {
  // TODO: Trigger Checkr API
  const checkrCandidate = await checkrAPI.createCandidate({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });
  
  // Save checkr ID for later webhook
  await prisma.verificationDocument.update({
    where: { id: document.id },
    data: { metadata: { checkrId: checkrCandidate.id } }
  });
}
```

**Implementation Steps**:
1. Create Checkr account (background-check service)
2. Get API key from Checkr dashboard
3. Update `.env` with `CHECKR_API_KEY`
4. Implement `CheckrAPI` service class
5. Add webhook handler for Checkr events (approval/denial)

---

### 4. Push Notifications - FCM/APNS Implementation

**File**: `src/workers/push.worker.js` line 9  

**Current**: Dummy implementation  
**Needed**: Send actual device notifications

```javascript
// Inside handlePushNotificationJob:
const devices = await prisma.userDevice.findMany({
  where: { userId: notification.userId },
  select: { deviceToken: true, isIOS: true }
});

for (const device of devices) {
  try {
    if (device.isIOS) {
      await apnsProvider.send({
        token: device.deviceToken,
        alert: notification.title,
        badge: 1,
        payload: { notificationId: notification.id }
      });
    } else {
      await fcmProvider.send({
        token: device.deviceToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: { notificationId: notification.id }
      });
    }
  } catch (err) {
    console.error('Push send failed:', err);
  }
}
```

**Implementation Steps**:
1. Create Firebase project for FCM
2. Create Apple app for APNS
3. Install `firebase-admin` and `apn` packages
4. Create `APNSProvider` and `FCMProvider` services
5. Add device token storage when app opens (frontend)

---

### 5. Optimize Database Queries - Fix N+1 Patterns

**File**: `src/controllers/search.controller.js` line 98-120  

**Current**: Queries each provider's skills individually  
**Fix**: Use includes instead

```javascript
// BEFORE (N+1):
const providers = await prisma.provider.findMany({
  where: { ..., category: categorySlug }
});
for (let p of providers) {
  p.skills = await prisma.skill.findMany({ where: { providerId: p.id } });
}

// AFTER (Single query):
const providers = await prisma.provider.findMany({
  where: { ..., category: categorySlug },
  include: { 
    skills: true,
    profile: { include: { reviews: true } }
  }
});
```

**Apply to**:
- Search controller - provider includes
- Projects controller - proposal includes
- Admin dashboard - user includes
- Messaging - conversation includes

---

## MEDIUM-TERM (2-3 sprints)

### 6. Type Safety Improvements

**Pattern**: Replace `any` with proper TypeScript generics

```typescript
// BEFORE:
const cache = new Map<string, any>();

// AFTER:
interface CacheEntry<T> {
  value: T;
  expiresAt: Date;
}
const cache = new Map<string, CacheEntry<unknown>>();
```

**Files to refactor**:
- Controllers (add proper request/response types)
- Middleware (type next function)
- Utils (generic helper functions)

---

### 7. Analytics Integration - Mixpanel

**File**: `src/workers/analytics.worker.js` line 54  

```javascript
// TODO: Push daily snapshot to Mixpanel
const snapshot = await generateDailySnapshot();
await mixpanel.track('daily_snapshot', snapshot);
```

**Implementation**:
1. Create Mixpanel account
2. Add `MIXPANEL_TOKEN` to `.env`
3. Implement snapshot generation
4. Run job daily via Bull

---

## Monitoring & Testing

### Test Cases to Add

1. **Concurrent Operations**:
   - Two simultaneous quote acceptances → only one succeeds
   - Two simultaneous job applications → only one succeeds
   - Two simultaneous payments → only one succeeds

2. **Edge Cases**:
   - Negative budget values → rejected
   - Invalid phone numbers → rejected
   - Null or empty required fields → rejected

3. **Error Recovery**:
   - Socket disconnect → client reconnects automatically
   - Queue job failure → retries with exponential backoff
   - Database transaction rollback → data remains consistent

---

## Deployment Checklist

- [ ] All database transactions implemented
- [ ] Input validation on all critical endpoints
- [ ] Checkr integration complete
- [ ] Push notifications working (manual test on device)
- [ ] No more N+1 queries in admin panel
- [ ] Type safety: 0 `any` types in business logic
- [ ] Error handling: All workers have try-catch + logging
- [ ] Load test: 100+ concurrent users without crashes
- [ ] Security audit: No SQL injection / XSS vectors
- [ ] Performance: Admin dashboard loads in <2s

---

## Files to Create/Modify

**New Files**:
- `src/lib/validators.js` - Input validation helpers
- `src/services/checkr.js` - Checkr API client
- `src/services/fcm.js` - Firebase Cloud Messaging
- `src/services/apns.js` - Apple Push Notifications
- `src/lib/analytics.js` - Analytics tracking

**Modify**:
- All controllers - add transactions & validation
- All workers - add error handling
- Database queries - optimize includes

---

## Estimated Effort

- **Race condition fixes**: 8-12 hours
- **Input validation**: 4-6 hours
- **Checkr integration**: 6-8 hours
- **Push notifications**: 8-10 hours
- **Query optimization**: 4-6 hours
- **Type safety**: 10-12 hours
- **Testing & QA**: 12-16 hours

**Total**: 52-70 hours (~1.5-2 week sprint for team of 2)

---

## Q&A for Implementation

**Q: What if transaction fails?**  
A: Catch error, log it, return 409 Conflict to client. Client can retry.

**Q: How to handle partial failures in batch operations?**  
A: Use `createMany` with `skipDuplicates` or handle failures individually.

**Q: How to test race conditions locally?**  
A: Use Artillery/K6 load testing tool with concurrent requests.

**Q: Do we need database migrations for new fields?**  
A: If adding new fields to schema: yes. Create migration with Prisma.

---

**Last Updated**: March 16, 2026  
**Status**: Ready for implementation
