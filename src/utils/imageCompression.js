export const RECIPE_IMAGE_LIMITS = Object.freeze({
  maxBytes: 8 * 1024 * 1024,
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function webpFilename(name = 'recipe-image') {
  const cleanName = String(name || 'recipe-image').replace(/\.[^.]+$/, '').trim() || 'recipe-image';
  return `${cleanName}.webp`;
}

export function containDimensions(width, height, maxWidth, maxHeight) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const scale = Math.min(1, maxWidth / safeWidth, maxHeight / safeHeight);
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

export function formatBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadWithImageElement(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('The selected image could not be decoded.'));
      element.src = objectUrl;
    });
    return {
      source: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      release() {},
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release() { bitmap.close?.(); },
      };
    } catch {
      // Some older browsers expose createImageBitmap but cannot decode every supported image.
    }
  }
  return loadWithImageElement(file);
}

function canvasToWebp(canvas, quality) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      reject(new Error('This browser cannot compress images before uploading.'));
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== 'image/webp') {
        reject(new Error('This browser does not support WebP image encoding.'));
        return;
      }
      resolve(blob);
    }, 'image/webp', quality);
  });
}

export async function prepareRecipeImage(file, options = {}) {
  if (!file) throw new Error('Choose an image first.');
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Only JPEG, PNG, and WebP image uploads are allowed.');

  const limits = { ...RECIPE_IMAGE_LIMITS, ...options };
  if (file.size > limits.maxBytes) throw new Error('The image must be 8 MB or smaller.');

  let decoded;
  try {
    decoded = await decodeImage(file);
    const size = containDimensions(decoded.width, decoded.height, limits.maxWidth, limits.maxHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('The browser could not start the image compressor.');
    context.drawImage(decoded.source, 0, 0, size.width, size.height);
    const blob = await canvasToWebp(canvas, limits.quality);
    const compressed = new File([blob], webpFilename(file.name), {
      type: 'image/webp',
      lastModified: Date.now(),
    });
    return {
      file: compressed,
      converted: true,
      originalBytes: file.size,
      outputBytes: compressed.size,
      originalType: file.type,
      outputType: compressed.type,
      width: size.width,
      height: size.height,
    };
  } catch (error) {
    return {
      file,
      converted: false,
      originalBytes: file.size,
      outputBytes: file.size,
      originalType: file.type,
      outputType: file.type,
      warning: error.message,
    };
  } finally {
    decoded?.release?.();
  }
}
