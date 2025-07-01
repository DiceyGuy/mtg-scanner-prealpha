// ClaudeVisionService.js - OPTIMIZED FOR FEWER API CALLS
class GeminiVisionService {
    constructor() {
        console.log('🧠 MTG CARD SCANNER - GEMINI + SCRYFALL INTEGRATION!');
        this.canvas = null;
        this.ctx = null;
        this.debugMode = true;
        
        // 🔥 OPTIMIZED: Reduced API call frequency
        this.geminiApiKey = 'AIzaSyBtqyUy1X3BdNtUAW88QZWbtqI39MbUDdk';
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.lastGeminiCall = 0;
        this.geminiRateLimit = 8000; // 🔥 INCREASED: 8 seconds base rate limit
        this.consecutiveErrors = 0;
        this.consecutiveRateLimits = 0;
        this.backoffMultiplier = 1.2; // 🔥 REDUCED: Even gentler backoff
        this.maxBackoff = 12000; // 🔥 REDUCED: Maximum 12 seconds backoff
        
        // 🔥 ENHANCED: Better frame similarity detection
        this.lastFrameHash = null;
        this.frameSimilarityThreshold = 0.98; // 🔥 INCREASED: More sensitive similarity
        this.lastSuccessfulDetection = null;
        this.lastSuccessfulTime = 0;
        this.framesSinceLastCall = 0;
        this.minFramesBetweenCalls = 5; // 🔥 NEW: Skip frames between API calls
        
        // SCRYFALL INTEGRATION
        this.scryfallData = new Map();
        this.scryfallLoaded = false;
        this.loadingScryfallData = false;
        
        console.log('✅ Gemini Vision API initialized successfully');
        console.log('🔧 MTG-focused scanner with Scryfall database integration');
        console.log('📦 Loading Scryfall MTG database...');
        
        this.initializeScryfallData();
        this.log('🚀 MTG Scanner initialized - preparing Scryfall database');
    }

    async initializeScryfallData() {
        if (this.loadingScryfallData || this.scryfallLoaded) return;
        
        this.loadingScryfallData = true;
        console.log('📦 Loading Scryfall MTG card database...');
        
        try {
            const bulkResponse = await fetch('https://api.scryfall.com/bulk-data');
            const bulkInfo = await bulkResponse.json();
            const oracleCards = bulkInfo.data.find(item => item.type === 'oracle_cards');
            
            if (!oracleCards) {
                throw new Error('Oracle cards bulk data not found');
            }
            
            console.log('⬇️ Downloading Scryfall Oracle Cards database...');
            console.log('📊 Database info:', {
                size: Math.round(oracleCards.size / 1024 / 1024) + ' MB',
                updated: oracleCards.updated_at
            });
            
            const cardsResponse = await fetch(oracleCards.download_uri);
            const cardsData = await cardsResponse.json();
            
            let processedCards = 0;
            for (const card of cardsData) {
                if (card.lang === 'en') {
                    const cardKey = card.name.toLowerCase();
                    this.scryfallData.set(cardKey, {
                        name: card.name,
                        oracle_id: card.oracle_id,
                        set: card.set_name,
                        set_code: card.set,
                        type_line: card.type_line,
                        mana_cost: card.mana_cost || '',
                        cmc: card.cmc || 0,
                        colors: card.colors || [],
                        rarity: card.rarity,
                        image_uri: card.image_uris?.normal || '',
                        scryfall_uri: card.scryfall_uri
                    });
                    processedCards++;
                }
            }
            
            this.scryfallLoaded = true;
            console.log('✅ Scryfall database loaded successfully!');
            console.log('📊 Total MTG cards in database:', processedCards);
            console.log('🎯 MTG Scanner ready for professional card identification!');
            
        } catch (error) {
            console.error('❌ Failed to load Scryfall database:', error);
            console.log('⚠️ Falling back to basic MTG card detection');
            this.scryfallLoaded = false;
        } finally {
            this.loadingScryfallData = false;
        }
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`🧠 ${message}`, data || '');
        }
    }

    calculateFrameHash(imageData) {
        let hash = 0;
        const step = Math.floor(imageData.length / 200); // 🔥 MORE DETAILED: Sample 200 points
        
        for (let i = 0; i < imageData.length; i += step) {
            hash = ((hash << 5) - hash + imageData[i]) & 0xffffffff;
        }
        
        return hash;
    }

    // 🔥 ENHANCED: Much better frame similarity detection
    isFrameSimilarToLast(frameData) {
        const canvas = frameData.canvas;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const currentHash = this.calculateFrameHash(imageData.data);
        
        if (this.lastFrameHash === null) {
            this.lastFrameHash = currentHash;
            return false;
        }
        
        // 🔥 IMPROVED: Better similarity calculation
        const hashDifference = Math.abs(currentHash - this.lastFrameHash);
        const totalPixels = imageData.data.length;
        const similarityRatio = 1 - (hashDifference / totalPixels);
        const isSimilar = similarityRatio > this.frameSimilarityThreshold;
        
        this.lastFrameHash = currentHash;
        
        if (isSimilar) {
            console.log(`⏭️ Frame similarity: ${(similarityRatio * 100).toFixed(1)}% - skipping API call`);
        }
        
        return isSimilar;
    }

    async processVideoFrame(videoElement) {
        this.log('🔄 Processing frame for MTG CARD IDENTIFICATION...');
        const startTime = performance.now();
        
        // 🔥 NEW: Frame counting to reduce API calls
        this.framesSinceLastCall++;
        if (this.framesSinceLastCall < this.minFramesBetweenCalls) {
            return {
                hasCard: false,
                message: 'Skipping frame for rate limiting',
                confidence: 0,
                method: 'frame_skipped',
                processingTime: Math.round(performance.now() - startTime),
                timestamp: new Date().toISOString()
            };
        }
        
        try {
            const frameData = await this.captureHighQualityFrame(videoElement);
            this.log('📷 Frame captured', `${frameData.width}x${frameData.height}`);
            
            // 🔥 ENHANCED: Better similarity detection
            if (this.isFrameSimilarToLast(frameData)) {
                if (this.lastSuccessfulDetection && 
                    Date.now() - this.lastSuccessfulTime < 8000) { // 🔥 INCREASED: 8 second cache
                    this.log('♻️ Returning cached detection for similar frame');
                    return this.lastSuccessfulDetection;
                }
                
                return {
                    hasCard: false,
                    message: 'Frame unchanged, no new scan needed',
                    confidence: 0,
                    method: 'frame_similarity_skip',
                    processingTime: Math.round(performance.now() - startTime),
                    timestamp: new Date().toISOString()
                };
            }
            
            // 🔥 Reset frame counter only when we make an API call
            this.framesSinceLastCall = 0;
            
            const geminiResult = await this.callGeminiVisionForMTG(frameData);
            this.log('🎯 Gemini MTG analysis result', geminiResult);
            
            const enhancedResult = await this.enhanceWithScryfallData(geminiResult, frameData);
            this.log('✨ Scryfall-enhanced result', enhancedResult);
            
            const processingTime = Math.round(performance.now() - startTime);
            const finalResult = this.formatMTGScannerResult(enhancedResult, processingTime);
            
            if (finalResult.hasCard && finalResult.confidence >= 80) {
                this.lastSuccessfulDetection = finalResult;
                this.lastSuccessfulTime = Date.now();
                this.consecutiveErrors = 0;
                this.consecutiveRateLimits = 0;
            }
            
            return finalResult;
            
        } catch (error) {
            this.log('❌ MTG scanning error, using fallback', error.message);
            
            if (!error.message.includes('Rate limited')) {
                this.consecutiveErrors++;
            }
            
            const processingTime = Math.round(performance.now() - startTime);
            return await this.mtgFallback(videoElement, processingTime);
        }
    }

    // 🔥 OPTIMIZED: Gentler rate limiting
    async callGeminiVisionForMTG(frameData) {
        this.log('🧠 Calling Gemini Vision for MTG CARD IDENTIFICATION...');
        
        const now = Date.now();
        let actualRateLimit = this.geminiRateLimit;
        
        // 🔥 OPTIMIZED: Much gentler backoff for rate limits
        if (this.consecutiveRateLimits > 0) {
            actualRateLimit = Math.min(
                this.geminiRateLimit + (this.consecutiveRateLimits * 1500), // +1.5s per rate limit
                this.maxBackoff // Cap at 12 seconds
            );
            console.log(`⏳ Gentle rate limit backoff: ${actualRateLimit}ms (rate limits: ${this.consecutiveRateLimits})`);
        }
        
        if (this.consecutiveErrors > 0) {
            const errorBackoff = this.geminiRateLimit * Math.pow(this.backoffMultiplier, this.consecutiveErrors);
            actualRateLimit = Math.max(actualRateLimit, Math.min(errorBackoff, this.maxBackoff));
            console.log(`⚠️ Error backoff: ${actualRateLimit}ms (errors: ${this.consecutiveErrors})`);
        }
        
        if (now - this.lastGeminiCall < actualRateLimit) {
            const waitTime = actualRateLimit - (now - this.lastGeminiCall);
            this.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
            
            this.consecutiveRateLimits++;
            
            throw new Error(`Rate limited - wait ${waitTime}ms between calls`);
        }
        
        this.lastGeminiCall = now;
        
        const imageBase64 = this.frameToBase64(frameData);
        const base64Data = imageBase64.split(',')[1];
        this.log('📤 Image ready for MTG analysis, size:', base64Data.length);
        
        const mtgPrompt = `You are an expert Magic: The Gathering card identifier. Analyze this image ONLY for MTG cards.

CRITICAL RULES:
1. If this is NOT a Magic: The Gathering card, respond with "NOT_MTG_CARD"
2. Only identify cards with 90%+ confidence
3. Focus on the card name in the title area
4. Ignore blurry, partial, or unclear cards

If you see a clear MTG card, identify:
- CARD NAME (exact spelling, most important)
- Mana cost from top-right corner
- Card type (Creature, Instant, etc.)
- Set symbol if clearly visible

RESPOND EXACTLY LIKE THIS:
CARD_NAME: [exact card name]
MANA_COST: [symbols like {R}, {2}{U}, etc.]
TYPE: [card type line]
SET: [set name if visible, otherwise "Unknown"]
TEXT: [first line of rules text if clearly visible]
CONFIDENCE: [80-100 only for clear cards]

ONLY analyze clear, well-lit MTG cards. Reject anything unclear.`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: mtgPrompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 200
            }
        };

        try {
            const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            this.log('📥 Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.log('❌ Gemini error response:', errorText);
                
                if (response.status === 429) {
                    this.consecutiveRateLimits++;
                    throw new Error(`Rate limited: ${response.status} - Gemini API rate limit exceeded`);
                }
                
                this.consecutiveErrors++;
                throw new Error(`Gemini error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid Gemini response structure');
            }
            
            const responseText = data.candidates[0].content.parts[0].text;
            console.log('🎯 RAW GEMINI RESPONSE (for debugging):');
            console.log('---START RESPONSE---');
            console.log(responseText);
            console.log('---END RESPONSE---');
            
            const mtgAnalysis = this.parseMTGResponse(responseText);
            this.log('✅ MTG parsing successful:', mtgAnalysis);
            
            if (mtgAnalysis.hasCard) {
                this.consecutiveRateLimits = 0;
                this.consecutiveErrors = 0;
            }
            
            return mtgAnalysis;

        } catch (error) {
            this.log('❌ Gemini MTG Vision call failed:', error.message);
            throw error;
        }
    }

    parseMTGResponse(responseText) {
        if (!responseText || responseText.includes('NOT_MTG_CARD')) {
            return {
                hasCard: false,
                cardName: '',
                confidence: 0,
                reason: 'Not a Magic: The Gathering card'
            };
        }
        
        const lines = responseText.split('\n');
        const result = {
            hasCard: true,
            cardName: '',
            manaCost: '',
            cardType: '',
            setInfo: '',
            rulesText: '',
            confidence: 50
        };
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('CARD_NAME:')) {
                result.cardName = trimmedLine.replace('CARD_NAME:', '').trim();
            } else if (trimmedLine.startsWith('MANA_COST:')) {
                result.manaCost = trimmedLine.replace('MANA_COST:', '').trim();
            } else if (trimmedLine.startsWith('TYPE:')) {
                result.cardType = trimmedLine.replace('TYPE:', '').trim();
            } else if (trimmedLine.startsWith('SET:')) {
                result.setInfo = trimmedLine.replace('SET:', '').trim();
            } else if (trimmedLine.startsWith('TEXT:')) {
                result.rulesText = trimmedLine.replace('TEXT:', '').trim();
            } else if (trimmedLine.startsWith('CONFIDENCE:')) {
                const confStr = trimmedLine.replace('CONFIDENCE:', '').trim();
                result.confidence = parseInt(confStr) || 50;
            }
        }
        
        if (!result.cardName || result.cardName.length < 3) {
            return {
                hasCard: false,
                cardName: '',
                confidence: 0,
                reason: 'No valid card name detected'
            };
        }
        
        if (result.confidence < 80) {
            return {
                hasCard: false,
                cardName: result.cardName,
                confidence: result.confidence,
                reason: `Confidence too low: ${result.confidence}%`
            };
        }
        
        return result;
    }

    async enhanceWithScryfallData(geminiResult, frameData) {
        this.log('✨ Enhancing with Scryfall MTG database...');
        
        if (!this.scryfallLoaded) {
            this.log('⚠️ Scryfall database not loaded yet, using basic enhancement');
            return geminiResult;
        }
        
        let enhanced = { ...geminiResult };
        
        if (geminiResult.hasCard && geminiResult.cardName) {
            const cardKey = geminiResult.cardName.toLowerCase().trim();
            
            if (this.scryfallData.has(cardKey)) {
                const scryfallCard = this.scryfallData.get(cardKey);
                enhanced = {
                    ...enhanced,
                    cardName: scryfallCard.name,
                    setInfo: scryfallCard.set,
                    cardType: scryfallCard.type_line,
                    manaCost: scryfallCard.mana_cost,
                    rarity: scryfallCard.rarity,
                    colors: scryfallCard.colors,
                    imageUri: scryfallCard.image_uri,
                    scryfallUri: scryfallCard.scryfall_uri,
                    confidence: Math.min(enhanced.confidence + 10, 98),
                    verificationSource: 'scryfall_exact_match',
                    isVerified: true
                };
                this.log('✅ EXACT MATCH found in Scryfall database:', scryfallCard.name);
            } else {
                const fuzzyMatch = this.scryfallFuzzyMatch(cardKey);
                if (fuzzyMatch.found) {
                    enhanced = {
                        ...enhanced,
                        cardName: fuzzyMatch.card.name,
                        setInfo: fuzzyMatch.card.set,
                        cardType: fuzzyMatch.card.type_line,
                        manaCost: fuzzyMatch.card.mana_cost,
                        confidence: Math.min(enhanced.confidence + 5, 95),
                        verificationSource: 'scryfall_fuzzy_match',
                        isFuzzyMatch: true,
                        matchScore: fuzzyMatch.score,
                        originalDetection: geminiResult.cardName
                    };
                    this.log('⚠️ FUZZY MATCH found in Scryfall:', fuzzyMatch.card.name);
                }
            }
        }
        
        return enhanced;
    }

    scryfallFuzzyMatch(cardName) {
        let bestMatch = null;
        let bestScore = 0;
        const minScore = 0.8;
        
        for (const [key, card] of this.scryfallData) {
            const score = this.calculateSimilarity(cardName, key);
            if (score > bestScore && score >= minScore) {
                bestScore = score;
                bestMatch = card;
            }
        }
        
        return bestMatch ? 
            { found: true, card: bestMatch, score: bestScore } : 
            { found: false, card: null, score: 0 };
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

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

    async captureHighQualityFrame(videoElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
            willReadFrequently: true
        });
        
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

    frameToBase64(frameData) {
        return frameData.canvas.toDataURL('image/jpeg', 0.8);
    }

    formatMTGScannerResult(result, processingTime) {
        if (result.hasCard && result.confidence >= 80 && result.cardName && result.cardName.length >= 3) {
            return {
                hasCard: true,
                cardName: result.cardName,
                confidence: result.confidence,
                setInfo: result.setInfo || 'Unknown Set',
                cardType: result.cardType || 'Unknown Type',
                manaCost: result.manaCost || '',
                rarity: result.rarity || 'Unknown',
                colors: result.colors || [],
                imageUri: result.imageUri || '',
                scryfallUri: result.scryfallUri || '',
                method: 'optimized_mtg_gemini_scryfall',
                isVerified: result.isVerified || false,
                isFuzzyMatch: result.isFuzzyMatch || false,
                verificationSource: result.verificationSource || 'none',
                processingTime: processingTime,
                timestamp: new Date().toISOString(),
                scryfallLoaded: this.scryfallLoaded
            };
        } else {
            const reason = result.confidence < 80 ? 'LOW_CONFIDENCE' : 'NO_MTG_CARD_DETECTED';
            const message = result.confidence < 80 ? 
                `MTG card detected but confidence too low (${result.confidence}%) - improve lighting/angle` : 
                'No Magic: The Gathering card detected - position card clearly in view';
                
            return {
                hasCard: false,
                message: message,
                reason: reason,
                confidence: result.confidence || 0,
                method: 'optimized_mtg_gemini_scryfall',
                processingTime: processingTime,
                timestamp: new Date().toISOString(),
                scryfallLoaded: this.scryfallLoaded
            };
        }
    }

    // 🔥 OPTIMIZED: Better fallback messaging
    async mtgFallback(videoElement, processingTime) {
        this.log('⚠️ MTG Vision unavailable, using fallback...');
        
        let fallbackMessage = 'MTG Scanner temporarily unavailable - please try again';
        
        if (this.consecutiveErrors > 3) {
            fallbackMessage = 'Too many errors - please check internet connection and try again later';
        } else if (this.consecutiveRateLimits > 3) {
            fallbackMessage = 'Rate limited - waiting for API availability (normal behavior, please wait)';
        } else if (this.consecutiveErrors > 1) {
            fallbackMessage = 'MTG Scanner experiencing issues - retrying with longer intervals';
        }
        
        return {
            hasCard: false,
            message: fallbackMessage,
            reason: this.consecutiveRateLimits > this.consecutiveErrors ? 'RATE_LIMITED' : 'SCANNER_ERROR',
            confidence: 0,
            method: 'optimized_mtg_fallback',
            processingTime: processingTime,
            timestamp: new Date().toISOString(),
            scryfallLoaded: this.scryfallLoaded,
            consecutiveErrors: this.consecutiveErrors,
            consecutiveRateLimits: this.consecutiveRateLimits
        };
    }

    extractCardNameFromText(text) {
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 3 && trimmed.length < 50 && /^[A-Z]/.test(trimmed) && 
                !trimmed.includes('http') && !trimmed.includes('@') && !trimmed.includes('CARD_NAME')) {
                return trimmed;
            }
        }
        return 'Unknown Card';
    }

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
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        }
        this.canvas.width = width;
        this.canvas.height = height;
        return { canvas: this.canvas, ctx: this.ctx };
    }

    resetErrorState() {
        this.consecutiveErrors = 0;
        this.consecutiveRateLimits = 0;
        this.lastFrameHash = null;
        this.lastSuccessfulDetection = null;
        this.lastSuccessfulTime = 0;
        this.framesSinceLastCall = 0;
        console.log('🔄 Vision service error state reset');
    }
}

export default GeminiVisionService;