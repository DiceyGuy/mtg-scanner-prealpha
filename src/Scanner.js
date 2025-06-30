// Scanner.js - IMPROVED with Better Cooldown System
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import CardDisplayUI from './CardDisplayUI';
import DeckManager from './DeckManager';
import MTGKnowledgeBase from './MTGKnowledgeBase';
import EditionSelector from './EditionSelector';
import './CardDisplay.css';

// 🔥 IMPROVED Smart Cooldown System
class MTGScannerCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.isEditionSelectorOpen = false;
        this.detectionBuffer = [];
        
        // 🔥 LESS AGGRESSIVE Cooldown periods
        this.SAME_CARD_COOLDOWN = 15000;      // 15 seconds for same card (was 8)
        this.MIN_API_INTERVAL = 4000;         // 4 seconds between API calls (was 2)
        this.DETECTION_STABILITY = 3;         // Need 3 consistent detections
        this.MAX_CONSECUTIVE = 2;             // Max consecutive before pause
        this.LONG_PAUSE_DURATION = 30000;     // 30 second pause after max consecutive
        
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
    }

    // Check if we should scan this frame
    shouldScan(cardName = null) {
        const now = Date.now();
        
        // 1. Don't scan if edition selector is open
        if (this.isEditionSelectorOpen) {
            console.log("🚫 Scanning blocked: Edition selector open");
            return false;
        }
        
        // 2. Check long pause (after too many consecutive detections)
        if (this.isLongPauseActive) {
            const pauseRemaining = this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime);
            if (pauseRemaining > 0) {
                console.log(`🚫 Scanning blocked: Long pause active (${Math.ceil(pauseRemaining/1000)}s remaining)`);
                return false;
            } else {
                // Reset long pause
                this.isLongPauseActive = false;
                this.consecutiveDetections = 0;
                console.log("✅ Long pause ended, scanning can resume");
            }
        }
        
        // 3. Enforce minimum API interval
        if (now - this.lastApiCall < this.MIN_API_INTERVAL) {
            const waitTime = this.MIN_API_INTERVAL - (now - this.lastApiCall);
            console.log(`🚫 Scanning blocked: API cooldown (${Math.ceil(waitTime/1000)}s remaining)`);
            return false;
        }
        
        // 4. Same card cooldown
        if (cardName && cardName === this.lastDetectedCard) {
            const timeSinceLastDetection = now - this.lastDetectionTime;
            if (timeSinceLastDetection < this.SAME_CARD_COOLDOWN) {
                const waitTime = this.SAME_CARD_COOLDOWN - timeSinceLastDetection;
                console.log(`🚫 Scanning blocked: Same card "${cardName}" cooldown (${Math.ceil(waitTime/1000)}s remaining)`);
                return false;
            }
        }
        
        return true;
    }

    // Add detection to buffer for stability checking
    addDetection(cardName, confidence) {
        const now = Date.now();
        
        // Add to buffer
        this.detectionBuffer.push({
            cardName,
            confidence,
            timestamp: now
        });
        
        // Keep only recent detections (last 10 seconds)
        this.detectionBuffer = this.detectionBuffer.filter(
            detection => now - detection.timestamp < 10000
        );
        
        // Check stability - need consistent detections of same card
        const recentSameCard = this.detectionBuffer.filter(
            detection => detection.cardName === cardName
        );
        
        return recentSameCard.length >= this.DETECTION_STABILITY;
    }

    // Record a successful detection
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
        
        // Clear detection buffer after successful detection
        this.detectionBuffer = [];
        
        console.log(`✅ Detection recorded: "${cardName}" (consecutive: ${this.consecutiveDetections})`);
        
        // Check if we need to activate long pause
        if (this.consecutiveDetections >= this.MAX_CONSECUTIVE) {
            this.isLongPauseActive = true;
            this.longPauseStartTime = now;
            console.log(`🛑 Too many consecutive detections (${this.MAX_CONSECUTIVE}), activating long pause (${this.LONG_PAUSE_DURATION/1000}s)`);
        }
    }

    // Reset cooldowns (call when user interaction occurs)
    resetCooldowns() {
        console.log("🔄 Cooldowns reset by user interaction");
        this.consecutiveDetections = 0;
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.detectionBuffer = [];
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
    }

    // Set edition selector state
    setEditionSelectorOpen(isOpen) {
        this.isEditionSelectorOpen = isOpen;
        if (isOpen) {
            console.log("🎭 Edition selector opened - scanning paused");
        } else {
            console.log("🎭 Edition selector closed - scanning can resume");
            // Don't reset cooldowns when edition selector closes
        }
    }

    // Get cooldown status for UI
    getCooldownStatus() {
        const now = Date.now();
        
        let longPauseRemaining = 0;
        if (this.isLongPauseActive) {
            longPauseRemaining = Math.max(0, this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime));
        }
        
        return {
            sameCardCooldown: this.lastDetectedCard ? Math.max(0, this.SAME_CARD_COOLDOWN - (now - this.lastDetectionTime)) : 0,
            apiCooldown: Math.max(0, this.MIN_API_INTERVAL - (now - this.lastApiCall)),
            consecutiveDetections: this.consecutiveDetections,
            longPauseRemaining,
            isEditionSelectorOpen: this.isEditionSelectorOpen,
            canScan: this.shouldScan(this.lastDetectedCard),
            detectionBufferSize: this.detectionBuffer.length,
            stabilityRequired: this.DETECTION_STABILITY
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
    
    // 🔥 IMPROVED: Cooldown system state
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
    
    // 🔥 IMPROVED: Cooldown system ref
    const cooldownSystemRef = useRef(new MTGScannerCooldown());

    // Initialize services and camera ONCE
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
            visionServiceRef.current = new ClaudeVisionService(); // YOUR ACTUAL SERVICE
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

    // Camera enumeration (keep your existing camera logic)
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

    // Keep your existing camera setup logic
    const setupCamera = async (deviceId = null) => {
        console.log('🎥 Setting up PERSISTENT camera for MTG Scanner Pro...');
        setCameraStatus('requesting');
        setCameraError(null);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

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
                    showCameraMessage('✅ Camera ready with improved cooldown!', 'success');
                };
            }
            
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            setCameraStatus('error');
            handleCameraError(error);
        }
    };

    // Keep your existing camera error handling
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

    // 🔥 IMPROVED: Much smarter scanning with detection stability
    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ MTG Scanner not ready');
            if (cameraStatus === 'error') {
                showCameraMessage('❌ Camera not ready. Please fix camera issues first.', 'error');
            }
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner Pro with IMPROVED Cooldown - ${scanMode} mode...`);
        setIsScanning(true);
        setScanningPausedForSelection(false);
        
        // 🔥 Reset cooldowns when starting scanning
        cooldownSystemRef.current.resetCooldowns();
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        
        if (scanMode === 'continuous') {
            setContinuousCount(0);
            console.log('🔄 Continuous mode: Reset counter to 0');
        }
        
        // 🔥 IMPROVED: Less aggressive scanning interval with stability detection
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

                console.log("🔄 Processing frame for MTG CARD IDENTIFICATION...");
                
                // Call your actual vision service
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 85) { // Higher confidence threshold
                    console.log('🎯 High-confidence MTG Card detected:', result.cardName, `(${result.confidence}%)`);
                    
                    // 🔥 Add to stability buffer before processing
                    const isStable = cooldownSystemRef.current.addDetection(result.cardName, result.confidence);
                    
                    if (isStable) {
                        console.log('✅ Card detection is STABLE, processing...');
                        
                        // 🔥 Record detection in cooldown system
                        cooldownSystemRef.current.recordDetection(result.cardName);
                        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                        
                        // Stop scanning in single mode when card detected
                        if (scanMode === 'single') {
                            stopScanning();
                        }
                        
                        // Always check for multiple editions
                        await handleCardDetection(result);
                    } else {
                        console.log('⏳ Card detection not stable yet, need more consistent readings...');
                    }
                    
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
        }, scanMode === 'single' ? 1500 : 3000); // 🔥 SLOWER intervals (was 500/1000)
    };

    // Keep your existing card detection logic but with stability
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
                    // 🔥 Only show edition selector if NOT in cooldown
                    if (cooldownSystemRef.current.shouldScan()) {
                        console.log(`🎭 Multiple editions found - showing selector`);
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
                    } else {
                        console.log(`🔄 Multiple editions found but in cooldown, using first edition`);
                        const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                        displayCard(enhancedCard);
                    }
                    
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

    // Keep all your existing helper functions...
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

    // Keep all your existing functions but update the edition handlers...

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
                        cooldownSystemRef.current.setEditionSelectorOpen(false);
                        if (!isScanning) {
                            startScanning();
                        }
                    }, 2000); // 🔥 Longer delay before resuming
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
                    }, 2000); // 🔥 Longer delay
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

    // Keep all your other existing functions...
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

    // Keep all your existing helper functions for camera switching, saving cards, etc...
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

    // Keep all your existing camera handling and collection management functions...
    // I'm keeping this short since you have working versions of these

    // 🔥 IMPROVED: Render cooldown status UI with more detail
    const renderCooldownStatus = () => {
        if (!cooldownStatus || activeTab !== 'scanner') return null;
        
        return (
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.85)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                border: '1px solid #4a90e2',
                minWidth: '220px',
                zIndex: 1000
            }}>
                <div style={{color: '#4a90e2', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center'}}>
                    🔥 IMPROVED Cooldown System
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>API Cooldown:</span>
                    <span style={{color: '#64b5f6'}}>{Math.ceil(cooldownStatus.apiCooldown / 1000)}s</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>Same Card:</span>
                    <span style={{color: '#64b5f6'}}>{Math.ceil(cooldownStatus.sameCardCooldown / 1000)}s</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>Consecutive:</span>
                    <span style={{color: '#64b5f6'}}>{cooldownStatus.consecutiveDetections}/2</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>Stability:</span>
                    <span style={{color: '#64b5f6'}}>{cooldownStatus.detectionBufferSize}/{cooldownStatus.stabilityRequired}</span>
                </div>
                {cooldownStatus.longPauseRemaining > 0 && (
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span>Long Pause:</span>
                        <span style={{color: '#ffc107'}}>{Math.ceil(cooldownStatus.longPauseRemaining / 1000)}s</span>
                    </div>
                )}
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>Edition Selector:</span>
                    <span style={{color: cooldownStatus.isEditionSelectorOpen ? '#ffc107' : '#28a745'}}>
                        {cooldownStatus.isEditionSelectorOpen ? '🎭 Open' : '✅ Closed'}
                    </span>
                </div>
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

    // Keep the rest of your existing component exactly as is...
    // Just use the improved cooldown rendering above

    const getCameraStatusDisplay = () => {
        switch (cameraStatus) {
            case 'initializing':
                return { text: '🔧 Initializing...', class: 'status-initializing' };
            case 'requesting':
                return { text: '📷 Requesting access...', class: 'status-requesting' };
            case 'ready':
                return { text: '✅ HD Camera Ready + IMPROVED Cooldown', class: 'status-ready' };
            case 'error':
                return { text: '❌ Camera Error', class: 'status-error' };
            default:
                return { text: '⏳ Setting up...', class: 'status-default' };
        }
    };

    const cameraStatus_display = getCameraStatusDisplay();

    // Return your existing JSX but with the improved cooldown display
    return (
        <div className="mtg-scanner-pro">
            {/* Keep all your existing JSX structure */}
            {/* Just make sure to include {renderCooldownStatus()} in your video container */}
            
            {/* Example of where to include the cooldown status: */}
            <div className="video-container">
                <video
                    ref={videoRef}
                    className="scanner-video"
                    autoPlay
                    playsInline
                    muted
                />
                
                {/* 🔥 IMPROVED: Cooldown Status Overlay */}
                {renderCooldownStatus()}
                
                {/* Rest of your existing video overlays... */}
            </div>
            
            {/* Keep all your existing JSX... */}
        </div>
    );
};

export default Scanner;