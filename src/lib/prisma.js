const { PrismaClient } = require('@prisma/client');

// Single shared instance — prevents connection pool exhaustion on Supabase PgBouncer
const prisma = global._prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global._prisma = prisma;

module.exports = prisma;
