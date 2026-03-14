const { PrismaClient } = require('@prisma/client');
const { success, paginated, getPagination, buildPaginationMeta, error } = require('../../utils/response');

const prisma = new PrismaClient();

// GET /admin/roles
async function getRoles(req, res) {
  try {
    const roles = await prisma.adminRole.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { userRoles: true } } },
    });

    const data = roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
      permissionCount: Array.isArray(r.permissions) ? r.permissions.length : Object.keys(r.permissions || {}).length,
      users: r._count.userRoles,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return success(res, data);
  } catch (err) {
    console.error('getRoles error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch roles' } });
  }
}

// GET /admin/roles/stats
async function getRoleStats(req, res) {
  try {
    const [totalRoles, adminUsersCount, lastRole] = await Promise.all([
      prisma.adminRole.count(),
      prisma.adminUserRole.groupBy({ by: ['userId'], _count: true }).then(r => r.length),
      prisma.adminRole.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
    ]);

    return success(res, {
      totalRoles,
      adminUsers: adminUsersCount,
      lastModified: lastRole?.updatedAt ?? null,
    });
  } catch (err) {
    console.error('getRoleStats error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch role stats' } });
  }
}

// POST /admin/roles
async function createRole(req, res) {
  try {
    const { name, description, permissions } = req.body;
    if (!name) return res.status(400).json({ success: false, error: { message: 'name is required' } });

    const role = await prisma.adminRole.create({
      data: { name, description: description ?? null, permissions: permissions ?? [] },
    });

    return res.status(201).json({ success: true, data: role });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: { message: 'Role name already exists' } });
    }
    console.error('createRole error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to create role' } });
  }
}

// PATCH /admin/roles/:id
async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await prisma.adminRole.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(permissions !== undefined && { permissions }),
      },
    });

    return success(res, role);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: { message: 'Role not found' } });
    }
    console.error('updateRole error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to update role' } });
  }
}

// GET /admin/roles/users  — admin users (users with at least one AdminUserRole)
async function getAdminUsers(req, res) {
  try {
    const { page, perPage, skip } = getPagination(req.query);

    const [assignments, total] = await Promise.all([
      prisma.adminUserRole.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              lastLoginAt: true,
              isActive: true,
              isSuspended: true,
            },
          },
          role: { select: { id: true, name: true } },
        },
      }),
      prisma.adminUserRole.count(),
    ]);

    const data = assignments.map(a => ({
      id: a.id,
      userId: a.user.id,
      name: `${a.user.firstName} ${a.user.lastName}`,
      email: a.user.email,
      role: a.role.name,
      roleId: a.role.id,
      lastLogin: a.user.lastLoginAt,
      status: a.user.isSuspended ? 'Suspended' : a.user.isActive ? 'Active' : 'Inactive',
      assignedAt: a.createdAt,
    }));

    return paginated(res, data, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('getAdminUsers error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch admin users' } });
  }
}

// POST /admin/roles/users/:userId/assign
async function assignRole(req, res) {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ success: false, error: { message: 'roleId is required' } });

    const assignment = await prisma.adminUserRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId, assignedBy: req.user?.id ?? null },
      update: {},
    });

    return res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    console.error('assignRole error:', err);
    return res.status(500).json({ success: false, error: { message: 'Failed to assign role' } });
  }
}

module.exports = { getRoles, getRoleStats, createRole, updateRole, getAdminUsers, assignRole };
