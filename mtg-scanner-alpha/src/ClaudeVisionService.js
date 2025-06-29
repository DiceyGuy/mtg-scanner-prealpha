// MTG-Focused GeminiVisionService.js - WITH SCRYFALL INTEGRATION
import Tesseract from 'tesseract.js';

class GeminiVisionService {
    constructor() {
        console.log('🚀 MTG CARD SCANNER - GEMINI + SCRYFALL INTEGRATION!');
        this.canvas = null;
        this.ctx = null;
        this.debugMode = true;
        
        // GOOGLE GEMINI API CONFIGURATION
        this.geminiApiKey = 'AIzaSyBtqyUy1X3BdNtUAW88QZWbtqI39MbUDdk';
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.lastGeminiCall = 0;
        this.geminiRateLimit = 1000;
        
        // SCRYFALL INTEGRATION
        this.scryfallData = new Map(); // Will store card name -> card data
        this.scryfallLoaded = false;
        this.loadingScryfallData = false;
        
        console.log('🔑 Gemini Vision API initialized successfully');
        console.log('🃏 MTG-focused scanner with Scryfall database integration');
        console.log('🎯 Loading Scryfall MTG database...');
        
        // Start loading Scryfall data
        this.initializeScryfallData();
        
        this.log('📊 MTG Scanner initialized - preparing Scryfall database');
    }

    async initializeScryfallData() {
        if (this.loadingScryfallData || this.scryfallLoaded) return;
        
        this.loadingScryfallData = true;
        console.log('📥 Loading Scryfall MTG card database...');
        
        try {
            // Get bulk data info from Scryfall
            const bulkResponse = await fetch('https://api.scryfall.com/bulk-data');
            const bulkInfo = await bulkResponse.json();
            
            // Find the Oracle Cards bulk data (best for card identification)
            const oracleCards = bulkInfo.data.find(item => item.type === 'oracle_cards');
            
            if (!oracleCards) {
                throw new Error('Oracle cards bulk data not found');
            }
            
            console.log('📥 Downloading Scryfall Oracle Cards database...');
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
            console.log(`🎯 ${message}`, data || '');
        }
    }

    // MAIN PROCESSING METHOD - MTG FOCUSED
    async processVideoFrame(videoElement) {
        this.log('🎥 Processing frame for MTG CARD IDENTIFICATION...');
        const startTime = performance.now();
        
        try {
            // Step 1: Capture frame
            const frameData = await this.captureHighQualityFrame(videoElement);
            this.log('📷 Frame captured', `${frameData.width}x${frameData.height}`);
            
            // Step 2: MTG-focused Gemini Vision analysis
            const geminiResult = await this.callGeminiVisionForMTG(frameData);
            this.log('🧠 Gemini MTG analysis result', geminiResult);
            
            // Step 3: Enhance with Scryfall database
            const enhancedResult = await this.enhanceWithScryfallData(geminiResult, frameData);
            this.log('⚡ Scryfall-enhanced result', enhancedResult);
            
            const processingTime = Math.round(performance.now() - startTime);
            
            return this.formatMTGScannerResult(enhancedResult, processingTime);
            
        } catch (error) {
            this.log('❌ MTG scanning error, using fallback', error.message);
            const processingTime = Math.round(performance.now() - startTime);
            return await this.mtgFallback(videoElement, processingTime);
        }
    }

    // MTG-OPTIMIZED GEMINI VISION CALL
    async callGeminiVisionForMTG(frameData) {
        this.log('🌐 Calling Gemini Vision for MTG CARD IDENTIFICATION...');
        
        // Rate limiting
        const now = Date.now();
        if (now - this.lastGeminiCall < this.geminiRateLimit) {
            const waitTime = this.geminiRateLimit - (now - this.lastGeminiCall);
            this.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
            throw new Error(`Rate limited - wait ${waitTime}ms between calls`);
        }
        this.lastGeminiCall = now;
        
        // Convert frame to base64
        const imageBase64 = this.frameToBase64(frameData);
        const base64Data = imageBase64.split(',')[1];
        this.log('📷 Image ready for MTG analysis, size:', base64Data.length);
        
        // MAGIC: THE GATHERING SPECIFIC PROMPT
        const mtgPrompt = `You are a Magic: The Gathering card identification expert. Analyze this image ONLY for Magic: The Gathering cards.

IMPORTANT: If this is NOT a Magic: The Gathering card, respond with "NOT_MTG_CARD".

If you see a Magic: The Gathering card, identify:
1. CARD NAME (most critical) - exact spelling
2. Mana cost (symbols in top right)
3. Card type line (Creature, Instant, Sorcery, etc.)
4. Set symbol if visible
5. Any visible rules text

RESPOND IN EXACTLY THIS FORMAT:
CARD_NAME: [exact card name]
MANA_COST: [mana symbols]
TYPE: [card type]
SET: [set if visible]
TEXT: [any visible rules text]
CONFIDENCE: [1-100]

Examples:
CARD_NAME: Lightning Bolt
MANA_COST: R
TYPE: Instant
SET: Unknown
TEXT: Lightning Bolt deals 3 damage to any target
CONFIDENCE: 95

Only analyze Magic: The Gathering cards. Ignore all other objects.`;

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
            }]
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
                throw new Error(`Gemini error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // CRITICAL: LOG THE RAW RESPONSE TO DEBUG JSON PARSING
            const responseText = data.candidates[0].content.parts[0].text;
            console.log('🔍 RAW GEMINI RESPONSE (for debugging):');
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

    // PARSE MTG-SPECIFIC RESPONSE
    parseMTGResponse(responseText) {
        if (responseText.includes('NOT_MTG_CARD')) {
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
                result.confidence = parseInt(trimmedLine.replace('CONFIDENCE:', '').trim()) || 50;
            }
        }
        
        // If no card name found, try extracting from raw text
        if (!result.cardName) {
            result.cardName = this.extractCardNameFromText(responseText);
        }
        
        return result;
    }

    // ENHANCE WITH SCRYFALL DATABASE
    async enhanceWithScryfallData(geminiResult, frameData) {
        this.log('⚡ Enhancing with Scryfall MTG database...');
        
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
                    confidence: Math.min(enhanced.confidence + 20, 95),
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
                        confidence: Math.min(enhanced.confidence + 15, 90),
                        verificationSource: 'scryfall_fuzzy_match',
                        isFuzzyMatch: true,
                        matchScore: fuzzyMatch.score,
                        originalDetection: geminiResult.cardName
                    };
                    this.log('🎯 FUZZY MATCH found in Scryfall:', fuzzyMatch.card.name);
                }
            }
        }
        
        return enhanced;
    }

    // SCRYFALL FUZZY MATCHING
    scryfallFuzzyMatch(cardName) {
        let bestMatch = null;
        let bestScore = 0;
        const minScore = 0.7;
        
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
        return frameData.canvas.toDataURL('image/jpeg', 0.9);
    }

    // FORMAT MTG SCANNER RESULT
    formatMTGScannerResult(result, processingTime) {
        if (result.hasCard && result.confidence >= 60 && result.cardName && result.cardName.length >= 3) {
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
                method: 'mtg_gemini_scryfall',
                isVerified: result.isVerified || false,
                isFuzzyMatch: result.isFuzzyMatch || false,
                verificationSource: result.verificationSource || 'none',
                processingTime: processingTime,
                timestamp: new Date().toISOString(),
                scryfallLoaded: this.scryfallLoaded
            };
        } else {
            const reason = result.confidence < 60 ? 'LOW_CONFIDENCE' : 'NO_MTG_CARD_DETECTED';
            const message = result.confidence < 60 ? 
                `MTG card detected but confidence too low (${result.confidence}%) - improve lighting/angle` : 
                'No Magic: The Gathering card detected - position card clearly in view';
                
            return {
                hasCard: false,
                message: message,
                reason: reason,
                confidence: result.confidence || 0,
                method: 'mtg_gemini_scryfall',
                processingTime: processingTime,
                timestamp: new Date().toISOString(),
                scryfallLoaded: this.scryfallLoaded
            };
        }
    }

    // MTG FALLBACK
    async mtgFallback(videoElement, processingTime) {
        this.log('🔄 MTG Vision unavailable, using basic fallback...');
        
        return {
            hasCard: false,
            message: 'MTG Scanner temporarily unavailable - please try again',
            reason: 'SCANNER_ERROR',
            confidence: 0,
            method: 'mtg_fallback',
            processingTime: processingTime,
            timestamp: new Date().toISOString(),
            scryfallLoaded: this.scryfallLoaded
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
}

export default GeminiVisionService;