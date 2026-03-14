const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../../utils/response');

const prisma = new PrismaClient();

/**
 * GET /api/admin/dashboard/stats
 * Get overall platform statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeRequests,
      activeProjects,
      activeJobs,
      totalPayments,
      pendingDisputes,
      pendingFlags,
      pendingVerifications,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.serviceRequest.count({ where: { status: { in: ['open', 'assigned', 'in_progress'] } } }),
      prisma.project.count({ where: { status: 'in_progress' } }),
      prisma.jobPosting.count({ where: { status: 'open' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' },
      }),
      prisma.dispute.count({ where: { status: { in: ['open', 'under_review'] } } }),
      prisma.flag.count({ where: { status: 'pending' } }),
      prisma.providerProfile.count({ where: { verificationStatus: 'pending' } }),
    ]);

    // Get revenue chart data (last 12 months)
    const now = new Date();
    const lastYear = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    
    const revenueData = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(amount) as amount
      FROM payments
      WHERE status = 'completed' AND created_at >= ${lastYear}
      GROUP BY month
      ORDER BY month ASC
    `;

    // Get recent activities
    const recentActivities = await prisma.userActivityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const stats = {
      total_users: totalUsers,
      active_requests: activeRequests,
      active_projects: activeProjects,
      active_jobs: activeJobs,
      total_revenue: Number(totalPayments._sum.amount || 0),
      pending_disputes: pendingDisputes,
      pending_flags: pendingFlags,
      pending_approvals: pendingVerifications,
      revenue_chart: revenueData.map((r) => ({
        date: r.month,
        amount: Number(r.amount),
      })),
      recent_activities: recentActivities.map((log) => ({
        id: log.id,
        type: log.action,
        description: `${log.action} on ${log.resourceType}`,
        user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        timestamp: log.createdAt,
      })),
    };

    return success(res, stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    next(err);
  }
};

/**
 * GET /api/admin/dashboard/alerts
 * Get critical alerts and notifications
 */
const getDashboardAlerts = async (req, res, next) => {
  try {
    const [urgentDisputes, highPriorityFlags, pendingPayouts, failedPayments] = await Promise.all([
      prisma.dispute.count({
        where: {
          status: 'open',
          priority: { in: ['high', 'urgent'] },
        },
      }),
      prisma.flag.count({
        where: {
          status: 'pending',
          reason: { in: ['fraud', 'harassment'] },
        },
      }),
      prisma.payout.count({
        where: { status: 'pending' },
      }),
      prisma.payment.count({
        where: { status: 'failed' },
      }),
    ]);

    const alerts = [];

    if (urgentDisputes > 0) {
      alerts.push({
        id: 'alert-disputes',
        type: 'dispute',
        severity: 'high',
        message: `${urgentDisputes} dispute${urgentDisputes > 1 ? 's' : ''} require immediate attention`,
        count: urgentDisputes,
        link: '/admin/disputes?status=open&priority=urgent,high',
      });
    }

    if (highPriorityFlags > 0) {
      alerts.push({
        id: 'alert-flags',
        type: 'flag',
        severity: 'high',
        message: `${highPriorityFlags} serious flag${highPriorityFlags > 1 ? 's' : ''} pending review`,
        count: highPriorityFlags,
        link: '/admin/flags?status=pending&reason=fraud,harassment',
      });
    }

    if (pendingPayouts > 5) {
      alerts.push({
        id: 'alert-payouts',
        type: 'payout',
        severity: 'medium',
        message: `${pendingPayouts} payout${pendingPayouts > 1 ? 's' : ''} awaiting processing`,
        count: pendingPayouts,
        link: '/admin/payouts?status=pending',
      });
    }

    if (failedPayments > 0) {
      alerts.push({
        id: 'alert-failed-payments',
        type: 'payment',
        severity: 'medium',
        message: `${failedPayments} failed payment${failedPayments > 1 ? 's' : ''} need attention`,
        count: failedPayments,
        link: '/admin/payments?status=failed',
      });
    }

    return success(res, alerts);
  } catch (err) {
    console.error('Dashboard alerts error:', err);
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardAlerts,
};
