const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL) {
  // Minimal stub to allow running the app without Supabase configured.
  module.exports = {
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: (path) => ({ data: { publicUrl: '' } }),
        createSignedUploadUrl: async () => ({ data: { signedUrl: '', token: '' }, error: null }),
      }),
    },
  };
} else {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  module.exports = supabase;
}
