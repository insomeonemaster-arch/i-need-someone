const { imageQueue } = require('../index');
const sharp = require('sharp');
const supabase = require('../../supabase');

const prisma = require('../../prisma');
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'ins-platform';

const SIZES = {
  avatar: [
    { name: 'thumbnail', width: 80,  height: 80  },
    { name: 'medium',    width: 200, height: 200 },
    { name: 'large',     width: 500, height: 500 },
  ],
  portfolio: [
    { name: 'thumbnail', width: 400,  height: 300  },
    { name: 'large',     width: 1200, height: 900  },
  ],
  general: [
    { name: 'medium', width: 800,  height: 600  },
    { name: 'large',  width: 1200, height: 900  },
  ],
};

imageQueue.process('resize', async (job) => {
  const { buffer, basePath, type = 'general' } = job.data;
  const sizes = SIZES[type] || SIZES.general;
  const urls = {};

  const rawBuffer = Buffer.from(buffer);

  for (const size of sizes) {
    const processed = await sharp(rawBuffer)
      .resize(size.width, size.height, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const path = `${basePath}_${size.name}.webp`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, processed, { contentType: 'image/webp', upsert: true });

    if (error) throw new Error(`Upload failed for ${size.name}: ${error.message}`);

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls[size.name] = publicUrl;
  }

  return urls;
});

imageQueue.process('delete', async (job) => {
  const { paths } = job.data;
  await supabase.storage.from(BUCKET).remove(paths);
});

imageQueue.on('failed', (job, err) => {
  console.error(`[ImageQueue] Job ${job.id} failed:`, err.message);
});

console.log('[Worker] Image queue started');
