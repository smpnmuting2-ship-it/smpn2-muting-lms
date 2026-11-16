const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
]);

/**
 * Mengunggah foto ke Cloudinary menggunakan Unsigned Upload Preset.
 * Tidak memerlukan API Secret di sisi frontend.
 */
export async function uploadImageToCloudinary(file, options = {}) {
  if (!isCloudinaryConfigured) {
    if (CLOUD_NAME && !UPLOAD_PRESET) {
      throw new Error(
        `Cloud Name "${CLOUD_NAME}" sudah terhubung, tetapi VITE_CLOUDINARY_UPLOAD_PRESET belum diisi. Buat Upload Preset bertipe "Unsigned" di Cloudinary Dashboard lalu isi namanya ke .env / Vercel.`
      );
    }
    throw new Error(
      'Cloudinary belum dikonfigurasi. Isi VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET di .env / Vercel, atau tempel URL gambar secara manual.'
    );
  }

  if (!file) {
    throw new Error('Pilih file foto terlebih dahulu.');
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Format file harus berupa gambar (JPG, PNG, WEBP, GIF, atau AVIF).');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran foto melebihi batas maksimal 10 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', options.folder || 'smpn2_muting_unsigned');

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = data?.error?.message || 'Gagal mengunggah foto ke Cloudinary.';
    throw new Error(msg);
  }

  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    width: data.width,
    height: data.height
  };
}

