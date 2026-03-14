const supabase = require('../lib/supabase');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/response');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'ins-platform';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOC_SIZE = 10 * 1024 * 1024;

const uploadToSupabase = async (buffer, path, contentType) => {
  let data, uploadError;
  try {
    ({ data, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true }));
  } catch (networkErr) {
    const err = new Error('Storage service is unreachable. Please try again later.');
    err.status = 503;
    throw err;
  }

  if (uploadError) {
    const err = new Error(uploadError.message || 'Storage upload failed');
    err.status = 503;
    throw err;
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file provided', 400, 'VALIDATION_ERROR');
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) return error(res, 'Invalid file type', 400, 'VALIDATION_ERROR');
    if (req.file.size > MAX_IMAGE_SIZE) return error(res, 'File too large (max 5MB)', 400, 'VALIDATION_ERROR');

    const filename = `${uuidv4()}.webp`;
    const folder = req.query.folder || 'general';
    const path = `${folder}/${req.user.id}/${filename}`;

    const processed = await sharp(req.file.buffer).webp({ quality: 85 }).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).toBuffer();
    const url = await uploadToSupabase(processed, path, 'image/webp');

    return success(res, { url, path });
  } catch (err) {
    next(err);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file provided', 400, 'VALIDATION_ERROR');
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) return error(res, 'Invalid file type', 400, 'VALIDATION_ERROR');
    if (req.file.size > 2 * 1024 * 1024) return error(res, 'File too large (max 2MB)', 400, 'VALIDATION_ERROR');

    const filename = `${uuidv4()}.webp`;
    const path = `avatars/${req.user.id}/${filename}`;

    const processed = await sharp(req.file.buffer).webp({ quality: 90 }).resize(500, 500, { fit: 'cover' }).toBuffer();
    const url = await uploadToSupabase(processed, path, 'image/webp');

    // Update user avatar
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl: url } });

    return success(res, { url });
  } catch (err) {
    next(err);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file provided', 400, 'VALIDATION_ERROR');
    if (!ALLOWED_DOC_TYPES.includes(req.file.mimetype)) return error(res, 'Invalid file type', 400, 'VALIDATION_ERROR');
    if (req.file.size > MAX_DOC_SIZE) return error(res, 'File too large (max 10MB)', 400, 'VALIDATION_ERROR');

    const ext = req.file.mimetype === 'application/pdf' ? 'pdf' : 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const path = `verification/${req.user.id}/${filename}`;

    const url = await uploadToSupabase(req.file.buffer, path, req.file.mimetype);
    return success(res, { url, path });
  } catch (err) {
    next(err);
  }
};

const getPresignedUrl = async (req, res, next) => {
  try {
    const { filename, folder = 'general', contentType } = req.body;
    if (!filename || !contentType) return error(res, 'filename and contentType required', 400, 'VALIDATION_ERROR');

    const ext = filename.split('.').pop();
    const path = `${folder}/${req.user.id}/${uuidv4()}.${ext}`;

    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (signError) throw signError;

    return success(res, { signedUrl: data.signedUrl, path, token: data.token });
  } catch (err) {
    next(err);
  }
};

// Generates a short-lived signed URL so users can view private bucket documents
const getDocumentViewUrl = async (req, res, next) => {
  try {
    const { fileUrl } = req.query;
    if (!fileUrl) return error(res, 'fileUrl query param required', 400, 'VALIDATION_ERROR');

    // Extract the storage path from the full Supabase URL
    // URL format: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    //          or https://<ref>.supabase.co/storage/v1/object/<bucket>/<path>
    const match = decodeURIComponent(fileUrl).match(/\/storage\/v1\/object\/(?:public\/)?[^/]+\/(.+)/);
    if (!match) return error(res, 'Unable to parse file path from URL', 400, 'VALIDATION_ERROR');
    const storagePath = match[1];

    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60); // 1-hour expiry

    if (signError) throw new Error(signError.message);

    return success(res, { signedUrl: data.signedUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImage, uploadAvatar, uploadDocument, getPresignedUrl, getDocumentViewUrl };
