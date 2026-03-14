const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ineedsome.one' },
    update: {},
    create: {
      email: 'admin@ineedsome.one',
      passwordHash: await bcrypt.hash('admin123!', 12),
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      isAdmin: true,
      isEmailVerified: true,
    },
  });
  console.log('Admin created:', admin.email);

  // Categories
  const categoryData = [
    // Local Services
    { name: 'Plumbing', slug: 'plumbing', module: 'local-services', iconName: 'wrench' },
    { name: 'Electrical', slug: 'electrical', module: 'local-services', iconName: 'zap' },
    { name: 'Painting', slug: 'painting', module: 'local-services', iconName: 'paintbrush' },
    { name: 'Cleaning', slug: 'cleaning', module: 'local-services', iconName: 'sparkles' },
    { name: 'Landscaping', slug: 'landscaping', module: 'local-services', iconName: 'trees' },
    { name: 'HVAC', slug: 'hvac', module: 'local-services', iconName: 'thermometer' },
    // Jobs
    { name: 'Administrative', slug: 'administrative', module: 'jobs', iconName: 'briefcase' },
    { name: 'Sales & Marketing', slug: 'sales-marketing', module: 'jobs', iconName: 'trending-up' },
    { name: 'Customer Service', slug: 'customer-service', module: 'jobs', iconName: 'headphones' },
    { name: 'Technology', slug: 'technology', module: 'jobs', iconName: 'code' },
    // Projects
    { name: 'Web Development', slug: 'web-development', module: 'projects', iconName: 'globe' },
    { name: 'Mobile Development', slug: 'mobile-development', module: 'projects', iconName: 'smartphone' },
    { name: 'Graphic Design', slug: 'graphic-design', module: 'projects', iconName: 'palette' },
    { name: 'Content Writing', slug: 'content-writing', module: 'projects', iconName: 'pen-tool' },
    { name: 'Video & Animation', slug: 'video-animation', module: 'projects', iconName: 'video' },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  console.log('Categories seeded');

  // Skills
  const skillData = [
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'React', slug: 'react' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: 'Python', slug: 'python' },
    { name: 'Figma', slug: 'figma' },
    { name: 'Plumbing Installation', slug: 'plumbing-installation' },
    { name: 'Electrical Wiring', slug: 'electrical-wiring' },
    { name: 'Interior Painting', slug: 'interior-painting' },
  ];

  for (const skill of skillData) {
    await prisma.skill.upsert({ where: { slug: skill.slug }, update: {}, create: skill });
  }
  console.log('Skills seeded');

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
