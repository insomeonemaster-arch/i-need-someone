const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/payments.controller');

router.post('/webhook', express.raw({ type: 'application/json' }), c.handleWebhook);

router.get('/methods', authenticate, c.getPaymentMethods);
router.post('/methods', authenticate, c.addPaymentMethod);
router.post('/methods/:id/set-default', authenticate, c.setDefaultMethod);
router.delete('/methods/:id', authenticate, c.deletePaymentMethod);

router.post('/charge', authenticate, c.chargePayment);
router.get('/transactions', authenticate, c.getTransactions);
router.get('/transactions/:id', authenticate, c.getTransaction);
router.post('/transactions/:id/refund', authenticate, c.refundTransaction);

router.get('/payouts', authenticate, c.getPayouts);
router.post('/payouts/request', authenticate, c.requestPayout);

router.get('/earnings', authenticate, c.getEarnings);
router.get('/earnings/summary', authenticate, c.getEarningsSummary);

router.get('/connect/status', authenticate, c.getConnectStatus);
router.post('/connect/account', authenticate, c.createConnectAccount);

module.exports = router;
