/**
 * Client-side Canvas Image Analysis & Quality Diagnostic Tool.
 * Runs 100% on-device in the user's browser without uploading photos to external servers.
 */

export interface ImageQualityReport {
  isAcceptable: boolean;
  isBlurry: boolean;
  isDark: boolean;
  brightness: number; // 0 to 255
  contrastScore: number;
  recommendation?: string;
}

/**
 * Analyzes an image file using an offscreen HTML Canvas
 */
export async function analyzeImageQuality(file: File): Promise<ImageQualityReport> {
  return new Promise((resolve) => {
    // If not an image file (e.g. PDF), skip optical check
    if (!file.type.startsWith('image/')) {
      resolve({
        isAcceptable: true,
        isBlurry: false,
        isDark: false,
        brightness: 128,
        contrastScore: 50,
      });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ isAcceptable: true, isBlurry: false, isDark: false, brightness: 128, contrastScore: 50 });
          return;
        }

        // Downsample to 200x200 for fast real-time analysis
        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(img, 0, 0, 200, 200);

        const imgData = ctx.getImageData(0, 0, 200, 200);
        const data = imgData.data;

        let totalBrightness = 0;
        const grayValues: number[] = [];

        for (let i = 0; i < data.length; i += 4) {
          // Standard luminosity weighting
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          totalBrightness += gray;
          grayValues.push(gray);
        }

        const avgBrightness = totalBrightness / (data.length / 4);

        // Simple variance of grayscale for sharpness/contrast check
        let varianceSum = 0;
        for (const g of grayValues) {
          varianceSum += Math.pow(g - avgBrightness, 2);
        }
        const contrastScore = Math.sqrt(varianceSum / grayValues.length);

        const isDark = avgBrightness < 45;
        const isBlurry = contrastScore < 18;

        let recommendation: string | undefined;
        if (isDark) {
          recommendation = 'Bill photo is too dark. Please take photo near a light or turn on flash.';
        } else if (isBlurry) {
          recommendation = 'Bill image appears blurry or low contrast. Hold camera steady and focus on the printed numbers.';
        }

        resolve({
          isAcceptable: !isDark && !isBlurry,
          isBlurry,
          isDark,
          brightness: Math.round(avgBrightness),
          contrastScore: Math.round(contrastScore),
          recommendation,
        });
      } catch {
        resolve({ isAcceptable: true, isBlurry: false, isDark: false, brightness: 128, contrastScore: 50 });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ isAcceptable: true, isBlurry: false, isDark: false, brightness: 128, contrastScore: 50 });
    };
  });
}
