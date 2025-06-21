// ClaudeVisionService.js - VERCEL PROXY MODE
import Tesseract from 'tesseract.js';

class ClaudeVisionService {
    constructor() {
        console.log('🚀 CLAUDE VERCEL PROXY MTG SCANNER!');
        this.canvas = null;
        this.ctx = null;
        this.debugMode = true;
        
        // VERCEL PROXY CONFIGURATION - NO MORE DIRECT BROWSER CALLS!
        this.claudeApiUrl = '/api/claude'; // Vercel serverless function
        this.lastClaudeCall = 0;
        this.claudeRateLimit = 1000; // 1 second between calls (optimized)
        
        console.log('🌐 Using Vercel serverless proxy - secure and reliable!');
        console.log('🎯 Proxy URL:', this.claudeApiUrl);
        
        // MTG Card Database
        this.knownCards = new Set([
            'black lotus', 'ancestral recall', 'time walk', 'timetwister',
            'mox pearl', 'mox sapphire', 'mox jet', 'mox ruby', 'mox emerald',
            'lightning bolt', 'counterspell', 'path to exile', 'swords to plowshares',
            'snapcaster mage', 'tarmogoyf', 'delver of secrets', 'young pyromancer',
            'monastery swiftspear', 'brainstorm', 'ponder', 'serum visions',
            'thoughtseize', 'inquisition of kozilek', 'gitaxian probe',
            'sol ring', 'command tower', 'arcane signet', 'rhystic study',
            'cyclonic rift', 'demonic tutor', 'vampiric tutor', 'mystical tutor',
            'enlightened tutor', 'worldly tutor', 'sylvan library', 'smothering tithe',
            'dockside extortionist', 'mana crypt', 'chrome mox', 'mox diamond',
            'ragavan nimble pilferer', 'orcish bowmasters', 'grief', 'fury',
            'solitude', 'endurance', 'subtlety', 'teferi time raveler',
            'oko thief of crowns', 'ragavan', 'bowmasters', 'sheoldred the apocalypse',
            'atraxa grand unifier', 'elesh norn mother of machines',
            'force of will', 'force of negation', 'mana drain', 'cryptic command',
            'jace the mind sculptor', 'teferi hero of dominaria', 'wrenn and six',
            'wasteland', 'strip mine', 'fetchlands', 'shocklands', 'dual lands'
        ]);
        
        this.log('📊 MTG database loaded', `${this.knownCards.size} known cards`);
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`🎯 ${message}`, data || '');
        }
    }

    // MAIN PROCESSING METHOD
    async processVideoFrame(videoElement) {
        this.log('🎥 Processing video frame with VERCEL PROXY...');
        const startTime = performance.now();
        
        try {
            // Step 1: Capture frame
            const frameData = await this.captureHighQualityFrame(videoElement);
            this.log('📷 Frame captured', `${frameData.width}x${frameData.height}`);
            
            // Step 2: Call Claude via Vercel Proxy
            const claudeResult = await this.callClaudeViaProxy(frameData);
            this.log('🧠 Claude API result', claudeResult);
            
            // Step 3: Enhance with local intelligence
            const enhancedResult = await this.enhanceWithMTGIntelligence(claudeResult, frameData);
            this.log('⚡ Enhanced result', enhancedResult);
            
            const processingTime = Math.round(performance.now() - startTime);
            
            return this.formatScannerResult(enhancedResult, processingTime);
            
        } catch (error) {
            this.log('❌ Claude Proxy error, falling back to OCR', error.message);
            const processingTime = Math.round(performance.now() - startTime);
            return await this.ocrFallback(videoElement, processingTime);
        }
    }

    // CLAUDE API VIA VERCEL PROXY
    async callClaudeViaProxy(frameData) {
        this.log('🌐 Calling Claude API via Vercel proxy...');
        
        // Rate limiting
        const now = Date.now();
        if (now - this.lastClaudeCall < this.claudeRateLimit) {
            const waitTime = this.claudeRateLimit - (now - this.lastClaudeCall);
            this.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
            throw new Error(`Rate limited - wait ${waitTime}ms between calls`);
        }
        this.lastClaudeCall = now;
        
        // Convert frame to base64
        const imageBase64 = this.frameToBase64(frameData);
        const base64Data = imageBase64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        this.log('📷 Image converted to base64, size:', base64Data.length);
        
        // MTG-optimized prompt
        const prompt = `You are an expert Magic: The Gathering card identifier. Analyze this image and identify any MTG cards visible.

FOCUS ON:
- Card name (most important)
- Set/edition if visible
- Art style and visual elements
- Border type (black, white, modern, etc.)
- Special treatments (foil, showcase, etc.)
- Card type (creature, spell, land, etc.)

Respond in EXACTLY this JSON format:
{
    "hasCard": true/false,
    "cardName": "exact card name",
    "confidence": 0-100,
    "setInfo": "set name or edition if visible",
    "cardType": "creature/spell/land/etc if visible", 
    "specialTreatment": "foil/showcase/borderless/etc if applicable",
    "artDescription": "brief description of the artwork",
    "analysis": "why you think this is this card"
}

If no clear MTG card is visible, respond with hasCard: false.`;

        const requestBody = {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt
                        },
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        };

        this.log('📤 Sending request to Vercel proxy...', {
            url: this.claudeApiUrl,
            model: requestBody.model,
            maxTokens: requestBody.max_tokens,
            imageSize: base64Data.length
        });

        try {
            const response = await fetch(this.claudeApiUrl, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            this.log('📥 Proxy response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                this.log('❌ Proxy error response:', errorData);
                throw new Error(`Proxy error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            this.log('✅ Proxy response received successfully');
            this.log('📊 Response data:', {
                usage: data.usage,
                model: data.model,
                contentLength: data.content?.[0]?.text?.length
            });

            // Parse Claude's response
            let claudeAnalysis;
            try {
                claudeAnalysis = JSON.parse(data.content[0].text);
                this.log('✅ JSON parsing successful:', claudeAnalysis);
            } catch (parseError) {
                this.log('⚠️ JSON parsing failed, creating structured response');
                // If Claude doesn't return JSON, create structured response
                claudeAnalysis = {
                    hasCard: true,
                    cardName: this.extractCardNameFromText(data.content[0].text),
                    confidence: 85,
                    setInfo: 'Claude AI Detection',
                    cardType: 'Unknown',
                    specialTreatment: 'None',
                    artDescription: data.content[0].text.substring(0, 100),
                    analysis: 'Claude AI vision analysis'
                };
            }

            return claudeAnalysis;

        } catch (error) {
            this.log('❌ Proxy call failed:', {
                message: error.message,
                name: error.name,
                type: typeof error,
                isNetworkError: error.message.includes('fetch'),
                isProxyError: error.message.includes('Proxy error'),
                stack: error.stack?.substring(0, 200)
            });
            
            // Enhanced error messages
            if (error.message.includes('Proxy error')) {
                console.log('🌐 Proxy Error - Vercel serverless function issue');
            } else if (error.message.includes('fetch')) {
                console.log('🌐 Network Error - checking internet connection...');
            }
            
            throw error;
        }
    }

    // ENHANCE WITH MTG INTELLIGENCE
    async enhanceWithMTGIntelligence(claudeResult, frameData) {
        this.log('⚡ Enhancing with MTG intelligence...');
        
        let enhanced = { ...claudeResult };
        
        if (claudeResult.hasCard && claudeResult.cardName) {
            const normalizedName = claudeResult.cardName.toLowerCase().trim();
            
            // Database verification
            if (this.knownCards.has(normalizedName)) {
                enhanced.confidence = Math.min(enhanced.confidence + 15, 95);
                enhanced.isKnownCard = true;
                enhanced.verificationSource = 'database_verified';
                this.log('✅ Card verified in database');
            }
            
            // Fuzzy matching
            const fuzzyMatch = this.intelligentFuzzyMatch(normalizedName);
            if (fuzzyMatch.found) {
                enhanced.cardName = fuzzyMatch.match;
                enhanced.confidence = Math.min(enhanced.confidence + 10, 92);
                enhanced.isFuzzyMatch = true;
                enhanced.originalDetection = claudeResult.cardName;
                this.log('🎯 Fuzzy match found:', fuzzyMatch.match);
            }
            
            // OCR backup for low confidence
            if (enhanced.confidence < 80) {
                const ocrBackup = await this.quickOCRBackup(frameData);
                if (ocrBackup.success && ocrBackup.confidence > 60) {
                    enhanced.ocrBackup = ocrBackup.text;
                    enhanced.confidence = Math.min(enhanced.confidence + 8, 87);
                    this.log('📝 OCR backup added confidence boost');
                }
            }
        }
        
        return enhanced;
    }

    // INTELLIGENT FUZZY MATCHING
    intelligentFuzzyMatch(cardName) {
        let bestMatch = '';
        let bestScore = 0;
        const minScore = 0.7;
        
        for (const knownCard of this.knownCards) {
            const score = this.calculateSimilarity(cardName, knownCard);
            if (score > bestScore && score >= minScore) {
                bestScore = score;
                bestMatch = knownCard;
            }
        }
        
        return bestMatch ? 
            { found: true, match: bestMatch, score: bestScore } : 
            { found: false, match: '', score: 0 };
    }

    // CALCULATE STRING SIMILARITY
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    // LEVENSHTEIN DISTANCE
    levenshteinDistance(str1, str2) {
        const matrix = [];
        const n = str2.length;
        const m = str1.length;

        if (n === 0) return m;
        if (m === 0) return n;

        for (let i = 0; i <= n; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= m; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[n][m];
    }

    // QUICK OCR BACKUP
    async quickOCRBackup(frameData) {
        try {
            this.log('🔍 Quick OCR backup...');
            
            const nameZone = this.extractNameZone(frameData);
            const enhancedZone = this.enhanceForOCR(nameZone);
            const dataUrl = this.frameToBase64(enhancedZone);
            
            const { data } = await Tesseract.recognize(dataUrl, 'eng', {
                logger: () => {},
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\',. -',
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
            });
            
            const cleanText = this.cleanOCRText(data.text);
            
            return {
                success: cleanText.length >= 3,
                text: cleanText,
                confidence: data.confidence,
                method: 'quick_ocr_backup'
            };
            
        } catch (error) {
            return { success: false, text: '', confidence: 0 };
        }
    }

    // EXTRACT NAME ZONE
    extractNameZone(frameData) {
        const zone = { x: 0.05, y: 0.04, width: 0.70, height: 0.10 };
        
        const nameX = Math.floor(frameData.width * zone.x);
        const nameY = Math.floor(frameData.height * zone.y);
        const nameWidth = Math.floor(frameData.width * zone.width);
        const nameHeight = Math.floor(frameData.height * zone.height);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = nameWidth;
        canvas.height = nameHeight;
        
        ctx.drawImage(frameData.canvas, nameX, nameY, nameWidth, nameHeight, 0, 0, nameWidth, nameHeight);
        
        return {
            canvas: canvas,
            width: nameWidth,
            height: nameHeight,
            imageData: ctx.getImageData(0, 0, nameWidth, nameHeight)
        };
    }

    // ENHANCE FOR OCR
    enhanceForOCR(imageData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        
        ctx.putImageData(imageData.imageData, 0, 0);
        ctx.filter = 'contrast(150%) brightness(110%)';
        ctx.drawImage(canvas, 0, 0);
        
        return {
            canvas: canvas,
            width: canvas.width,
            height: canvas.height,
            imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
        };
    }

    // CAPTURE HIGH-QUALITY FRAME
    async captureHighQualityFrame(videoElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(videoElement, 0, 0);
        
        return {
            canvas: canvas,
            width: canvas.width,
            height: canvas.height,
            imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
        };
    }

    // CONVERT TO BASE64
    frameToBase64(frameData) {
        return frameData.canvas.toDataURL('image/jpeg', 0.9);
    }

    // FORMAT SCANNER RESULT
    formatScannerResult(result, processingTime) {
        const cardName = result.cardName || this.formatCardName(result.cleanText || result.text);
        
        if (result.hasCard && result.confidence >= 70 && cardName && cardName.length >= 3) {
            return {
                hasCard: true,
                cardName: this.formatCardName(cardName),
                confidence: result.confidence,
                detectionConfidence: result.confidence / 100,
                setInfo: result.setInfo || 'Unknown Set',
                cardType: result.cardType || 'Unknown Type',
                specialTreatment: result.specialTreatment || 'Standard',
                method: 'vercel_proxy_claude_api',
                isKnownCard: result.isKnownCard || false,
                isFuzzyMatch: result.isFuzzyMatch || false,
                artDescription: result.artDescription || '',
                analysis: result.analysis || '',
                processingTime: processingTime,
                timestamp: new Date().toISOString()
            };
        } else {
            const reason = result.confidence < 70 ? 'LOW_CONFIDENCE' : 'NO_CARD_DETECTED';
            const message = result.confidence < 70 ? 
                `Card detected but confidence too low (${result.confidence}%) - try better lighting` : 
                'Position MTG card clearly in camera view';
                
            return {
                hasCard: false,
                message: message,
                reason: reason,
                details: `Vercel Proxy Claude API: ${result.confidence}%, Processing: ${processingTime}ms`,
                confidence: result.confidence,
                method: 'vercel_proxy_claude_api',
                processingTime: processingTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    // OCR FALLBACK
    async ocrFallback(videoElement, processingTime) {
        this.log('🔄 Claude Proxy unavailable, using OCR fallback...');
        
        try {
            const frameData = await this.captureHighQualityFrame(videoElement);
            const ocrResult = await this.quickOCRBackup(frameData);
            
            return {
                hasCard: ocrResult.success && ocrResult.confidence > 50,
                message: ocrResult.success ? 
                    `OCR Fallback: ${this.formatCardName(ocrResult.text)} (${ocrResult.confidence}%)` :
                    'Claude Proxy unavailable, OCR fallback also failed',
                reason: 'CLAUDE_PROXY_FALLBACK',
                details: `OCR: ${ocrResult.text || 'No text'}, Processing: ${processingTime}ms`,
                confidence: ocrResult.confidence || 0,
                cardName: ocrResult.success ? this.formatCardName(ocrResult.text) : '',
                method: 'ocr_fallback',
                processingTime: processingTime,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                hasCard: false,
                message: 'Scanner temporarily unavailable',
                reason: 'TOTAL_FAILURE',
                details: `All methods failed: ${error.message}`,
                processingTime: processingTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    // HELPER METHODS
    formatCardName(cardName) {
        if (!cardName) return '';
        return cardName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    cleanOCRText(text) {
        if (!text) return '';
        return text.replace(/[^\w\s',.-]/g, '').replace(/\s+/g, ' ').replace(/\b\w\b/g, '').trim().toLowerCase();
    }

    extractCardNameFromText(text) {
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 3 && trimmed.length < 50 && /^[A-Z]/.test(trimmed) && !trimmed.includes('http') && !trimmed.includes('@')) {
                return trimmed;
            }
        }
        return 'Unknown Card';
    }

    // COMPATIBILITY METHODS
    async scanCard(imageSrc, cardType = 'standard') {
        if (imageSrc && imageSrc.tagName === 'VIDEO') {
            return await this.processVideoFrame(imageSrc);
        }
        return { success: false, confidence: 0, message: 'Only video processing supported' };
    }

    async processCardImage(imageSrc, cardType = 'standard') {
        return { success: false, confidence: 0, message: 'Only video processing supported' };
    }

    setupCanvas(width, height) {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
        this.canvas.width = width;
        this.canvas.height = height;
        return { canvas: this.canvas, ctx: this.ctx };
    }
}

export default ClaudeVisionService;