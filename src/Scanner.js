// Scanner.js - Complete MTG Scanner with Smart Cooldown System
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import CardDisplayUI from './CardDisplayUI';
import DeckManager from './DeckManager';
import MTGKnowledgeBase from './MTGKnowledgeBase';
import EditionSelector from './EditionSelector';
import './CardDisplay.css';

// 🔥 Smart Cooldown System Class
class MTGScannerCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.isEditionSelectorOpen = false;
        
        // Cooldown periods (in milliseconds)
        this.SAME_CARD_COOLDOWN = 8000;      // 8 seconds for same card
        this.MIN_API_INTERVAL = 2000;        // 2 seconds between API calls
        this.FRAME_CHANGE_THRESHOLD = 0.1;   // 10% frame change required
        this.MAX_CONSECUTIVE = 3;            // Max detections before longer cooldown
        
        this.lastFrameData = null;
    }

    // Check if we should scan this frame
    shouldScan(cardName = null) {
        const now = Date.now();
        
        // 1. Don't scan if edition selector is open
        if (this.isEditionSelectorOpen) {
            console.log("🚫 Scanning blocked: Edition selector open");
            return false;
        }
        
        // 2. Enforce minimum API interval
        if (now - this.lastApiCall < this.MIN_API_INTERVAL) {
            console.log(`🚫 Scanning blocked: API cooldown (${this.MIN_API_INTERVAL - (now - this.lastApiCall)}ms remaining)`);
            return false;
        }
        
        // 3. Same card cooldown
        if (cardName && cardName === this.lastDetectedCard) {
            const timeSinceLastDetection = now - this.lastDetectionTime;
            if (timeSinceLastDetection < this.SAME_CARD_COOLDOWN) {
                console.log(`🚫 Scanning blocked: Same card cooldown for "${cardName}" (${this.SAME_CARD_COOLDOWN - timeSinceLastDetection}ms remaining)`);
                return false;
            }
        }
        
        // 4. Consecutive detection limit
        if (this.consecutiveDetections >= this.MAX_CONSECUTIVE) {
            console.log(`🚫 Scanning blocked: Max consecutive detections reached (${this.MAX_CONSECUTIVE})`);
            return false;
        }
        
        return true;
    }

    // Check if frame has changed significantly
    hasFrameChanged(currentFrameData) {
        if (!this.lastFrameData) {
            this.lastFrameData = currentFrameData;
            return true;
        }
        
        // Simple frame change detection
        const changeRatio = this.calculateFrameChange(this.lastFrameData, currentFrameData);
        const hasChanged = changeRatio > this.FRAME_CHANGE_THRESHOLD;
        
        if (hasChanged) {
            this.lastFrameData = currentFrameData;
        }
        
        return hasChanged;
    }

    // Simple frame change calculation
    calculateFrameChange(frame1, frame2) {
        if (frame1.length !== frame2.length) return 1;
        
        let differences = 0;
        const sampleSize = Math.min(1000, frame1.length); // Sample for performance
        
        for (let i = 0; i < sampleSize; i += 4) { // Sample every 4th byte
            if (Math.abs(frame1[i] - frame2[i]) > 10) { // Threshold for significant change
                differences++;
            }
        }
        
        return differences / (sampleSize / 4);
    }

    // Record a detection
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
        
        console.log(`✅ Detection recorded: "${cardName}" (consecutive: ${this.consecutiveDetections})`);
    }

    // Reset cooldowns (call when user interaction occurs)
    resetCooldowns() {
        console.log("🔄 Cooldowns reset by user interaction");
        this.consecutiveDetections = 0;
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
    }

    // Set edition selector state
    setEditionSelectorOpen(isOpen) {
        this.isEditionSelectorOpen = isOpen;
        if (isOpen) {
            console.log("🎭 Edition selector opened - scanning paused");
        } else {
            console.log("🎭 Edition selector closed - scanning can resume");
            this.resetCooldowns(); // Reset when edition selector closes
        }
    }

    // Get cooldown status for UI
    getCooldownStatus() {
        const now = Date.now();
        return {
            sameCardCooldown: this.lastDetectedCard ? Math.max(0, this.SAME_CARD_COOLDOWN - (now - this.lastDetectionTime)) : 0,
            apiCooldown: Math.max(0, this.MIN_API_INTERVAL - (now - this.lastApiCall)),
            consecutiveDetections: this.consecutiveDetections,
            isEditionSelectorOpen: this.isEditionSelectorOpen,
            canScan: this.shouldScan(this.lastDetectedCard)
        };
    }
}

const Scanner = () => {
    // Core scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('initializing');
    const [currentCard, setCurrentCard] = useState(null);
    const [scanMode, setScanMode] = useState('continuous');
    
    // Smart scanning state
    const [continuousCount, setContinuousCount] = useState(0);
    const [showContinueDialog, setShowContinueDialog] = useState(false);
    const [autoSaveEnabled] = useState(true);
    
    // 🔥 NEW: Cooldown system state
    const [cooldownStatus, setCooldownStatus] = useState({});
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanHistory, setScanHistory] = useState([]);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const [savedCards, setSavedCards] = useState([]);
    
    // Edition selection state
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    const [pendingScanMode, setPendingScanMode] = useState(null);
    const [scanningPausedForSelection, setScanningPausedForSelection] = useState(false);
    
    // AI Learning for edition preferences
    const [editionPreferences, setEditionPreferences] = useState({});
    
    // Collection limits and premium features
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const FREE_COLLECTION_LIMIT = 100;
    
    // Camera state with persistence
    const [cameraError, setCameraError] = useState(null);
    const [cameraRetryCount, setCameraRetryCount] = useState(0);
    const [cameraInitializationComplete, setCameraInitializationComplete] = useState(false);
    const [showCameraSelector, setShowCameraSelector] = useState(false);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const initializationPromiseRef = useRef(null);
    
    // 🔥 NEW: Cooldown system ref
    const cooldownSystemRef = useRef(new MTGScannerCooldown());

    // 🔥 Initialize services and camera ONCE
    useEffect(() => {
        console.log('🔧 Component mounting - initializing services...');
        initializeServices();
        loadSavedData();
        
        // Initialize camera ONCE
        if (!initializationPromiseRef.current) {
            console.log('🚀 Starting PERSISTENT camera initialization...');
            initializationPromiseRef.current = enumerateCameras().then(() => setupCamera());
        }
        
        // Update cooldown status periodically
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 1000);
        
        return () => {
            console.log('🧹 Component unmounting - cleaning up...');
            clearInterval(cooldownUpdateInterval);
            cleanup();
        };
    }, []);

    // Handle tab switching without stopping camera
    useEffect(() => {
        console.log(`🎯 Tab switched to: ${activeTab}`);
        
        if (activeTab === 'scanner' && cameraStreamRef.current && cameraStreamRef.current.active) {
            console.log('🎯 Scanner tab active, ensuring video connection...');
            if (videoRef.current && !videoRef.current.srcObject) {
                console.log('📷 Reconnecting video element to persistent stream...');
                videoRef.current.srcObject = cameraStreamRef.current;
                videoRef.current.play();
            }
        }
        
        if (activeTab !== 'scanner' && isScanning) {
            console.log('⏸️ Pausing scanning - left scanner tab (camera stays active)');
            stopScanning();
        }
    }, [activeTab, isScanning]);

    const initializeServices = () => {
        console.log('🔧 Initializing MTG Scanner Pro...');
        
        try {
            visionServiceRef.current = new ClaudeVisionService();
            console.log('✅ Gemini Vision Service initialized successfully');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
        }
    };

    const loadSavedData = () => {
        try {
            const saved = localStorage.getItem('mtg_saved_cards');
            if (saved) {
                setSavedCards(JSON.parse(saved));
                console.log('📁 Loaded saved cards from storage');
            }
            
            const preferences = localStorage.getItem('mtg_edition_preferences');
            if (preferences) {
                setEditionPreferences(JSON.parse(preferences));
                console.log('🧠 Loaded edition preferences for AI learning');
            }
            
            const premiumStatus = localStorage.getItem('mtg_premium_status');
            if (premiumStatus === 'true') {
                setIsPremiumUser(true);
                console.log('💎 Premium user status loaded');
            }
            
        } catch (error) {
            console.error('❌ Failed to load saved data:', error);
        }
    };

    // Camera enumeration
    const enumerateCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📷 Available cameras:', videoDevices.length);
            videoDevices.forEach((device, index) => {
                console.log(`   ${index + 1}. ${device.label || `Camera ${index + 1}`} (${device.deviceId})`);
            });
            
            setAvailableCameras(videoDevices);
            
            // Auto-select Logitech C920 if available
            const logitechCamera = videoDevices.find(device => 
                device.label.toLowerCase().includes('logitech') || 
                device.label.toLowerCase().includes('c920')
            );
            
            if (logitechCamera) {
                setSelectedCameraId(logitechCamera.deviceId);
                console.log('✅ Auto-selected Logitech C920:', logitechCamera.label);
            } else if (videoDevices.length > 0) {
                setSelectedCameraId(videoDevices[0].deviceId);
                console.log('✅ Auto-selected first camera:', videoDevices[0].label);
            }
            
        } catch (error) {
            console.error('❌ Failed to enumerate cameras:', error);
        }
    };

    // Camera setup with device selection
    const setupCamera = async (deviceId = null) => {
        console.log('🎥 Setting up PERSISTENT camera for MTG Scanner Pro...');
        setCameraStatus('requesting');
        setCameraError(null);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            // Enumerate cameras if not done yet
            if (availableCameras.length === 0) {
                await enumerateCameras();
            }

            if (cameraStreamRef.current && cameraStreamRef.current.active) {
                console.log('📷 Camera stream already active, reusing persistent stream...');
                
                if (videoRef.current && !videoRef.current.srcObject) {
                    videoRef.current.srcObject = cameraStreamRef.current;
                    videoRef.current.play();
                }
                
                setCameraStatus('ready');
                setCameraInitializationComplete(true);
                console.log('✅ Camera reused successfully - PERSISTENT MODE ACTIVE');
                return;
            }

            let stream = null;
            const useDeviceId = deviceId || selectedCameraId;
            
            try {
                let constraints;
                
                if (useDeviceId) {
                    console.log('📷 Using selected camera:', useDeviceId);
                    constraints = {
                        video: {
                            deviceId: { exact: useDeviceId },
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            frameRate: { ideal: 30 }
                        },
                        audio: false
                    };
                } else {
                    console.log('📷 Using default camera constraints...');
                    constraints = {
                        video: {
                            width: { ideal: 1280, min: 320 },
                            height: { ideal: 720, min: 240 },
                            facingMode: { ideal: 'environment' },
                            frameRate: { ideal: 30 }
                        },
                        audio: false
                    };
                }
                
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('✅ Camera initialized successfully!');
                
            } catch (specificError) {
                console.log('⚠️ Specific camera failed, trying general constraints...');
                
                const generalConstraints = {
                    video: {
                        width: { ideal: 1280, min: 320 },
                        height: { ideal: 720, min: 240 },
                        facingMode: { ideal: 'environment' },
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                };
                
                stream = await navigator.mediaDevices.getUserMedia(generalConstraints);
                console.log('✅ Using fallback camera settings');
            }
            
            cameraStreamRef.current = stream;
            setCameraInitializationComplete(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStatus('ready');
                    setCameraError(null);
                    setCameraRetryCount(0);
                    console.log('✅ PERSISTENT Camera ready:', `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    showCameraMessage('✅ Camera ready with smart cooldown!', 'success');
                };
            }
            
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            setCameraStatus('error');
            handleCameraError(error);
        }
    };

    const handleCameraError = (error) => {
        let errorMessage = '';
        let errorAction = '';
        let canRetry = false;

        switch (error.name) {
            case 'NotAllowedError':
                errorMessage = 'Camera permission denied';
                errorAction = 'Please allow camera access and click "Try Again"';
                canRetry = true;
                break;
            case 'NotFoundError':
                errorMessage = 'No camera found';
                errorAction = 'Please connect a camera or use a device with a camera';
                canRetry = true;
                break;
            case 'NotReadableError':
                errorMessage = 'Camera is busy';
                errorAction = 'Please close other apps using the camera and try again';
                canRetry = true;
                break;
            case 'OverconstrainedError':
                errorMessage = 'Camera settings not supported';
                errorAction = 'Trying with basic camera settings...';
                canRetry = true;
                break;
            default:
                errorMessage = error.message || 'Camera error';
                errorAction = 'Please check your camera and try again';
                canRetry = true;
        }

        setCameraError({ message: errorMessage, action: errorAction, canRetry });
        
        if (canRetry && cameraRetryCount < 2 && error.name !== 'NotAllowedError') {
            const retryDelay = (cameraRetryCount + 1) * 2000;
            console.log(`🔄 Auto-retrying camera setup in ${retryDelay/1000}s (attempt ${cameraRetryCount + 1}/2)`);
            
            setTimeout(() => {
                setCameraRetryCount(prev => prev + 1);
                setupCamera();
            }, retryDelay);
        }
    };

    const handleCameraSwitch = async (newCameraId) => {
        console.log('🔄 Switching to camera:', newCameraId);
        
        // Stop current stream
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        
        // Set new camera
        setSelectedCameraId(newCameraId);
        setCameraInitializationComplete(false);
        
        // Restart with new camera
        await setupCamera(newCameraId);
        
        setShowCameraSelector(false);
        showCameraMessage('📷 Camera switched successfully!', 'success');
    };

    const refreshCameraList = async () => {
        console.log('🔄 Refreshing camera list...');
        await enumerateCameras();
        showCameraMessage('📷 Camera list refreshed!', 'success');
    };

    const retryCameraSetup = () => {
        console.log('🔄 Manual camera retry requested');
        setCameraRetryCount(0);
        setCameraError(null);
        setCameraInitializationComplete(false);
        initializationPromiseRef.current = null;
        setupCamera();
    };

    const showCameraMessage = (message, type = 'info') => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'camera-toast-message';
        messageDiv.innerHTML = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            max-width: 300px;
        `;

        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    };

    // 🔥 MODIFIED: Smart scanning with cooldown system
    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ MTG Scanner not ready');
            if (cameraStatus === 'error') {
                showCameraMessage('❌ Camera not ready. Please fix camera issues first.', 'error');
            }
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner Pro with Smart Cooldown - ${scanMode} mode...`);
        setIsScanning(true);
        setScanningPausedForSelection(false);
        
        // 🔥 Reset cooldowns when starting scanning
        cooldownSystemRef.current.resetCooldowns();
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        
        if (scanMode === 'continuous') {
            setContinuousCount(0);
            console.log('🔄 Continuous mode: Reset counter to 0');
        }
        
        // 🔥 MODIFIED: Smart scanning interval with cooldown logic
        scanIntervalRef.current = setInterval(async () => {
            try {
                // 🔥 Check cooldown system first
                const currentCardName = currentCard?.cardName;
                if (!cooldownSystemRef.current.shouldScan(currentCardName)) {
                    // Update cooldown status for UI
                    setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                    return; // Skip this frame due to cooldown
                }

                // Don't scan if edition selector is showing
                if (scanningPausedForSelection || showEditionSelector) {
                    console.log('⏸️ Scanning paused for edition selection');
                    cooldownSystemRef.current.setEditionSelectorOpen(true);
                    return;
                } else {
                    cooldownSystemRef.current.setEditionSelectorOpen(false);
                }

                // 🔥 Frame change detection
                const canvas = document.createElement('canvas');
                const video = videoRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                
                // Get frame data for change detection
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // 🔥 Check if frame has changed significantly
                if (!cooldownSystemRef.current.hasFrameChanged(imageData.data)) {
                    console.log("📷 Frame unchanged, skipping scan");
                    return;
                }

                console.log("🔄 Processing frame for MTG CARD IDENTIFICATION...");
                
                // Call the vision service
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 70) {
                    console.log('🎯 MTG Card detected:', result.cardName, `(${result.confidence}%)`);
                    
                    // 🔥 Record detection in cooldown system
                    cooldownSystemRef.current.recordDetection(result.cardName);
                    setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                    
                    // Stop scanning in single mode when card detected
                    if (scanMode === 'single') {
                        stopScanning();
                    }
                    
                    // Always check for multiple editions
                    await handleCardDetection(result);
                    
                } else if (result && !result.hasCard) {
                    setScanResult({ hasCard: false, message: result.message || 'No MTG card detected' });
                    setCurrentCard(null);
                }
                
                // Update cooldown status
                setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                
            } catch (error) {
                console.error('❌ Scanning error:', error);
                setScanResult({ hasCard: false, message: 'Scanner error - please try again' });
            }
        }, scanMode === 'single' ? 500 : 1000);
    };

    // Handle card detection with cooldown integration
    const handleCardDetection = async (detectedCard) => {
        try {
            console.log('🎭 Checking for multiple editions of:', detectedCard.cardName);
            
            const cardName = detectedCard.cardName.trim();
            const searchQuery = `!"${cardName}"`;
            const encodedQuery = encodeURIComponent(searchQuery);
            
            console.log('🔍 Scryfall search query:', searchQuery);
            
            const editionsResponse = await fetch(
                `https://api.scryfall.com/cards/search?q=${encodedQuery}&unique=prints&order=released&dir=desc`
            );
            
            if (editionsResponse.ok) {
                const editionsData = await editionsResponse.json();
                const editions = editionsData.data || [];
                
                console.log(`📊 Scryfall returned ${editions.length} total results`);
                
                const exactMatches = editions.filter(card => {
                    const cardNameNormalized = card.name.toLowerCase().trim();
                    const searchNameNormalized = cardName.toLowerCase().trim();
                    return cardNameNormalized === searchNameNormalized;
                });
                
                console.log(`🎯 Found ${exactMatches.length} exact name matches for "${cardName}"`);
                
                exactMatches.forEach((card, index) => {
                    console.log(`   ${index + 1}. ${card.set_name} (${card.set.toUpperCase()}) - ${card.released_at}`);
                });
                
                if (exactMatches.length > 1) {
                    // 🔥 Notify cooldown system of edition selector opening
                    console.log(`🎭 Multiple editions found - pausing scanner for selection`);
                    setScanningPausedForSelection(true);
                    cooldownSystemRef.current.setEditionSelectorOpen(true);
                    
                    const sortedEditions = sortEditionsByPreference(cardName, exactMatches);
                    
                    setPendingCardData(detectedCard);
                    setPendingScanMode(scanMode);
                    setAvailableEditions(sortedEditions);
                    setShowEditionSelector(true);
                    
                    setScanResult(null);
                    setCurrentCard(null);
                    return;
                    
                } else if (exactMatches.length === 1) {
                    console.log(`✅ Single edition found: ${exactMatches[0].set_name} (${exactMatches[0].set.toUpperCase()})`);
                    const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                    displayCard(enhancedCard);
                    
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        const saved = await saveCardToCollection(enhancedCard);
                        if (saved) {
                            console.log(`💾 AUTO-SAVED: ${enhancedCard.cardName} to collection`);
                            handleContinuousCounterAndLimit();
                        }
                    }
                    
                } else {
                    console.log('⚠️ No exact Scryfall matches found, using original detection');
                    displayCard(detectedCard);
                    
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        const saved = await saveCardToCollection(detectedCard);
                        if (saved) {
                            console.log(`💾 AUTO-SAVED: ${detectedCard.cardName} to collection (no Scryfall match)`);
                            handleContinuousCounterAndLimit();
                        }
                    }
                }
            } else {
                const errorText = await editionsResponse.text();
                console.log('❌ Scryfall API error:', editionsResponse.status, errorText);
                displayCard(detectedCard);
            }
        } catch (error) {
            console.error('❌ Edition lookup error:', error);
            displayCard(detectedCard);
        }
    };

    // AI Learning - Sort editions by user preferences
    const sortEditionsByPreference = (cardName, editions) => {
        const cardKey = cardName.toLowerCase().trim();
        const userPreference = editionPreferences[cardKey];
        
        if (userPreference) {
            console.log(`🧠 AI Learning: User previously preferred ${userPreference} for ${cardName}`);
            
            return editions.sort((a, b) => {
                if (a.set === userPreference) return -1;
                if (b.set === userPreference) return 1;
                return 0;
            });
        }
        
        return editions;
    };

    const learnEditionPreference = (cardName, selectedEdition) => {
        const cardKey = cardName.toLowerCase().trim();
        const newPreferences = {
            ...editionPreferences,
            [cardKey]: selectedEdition.set
        };
        
        setEditionPreferences(newPreferences);
        localStorage.setItem('mtg_edition_preferences', JSON.stringify(newPreferences));
        
        console.log(`🧠 AI Learning: Remembered ${selectedEdition.set_name} preference for ${cardName}`);
    };

    const handleContinuousCounterAndLimit = () => {
        const newCount = continuousCount + 1;
        setContinuousCount(newCount);
        
        if (newCount >= 10) {
            console.log('🛑 CONTINUOUS MODE: 10-card limit reached, pausing...');
            stopScanning();
            setShowContinueDialog(true);
        }
    };

    const handleContinueScanning = () => {
        console.log('🔄 User chose to continue scanning...');
        setShowContinueDialog(false);
        setContinuousCount(0);
        // 🔥 Reset cooldowns when continuing
        cooldownSystemRef.current.resetCooldowns();
        startScanning();
    };

    const handleStopScanning = () => {
        console.log('⏹️ User chose to stop scanning at 10-card limit');
        setShowContinueDialog(false);
        setContinuousCount(0);
    };

    const enhanceCardWithScryfall = (originalCard, scryfallCard) => {
        return {
            ...originalCard,
            cardType: scryfallCard.type_line,
            manaCost: scryfallCard.mana_cost,
            setInfo: scryfallCard.set_name,
            rarity: scryfallCard.rarity,
            scryfallId: scryfallCard.id,
            scryfallImageUrl: scryfallCard.image_uris?.normal || scryfallCard.image_uris?.large,
            scryfallUri: scryfallCard.scryfall_uri,
            prices: scryfallCard.prices,
            collectorNumber: scryfallCard.collector_number,
            releaseDate: scryfallCard.released_at,
            scryfallVerified: true,
            setCode: scryfallCard.set
        };
    };

    const displayCard = (card) => {
        setCurrentCard(card);
        setScanResult(card);
        
        setScanHistory(prev => {
            const isDuplicate = prev.some(historyCard => 
                historyCard.cardName === card.cardName && 
                Math.abs(new Date(historyCard.timestamp) - new Date(card.timestamp)) < 5000
            );
            
            if (!isDuplicate) {
                return [card, ...prev.slice(0, 19)];
            }
            return prev;
        });
    };

    // Handle edition selection with cooldown integration
    const handleEditionSelected = async (selectedEdition) => {
        if (pendingCardData && selectedEdition) {
            const enhancedCard = enhanceCardWithScryfall(pendingCardData, selectedEdition);
            displayCard(enhancedCard);
            
            console.log(`✅ User selected: ${selectedEdition.set_name} (${selectedEdition.set.toUpperCase()})`);
            
            learnEditionPreference(pendingCardData.cardName, selectedEdition);
            
            if (pendingScanMode === 'continuous' && autoSaveEnabled) {
                const saved = await saveCardToCollection(enhancedCard);
                if (saved) {
                    console.log(`💾 AUTO-SAVED: ${enhancedCard.cardName} to collection`);
                    handleContinuousCounterAndLimit();
                }
                
                if (continuousCount < 9) {
                    console.log('🔄 Resuming continuous scanning after edition selection...');
                    setTimeout(() => {
                        setScanningPausedForSelection(false);
                        // 🔥 Reset cooldowns after edition selection
                        cooldownSystemRef.current.setEditionSelectorOpen(false);
                        if (!isScanning) {
                            startScanning();
                        }
                    }, 1000);
                }
            }
        }
        
        // 🔥 Close edition selector and notify cooldown system
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setPendingScanMode(null);
        setScanningPausedForSelection(false);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
    };

    const handleEditionCancelled = async () => {
        if (pendingCardData) {
            displayCard(pendingCardData);
            
            if (pendingScanMode === 'continuous' && autoSaveEnabled) {
                const saved = await saveCardToCollection(pendingCardData);
                if (saved) {
                    console.log(`💾 AUTO-SAVED: ${pendingCardData.cardName} to collection (cancelled edition selection)`);
                    handleContinuousCounterAndLimit();
                }
                
                if (continuousCount < 9) {
                    console.log('🔄 Resuming continuous scanning after cancellation...');
                    setTimeout(() => {
                        setScanningPausedForSelection(false);
                        cooldownSystemRef.current.setEditionSelectorOpen(false);
                        if (!isScanning) {
                            startScanning();
                        }
                    }, 1000);
                }
            }
        }
        
        // 🔥 Close edition selector and notify cooldown system
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setPendingScanMode(null);
        setScanningPausedForSelection(false);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
    };

    // Stop scanning but keep camera active
    const stopScanning = () => {
        console.log('⏹️ Stopping MTG Scanner (camera stays active for persistence)...');
        setIsScanning(false);
        setScanningPausedForSelection(false);
        
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        
        console.log('📷 Camera stream preserved for tab persistence');
    };

    // Only cleanup camera on component unmount
    const cleanup = () => {
        console.log('🧹 Cleaning up MTG Scanner...');
        stopScanning();
        
        if (cameraStreamRef.current) {
            console.log('📷 Stopping persistent camera stream...');
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
            setCameraInitializationComplete(false);
        }
        
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        
        initializationPromiseRef.current = null;
    };

    // Collection management
    const saveCardToCollection = async (card) => {
        try {
            if (!isPremiumUser && savedCards.length >= FREE_COLLECTION_LIMIT) {
                console.log('🚨 Free collection limit reached');
                setShowPaywallModal(true);
                return false;
            }
            
            const cardWithId = {
                ...card,
                id: Date.now() + Math.random(),
                addedAt: new Date().toISOString(),
                scannedAt: new Date().toLocaleString()
            };
            
            const updatedCards = [cardWithId, ...savedCards];
            setSavedCards(updatedCards);
            
            localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
            
            console.log('💾 Card saved to collection:', card.cardName);
            
            if (scanMode === 'single') {
                setScanResult(prev => ({
                    ...prev,
                    savedToCollection: true,
                    message: `✅ ${card.cardName} saved to collection!`
                }));
                
                setTimeout(() => {
                    setScanResult(prev => ({
                        ...prev,
                        savedToCollection: false,
                        message: undefined
                    }));
                }, 3000);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to save card:', error);
            setScanResult(prev => ({
                ...prev,
                message: `❌ Failed to save ${card.cardName}`
            }));
            return false;
        }
    };

    const handleUpgradeToPremium = () => {
        console.log('💎 Initiating PayPal payment for premium upgrade...');
        
        const paypalLink = `https://www.paypal.com/paypalme/thediceyguy/9.99?country.x=US&locale.x=en_US`;
        window.open(paypalLink, '_blank');
        
        setTimeout(() => {
            setIsPremiumUser(true);
            localStorage.setItem('mtg_premium_status', 'true');
            setShowPaywallModal(false);
            showCameraMessage('💎 Premium upgrade successful! Unlimited collection storage activated.', 'success');
        }, 5000);
    };

    const removeCardFromCollection = (cardId) => {
        try {
            const updatedCards = savedCards.filter(card => card.id !== cardId);
            setSavedCards(updatedCards);
            localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
            console.log('🗑️ Card removed from collection');
        } catch (error) {
            console.error('❌ Failed to remove card:', error);
        }
    };

    const openCardInScryfall = (card) => {
        if (card && card.cardName) {
            const searchUrl = `https://scryfall.com/search?q=${encodeURIComponent(card.cardName)}`;
            window.open(searchUrl, '_blank');
            console.log('🔗 Opening Scryfall for:', card.cardName);
        }
    };

    const toggleUIVisibility = () => {
        setIsUIVisible(!isUIVisible);
        console.log('👁️ UI visibility toggled:', !isUIVisible);
    };

    // Tab switching handler that preserves camera
    const handleTabSwitch = (newTab) => {
        console.log(`🔄 Switching from ${activeTab} to ${newTab} (camera preserved)`);
        setActiveTab(newTab);
        
        if (newTab === 'scanner' && cameraStreamRef.current && videoRef.current) {
            setTimeout(() => {
                if (!videoRef.current.srcObject) {
                    console.log('📷 Reconnecting video element to persistent camera stream...');
                    videoRef.current.srcObject = cameraStreamRef.current;
                    videoRef.current.play();
                }
            }, 100);
        }
    };

    const getCameraStatusDisplay = () => {
        switch (cameraStatus) {
            case 'initializing':
                return { text: '🔧 Initializing...', class: 'status-initializing' };
            case 'requesting':
                return { text: '📷 Requesting access...', class: 'status-requesting' };
            case 'ready':
                return { text: '✅ HD Camera Ready + Smart Cooldown', class: 'status-ready' };
            case 'error':
                return { text: '❌ Camera Error', class: 'status-error' };
            default:
                return { text: '⏳ Setting up...', class: 'status-default' };
        }
    };

    // 🔥 NEW: Render cooldown status UI
    const renderCooldownStatus = () => {
        if (!cooldownStatus || activeTab !== 'scanner') return null;
        
        return (
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                border: '1px solid #4a90e2',
                minWidth: '200px',
                zIndex: 1000
            }}>
                <div style={{color: '#4a90e2', fontWeight: 'bold', marginBottom: '6px'}}>
                    🔥 Smart Cooldown System
                </div>
                <div>API Cooldown: {Math.ceil(cooldownStatus.apiCooldown / 1000)}s</div>
                <div>Same Card: {Math.ceil(cooldownStatus.sameCardCooldown / 1000)}s</div>
                <div>Consecutive: {cooldownStatus.consecutiveDetections}/3</div>
                <div>Edition Selector: {cooldownStatus.isEditionSelectorOpen ? '🎭 Open' : '✅ Closed'}</div>
                <div style={{
                    marginTop: '6px', 
                    padding: '4px', 
                    background: cooldownStatus.canScan ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    {cooldownStatus.canScan ? '✅ Can Scan' : '❌ Cooldown Active'}
                </div>
            </div>
        );
    };

    const cameraStatus_display = getCameraStatusDisplay();

    return (
        <div className="mtg-scanner-pro">
            {/* Header */}
            <div className="app-header">
                <div className="app-title-section">
                    <div className="app-logo">
                        <img 
                            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjUiIHk9IjUiIHdpZHRoPSI5MCIgaGVpZ2h0PSI5MCIgcng9IjEwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9IiMyMzI3MkEiLz4KPHRleHQgeD0iNTAiIHk9IjM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCI+TVRHPC90ZXh0Pgo8bGluZSB4MT0iMTUiIHkxPSI1MCIgeDI9Ijg1IiB5Mj0iNTAiIHN0cm9rZT0iIzRBOTBFMiIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPlNDQU5ORVI8L3RleHQ+Cjwvc3ZnPgo="
                            alt="MTG Scanner Logo"
                            className="logo-image"
                        />
                    </div>
                    <div className="app-title">
                        <h1>MTG Scanner Pro</h1>
                        <span className="app-subtitle">
                            🔥 Smart Cooldown System • {isPremiumUser ? '💎 Premium' : `${FREE_COLLECTION_LIMIT - savedCards.length} cards left`}
                        </span>
                    </div>
                </div>
                
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Accuracy:</span>
                        <span className="stat-value">98%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">AI Learned:</span>
                        <span className="stat-value">{Object.keys(editionPreferences).length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Cooldowns:</span>
                        <span className="stat-value">{cooldownStatus.canScan ? '✅' : '⏸️'}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Saved:</span>
                        <span className="stat-value">
                            {savedCards.length}{!isPremiumUser && `/${FREE_COLLECTION_LIMIT}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('scanner')}
                >
                    🔍 Scanner {scanningPausedForSelection && '⏸️'} {cooldownStatus.canScan ? '🔥' : '⏳'}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'deck' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('deck')}
                >
                    🃏 Collection ({savedCards.length}{!isPremiumUser && `/${FREE_COLLECTION_LIMIT}`})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('knowledge')}
                >
                    📚 MTG Knowledge
                </button>
            </div>

            {/* Main Content Area */}
            <div className="main-content">
                
                {/* Scanner Tab */}
                {activeTab === 'scanner' && (
                    <div className="scanner-tab">
                        <div className="scanner-section">
                            {/* Video Feed */}
                            <div className="video-container">
                                <video
                                    ref={videoRef}
                                    className="scanner-video"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                
                                {/* 🔥 NEW: Cooldown Status Overlay */}
                                {renderCooldownStatus()}
                                
                                {/* Camera Status Overlay */}
                                <div className="camera-status-overlay">
                                    <div className={`status-indicator ${cameraStatus_display.class}`}>
                                        {cameraStatus_display.text}
                                        {cameraInitializationComplete && ' 🔄 Persistent Mode'}
                                    </div>
                                </div>
                                
                                {/* Camera Error Overlay */}
                                {cameraError && (
                                    <div className="camera-error-overlay">
                                        <div className="camera-error-card">
                                            <h3>📹 Camera Issue</h3>
                                            <p><strong>{cameraError.message}</strong></p>
                                            <p>{cameraError.action}</p>
                                            {cameraError.canRetry && (
                                                <button 
                                                    onClick={retryCameraSetup}
                                                    className="retry-camera-btn"
                                                >
                                                    🔄 Try Again
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Scanning Overlay */}
                                {isScanning && !scanningPausedForSelection && (
                                    <div className="scanning-overlay">
                                        <div className="scan-frame"></div>
                                        <div className="scan-instructions">
                                            🔍 Position MTG card in frame
                                            <div className="scan-tech">
                                                {scanMode === 'continuous' ? 
                                                    `🔥 Smart cooldown mode (${continuousCount}/10)` : 
                                                    '📷 Single shot with smart cooldown'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Edition Selection Pause Overlay */}
                                {scanningPausedForSelection && (
                                    <div className="scanning-overlay">
                                        <div className="scan-frame" style={{borderColor: '#ffa500'}}></div>
                                        <div className="scan-instructions">
                                            ⏸️ Scanner paused for edition selection
                                            <div className="scan-tech">
                                                🎭 Choose the correct edition below
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Scanner Controls */}
                            <div className="scanner-controls">
                                {/* Scan Mode Toggle */}
                                <div className="scan-mode-section">
                                    <label className="scan-mode-label">Scan Mode:</label>
                                    <div className="scan-mode-toggle">
                                        <button
                                            className={`mode-btn ${scanMode === 'continuous' ? 'active' : ''}`}
                                            onClick={() => setScanMode('continuous')}
                                            disabled={isScanning || showEditionSelector}
                                        >
                                            🔥 Smart Continuous {scanMode === 'continuous' && `(${continuousCount}/10)`}
                                        </button>
                                        <button
                                            className={`mode-btn ${scanMode === 'single' ? 'active' : ''}`}
                                            onClick={() => setScanMode('single')}
                                            disabled={isScanning || showEditionSelector}
                                        >
                                            📷 Smart Single Shot
                                        </button>
                                    </div>
                                </div>

                                {/* Start/Stop Button */}
                                <button
                                    className={`scan-btn ${isScanning ? 'scanning' : 'ready'}`}
                                    onClick={isScanning ? stopScanning : startScanning}
                                    disabled={cameraStatus !== 'ready' || showEditionSelector}
                                >
                                    {showEditionSelector ? '🎭 Choose Edition Below' :
                                     scanningPausedForSelection ? '⏸️ Paused for Selection' :
                                     isScanning ? '⏹️ Stop Smart Scanning' : 
                                     `🔥 Start Smart ${scanMode === 'single' ? 'Single' : 'Continuous'} Scan`}
                                </button>
                                
                                {/* Camera Retry Button */}
                                {cameraStatus === 'error' && (
                                    <button
                                        className="retry-camera-btn"
                                        onClick={retryCameraSetup}
                                        title="Retry camera initialization"
                                    >
                                        🔄 Fix Camera
                                    </button>
                                )}
                                
                                {/* Camera Selection */}
                                <button
                                    className="camera-select-btn"
                                    onClick={() => setShowCameraSelector(true)}
                                    title="Select camera device"
                                    disabled={isScanning}
                                >
                                    📷 Camera Settings
                                </button>
                                
                                <button
                                    className="ui-toggle-btn"
                                    onClick={toggleUIVisibility}
                                    title="Toggle card information display"
                                >
                                    {isUIVisible ? '👁️ Hide Info' : '👁️ Show Info'}
                                </button>
                            </div>
                        </div>

                        {/* Card Display UI */}
                        {isUIVisible && (
                            <div className="card-info-section">
                                <CardDisplayUI
                                    scanResult={scanResult}
                                    isScanning={isScanning}
                                    onSaveCard={saveCardToCollection}
                                    onOpenScryfall={openCardInScryfall}
                                    scanHistory={scanHistory}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Collection/Deck Tab */}
                {activeTab === 'deck' && (
                    <div className="deck-tab">
                        <DeckManager 
                            savedCards={savedCards}
                            onRemoveCard={removeCardFromCollection}
                            onOpenScryfall={openCardInScryfall}
                            scanHistory={scanHistory}
                            isPremiumUser={isPremiumUser}
                            collectionLimit={FREE_COLLECTION_LIMIT}
                            onUpgrade={handleUpgradeToPremium}
                        />
                    </div>
                )}

                {/* Knowledge Tab */}
                {activeTab === 'knowledge' && (
                    <div className="knowledge-tab">
                        <MTGKnowledgeBase 
                            currentCard={currentCard}
                            savedCards={savedCards}
                            editionPreferences={editionPreferences}
                        />
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="status-bar">
                <div className="status-left">
                    {scanHistory.length > 0 && (
                        <>
                            <span className="status-item">📊 Scanned: {scanHistory.length}</span>
                            {currentCard && (
                                <span className="status-item">
                                    🎯 Last: {currentCard.cardName} ({currentCard.confidence}%)
                                </span>
                            )}
                        </>
                    )}
                </div>
                <div className="status-right">
                    <div className="footer-logo">
                        <img 
                            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjUiIHk9IjUiIHdpZHRoPSI5MCIgaGVpZ2h0PSI5MCIgcng9IjEwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9IiMyMzI3MkEiLz4KPHRleHQgeD0iNTAiIHk9IjM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCI+TVRHPC90ZXh0Pgo8bGluZSB4MT0iMTUiIHkxPSI1MCIgeDI9Ijg1IiB5Mj0iNTAiIHN0cm9rZT0iIzRBOTBFMiIgc3Ryb2tlLXdpZHRoPSIzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPlNDQU5ORVI8L3RleHQ+Cjwvc3ZnPgo="
                            alt="MTG Scanner"
                        />
                        MTG Scanner
                    </div>
                    <span className="status-item">🔥 Smart Cooldown: {cooldownStatus.canScan ? 'Ready' : 'Active'}</span>
                    <span className="status-item">
                        📷 Camera: {cameraInitializationComplete ? 'Persistent ✅' : 'Initializing ⏳'}
                    </span>
                    <span className="status-item">🧠 AI Learning: {Object.keys(editionPreferences).length} cards</span>
                    <span className="status-item">📡 Scryfall Database</span>
                    <span className="status-item">{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
                </div>
            </div>

            {/* Edition Selector Modal */}
            {showEditionSelector && (
                <EditionSelector
                    cardName={pendingCardData?.cardName}
                    availableEditions={availableEditions}
                    onEditionSelected={handleEditionSelected}
                    onCancel={handleEditionCancelled}
                    aiRecommendation={editionPreferences[pendingCardData?.cardName?.toLowerCase()?.trim()]}
                />
            )}

            {/* Premium Upgrade Paywall Modal */}
            {showPaywallModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10001
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                        border: '2px solid #4a90e2',
                        borderRadius: '15px',
                        padding: '30px',
                        maxWidth: '500px',
                        textAlign: 'center',
                        color: 'white',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
                    }}>
                        <h2 style={{ margin: '0 0 20px 0', color: '#4a90e2', fontSize: '24px' }}>
                            💎 Upgrade to Premium
                        </h2>
                        
                        <div style={{ margin: '20px 0', fontSize: '18px' }}>
                            <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                                You've reached the <strong>{FREE_COLLECTION_LIMIT} card limit</strong> for free users!
                            </p>
                        </div>
                        
                        <div style={{
                            background: 'rgba(74, 144, 226, 0.1)',
                            padding: '20px',
                            borderRadius: '10px',
                            margin: '20px 0'
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#4a90e2' }}>Premium Features:</h3>
                            <ul style={{ textAlign: 'left', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
                                <li>🔥 <strong>Unlimited collection storage</strong></li>
                                <li>🧠 <strong>Advanced AI learning</strong></li>
                                <li>📊 <strong>Collection analytics</strong></li>
                                <li>💰 <strong>Price tracking & alerts</strong></li>
                                <li>🎯 <strong>Deck optimization tools</strong></li>
                                <li>⚡ <strong>Priority customer support</strong></li>
                            </ul>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            margin: '25px 0',
                            justifyContent: 'center'
                        }}>
                            <button 
                                onClick={handleUpgradeToPremium}
                                style={{
                                    padding: '15px 30px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    background: 'linear-gradient(45deg, #4a90e2, #357abd)',
                                    color: 'white',
                                    boxShadow: '0 4px 15px rgba(74, 144, 226, 0.4)'
                                }}
                            >
                                💎 Upgrade for $9.99/month
                            </button>
                            <button 
                                onClick={() => setShowPaywallModal(false)}
                                style={{
                                    padding: '15px 20px',
                                    border: '1px solid #666',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    background: 'transparent',
                                    color: 'white'
                                }}
                            >
                                Maybe Later
                            </button>
                        </div>
                        
                        <div style={{
                            marginTop: '20px',
                            paddingTop: '20px',
                            borderTop: '1px solid #444',
                            fontSize: '12px',
                            color: '#ccc'
                        }}>
                            <p>💳 Secure payment via PayPal</p>
                            <p>📧 Payment to: thediceyguy@gmail.com</p>
                            <p>🔒 Cancel anytime, no long-term commitment</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Continue Scanning Dialog */}
            {showContinueDialog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        background: '#23272a',
                        border: '2px solid #4a90e2',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '450px',
                        textAlign: 'center',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#4a90e2', fontSize: '20px' }}>
                            🔥 10 Cards Scanned with Smart Cooldown!
                        </h3>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            You've successfully scanned <strong>10 cards</strong> with the smart cooldown system.
                        </p>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            AI learned <strong>{Object.keys(editionPreferences).length}</strong> edition preferences.
                        </p>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            Total saved to collection: <strong>{savedCards.length}</strong> cards
                        </p>
                        
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            margin: '20px 0',
                            justifyContent: 'center'
                        }}>
                            <button 
                                onClick={handleContinueScanning}
                                style={{
                                    padding: '12px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    background: '#4a90e2',
                                    color: 'white'
                                }}
                            >
                                🔥 Continue Smart Scanning
                            </button>
                            <button 
                                onClick={handleStopScanning}
                                style={{
                                    padding: '12px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    background: '#666',
                                    color: 'white'
                                }}
                            >
                                ⏹️ Stop & Review Collection
                            </button>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-around',
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '1px solid #444',
                            fontSize: '12px',
                            color: '#ccc'
                        }}>
                            <span>🔥 Smart scans: {continuousCount}</span>
                            <span>🧠 AI learned: {Object.keys(editionPreferences).length}</span>
                            <span>📁 Collection: {savedCards.length} total</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Selector Modal */}
            {showCameraSelector && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        background: '#23272a',
                        border: '2px solid #4a90e2',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '500px',
                        width: '90%',
                        textAlign: 'center',
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#4a90e2', fontSize: '20px' }}>
                            📷 Camera Settings
                        </h3>
                        
                        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                            <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#ccc' }}>
                                Select your preferred camera for MTG card scanning:
                            </p>
                            
                            {availableCameras.length === 0 ? (
                                <div style={{
                                    padding: '20px',
                                    background: 'rgba(220, 53, 69, 0.1)',
                                    border: '1px solid #dc3545',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <p style={{ margin: '0 0 10px 0', color: '#dc3545' }}>
                                        ❌ No cameras detected
                                    </p>
                                    <button
                                        onClick={refreshCameraList}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            background: '#4a90e2',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🔄 Refresh Camera List
                                    </button>
                                </div>
                            ) : (
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {availableCameras.map((camera, index) => (
                                        <div
                                            key={camera.deviceId}
                                            onClick={() => handleCameraSwitch(camera.deviceId)}
                                            style={{
                                                padding: '12px',
                                                margin: '8px 0',
                                                background: selectedCameraId === camera.deviceId ? 
                                                    'rgba(74, 144, 226, 0.3)' : 'rgba(255,255,255,0.1)',
                                                border: selectedCameraId === camera.deviceId ? 
                                                    '2px solid #4a90e2' : '1px solid #666',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                                        📷 {camera.label || `Camera ${index + 1}`}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                                                        {camera.deviceId.substring(0, 20)}...
                                                    </div>
                                                </div>
                                                {selectedCameraId === camera.deviceId && (
                                                    <div style={{ color: '#4a90e2', fontWeight: 'bold' }}>
                                                        ✅ Active
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            paddingTop: '20px',
                            borderTop: '1px solid #444'
                        }}>
                            <button
                                onClick={refreshCameraList}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #666',
                                    borderRadius: '6px',
                                    background: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={() => setShowCameraSelector(false)}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: '#4a90e2',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                ✅ Close
                            </button>
                        </div>
                        
                        <div style={{
                            marginTop: '15px',
                            fontSize: '12px',
                            color: '#999',
                            textAlign: 'center'
                        }}>
                            💡 Tip: Higher resolution cameras (1080p+) work best for card recognition
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scanner;