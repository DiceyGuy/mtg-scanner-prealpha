// src/services/EnhancedTesseractService.js
// Drop-in replacement for your existing OCR service

import Tesseract from 'tesseract.js';

class AdvancedImageProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  // Main processing pipeline - optimized for MTG cards
  async processForOCR(imageElement) {
    const processedImages = [];
    
    // Create base enhanced version
    const baseProcessed = await this.enhanceForOCR(imageElement);
    processedImages.push({
      name: 'enhanced_base',
      canvas: baseProcessed,
      config: { 
        tessdata_dir: './node_modules/tesseract.js/tessdata',
        psm: 6, // Uniform block of text
        oem: 3  // Default OCR Engine Mode
      }
    });

    // High contrast version for difficult text
    const highContrast = await this.createHighContrastVersion(baseProcessed);
    processedImages.push({
      name: 'high_contrast',
      canvas: highContrast,
      config: {
        tessdata_dir: './node_modules/tesseract.js/tessdata',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz \'-,.',
        psm: 8 // Single word
      }
    });

    // Card name focused version (top portion)
    const nameFocused = await this.createNameFocusedVersion(baseProcessed);
    processedImages.push({
      name: 'name_focused',
      canvas: nameFocused,
      config: {
        tessdata_dir: './node_modules/tesseract.js/tessdata',
        psm: 7, // Single text line
        oem: 3
      }
    });

    return processedImages;
  }

  // Core image enhancement optimized for MTG cards
  async enhanceForOCR(imageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Optimal size for OCR (balance speed vs accuracy)
    const targetWidth = 800;
    const aspectRatio = imageElement.height / imageElement.width;
    const targetHeight = targetWidth * aspectRatio;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Draw and get image data
    ctx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;
    
    // Apply enhancement pipeline
    this.normalizeExposure(data);
    this.reduceNoise(data, targetWidth, targetHeight);
    this.enhanceTextContrast(data);
    this.sharpenEdges(data, targetWidth, targetHeight);
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  // Normalize exposure for consistent results
  normalizeExposure(data) {
    const histogram = new Array(256).fill(0);
    
    // Build luminance histogram
    for (let i = 0; i < data.length; i += 4) {
      const luminance = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      histogram[luminance]++;
    }
    
    // Find 2% and 98% percentiles for contrast stretching
    let minVal = 0, maxVal = 255;
    const totalPixels = data.length / 4;
    let count = 0;
    
    for (let i = 0; i < 256; i++) {
      count += histogram[i];
      if (count > totalPixels * 0.02 && minVal === 0) {
        minVal = i;
      }
      if (count > totalPixels * 0.98 && maxVal === 255) {
        maxVal = i;
        break;
      }
    }
    
    // Apply contrast stretching
    const range = maxVal - minVal;
    if (range > 0) {
      for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          data[i + c] = Math.max(0, Math.min(255, 
            ((data[i + c] - minVal) * 255) / range
          ));
        }
      }
    }
  }

  // Adaptive noise reduction
  reduceNoise(data, width, height) {
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Median filter for noise reduction
        for (let c = 0; c < 3; c++) {
          const neighbors = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              neighbors.push(tempData[nIdx + c]);
            }
          }
          neighbors.sort((a, b) => a - b);
          data[idx + c] = neighbors[4]; // Median
        }
      }
    }
  }

  // Enhanced text contrast using adaptive thresholding
  enhanceTextContrast(data) {
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Apply sigmoid curve for better text separation
      const enhanced = 255 / (1 + Math.exp(-((gray - 127) / 25)));
      
      // Set RGB channels
      data[i] = data[i + 1] = data[i + 2] = enhanced;
    }
  }

  // Sharpen text edges
  sharpenEdges(data, width, height) {
    const tempData = new Uint8ClampedArray(data);
    // Sharpening kernel
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let kernelIdx = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              sum += tempData[nIdx + c] * kernel[kernelIdx++];
            }
          }
          
          data[idx + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
  }

  // High contrast binary version
  async createHighContrastVersion(canvas) {
    const newCanvas = document.createElement('canvas');
    const ctx = newCanvas.getContext('2d');
    
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Adaptive binary thresholding
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const binary = gray > 140 ? 255 : 0; // Threshold optimized for MTG cards
      data[i] = data[i + 1] = data[i + 2] = binary;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return newCanvas;
  }

  // Focus on card name area (top 25% of card)
  async createNameFocusedVersion(canvas) {
    const newCanvas = document.createElement('canvas');
    const ctx = newCanvas.getContext('2d');
    
    const cropHeight = Math.floor(canvas.height * 0.25);
    newCanvas.width = canvas.width;
    newCanvas.height = cropHeight;
    
    // Extract top portion where card names appear
    ctx.drawImage(canvas, 0, 0, canvas.width, cropHeight, 0, 0, canvas.width, cropHeight);
    
    return newCanvas;
  }

  canvasToDataURL(canvas) {
    return canvas.toDataURL('image/png');
  }
}

// Enhanced Tesseract Service - drop-in replacement
class EnhancedTesseractService {
  constructor() {
    this.processor = new AdvancedImageProcessor();
    this.workers = [];
    this.isInitialized = false;
    this.maxWorkers = 3; // Parallel processing
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing Enhanced OCR Service...');
    const startTime = performance.now();
    
    try {
      // Initialize multiple workers for parallel processing
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = Tesseract.createWorker();
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        this.workers.push(worker);
      }
      
      this.isInitialized = true;
      console.log(`✅ Enhanced OCR initialized in ${Math.round(performance.now() - startTime)}ms`);
    } catch (error) {
      console.error('❌ OCR initialization failed:', error);
      throw error;
    }
  }

  // Main scanning method - compatible with your existing interface
  async scanCard(imageElement) {
    await this.initialize();
    
    const scanStartTime = performance.now();
    console.log('🔍 Starting enhanced OCR scan...');
    
    try {
      // Process image into multiple optimized versions
      const processedImages = await this.processor.processForOCR(imageElement);
      console.log(`📷 Image processing completed in ${Math.round(performance.now() - scanStartTime)}ms`);
      
      // Run OCR on all versions in parallel
      const ocrPromises = processedImages.map((processed, index) => 
        this.runOCROnProcessedImage(processed, index)
      );
      
      const results = await Promise.allSettled(ocrPromises);
      const successfulResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      if (successfulResults.length === 0) {
        throw new Error('All OCR attempts failed');
      }
      
      // Select best result
      const bestResult = this.selectBestResult(successfulResults);
      
      const totalTime = Math.round(performance.now() - scanStartTime);
      console.log(`✅ Enhanced OCR completed in ${totalTime}ms`);
      console.log('📊 Best result:', {
        text: bestResult.text,
        confidence: Math.round(bestResult.confidence),
        method: bestResult.method
      });
      
      return {
        text: bestResult.text.trim(),
        confidence: bestResult.confidence,
        method: bestResult.method,
        processingTime: totalTime,
        allResults: successfulResults // For debugging
      };
      
    } catch (error) {
      console.error('❌ Enhanced OCR scan failed:', error);
      throw error;
    }
  }

  async runOCROnProcessedImage(processed, workerIndex) {
    const worker = this.workers[workerIndex % this.workers.length];
    const dataURL = this.processor.canvasToDataURL(processed.canvas);
    
    const { data } = await worker.recognize(dataURL, processed.config);
    
    return {
      text: data.text.trim(),
      confidence: data.confidence,
      method: processed.name,
      words: data.words,
      lines: data.lines
    };
  }

  selectBestResult(results) {
    if (results.length === 1) return results[0];
    
    // Score results based on multiple factors
    const scoredResults = results.map(result => {
      let score = result.confidence;
      
      // Text quality scoring
      const cleanText = result.text.replace(/[^a-zA-Z\s]/g, '');
      const textLength = cleanText.length;
      
      // Bonus for reasonable card name length (3-30 characters)
      if (textLength >= 3 && textLength <= 30) {
        score += 15;
      } else if (textLength < 3) {
        score -= 20; // Penalty for too short
      }
      
      // Bonus for proper capitalization (MTG cards start with capital)
      if (/^[A-Z]/.test(result.text.trim())) {
        score += 10;
      }
      
      // Bonus for containing common MTG patterns
      if (/^[A-Z][a-z]/.test(result.text)) {
        score += 8;
      }
      
      // Penalty for excessive special characters
      const specialCharRatio = (result.text.length - cleanText.length) / result.text.length;
      if (specialCharRatio > 0.3) {
        score -= 15;
      }
      
      // Bonus for name_focused results (more likely to be accurate)
      if (result.method === 'name_focused') {
        score += 5;
      }
      
      return { ...result, score };
    });
    
    // Return highest scoring result
    return scoredResults.sort((a, b) => b.score - a.score)[0];
  }

  // Compatibility method for your existing code
  async scanCardImage(imageElement) {
    return this.scanCard(imageElement);
  }

  // Cleanup method
  async terminate() {
    for (const worker of this.workers) {
      await worker.terminate();
    }
    this.workers = [];
    this.isInitialized = false;
    console.log('🛑 Enhanced OCR service terminated');
  }
}

export default EnhancedTesseractService;
