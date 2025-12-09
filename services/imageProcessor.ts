
// Utility to process images for AI analysis (resize and crop variations)

const MAX_DIMENSION = 1024; // Limit size for API performance
const JPEG_QUALITY = 0.85;

interface ImageVariation {
  label: string;
  base64: string;
  mimeType: string;
}

export type CropStrategy = 'center' | 'top' | 'zoom-center' | 'bottom';

const readImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const getCropCoordinates = (
  width: number, 
  height: number, 
  targetRatio: number | null, 
  strategy: CropStrategy
) => {
  let sWidth = width;
  let sHeight = height;
  let sx = 0;
  let sy = 0;

  if (targetRatio !== null) {
    const currentRatio = width / height;
    
    if (currentRatio > targetRatio) {
      // Image is wider than target: Crop width
      sWidth = height * targetRatio;
      sHeight = height;
      sx = (width - sWidth) / 2;
      sy = 0;
    } else {
      // Image is taller than target: Crop height
      sWidth = width;
      sHeight = width / targetRatio;
      sx = 0;
      
      if (strategy === 'top') sy = 0;
      else if (strategy === 'bottom') sy = height - sHeight;
      else sy = (height - sHeight) / 2;
    }

    if (strategy === 'zoom-center') {
      const zoomFactor = 0.8;
      const oldSWidth = sWidth;
      const oldSHeight = sHeight;
      sWidth = sWidth * zoomFactor;
      sHeight = sHeight * zoomFactor;
      sx = sx + (oldSWidth - sWidth) / 2;
      sy = sy + (oldSHeight - sHeight) / 2;
    }
  }

  return { sx, sy, sWidth, sHeight };
};

const smartCropAndResize = (
  img: HTMLImageElement, 
  targetRatio: number | null, 
  strategy: CropStrategy = 'center'
): string => {
  const canvas = document.createElement('canvas');
  const coords = getCropCoordinates(img.width, img.height, targetRatio, strategy);

  // 2. Calculate Output Dimensions (Resize if too big for AI)
  let dWidth = coords.sWidth;
  let dHeight = coords.sHeight;

  if (dWidth > MAX_DIMENSION || dHeight > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(dWidth, dHeight);
    dWidth *= scale;
    dHeight *= scale;
  }

  canvas.width = dWidth;
  canvas.height = dHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, dWidth, dHeight);
  ctx.drawImage(img, coords.sx, coords.sy, coords.sWidth, coords.sHeight, 0, 0, dWidth, dHeight);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return dataUrl.split(',')[1];
};

export const generateImageVariations = async (file: File): Promise<ImageVariation[]> => {
  const img = await readImage(file);
  const variations: ImageVariation[] = [];

  variations.push({ label: 'Original', base64: smartCropAndResize(img, null, 'center'), mimeType: 'image/jpeg' });
  variations.push({ label: '4:5 Center', base64: smartCropAndResize(img, 4/5, 'center'), mimeType: 'image/jpeg' });
  variations.push({ label: '4:5 Upper', base64: smartCropAndResize(img, 4/5, 'top'), mimeType: 'image/jpeg' });
  variations.push({ label: '1:1 Zoomed', base64: smartCropAndResize(img, 1, 'zoom-center'), mimeType: 'image/jpeg' });
  variations.push({ label: '9:16 Story', base64: smartCropAndResize(img, 9/16, 'center'), mimeType: 'image/jpeg' });

  return variations;
};

/**
 * Generates a full-resolution cropped image blob for downloading.
 * Uses 100% Quality (1.0) and high-quality smoothing.
 */
export const generateHighQualityCrop = async (
  file: File, 
  bestCrop: string, 
  alignment: string
): Promise<Blob> => {
  const img = await readImage(file);
  
  // Map AI string to technical parameters
  let targetRatio: number | null = null;
  let strategy: CropStrategy = 'center';

  if (bestCrop.includes('4:5')) targetRatio = 4/5;
  else if (bestCrop.includes('1:1')) targetRatio = 1;
  else if (bestCrop.includes('9:16')) targetRatio = 9/16;

  if (alignment === 'top') strategy = 'top';
  else if (alignment === 'bottom') strategy = 'bottom';
  
  if (bestCrop.includes('Zoomed')) strategy = 'zoom-center';
  else if (bestCrop.includes('Upper')) strategy = 'top';

  const coords = getCropCoordinates(img.width, img.height, targetRatio, strategy);

  const canvas = document.createElement('canvas');
  // Use full source resolution
  canvas.width = coords.sWidth;
  canvas.height = coords.sHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  // High quality rendering configuration
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(
    img, 
    coords.sx, coords.sy, coords.sWidth, coords.sHeight, 
    0, 0, coords.sWidth, coords.sHeight
  );

  return new Promise((resolve, reject) => {
    // Quality set to 1.0 (Maximum)
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas to Blob failed"));
    }, 'image/jpeg', 1.0); 
  });
};
