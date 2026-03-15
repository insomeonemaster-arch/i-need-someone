const { success, paginated, error, getPagination, buildPaginationMeta } = require('../../utils/response');
const { logAdminAction, AdminActions } = require('../../utils/auditLog');

const prisma = require('../../lib/prisma');

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/categories
 * List all categories
 */
const getCategories = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { parent_id, status, module } = req.query;

    const where = {};
    if (parent_id === 'null') {
      where.parentCategoryId = null;
    } else if (parent_id) {
      where.parentCategoryId = parent_id;
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (module) where.module = module;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { displayOrder: 'asc' },
        include: {
          children: true,
          parent: true,
        },
      }),
      prisma.category.count({ where }),
    ]);

    const categoriesData = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      module: c.module,
      parent_id: c.parentCategoryId,
      icon: c.iconName,
      applicable_modes: [c.module], // Based on module
      status: c.isActive ? 'active' : 'inactive',
      children_count: c.children.length,
      created_at: c.createdAt,
    }));

    return paginated(res, categoriesData, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('Get categories error:', err);
    next(err);
  }
};

/**
 * POST /api/admin/categories
 * Create a new category
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parent_id, icon, module, display_order } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        module,
        parentCategoryId: parent_id || null,
        iconName: icon,
        displayOrder: display_order || 0,
        isActive: true,
      },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.CATEGORY_CREATED,
      resourceType: 'category',
      resourceId: category.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { name, slug },
    });

    return success(res, {
      message: 'Category created successfully',
      category,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return error(res, 'Category slug already exists', 409, 'DUPLICATE_SLUG');
    }
    console.error('Create category error:', err);
    next(err);
  }
};

/**
 * PATCH /api/admin/categories/:id
 * Update a category
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description, icon, status, display_order } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (icon) updateData.iconName = icon;
    if (status) updateData.isActive = status === 'active';
    if (display_order !== undefined) updateData.displayOrder = display_order;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.CATEGORY_UPDATED,
      resourceType: 'category',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { updates: updateData },
    });

    return success(res, {
      message: 'Category updated successfully',
      category,
    });
  } catch (err) {
    console.error('Update category error:', err);
    next(err);
  }
};

/**
 * DELETE /api/admin/categories/:id
 * Delete a category
 */
const deleteCategory = async (req, res, next) => {
  try {
    // Check if category has children
    const childrenCount = await prisma.category.count({
      where: { parentCategoryId: req.params.id },
    });

    if (childrenCount > 0) {
      return error(res, 'Cannot delete category with subcategories', 400, 'HAS_CHILDREN');
    }

    await prisma.category.delete({
      where: { id: req.params.id },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.CATEGORY_DELETED,
      resourceType: 'category',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return success(res, {
      message: 'Category deleted successfully',
    });
  } catch (err) {
    console.error('Delete category error:', err);
    next(err);
  }
};

// ─── SERVICE ZONES ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/service-zones
 * List all service zones
 */
const getServiceZones = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { status, city, state } = req.query;

    const where = {};
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = state;

    const [zones, total] = await Promise.all([
      prisma.serviceZone.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceZone.count({ where }),
    ]);

    const zonesData = zones.map((z) => ({
      id: z.id,
      name: z.name,
      city: z.city,
      state: z.state,
      country: z.country,
      zip_codes: z.zipCodes,
      status: z.status,
      created_at: z.createdAt,
    }));

    return paginated(res, zonesData, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('Get service zones error:', err);
    next(err);
  }
};

/**
 * POST /api/admin/service-zones
 * Create a new service zone
 */
const createServiceZone = async (req, res, next) => {
  try {
    const { name, city, state, country, zip_codes } = req.body;

    const zone = await prisma.serviceZone.create({
      data: {
        name,
        city,
        state,
        country: country || 'USA',
        zipCodes: zip_codes || [],
        status: 'active',
      },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.ZONE_CREATED,
      resourceType: 'service_zone',
      resourceId: zone.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { name, city, state },
    });

    return success(res, {
      message: 'Service zone created successfully',
      zone,
    });
  } catch (err) {
    console.error('Create service zone error:', err);
    next(err);
  }
};

/**
 * PATCH /api/admin/service-zones/:id
 * Update a service zone
 */
const updateServiceZone = async (req, res, next) => {
  try {
    const { name, city, state, country, zip_codes, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (country) updateData.country = country;
    if (zip_codes) updateData.zipCodes = zip_codes;
    if (status) updateData.status = status;

    const zone = await prisma.serviceZone.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.ZONE_UPDATED,
      resourceType: 'service_zone',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { updates: updateData },
    });

    return success(res, {
      message: 'Service zone updated successfully',
      zone,
    });
  } catch (err) {
    console.error('Update service zone error:', err);
    next(err);
  }
};

/**
 * DELETE /api/admin/service-zones/:id
 * Delete a service zone
 */
const deleteServiceZone = async (req, res, next) => {
  try {
    await prisma.serviceZone.delete({
      where: { id: req.params.id },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.ZONE_DELETED,
      resourceType: 'service_zone',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return success(res, {
      message: 'Service zone deleted successfully',
    });
  } catch (err) {
    console.error('Delete service zone error:', err);
    next(err);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getServiceZones,
  createServiceZone,
  updateServiceZone,
  deleteServiceZone,
};
