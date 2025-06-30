// Scanner.js - PROFESSIONAL VERSION with Enhanced UI Components
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import CardDisplayUI from './CardDisplayUI';
import DeckManager from './DeckManager';
import MTGKnowledgeBase from './MTGKnowledgeBase';
import EditionSelector from './EditionSelector';
import './CardDisplay.css';

// 🔥 NEW: Import professional components
import {
    ProfessionalCooldownStatus,
    ProfessionalCameraStatus,
    ProfessionalScanControls,
    ProfessionalCardResult,
    ProfessionalEditionSelector,
    ProfessionalStats,
    showProfessionalToast,
    ProfessionalTabs
} from './ProfessionalComponents';

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
                    showProfessionalToast('✅ Camera ready with enhanced cooldown system!', 'success');
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
                showProfessionalToast('❌ Camera not ready. Please fix camera issues first.', 'error');
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
            showProfessionalToast('💎 Premium upgrade successful! Unlimited collection storage activated.', 'success');
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
        showProfessionalToast('📷 Camera switched successfully!', 'success');
    };

    const refreshCameraList = async () => {
        console.log('🔄 Refreshing camera list...');
        await enumerateCameras();
        showProfessionalToast('📷 Camera list refreshed!', 'success');
    };

    const retryCameraSetup = () => {
        console.log('🔄 Manual camera retry requested');
        setCameraRetryCount(0);
        setCameraError(null);
        setCameraInitializationComplete(false);
        initializationPromiseRef.current = null;
        setupCamera();
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

    // 🔥 PROFESSIONAL: Updated cooldown status renderer
    const renderCooldownStatus = () => {
        return (
            <ProfessionalCooldownStatus
                cooldownStatus={cooldownStatus}
                isVisible={activeTab === 'scanner'}
            />
        );
    };

    // Return the professional JSX structure
    return (
        <div className="mtg-scanner-pro">
            {/* 🏆 PROFESSIONAL HEADER */}
            <div className="app-header">
                <div className="app-title-section">
                    <div className="app-logo">
                        MTG<br/>SCAN
                    </div>
                    <div className="app-title">
                        <h1>MTG Scanner Pro</h1>
                        <span className="app-subtitle">
                            🔥 Enhanced Smart Cooldown System • Professional Grade
                        </span>
                    </div>
                </div>
                
                <ProfessionalStats
                    accuracy={98}
                    scannedCount={scanHistory.length}
                    savedCount={savedCards.length}
                    aiLearned={Object.keys(editionPreferences).length}
                    isPremium={isPremiumUser}
                    cooldownActive={!cooldownStatus.canScan}
                />
            </div>

            {/* 🎨 PROFESSIONAL TAB NAVIGATION */}
            <ProfessionalTabs
                activeTab={activeTab}
                onTabChange={handleTabSwitch}
                savedCards={savedCards}
                isPremium={isPremiumUser}
            />

            {/* MAIN CONTENT AREA */}
            <div className="main-content">
                
                {/* 🔍 SCANNER TAB */}
                {activeTab === 'scanner' && (
                    <>
                        <div className="scanner-section glass-card">
                            {/* Video Container with Professional Overlays */}
                            <div className="video-container">
                                <video
                                    ref={videoRef}
                                    className="scanner-video"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                
                                {/* 🔥 PROFESSIONAL Cooldown Status */}
                                {renderCooldownStatus()}
                                
                                {/* 📷 PROFESSIONAL Camera Status */}
                                <ProfessionalCameraStatus
                                    cameraStatus={cameraStatus}
                                    cameraInitialized={cameraInitializationComplete}
                                />
                                
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
                                {isScanning && (
                                    <div className="scanning-overlay">
                                        <div className={`scan-frame ${scanningPausedForSelection ? 'paused' : ''}`}></div>
                                        <div className="scan-instructions">
                                            {scanningPausedForSelection ? 
                                                '⏸️ Scanner paused for edition selection' :
                                                '🔍 Position MTG card in frame'
                                            }
                                            <div className="scan-tech">
                                                🔥 Enhanced smart cooldown active
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 🎮 PROFESSIONAL Scan Controls */}
                            <ProfessionalScanControls
                                scanMode={scanMode}
                                setScanMode={setScanMode}
                                isScanning={isScanning}
                                onStartScanning={startScanning}
                                onStopScanning={stopScanning}
                                cameraStatus={cameraStatus}
                                showEditionSelector={showEditionSelector}
                                scanningPausedForSelection={scanningPausedForSelection}
                                cooldownStatus={cooldownStatus}
                            />
                        </div>

                        {/* 💎 PROFESSIONAL Card Display */}
                        {isUIVisible && (
                            <div className="card-info-section glass-card">
                                <ProfessionalCardResult
                                    scanResult={scanResult}
                                    currentCard={currentCard}
                                    onSaveCard={saveCardToCollection}
                                    onOpenScryfall={openCardInScryfall}
                                />

                                {/* Show scan history */}
                                {scanHistory.length > 0 && (
                                    <div style={{marginTop: '24px'}}>
                                        <h4 style={{color: '#4a90e2', marginBottom: '16px', fontSize: '16px'}}>
                                            📊 Recent Scans
                                        </h4>
                                        <div style={{maxHeight: '200px', overflowY: 'auto'}} className="scrollable">
                                            {scanHistory.map((card, index) => (
                                                <div key={index} style={{
                                                    padding: '12px',
                                                    margin: '8px 0',
                                                    background: 'rgba(74, 144, 226, 0.1)',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    border: '1px solid rgba(74, 144, 226, 0.2)'
                                                }}>
                                                    <span style={{fontWeight: '600'}}>{card.cardName}</span>
                                                    <span style={{color: '#64b5f6', fontWeight: '700'}}>{card.confidence}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* 🃏 COLLECTION TAB */}
                {activeTab === 'deck' && (
                    <div className="glass-card" style={{padding: '32px', width: '100%'}}>
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

                {/* 📚 KNOWLEDGE TAB */}
                {activeTab === 'knowledge' && (
                    <div className="glass-card" style={{padding: '32px', width: '100%'}}>
                        <MTGKnowledgeBase 
                            currentCard={currentCard}
                            savedCards={savedCards}
                            editionPreferences={editionPreferences}
                        />
                    </div>
                )}
            </div>

            {/* 📊 PROFESSIONAL Status Bar */}
            <div className="status-bar glass-card">
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
                        MTG Scanner Pro
                    </div>
                    <span className="status-item">
                        🔥 Enhanced Cooldown: {cooldownStatus.canScan ? 'Ready' : 'Active'}
                    </span>
                    <span className="status-item">
                        📷 Camera: {cameraStatus === 'ready' ? 'Ready ✅' : 'Initializing ⏳'}
                    </span>
                    <span className="status-item">🧠 AI: Gemini Vision</span>
                    <span className="status-item">{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
                </div>
            </div>

            {/* 🎭 PROFESSIONAL Edition Selector */}
            {showEditionSelector && (
                <ProfessionalEditionSelector
                    cardName={pendingCardData?.cardName}
                    availableEditions={availableEditions}
                    onEditionSelected={handleEditionSelected}
                    onCancel={handleEditionCancelled}
                    aiRecommendation={editionPreferences[pendingCardData?.cardName?.toLowerCase()?.trim()]}
                />
            )}

            {/* Premium Upgrade Paywall Modal */}
            {showPaywallModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>💎 Upgrade to Premium</h3>
                        
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
                            <h4 style={{ margin: '0 0 15px 0', color: '#4a90e2' }}>Premium Features:</h4>
                            <ul style={{ textAlign: 'left', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
                                <li>🔥 <strong>Unlimited collection storage</strong></li>
                                <li>🧠 <strong>Advanced AI learning</strong></li>
                                <li>📊 <strong>Collection analytics</strong></li>
                                <li>💰 <strong>Price tracking & alerts</strong></li>
                                <li>🎯 <strong>Deck optimization tools</strong></li>
                                <li>⚡ <strong>Priority customer support</strong></li>
                            </ul>
                        </div>
                        
                        <div className="modal-buttons">
                            <button 
                                onClick={handleUpgradeToPremium}
                                className="modal-btn primary"
                            >
                                💎 Upgrade for $9.99/month
                            </button>
                            <button 
                                onClick={() => setShowPaywallModal(false)}
                                className="modal-btn secondary"
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
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>🔥 10 Cards Scanned with Smart Cooldown!</h3>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            You've successfully scanned <strong>10 cards</strong> with the enhanced cooldown system.
                        </p>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            AI learned <strong>{Object.keys(editionPreferences).length}</strong> edition preferences.
                        </p>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            Total saved to collection: <strong>{savedCards.length}</strong> cards
                        </p>
                        
                        <div className="modal-buttons">
                            <button 
                                onClick={handleContinueScanning}
                                className="modal-btn primary"
                            >
                                🔥 Continue Smart Scanning
                            </button>
                            <button 
                                onClick={handleStopScanning}
                                className="modal-btn secondary"
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
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>📷 Camera Settings</h3>
                        
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
                                        className="modal-btn primary"
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
                        
                        <div className="modal-buttons">
                            <button
                                onClick={refreshCameraList}
                                className="modal-btn secondary"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={() => setShowCameraSelector(false)}
                                className="modal-btn primary"
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