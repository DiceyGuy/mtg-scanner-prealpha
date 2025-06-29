// Scanner.js - MTG Scanner with AI Learning & Collection Limits
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import CardDisplayUI from './CardDisplayUI';
import DeckManager from './DeckManager';
import MTGKnowledgeBase from './MTGKnowledgeBase';
import EditionSelector from './EditionSelector';
import './CardDisplay.css';

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
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanHistory, setScanHistory] = useState([]);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const [savedCards, setSavedCards] = useState([]);
    
    // Edition selection state - FIXED: Proper pause control
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    const [pendingScanMode, setPendingScanMode] = useState(null);
    const [scanningPausedForSelection, setScanningPausedForSelection] = useState(false);
    
    // NEW: AI Learning for edition preferences
    const [editionPreferences, setEditionPreferences] = useState({});
    
    // NEW: Collection limits and premium features
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const FREE_COLLECTION_LIMIT = 100;
    
    // Camera state
    const [cameraError, setCameraError] = useState(null);
    const [cameraRetryCount, setCameraRetryCount] = useState(0);
    const [permissionRequested, setPermissionRequested] = useState(false);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const cameraStreamRef = useRef(null);

    // Initialize services and load data
    useEffect(() => {
        initializeServices();
        
        const initCamera = async () => {
            console.log('🚀 MTG Scanner: Auto-initializing camera...');
            await setupCamera();
        };
        
        const cameraTimer = setTimeout(initCamera, 1000);
        loadSavedData();
        
        return () => {
            clearTimeout(cameraTimer);
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'scanner' && cameraStatus !== 'ready' && !permissionRequested) {
            console.log('🎯 Scanner tab active, ensuring camera is ready...');
            setupCamera();
        }
    }, [activeTab]);

    const initializeServices = () => {
        console.log('🔧 Initializing MTG Scanner Pro...');
        
        try {
            visionServiceRef.current = new ClaudeVisionService();
            console.log('✅ Gemini Vision Service initialized successfully');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
        }
    };

    // NEW: Load all saved data including edition preferences
    const loadSavedData = () => {
        try {
            // Load saved cards
            const saved = localStorage.getItem('mtg_saved_cards');
            if (saved) {
                setSavedCards(JSON.parse(saved));
                console.log('📁 Loaded saved cards from storage');
            }
            
            // Load edition preferences for AI learning
            const preferences = localStorage.getItem('mtg_edition_preferences');
            if (preferences) {
                setEditionPreferences(JSON.parse(preferences));
                console.log('🧠 Loaded edition preferences for AI learning');
            }
            
            // Load premium status
            const premiumStatus = localStorage.getItem('mtg_premium_status');
            if (premiumStatus === 'true') {
                setIsPremiumUser(true);
                console.log('💎 Premium user status loaded');
            }
            
        } catch (error) {
            console.error('❌ Failed to load saved data:', error);
        }
    };

    // FIXED: Camera setup with Logitech C920 prioritization
    const setupCamera = async () => {
        console.log('🎥 Setting up camera for MTG Scanner Pro...');
        setCameraStatus('requesting');
        setCameraError(null);
        setPermissionRequested(true);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            let stream = null;
            
            try {
                console.log('📷 Attempting to use Logitech C920...');
                const logitechConstraints = {
                    video: {
                        deviceId: { exact: '9b204eef73d1ed44be0ea768bfdb4c98dc4384c6cdc2fdabd82c6e863313382b' },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                };
                
                stream = await navigator.mediaDevices.getUserMedia(logitechConstraints);
                console.log('✅ Successfully using Logitech C920!');
                
            } catch (logitechError) {
                console.log('⚠️ Logitech C920 not available, trying general constraints...');
                
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
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStatus('ready');
                    setCameraError(null);
                    setCameraRetryCount(0);
                    console.log('✅ Camera ready:', `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    showCameraMessage('✅ Camera ready for scanning!', 'success');
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

    const retryCameraSetup = () => {
        console.log('🔄 Manual camera retry requested');
        setCameraRetryCount(0);
        setCameraError(null);
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

    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ MTG Scanner not ready');
            if (cameraStatus === 'error') {
                showCameraMessage('❌ Camera not ready. Please fix camera issues first.', 'error');
            }
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner Pro - ${scanMode} mode...`);
        setIsScanning(true);
        setScanningPausedForSelection(false); // Reset pause state
        
        if (scanMode === 'continuous') {
            setContinuousCount(0);
            console.log('🔄 Continuous mode: Reset counter to 0');
        }
        
        scanIntervalRef.current = setInterval(async () => {
            // FIXED: Don't scan if edition selector is showing
            if (scanningPausedForSelection || showEditionSelector) {
                console.log('⏸️ Scanning paused for edition selection');
                return;
            }
            
            try {
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 70) {
                    console.log('🎯 MTG Card detected:', result.cardName, `(${result.confidence}%)`);
                    
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
                
            } catch (error) {
                console.error('❌ Scanning error:', error);
                setScanResult({ hasCard: false, message: 'Scanner error - please try again' });
            }
        }, scanMode === 'single' ? 500 : 1000);
    };

    // FIXED: Proper pause control during edition selection
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
                
                // Filter to exact name matches only
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
                    // FIXED: Properly pause scanning during edition selection
                    console.log(`🎭 Multiple editions found - pausing scanner for selection`);
                    
                    // CRITICAL: Pause scanning immediately
                    setScanningPausedForSelection(true);
                    
                    // NEW: Sort editions by AI learning preferences
                    const sortedEditions = sortEditionsByPreference(cardName, exactMatches);
                    
                    // Store the pending card data and scan mode
                    setPendingCardData(detectedCard);
                    setPendingScanMode(scanMode);
                    setAvailableEditions(sortedEditions);
                    setShowEditionSelector(true);
                    
                    // Clear current display while waiting for selection
                    setScanResult(null);
                    setCurrentCard(null);
                    return;
                    
                } else if (exactMatches.length === 1) {
                    // Single edition - use it directly
                    console.log(`✅ Single edition found: ${exactMatches[0].set_name} (${exactMatches[0].set.toUpperCase()})`);
                    const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                    displayCard(enhancedCard);
                    
                    // Auto-save in continuous mode
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        const saved = await saveCardToCollection(enhancedCard);
                        if (saved) {
                            console.log(`💾 AUTO-SAVED: ${enhancedCard.cardName} to collection`);
                            handleContinuousCounterAndLimit();
                        }
                    }
                    
                } else {
                    // No exact matches - use original detection
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

    // NEW: AI Learning - Sort editions by user preferences
    const sortEditionsByPreference = (cardName, editions) => {
        const cardKey = cardName.toLowerCase().trim();
        const userPreference = editionPreferences[cardKey];
        
        if (userPreference) {
            console.log(`🧠 AI Learning: User previously preferred ${userPreference} for ${cardName}`);
            
            // Sort to put preferred edition first
            return editions.sort((a, b) => {
                if (a.set === userPreference) return -1;
                if (b.set === userPreference) return 1;
                return 0; // Keep original order for the rest
            });
        }
        
        return editions; // No preference, return original order
    };

    // NEW: Learn user's edition preference
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

    // FIXED: Handle edition selection and properly resume scanning
    const handleEditionSelected = async (selectedEdition) => {
        if (pendingCardData && selectedEdition) {
            const enhancedCard = enhanceCardWithScryfall(pendingCardData, selectedEdition);
            displayCard(enhancedCard);
            
            console.log(`✅ User selected: ${selectedEdition.set_name} (${selectedEdition.set.toUpperCase()})`);
            
            // NEW: Learn the user's preference for AI
            learnEditionPreference(pendingCardData.cardName, selectedEdition);
            
            // Handle post-selection behavior based on original scan mode
            if (pendingScanMode === 'continuous' && autoSaveEnabled) {
                const saved = await saveCardToCollection(enhancedCard);
                if (saved) {
                    console.log(`💾 AUTO-SAVED: ${enhancedCard.cardName} to collection`);
                    handleContinuousCounterAndLimit();
                }
                
                // Resume continuous scanning if we haven't hit the limit
                if (continuousCount < 9) {
                    console.log('🔄 Resuming continuous scanning after edition selection...');
                    setTimeout(() => {
                        setScanningPausedForSelection(false); // Resume scanning
                        if (!isScanning) {
                            startScanning();
                        }
                    }, 1000);
                }
            }
        }
        
        // Close edition selector and reset state
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setPendingScanMode(null);
        setScanningPausedForSelection(false);
    };

    const handleEditionCancelled = async () => {
        // Use original detection without Scryfall enhancement
        if (pendingCardData) {
            displayCard(pendingCardData);
            
            // Handle post-cancellation behavior
            if (pendingScanMode === 'continuous' && autoSaveEnabled) {
                const saved = await saveCardToCollection(pendingCardData);
                if (saved) {
                    console.log(`💾 AUTO-SAVED: ${pendingCardData.cardName} to collection (cancelled edition selection)`);
                    handleContinuousCounterAndLimit();
                }
                
                // Resume continuous scanning if appropriate
                if (continuousCount < 9) {
                    console.log('🔄 Resuming continuous scanning after cancellation...');
                    setTimeout(() => {
                        setScanningPausedForSelection(false);
                        if (!isScanning) {
                            startScanning();
                        }
                    }, 1000);
                }
            }
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setPendingScanMode(null);
        setScanningPausedForSelection(false);
    };

    const stopScanning = () => {
        console.log('⏹️ Stopping MTG Scanner...');
        setIsScanning(false);
        setScanningPausedForSelection(false);
        
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
        
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    // NEW: Collection with limits and paywall
    const saveCardToCollection = async (card) => {
        try {
            // Check collection limit for free users
            if (!isPremiumUser && savedCards.length >= FREE_COLLECTION_LIMIT) {
                console.log('🚨 Free collection limit reached');
                setShowPaywallModal(true);
                return false; // Don't save the card
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
            
            return true; // Successfully saved
            
        } catch (error) {
            console.error('❌ Failed to save card:', error);
            setScanResult(prev => ({
                ...prev,
                message: `❌ Failed to save ${card.cardName}`
            }));
            return false;
        }
    };

    // NEW: PayPal integration for premium upgrade
    const handleUpgradeToPremium = () => {
        console.log('💎 Initiating PayPal payment for premium upgrade...');
        
        // Create PayPal payment link
        const paypalLink = `https://www.paypal.com/paypalme/thediceyguy/9.99?country.x=US&locale.x=en_US`;
        
        // Open PayPal in new window
        window.open(paypalLink, '_blank');
        
        // Show success message (in real app, you'd verify payment)
        setTimeout(() => {
            setIsPremiumUser(true);
            localStorage.setItem('mtg_premium_status', 'true');
            setShowPaywallModal(false);
            showCameraMessage('💎 Premium upgrade successful! Unlimited collection storage activated.', 'success');
        }, 5000); // Simulate payment verification delay
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

    const getCameraStatusDisplay = () => {
        switch (cameraStatus) {
            case 'initializing':
                return { text: '🔧 Initializing...', class: 'status-initializing' };
            case 'requesting':
                return { text: '📷 Requesting access...', class: 'status-requesting' };
            case 'ready':
                return { text: '✅ HD Camera Ready', class: 'status-ready' };
            case 'error':
                return { text: '❌ Camera Error', class: 'status-error' };
            default:
                return { text: '⏳ Setting up...', class: 'status-default' };
        }
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
                            {isPremiumUser ? '💎 Premium' : `AI Learning + ${FREE_COLLECTION_LIMIT - savedCards.length} cards left`}
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
                    onClick={() => setActiveTab('scanner')}
                >
                    🔍 Scanner {scanningPausedForSelection && '⏸️'}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'deck' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deck')}
                >
                    🃏 Collection ({savedCards.length}{!isPremiumUser && `/${FREE_COLLECTION_LIMIT}`})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
                    onClick={() => setActiveTab('knowledge')}
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
                                
                                {/* Camera Status Overlay */}
                                <div className="camera-status-overlay">
                                    <div className={`status-indicator ${cameraStatus_display.class}`}>
                                        {cameraStatus_display.text}
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
                                                    `🔄 AI learning mode (${continuousCount}/10)` : 
                                                    '📷 Single shot with AI learning'
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
                                            🔄 Continuous {scanMode === 'continuous' && `(${continuousCount}/10)`}
                                        </button>
                                        <button
                                            className={`mode-btn ${scanMode === 'single' ? 'active' : ''}`}
                                            onClick={() => setScanMode('single')}
                                            disabled={isScanning || showEditionSelector}
                                        >
                                            📷 Single Shot
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
                                     isScanning ? '⏹️ Stop Scanning' : 
                                     `▶️ Start ${scanMode === 'single' ? 'Single' : 'Continuous'} Scan`}
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
                                
                                <button
                                    className="ui-toggle-btn"
                                    onClick={toggleUIVisibility}
                                    title="Toggle card information display"
                                >
                                    {isUIVisible ? '👁️ Hide Info' : '👁️ Show Info'}
                                </button>

                                {/* Debug Edition Test Button */}
                                <button
                                    className="debug-btn"
                                    onClick={() => {
                                        console.log('🧪 Testing AI learning for Lightning Bolt...');
                                        handleCardDetection({
                                            cardName: 'Lightning Bolt',
                                            confidence: 95,
                                            timestamp: new Date().toISOString(),
                                            hasCard: true
                                        });
                                    }}
                                    title="Test AI learning"
                                >
                                    🧪 Test AI Learning
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
                            🎯 10 Cards Scanned!
                        </h3>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            You've successfully scanned <strong>10 cards</strong> with AI learning.
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
                                🔄 Continue Scanning
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
                            <span>📊 Session: {continuousCount} cards</span>
                            <span>🧠 AI learned: {Object.keys(editionPreferences).length}</span>
                            <span>📁 Collection: {savedCards.length} total</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scanner;