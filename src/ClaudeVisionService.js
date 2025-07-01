// MTG-Focused GeminiVisionService.js - IMPROVED RATE LIMITING
class GeminiVisionService {
    constructor() {
        console.log('🧠 MTG CARD SCANNER - GEMINI + SCRYFALL INTEGRATION!');
        this.canvas = null;
        this.ctx = null;
        this.debugMode = true;
        
        // 🔥 IMPROVED GOOGLE GEMINI API CONFIGURATION
        // 🔒 SIKKER: Bruk environment variable
this.geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;

if (!this.geminiApiKey) {
    console.error('❌ Gemini API key not found in environment variables');
    throw new Error('Gemini API key required for MTG Scanner to function');
}

console.log('✅ Gemini API key loaded from environment variables');
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.lastGeminiCall = 0;
        this.geminiRateLimit = 4000; // 🔥 INCREASED from 1000ms to 4000ms (4 seconds)
        this.consecutiveErrors = 0;
        this.backoffMultiplier = 1.5;
        
        // 🔥 NEW: Frame similarity detection to avoid duplicate API calls
        this.lastFrameHash = null;
        this.frameSimilarityThreshold = 0.95;
        this.lastSuccessfulDetection = null;
        this.lastSuccessfulTime = 0;
        
        // SCRYFALL INTEGRATION
        this.scryfallData = new Map();
        this.scryfallLoaded = false;
        this.loadingScryfallData = false;
        
        console.log('✅ Gemini Vision API initialized successfully');
        console.log('🔧 MTG-focused scanner with Scryfall database integration');
        console.log('📦 Loading Scryfall MTG database...');
        
        // Start loading Scryfall data
        this.initializeScryfallData();
        
        this.log('🚀 MTG Scanner initialized - preparing Scryfall database');
    }

    async initializeScryfallData() {
        if (this.loadingScryfallData || this.scryfallLoaded) return;
        
        this.loadingScryfallData = true;
        console.log('📦 Loading Scryfall MTG card database...');
        
        try {
            // Get bulk data info from Scryfall
            const bulkResponse = await fetch('https://api.scryfall.com/bulk-data');
            const bulkInfo = await bulkResponse.json();
            
            // Find the Oracle Cards bulk data (best for card identification)
            const oracleCards = bulkInfo.data.find(item => item.type === 'oracle_cards');
            
            if (!oracleCards) {
                throw new Error('Oracle cards bulk data not found');
            }
            
            console.log('⬇️ Downloading Scryfall Oracle Cards database...');
            console.log('📊 Database info:', {
                size: Math.round(oracleCards.size / 1024 / 1024) + ' MB',
                updated: oracleCards.updated_at
            });
            
            // Download the actual card data
            const cardsResponse = await fetch(oracleCards.download_uri);
            const cardsData = await cardsResponse.json();
            
            // Process and index the cards for fast lookup
            let processedCards = 0;
            for (const card of cardsData) {
                if (card.lang === 'en') { // Only English cards
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

    // 🔥 NEW: Calculate simple frame hash for similarity detection
    calculateFrameHash(imageData) {
        let hash = 0;
        const step = Math.floor(imageData.length / 100); // Sample 100 points
        
        for (let i = 0; i < imageData.length; i += step) {
            hash = ((hash << 5) - hash + imageData[i]) & 0xffffffff;
        }
        
        return hash;
    }

    // 🔥 NEW: Check if current frame is too similar to last frame
    isFrameSimilarToLast(frameData) {
        const canvas = frameData.canvas;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const currentHash = this.calculateFrameHash(imageData.data);
        
        if (this.lastFrameHash === null) {
            this.lastFrameHash = currentHash;
            return false;
        }
        
        // Simple similarity check - if hash is identical or very close, skip
        const hashDifference = Math.abs(currentHash - this.lastFrameHash);
        const isSimilar = hashDifference < 1000; // Threshold for "too similar"
        
        this.lastFrameHash = currentHash;
        
        if (isSimilar) {
            console.log('⏭️ Frame too similar to last, skipping API call');
        }
        
        return isSimilar;
    }

    // MAIN PROCESSING METHOD - MTG FOCUSED
    async processVideoFrame(videoElement) {
        this.log('🔄 Processing frame for MTG CARD IDENTIFICATION...');
        const startTime = performance.now();
        
        try {
            // Step 1: Capture frame
            const frameData = await this.captureHighQualityFrame(videoElement);
            this.log('📷 Frame captured', `${frameData.width}x${frameData.height}`);
            
            // 🔥 NEW: Check frame similarity to avoid duplicate API calls
            if (this.isFrameSimilarToLast(frameData)) {
                // Return last successful detection if we have one and it's recent
                if (this.lastSuccessfulDetection && 
                    Date.now() - this.lastSuccessfulTime < 5000) {
                    this.log('♻️ Returning cached detection for similar frame');
                    return this.lastSuccessfulDetection;
                }
                
                // Otherwise return no detection
                return {
                    hasCard: false,
                    message: 'Frame unchanged, skipping scan',
                    confidence: 0,
                    method: 'frame_similarity_skip',
                    processingTime: Math.round(performance.now() - startTime),
                    timestamp: new Date().toISOString()
                };
            }
            
            // Step 2: MTG-focused Gemini Vision analysis
            const geminiResult = await this.callGeminiVisionForMTG(frameData);
            this.log('🎯 Gemini MTG analysis result', geminiResult);
            
            // Step 3: Enhance with Scryfall database
            const enhancedResult = await this.enhanceWithScryfallData(geminiResult, frameData);
            this.log('✨ Scryfall-enhanced result', enhancedResult);
            
            const processingTime = Math.round(performance.now() - startTime);
            const finalResult = this.formatMTGScannerResult(enhancedResult, processingTime);
            
            // Cache successful detections
            if (finalResult.hasCard && finalResult.confidence >= 80) {
                this.lastSuccessfulDetection = finalResult;
                this.lastSuccessfulTime = Date.now();
                this.consecutiveErrors = 0; // Reset error count on success
            }
            
            return finalResult;
            
        } catch (error) {
            this.log('❌ MTG scanning error, using fallback', error.message);
            this.consecutiveErrors++;
            const processingTime = Math.round(performance.now() - startTime);
            return await this.mtgFallback(videoElement, processingTime);
        }
    }

    // 🔥 IMPROVED: MTG-OPTIMIZED GEMINI VISION CALL with better rate limiting
    async callGeminiVisionForMTG(frameData) {
        this.log('🧠 Calling Gemini Vision for MTG CARD IDENTIFICATION...');
        
        // 🔥 IMPROVED: Dynamic rate limiting with backoff
        const now = Date.now();
        let actualRateLimit = this.geminiRateLimit;
        
        // Apply exponential backoff if we've had consecutive errors
        if (this.consecutiveErrors > 0) {
            actualRateLimit = this.geminiRateLimit * Math.pow(this.backoffMultiplier, this.consecutiveErrors);
            actualRateLimit = Math.min(actualRateLimit, 30000); // Max 30 seconds
            console.log(`⏳ Applying backoff: ${actualRateLimit}ms (errors: ${this.consecutiveErrors})`);
        }
        
        if (now - this.lastGeminiCall < actualRateLimit) {
            const waitTime = actualRateLimit - (now - this.lastGeminiCall);
            this.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
            throw new Error(`Rate limited - wait ${waitTime}ms between calls`);
        }
        this.lastGeminiCall = now;
        
        // Convert frame to base64
        const imageBase64 = this.frameToBase64(frameData);
        const base64Data = imageBase64.split(',')[1];
        this.log('📤 Image ready for MTG analysis, size:', base64Data.length);
        
        // 🔥 IMPROVED: More specific MTG prompt
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
                temperature: 0.1, // 🔥 Lower temperature for more consistent results
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 200 // 🔥 Limit output length
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
                
                // 🔥 Check for specific rate limit errors
                if (response.status === 429) {
                    this.consecutiveErrors++;
                    throw new Error(`Gemini rate limited: ${response.status} - Implementing longer backoff`);
                }
                
                throw new Error(`Gemini error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // Check if response has expected structure
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid Gemini response structure');
            }
            
            // CRITICAL: LOG THE RAW RESPONSE TO DEBUG JSON PARSING
            const responseText = data.candidates[0].content.parts[0].text;
            console.log('🎯 RAW GEMINI RESPONSE (for debugging):');
            console.log('---START RESPONSE---');
            console.log(responseText);
            console.log('---END RESPONSE---');
            
            // Parse MTG-specific response format
            const mtgAnalysis = this.parseMTGResponse(responseText);
            this.log('✅ MTG parsing successful:', mtgAnalysis);
            
            return mtgAnalysis;

        } catch (error) {
            this.log('❌ Gemini MTG Vision call failed:', error.message);
            throw error;
        }
    }

    // 🔥 IMPROVED: Parse MTG-specific response with better error handling
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
        
        // 🔥 Validation: Must have card name and reasonable confidence
        if (!result.cardName || result.cardName.length < 3) {
            return {
                hasCard: false,
                cardName: '',
                confidence: 0,
                reason: 'No valid card name detected'
            };
        }
        
        // 🔥 Must have high confidence for MTG cards
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

    // ENHANCE WITH SCRYFALL DATABASE
    async enhanceWithScryfallData(geminiResult, frameData) {
        this.log('✨ Enhancing with Scryfall MTG database...');
        
        if (!this.scryfallLoaded) {
            this.log('⚠️ Scryfall database not loaded yet, using basic enhancement');
            return geminiResult;
        }
        
        let enhanced = { ...geminiResult };
        
        if (geminiResult.hasCard && geminiResult.cardName) {
            const cardKey = geminiResult.cardName.toLowerCase().trim();
            
            // Direct Scryfall lookup
            if (this.scryfallData.has(cardKey)) {
                const scryfallCard = this.scryfallData.get(cardKey);
                enhanced = {
                    ...enhanced,
                    cardName: scryfallCard.name, // Use official name
                    setInfo: scryfallCard.set,
                    cardType: scryfallCard.type_line,
                    manaCost: scryfallCard.mana_cost,
                    rarity: scryfallCard.rarity,
                    colors: scryfallCard.colors,
                    imageUri: scryfallCard.image_uri,
                    scryfallUri: scryfallCard.scryfall_uri,
                    confidence: Math.min(enhanced.confidence + 10, 98), // 🔥 Smaller boost
                    verificationSource: 'scryfall_exact_match',
                    isVerified: true
                };
                this.log('✅ EXACT MATCH found in Scryfall database:', scryfallCard.name);
            } else {
                // Fuzzy matching in Scryfall database
                const fuzzyMatch = this.scryfallFuzzyMatch(cardKey);
                if (fuzzyMatch.found) {
                    enhanced = {
                        ...enhanced,
                        cardName: fuzzyMatch.card.name,
                        setInfo: fuzzyMatch.card.set,
                        cardType: fuzzyMatch.card.type_line,
                        manaCost: fuzzyMatch.card.mana_cost,
                        confidence: Math.min(enhanced.confidence + 5, 95), // 🔥 Smaller boost for fuzzy
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

    // SCRYFALL FUZZY MATCHING
    scryfallFuzzyMatch(cardName) {
        let bestMatch = null;
        let bestScore = 0;
        const minScore = 0.8; // 🔥 Higher threshold for fuzzy matching
        
        // Search through Scryfall database
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

    // STRING SIMILARITY CALCULATION
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

    frameToBase64(frameData) {
        return frameData.canvas.toDataURL('image/jpeg', 0.8); // 🔥 Slightly lower quality for faster upload
    }

    // 🔥 IMPROVED: FORMAT MTG SCANNER RESULT with stricter requirements
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
                method: 'improved_mtg_gemini_scryfall',
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
                method: 'improved_mtg_gemini_scryfall',
                processingTime: processingTime,
                timestamp: new Date().toISOString(),
                scryfallLoaded: this.scryfallLoaded
            };
        }
    }

    // 🔥 IMPROVED: MTG FALLBACK with better error messages
    async mtgFallback(videoElement, processingTime) {
        this.log('⚠️ MTG Vision unavailable, using fallback...');
        
        let fallbackMessage = 'MTG Scanner temporarily unavailable - please try again';
        
        if (this.consecutiveErrors > 3) {
            fallbackMessage = 'Too many errors - please check internet connection and try again later';
        } else if (this.consecutiveErrors > 1) {
            fallbackMessage = 'MTG Scanner experiencing issues - retrying with longer intervals';
        }
        
        return {
            hasCard: false,
            message: fallbackMessage,
            reason: 'SCANNER_ERROR',
            confidence: 0,
            method: 'improved_mtg_fallback',
            processingTime: processingTime,
            timestamp: new Date().toISOString(),
            scryfallLoaded: this.scryfallLoaded,
            consecutiveErrors: this.consecutiveErrors
        };
    }

    // HELPER METHODS
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

    // 🔥 NEW: Reset method for when user wants to clear errors
    resetErrorState() {
        this.consecutiveErrors = 0;
        this.lastFrameHash = null;
        this.lastSuccessfulDetection = null;
        this.lastSuccessfulTime = 0;
        console.log('🔄 Vision service error state reset');
    }
}

export default GeminiVisionService;