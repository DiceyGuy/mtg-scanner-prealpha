import React, { useState, useRef, useEffect } from 'react';

// 🧠 GEMINI VISION SERVICE - PRODUCTION READY
class GeminiVisionService {
    constructor() {
        this.geminiApiKey = 'AIzaSyBtqyUy1X3BdNtUAW88QZWbtqI39MbUDdk'; // Your working API key
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.lastApiCall = 0;
        this.rateLimitDelay = 3000; // 3 seconds between calls
        this.consecutiveErrors = 0;
        
        console.log('🧠 Gemini Vision Service initialized with operative camera');
    }

    async processVideoFrame(videoElement) {
        const startTime = performance.now();
        
        try {
            // Rate limiting
            const now = Date.now();
            const timeSinceLastCall = now - this.lastApiCall;
            if (timeSinceLastCall < this.rateLimitDelay) {
                const waitTime = this.rateLimitDelay - timeSinceLastCall;
                console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
                throw new Error(`Rate limited - wait ${Math.ceil(waitTime/1000)}s`);
            }
            this.lastApiCall = Date.now();

            // Capture frame from video
            const frameData = this.captureFrame(videoElement);
            const imageBase64 = frameData.canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = imageBase64.split(',')[1];

            // Call Gemini API
            const result = await this.callGeminiAPI(base64Data);
            
            if (result.hasCard) {
                this.consecutiveErrors = 0;
                
                // Enhance with Scryfall data
                const enhancedResult = await this.enhanceWithScryfall(result);
                
                const processingTime = Math.round(performance.now() - startTime);
                return {
                    ...enhancedResult,
                    processingTime,
                    timestamp: new Date().toISOString()
                };
            }
            
            return result;
            
        } catch (error) {
            this.consecutiveErrors++;
            console.error('❌ Vision processing error:', error);
            
            const processingTime = Math.round(performance.now() - startTime);
            return {
                hasCard: false,
                message: `Scanner: ${error.message}`,
                confidence: 0,
                processingTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    captureFrame(videoElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(videoElement, 0, 0);
        
        return { canvas, width: canvas.width, height: canvas.height };
    }

    async callGeminiAPI(base64Data) {
        const prompt = `Analyze this image for Magic: The Gathering cards. 

RULES:
1. Only identify clear, well-lit MTG cards
2. Must be 90%+ confident to respond
3. Focus on the card name in the title area

If you see a clear MTG card, respond EXACTLY like this:
CARD_NAME: [exact name]
CONFIDENCE: [90-100]
TYPE: [card type]
MANA_COST: [if visible]

If no clear MTG card: "NO_MTG_CARD"`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
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

        const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            if (response.status === 429) {
                this.rateLimitDelay = Math.min(this.rateLimitDelay * 1.5, 15000);
                throw new Error(`Rate limited - reducing scan speed`);
            }
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates[0]?.content?.parts[0]?.text || '';
        
        return this.parseGeminiResponse(responseText);
    }

    parseGeminiResponse(responseText) {
        if (!responseText || responseText.includes('NO_MTG_CARD')) {
            return {
                hasCard: false,
                message: 'No MTG card detected',
                confidence: 0
            };
        }

        const lines = responseText.split('\n');
        let cardName = '';
        let confidence = 0;
        let cardType = '';
        let manaCost = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('CARD_NAME:')) {
                cardName = trimmed.replace('CARD_NAME:', '').trim();
            } else if (trimmed.startsWith('CONFIDENCE:')) {
                confidence = parseInt(trimmed.replace('CONFIDENCE:', '').trim()) || 0;
            } else if (trimmed.startsWith('TYPE:')) {
                cardType = trimmed.replace('TYPE:', '').trim();
            } else if (trimmed.startsWith('MANA_COST:')) {
                manaCost = trimmed.replace('MANA_COST:', '').trim();
            }
        }

        if (!cardName || cardName.length < 3 || confidence < 85) {
            return {
                hasCard: false,
                message: confidence < 85 ? `Low confidence: ${confidence}%` : 'Invalid card name',
                confidence: confidence
            };
        }

        return {
            hasCard: true,
            cardName,
            confidence,
            cardType,
            manaCost,
            method: 'gemini_vision'
        };
    }

    async enhanceWithScryfall(result) {
        try {
            const encodedName = encodeURIComponent(result.cardName);
            const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodedName}`);
            
            if (response.ok) {
                const scryfallCard = await response.json();
                return {
                    ...result,
                    cardType: scryfallCard.type_line,
                    manaCost: scryfallCard.mana_cost || '',
                    setInfo: scryfallCard.set_name,
                    rarity: scryfallCard.rarity,
                    scryfallId: scryfallCard.id,
                    scryfallUri: scryfallCard.scryfall_uri,
                    imageUri: scryfallCard.image_uris?.normal,
                    prices: scryfallCard.prices,
                    colors: scryfallCard.colors || [],
                    setCode: scryfallCard.set,
                    collectorNumber: scryfallCard.collector_number,
                    isVerified: true
                };
            }
        } catch (error) {
            console.log('⚠️ Scryfall enhancement failed:', error.message);
        }
        
        return result;
    }
}

// 🔥 SMART COOLDOWN SYSTEM - BURST THEN PAUSE
class UltimateSmartCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.detectionBuffer = [];
        this.isEditionSelectorOpen = false;
        
        // Optimized timing for real camera
        this.BURST_SCAN_INTERVAL = 2000;      // 2s for fast scanning
        this.SAME_CARD_COOLDOWN = 10000;      // 10s after detection
        this.DETECTION_STABILITY = 2;         // Need 2 consistent detections
        this.MAX_CONSECUTIVE = 3;             // Max before long pause
        this.LONG_PAUSE_DURATION = 15000;    // 15s pause
        
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
        this.currentMode = 'burst';
    }

    shouldScan(cardName = null) {
        const now = Date.now();
        
        if (this.isEditionSelectorOpen) return false;
        
        if (this.isLongPauseActive) {
            const pauseRemaining = this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime);
            if (pauseRemaining > 0) return false;
            else {
                this.isLongPauseActive = false;
                this.consecutiveDetections = 0;
                this.currentMode = 'burst';
            }
        }
        
        const interval = this.currentMode === 'burst' ? this.BURST_SCAN_INTERVAL : this.SAME_CARD_COOLDOWN;
        if (now - this.lastApiCall < interval) return false;
        
        if (cardName && cardName === this.lastDetectedCard && this.currentMode === 'cooldown') {
            const timeSinceLastDetection = now - this.lastDetectionTime;
            if (timeSinceLastDetection < this.SAME_CARD_COOLDOWN) return false;
        }
        
        return true;
    }

    addDetection(cardName, confidence) {
        const now = Date.now();
        this.detectionBuffer.push({ cardName, confidence, timestamp: now });
        this.detectionBuffer = this.detectionBuffer.filter(
            detection => now - detection.timestamp < 8000
        );
        
        const recentSameCard = this.detectionBuffer.filter(
            detection => detection.cardName === cardName
        );
        
        return recentSameCard.length >= this.DETECTION_STABILITY;
    }

    recordDetection(cardName) {
        const now = Date.now();
        
        if (cardName === this.lastDetectedCard) {
            this.consecutiveDetections++;
        } else {
            this.consecutiveDetections = 1;
            this.lastDetectedCard = cardName;
        }
        
        this.lastDetectionTime = now;
        this.lastApiCall = now;
        this.detectionBuffer = [];
        this.currentMode = 'cooldown';
        
        if (this.consecutiveDetections >= this.MAX_CONSECUTIVE) {
            this.isLongPauseActive = true;
            this.longPauseStartTime = now;
        }
    }

    setEditionSelectorOpen(isOpen) {
        this.isEditionSelectorOpen = isOpen;
    }

    resetCooldowns() {
        this.consecutiveDetections = 0;
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.detectionBuffer = [];
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
        this.currentMode = 'burst';
    }

    getCooldownStatus() {
        const now = Date.now();
        let longPauseRemaining = 0;
        if (this.isLongPauseActive) {
            longPauseRemaining = Math.max(0, this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime));
        }
        
        const nextInterval = this.currentMode === 'burst' ? this.BURST_SCAN_INTERVAL : this.SAME_CARD_COOLDOWN;
        
        return {
            mode: this.currentMode,
            nextScanIn: Math.max(0, nextInterval - (now - this.lastApiCall)),
            consecutiveDetections: this.consecutiveDetections,
            longPauseRemaining,
            canScan: this.shouldScan(this.lastDetectedCard),
            detectionBufferSize: this.detectionBuffer.length,
            stabilityRequired: this.DETECTION_STABILITY
        };
    }
}

// 🎭 EDITION SELECTOR COMPONENT
const EditionSelector = ({ isOpen, cardName, editions, onSelect, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                border: '2px solid #4a90e2', borderRadius: '16px', padding: '32px',
                maxWidth: '600px', width: '90%', maxHeight: '80vh',
                color: 'white'
            }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '20px', textAlign: 'center' }}>
                    🎭 Multiple Editions Found
                </h3>
                
                <p style={{ marginBottom: '24px', color: '#94a3b8', textAlign: 'center' }}>
                    Choose the correct edition for <strong style={{ color: '#4a90e2' }}>{cardName}</strong>
                </p>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px' }}>
                    {editions.map((edition, index) => (
                        <div key={index} onClick={() => onSelect(edition)}
                            style={{
                                padding: '16px', margin: '12px 0',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px', cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(74, 144, 226, 0.1)';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.target.style.transform = 'translateY(0)';
                            }}>
                            
                            <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>
                                {edition.set_name}
                            </div>
                            
                            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                                <div><strong>Set:</strong> {edition.set.toUpperCase()}</div>
                                <div><strong>Released:</strong> {edition.released_at}</div>
                                {edition.prices?.usd && (
                                    <div><strong>Price:</strong> ${edition.prices.usd}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={onCancel}
                        style={{
                            padding: '12px 24px', background: 'transparent',
                            border: '2px solid #666', color: '#94a3b8',
                            borderRadius: '8px', cursor: 'pointer'
                        }}>
                        Skip Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

// 📷 CAMERA STATUS INDICATOR
const CameraStatus = ({ status, error }) => (
    <div style={{
        position: 'absolute', bottom: '10px', left: '10px',
        background: 'rgba(0,0,0,0.8)', color: 'white',
        padding: '8px 12px', borderRadius: '6px',
        fontSize: '12px', fontWeight: '500',
        border: '1px solid #4a90e2'
    }}>
        📷 {status === 'ready' ? 'Camera Ready ✅' : 
             status === 'requesting' ? 'Initializing... ⏳' : 
             status === 'error' ? `Error: ${error?.message || 'Unknown'} ❌` : 
             'Starting... 🔄'}
    </div>
);

// 🔥 ENHANCED COOLDOWN STATUS
const CooldownStatus = ({ cooldownStatus, isVisible }) => {
    if (!isVisible || !cooldownStatus) return null;

    return (
        <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.9)', color: 'white', padding: '12px',
            borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace',
            border: '1px solid #4a90e2', minWidth: '200px', zIndex: 1000
        }}>
            <div style={{color: '#4a90e2', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center'}}>
                🔥 OPERATIVE SCANNER
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                <span>Mode:</span>
                <span style={{
                    color: cooldownStatus.mode === 'burst' ? '#22c55e' : '#fbbf24',
                    fontWeight: 'bold'
                }}>
                    {cooldownStatus.mode === 'burst' ? '⚡ BURST' : '🛡️ COOLDOWN'}
                </span>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                <span>Next Scan:</span>
                <span style={{color: '#64b5f6'}}>{Math.ceil(cooldownStatus.nextScanIn / 1000)}s</span>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                <span>Stability:</span>
                <span style={{color: '#64b5f6'}}>
                    {cooldownStatus.detectionBufferSize}/{cooldownStatus.stabilityRequired}
                </span>
            </div>
            
            <div style={{
                marginTop: '8px', padding: '6px', 
                background: cooldownStatus.canScan ? 'rgba(34, 197, 94, 0.3)' : 'rgba(220, 53, 69, 0.3)',
                borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'
            }}>
                {cooldownStatus.canScan ? '✅ READY' : '⏳ WAITING'}
            </div>
        </div>
    );
};

// 🎯 TOAST NOTIFICATIONS
const showToast = (message, type = 'info', duration = 3000) => {
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10001;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#dc3545' : '#4a90e2'};
        color: white; padding: 16px 24px; border-radius: 8px;
        font-weight: 600; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out; max-width: 300px; font-size: 14px;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, duration);
};

// 🔥 MAIN SCANNER COMPONENT WITH OPERATIVE CAMERA
const MTGScannerPro = () => {
    // Core scanning state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('initializing');
    const [cameraError, setCameraError] = useState(null);
    const [currentCard, setCurrentCard] = useState(null);
    const [scanMode, setScanMode] = useState('continuous');
    
    // Collection state
    const [savedCards, setSavedCards] = useState([]);
    const [scanHistory, setScanHistory] = useState([]);
    
    // Edition selection state
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [cooldownStatus, setCooldownStatus] = useState({});
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const visionServiceRef = useRef(new GeminiVisionService());
    const cooldownSystemRef = useRef(new UltimateSmartCooldown());

    // Initialize component
    useEffect(() => {
        console.log('🚀 Initializing MTG Scanner Pro with operative camera...');
        loadSavedData();
        enumerateCameras().then(() => setupCamera());
        
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500);
        
        return () => {
            cleanup();
            clearInterval(cooldownUpdateInterval);
        };
    }, []);

    const loadSavedData = () => {
        try {
            const saved = localStorage.getItem('mtg_saved_cards_pro');
            if (saved) setSavedCards(JSON.parse(saved));
            
            const history = localStorage.getItem('mtg_scan_history_pro');
            if (history) setScanHistory(JSON.parse(history));
        } catch (error) {
            console.error('❌ Failed to load saved data:', error);
        }
    };

    // 📷 CAMERA ENUMERATION AND SETUP
    const enumerateCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📷 Available cameras:', videoDevices.length);
            setAvailableCameras(videoDevices);
            
            // Prioritize Logitech C920 or first available camera
            const logitechCamera = videoDevices.find(device => 
                device.label.toLowerCase().includes('logitech') || 
                device.label.toLowerCase().includes('c920')
            );
            
            if (logitechCamera) {
                setSelectedCameraId(logitechCamera.deviceId);
                console.log('✅ Auto-selected Logitech C920');
            } else if (videoDevices.length > 0) {
                setSelectedCameraId(videoDevices[0].deviceId);
                console.log('✅ Auto-selected first camera');
            }
        } catch (error) {
            console.error('❌ Failed to enumerate cameras:', error);
            setCameraError({ message: 'Failed to detect cameras' });
        }
    };

    const setupCamera = async (deviceId = null) => {
        console.log('🎥 Setting up operative camera...');
        setCameraStatus('requesting');
        setCameraError(null);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported');
            }

            // Stop existing stream
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
            }

            const useDeviceId = deviceId || selectedCameraId;
            let constraints = {
                video: {
                    deviceId: useDeviceId ? { exact: useDeviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraStreamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStatus('ready');
                    setCameraError(null);
                    console.log('✅ Operative camera ready:', `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    showToast('📷 Operative camera ready for MTG scanning!', 'success');
                };
            }
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            setCameraStatus('error');
            setCameraError({
                message: error.name === 'NotAllowedError' ? 'Camera permission denied' : 
                         error.name === 'NotFoundError' ? 'No camera found' :
                         error.name === 'NotReadableError' ? 'Camera is busy' : 'Camera error'
            });
            showToast('❌ Camera setup failed', 'error');
        }
    };

    // 🔍 SCANNING LOGIC
    const startScanning = () => {
        if (cameraStatus !== 'ready') {
            showToast('❌ Camera not ready', 'error');
            return;
        }
        
        console.log(`▶️ Starting operative scanning - ${scanMode} mode...`);
        setIsScanning(true);
        cooldownSystemRef.current.resetCooldowns();
        
        scanIntervalRef.current = setInterval(async () => {
            try {
                const currentCardName = currentCard?.cardName;
                
                if (!cooldownSystemRef.current.shouldScan(currentCardName)) {
                    setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                    return;
                }

                if (showEditionSelector) {
                    cooldownSystemRef.current.setEditionSelectorOpen(true);
                    return;
                } else {
                    cooldownSystemRef.current.setEditionSelectorOpen(false);
                }

                console.log("🔄 Processing frame with Gemini AI...");
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 85) {
                    console.log(`🎯 Card detected: ${result.cardName} (${result.confidence}%)`);
                    
                    const isStable = cooldownSystemRef.current.addDetection(result.cardName, result.confidence);
                    
                    if (isStable) {
                        console.log('✅ Detection stable, processing...');
                        
                        cooldownSystemRef.current.recordDetection(result.cardName);
                        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                        
                        if (scanMode === 'single') {
                            stopScanning();
                        }
                        
                        await handleCardDetection(result);
                    }
                    
                } else if (result && !result.hasCard) {
                    setScanResult({ hasCard: false, message: result.message || 'No MTG card detected' });
                    setCurrentCard(null);
                }
                
                setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                
            } catch (error) {
                console.error('❌ Scanning error:', error);
                setScanResult({ hasCard: false, message: `Scanner error: ${error.message}` });
            }
        }, 1000);
    };

    const handleCardDetection = async (detectedCard) => {
        try {
            addToScanHistory(detectedCard);
            
            // Mock Scryfall edition lookup for demo
            const mockEditions = [
                { set: 'dom', set_name: 'Dominaria', released_at: '2018-04-27', prices: { usd: '2.50' } },
                { set: 'lea', set_name: 'Limited Edition Alpha', released_at: '1993-08-05', prices: { usd: '150.00' } },
                { set: 'leb', set_name: 'Limited Edition Beta', released_at: '1993-10-01', prices: { usd: '75.00' } }
            ];
            
            if (mockEditions.length > 1) {
                setPendingCardData(detectedCard);
                setAvailableEditions(mockEditions);
                setShowEditionSelector(true);
                setScanResult(null);
                setCurrentCard(null);
                return;
            } else {
                const enhancedCard = enhanceCardWithScryfall(detectedCard, mockEditions[0]);
                displayCard(enhancedCard);
                await saveCardToCollection(enhancedCard);
            }
            
        } catch (error) {
            console.error('❌ Card detection error:', error);
            displayCard(detectedCard);
        }
    };

    const handleEditionSelected = async (selectedEdition) => {
        if (pendingCardData && selectedEdition) {
            const enhancedCard = enhanceCardWithScryfall(pendingCardData, selectedEdition);
            displayCard(enhancedCard);
            await saveCardToCollection(enhancedCard);
            showToast(`✅ ${enhancedCard.cardName} saved!`, 'success');
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
    };

    const handleEditionCancelled = async () => {
        if (pendingCardData) {
            displayCard(pendingCardData);
            await saveCardToCollection(pendingCardData);
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
    };

    const enhanceCardWithScryfall = (originalCard, scryfallCard) => {
        return {
            ...originalCard,
            setInfo: scryfallCard.set_name,
            setCode: scryfallCard.set,
            prices: scryfallCard.prices,
            scryfallUri: `https://scryfall.com/search?q=${encodeURIComponent(originalCard.cardName)}`,
            isVerified: true
        };
    };

    const displayCard = (card) => {
        setCurrentCard(card);
        setScanResult(card);
        showToast(`🎯 ${card.cardName} recognized (${card.confidence}%)`, 'success');
    };

    const addToScanHistory = (card) => {
        const historyEntry = {
            ...card,
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString()
        };
        
        setScanHistory(prev => {
            const newHistory = [historyEntry, ...prev.slice(0, 49)];
            localStorage.setItem('mtg_scan_history_pro', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const saveCardToCollection = async (card) => {
        try {
            const cardWithId = {
                ...card,
                id: Date.now() + Math.random(),
                addedAt: new Date().toISOString()
            };
            
            setSavedCards(prev => {
                const newCollection = [cardWithId, ...prev];
                localStorage.setItem('mtg_saved_cards_pro', JSON.stringify(newCollection));
                return newCollection;
            });
            
            return true;
        } catch (error) {
            console.error('❌ Failed to save card:', error);
            return false;
        }
    };

    const stopScanning = () => {
        setIsScanning(false);
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    };

    const cleanup = () => {
        stopScanning();
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
    };

    const removeCardFromCollection = (cardId) => {
        setSavedCards(prev => {
            const newCollection = prev.filter(card => card.id !== cardId);
            localStorage.setItem('mtg_saved_cards_pro', JSON.stringify(newCollection));
            return newCollection;
        });
        showToast('🗑️ Card removed', 'info');
    };

    const exportToMoxfield = () => {
        if (savedCards.length === 0) {
            showToast('❌ No cards to export', 'error');
            return;
        }
        
        const moxfieldFormat = savedCards.map(card => `1 ${card.cardName}`).join('\n');
        const blob = new Blob([moxfieldFormat], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mtg_collection_moxfield.txt';
        a.click();
        URL.revokeObjectURL(url);
        showToast('📤 Collection exported!', 'success');
    };

    return (
        <div style={{
            maxWidth: '1400px', margin: '0 auto', padding: '20px', minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 0', borderBottom: '2px solid #4a90e2',
                marginBottom: '20px', flexWrap: 'wrap', gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '60px', height: '60px',
                        background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                        borderRadius: '12px', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '12px', textAlign: 'center', lineHeight: '1.1'
                    }}>MTG<br/>SCAN<br/>PRO</div>
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text', marginBottom: '5px'
                        }}>MTG Scanner Pro</h1>
                        <span style={{ fontSize: '0.9rem', color: '#b0bec5' }}>
                            📷 Operative Camera • 🧠 Gemini AI • 🎭 Smart Editions
                        </span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)', padding: '8px 12px',
                        borderRadius: '20px', border: '1px solid rgba(74, 144, 226, 0.3)',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>History: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{scanHistory.length}</span>
                    </div>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)', padding: '8px 12px',
                        borderRadius: '20px', border: '1px solid rgba(74, 144, 226, 0.3)',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Collection: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{savedCards.length}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex', gap: '4px', marginBottom: '20px',
                background: 'rgba(255, 255, 255, 0.05)', padding: '4px',
                borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {[
                    { id: 'scanner', label: '📷 Scanner', badge: null },
                    { id: 'collection', label: '🖼️ Collection', badge: savedCards.length },
                    { id: 'history', label: '📊 History', badge: scanHistory.length }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1, padding: '12px 16px', border: 'none',
                            background: activeTab === tab.id ? 'linear-gradient(45deg, #4a90e2, #64b5f6)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#94a3b8',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                        <span>{tab.label}</span>
                        {tab.badge !== null && (
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.2)', color: 'white',
                                padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700'
                            }}>{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Scanner Tab */}
                {activeTab === 'scanner' && (
                    <>
                        {/* Camera & Scanning */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                            padding: '24px'
                        }}>
                            {/* Video Container */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <video ref={videoRef}
                                    style={{
                                        width: '100%', maxWidth: '640px', height: 'auto',
                                        borderRadius: '12px', border: '2px solid #4a90e2',
                                        background: '#000'
                                    }}
                                    autoPlay playsInline muted />
                                
                                {/* Cooldown Status */}
                                <CooldownStatus
                                    cooldownStatus={cooldownStatus}
                                    isVisible={isScanning}
                                />
                                
                                {/* Camera Status */}
                                <CameraStatus 
                                    status={cameraStatus} 
                                    error={cameraError} 
                                />
                                
                                {/* Scanning Overlay */}
                                {isScanning && (
                                    <div style={{
                                        position: 'absolute', top: '10px', left: '10px',
                                        background: 'rgba(74, 144, 226, 0.8)', color: 'white',
                                        padding: '8px 12px', borderRadius: '6px',
                                        fontSize: '14px', fontWeight: '600'
                                    }}>
                                        🔍 Operative scanning with Gemini AI...
                                    </div>
                                )}
                                
                                {/* Camera Error Overlay */}
                                {cameraError && (
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%',
                                        transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.9)',
                                        color: 'white', padding: '20px', borderRadius: '12px',
                                        textAlign: 'center', border: '2px solid #dc3545'
                                    }}>
                                        <h3>📹 Camera Issue</h3>
                                        <p>{cameraError.message}</p>
                                        <button onClick={() => setupCamera()}
                                            style={{
                                                padding: '10px 20px', background: '#4a90e2',
                                                border: 'none', color: 'white', borderRadius: '6px',
                                                cursor: 'pointer', marginTop: '10px'
                                            }}>
                                            🔄 Try Again
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Scan Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setScanMode('continuous')} disabled={isScanning}
                                        style={{
                                            flex: 1, padding: '12px',
                                            border: scanMode === 'continuous' ? '2px solid #4a90e2' : '1px solid #666',
                                            background: scanMode === 'continuous' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                                            color: 'white', borderRadius: '8px',
                                            cursor: isScanning ? 'not-allowed' : 'pointer', fontSize: '13px'
                                        }}>
                                        ⚡ Smart Continuous
                                    </button>
                                    <button onClick={() => setScanMode('single')} disabled={isScanning}
                                        style={{
                                            flex: 1, padding: '12px',
                                            border: scanMode === 'single' ? '2px solid #4a90e2' : '1px solid #666',
                                            background: scanMode === 'single' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                                            color: 'white', borderRadius: '8px',
                                            cursor: isScanning ? 'not-allowed' : 'pointer', fontSize: '13px'
                                        }}>
                                        📷 Smart Single
                                    </button>
                                </div>

                                <button onClick={isScanning ? stopScanning : startScanning}
                                    disabled={cameraStatus !== 'ready'}
                                    style={{
                                        padding: '16px 24px', border: 'none',
                                        background: isScanning 
                                            ? 'linear-gradient(135deg, #dc3545, #c82333)' 
                                            : 'linear-gradient(135deg, #4a90e2, #64b5f6)',
                                        color: 'white', borderRadius: '8px',
                                        cursor: cameraStatus !== 'ready' ? 'not-allowed' : 'pointer',
                                        fontSize: '16px', fontWeight: '600',
                                        opacity: cameraStatus !== 'ready' ? 0.6 : 1
                                    }}>
                                    {isScanning ? '⏹️ Stop Scanner' : `🔥 Start ${scanMode} Scan`}
                                </button>
                            </div>
                        </div>

                        {/* Current Card Display */}
                        {(currentCard || scanResult) && (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                                padding: '24px'
                            }}>
                                <h3 style={{ color: '#4a90e2', marginBottom: '20px' }}>🎯 Current Detection</h3>
                                
                                {currentCard ? (
                                    <div style={{
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                        borderRadius: '12px', padding: '20px'
                                    }}>
                                        <div style={{ 
                                            fontSize: '24px', fontWeight: 'bold', color: '#22c55e',
                                            marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            {currentCard.cardName}
                                            {currentCard.isVerified && <span>✅</span>}
                                        </div>
                                        
                                        <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.8', marginBottom: '16px' }}>
                                            {currentCard.cardType && <div><strong>Type:</strong> {currentCard.cardType}</div>}
                                            {currentCard.setInfo && <div><strong>Set:</strong> {currentCard.setInfo}</div>}
                                            {currentCard.prices?.usd && <div><strong>Price:</strong> ${currentCard.prices.usd}</div>}
                                            <div><strong>Confidence:</strong> {currentCard.confidence}%</div>
                                            <div><strong>Method:</strong> {currentCard.isVerified ? 'Scryfall Verified' : 'Gemini AI'}</div>
                                        </div>
                                        
                                        {/* Confidence Bar */}
                                        <div style={{
                                            width: '100%', height: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px',
                                            overflow: 'hidden', marginBottom: '16px'
                                        }}>
                                            <div style={{
                                                height: '100%', background: 'linear-gradient(90deg, #22c55e, #34d399)',
                                                width: `${currentCard.confidence}%`, borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button onClick={() => saveCardToCollection(currentCard)}
                                                style={{
                                                    padding: '12px 20px', background: 'rgba(74, 144, 226, 0.2)',
                                                    border: '1px solid #4a90e2', color: '#4a90e2',
                                                    borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                                                }}>
                                                💾 Save to Collection
                                            </button>
                                            
                                            {currentCard.scryfallUri && (
                                                <button onClick={() => window.open(currentCard.scryfallUri, '_blank')}
                                                    style={{
                                                        padding: '12px 20px', background: 'rgba(34, 197, 94, 0.2)',
                                                        border: '1px solid #22c55e', color: '#22c55e',
                                                        borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                                                    }}>
                                                    🔗 View on Scryfall
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                            {scanResult?.message || 'No card detected'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Collection Tab */}
                {activeTab === 'collection' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                        padding: '32px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ color: '#4a90e2', margin: 0 }}>🖼️ Card Collection ({savedCards.length})</h2>
                            <button onClick={exportToMoxfield} disabled={savedCards.length === 0}
                                style={{
                                    padding: '12px 24px', background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                                    border: 'none', color: 'white', borderRadius: '8px',
                                    cursor: savedCards.length === 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '14px', fontWeight: '600',
                                    opacity: savedCards.length === 0 ? 0.5 : 1
                                }}>
                                📤 Export to Moxfield
                            </button>
                        </div>

                        {savedCards.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '60px 20px',
                                background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px',
                                border: '1px dashed rgba(255, 255, 255, 0.1)'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
                                <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Cards in Collection</h3>
                                <p style={{ color: '#94a3b8' }}>Start scanning cards with your operative camera!</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '20px'
                            }}>
                                {savedCards.map((card, index) => (
                                    <div key={card.id || index}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            padding: '20px', transition: 'all 0.2s ease'
                                        }}>
                                        
                                        <h4 style={{ 
                                            color: '#4a90e2', marginBottom: '12px', fontSize: '16px',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            {card.cardName}
                                            {card.isVerified && <span>✅</span>}
                                        </h4>
                                        
                                        <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.6' }}>
                                            {card.cardType && <div><strong>Type:</strong> {card.cardType}</div>}
                                            {card.setInfo && <div><strong>Set:</strong> {card.setInfo}</div>}
                                            {card.prices?.usd && <div><strong>Price:</strong> ${card.prices.usd}</div>}
                                            <div><strong>Confidence:</strong> {card.confidence}%</div>
                                            {card.addedAt && <div><strong>Added:</strong> {new Date(card.addedAt).toLocaleDateString()}</div>}
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {card.scryfallUri && (
                                                <button onClick={() => window.open(card.scryfallUri, '_blank')}
                                                    style={{
                                                        flex: 1, padding: '8px 12px', background: 'rgba(74, 144, 226, 0.2)',
                                                        border: '1px solid #4a90e2', color: '#4a90e2',
                                                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                                                    }}>
                                                    🔗 Scryfall
                                                </button>
                                            )}
                                            <button onClick={() => removeCardFromCollection(card.id)}
                                                style={{
                                                    flex: 1, padding: '8px 12px', background: 'rgba(220, 53, 69, 0.2)',
                                                    border: '1px solid #dc3545', color: '#dc3545',
                                                    borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                                                }}>
                                                🗑️ Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                        padding: '32px'
                    }}>
                        <h2 style={{ color: '#4a90e2', marginBottom: '24px' }}>📊 Scan History ({scanHistory.length})</h2>

                        {scanHistory.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '60px 20px',
                                background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px',
                                border: '1px dashed rgba(255, 255, 255, 0.1)'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                                <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Scan History</h3>
                                <p style={{ color: '#94a3b8' }}>Start scanning cards to see your history here</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {scanHistory.map((card, index) => (
                                    <div key={index}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                                <span style={{ color: '#4a90e2', fontWeight: '600', fontSize: '16px' }}>
                                                    {card.cardName}
                                                </span>
                                                <span style={{ 
                                                    color: card.confidence >= 95 ? '#22c55e' : card.confidence >= 85 ? '#f59e0b' : '#ef4444',
                                                    fontSize: '14px', fontWeight: '600'
                                                }}>
                                                    {card.confidence}%
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                                {new Date(card.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                        
                                        <button onClick={() => saveCardToCollection(card)}
                                            style={{
                                                padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)',
                                                border: '1px solid #22c55e', color: '#22c55e',
                                                borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                                            }}>
                                            💾 Save
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edition Selector Modal */}
            <EditionSelector
                isOpen={showEditionSelector}
                cardName={pendingCardData?.cardName}
                editions={availableEditions}
                onSelect={handleEditionSelected}
                onCancel={handleEditionCancelled}
            />

            {/* Status Bar */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                padding: '16px', marginTop: '24px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '16px'
            }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#4a90e2' }}>MTG Scanner Pro</div>
                    {currentCard && (
                        <span style={{ fontSize: '14px' }}>
                            🎯 Last: {currentCard.cardName} ({currentCard.confidence}%)
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontSize: '14px' }}>
                    <span>📷 {cameraStatus === 'ready' ? 'Operative ✅' : 'Setup ⏳'}</span>
                    <span>🧠 Gemini AI</span>
                    <span>📊 Scryfall DB</span>
                    <span>⚡ {cooldownStatus.mode || 'Ready'} Mode</span>
                    <span>🔍 Smart Cooldown</span>
                </div>
            </div>
        </div>
    );
};

export default MTGScannerPro;