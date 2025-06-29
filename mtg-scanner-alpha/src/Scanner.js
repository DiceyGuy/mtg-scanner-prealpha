// Scanner.js - Production-Ready MTG Scanner (Build-Safe)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import CardDisplayUI from './CardDisplayUI';
import DeckManager from './DeckManager';
import EditionSelector from './EditionSelector';
import './CardDisplay.css';

// Temporary MTGKnowledgeBase component (build-safe)
const MTGKnowledgeBase = ({ currentCard, savedCards }) => (
    <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        <h2>📚 MTG Knowledge Base</h2>
        <p>Coming Soon! Rules, interactions, and card analysis.</p>
        {currentCard && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <h3>Current Card: {currentCard.cardName}</h3>
                <p>Type: {currentCard.cardType || 'Unknown'}</p>
                <p>Set: {currentCard.setInfo || 'Unknown'}</p>
            </div>
        )}
        <div style={{ marginTop: '20px' }}>
            <p><strong>Collection Size:</strong> {savedCards.length} cards</p>
        </div>
    </div>
);

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
    const [autoSaveEnabled] = useState(true); // Removed setAutoSaveEnabled to fix warning
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanHistory, setScanHistory] = useState([]);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const [savedCards, setSavedCards] = useState([]);
    
    // Edition selection state
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    
    // Camera initialization state
    const [cameraError, setCameraError] = useState(null);
    const [cameraRetryCount, setCameraRetryCount] = useState(0);
    const [permissionRequested, setPermissionRequested] = useState(false);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const cameraStreamRef = useRef(null);

    // Cleanup function (defined with useCallback to fix dependency warnings)
    const cleanup = useCallback(() => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    }, []);

    // Camera setup function (defined with useCallback to fix dependency warnings)
    const setupCamera = useCallback(async () => {
        console.log('🎥 Setting up HD camera for MTG Scanner Pro...');
        setCameraStatus('requesting');
        setCameraError(null);
        setPermissionRequested(true);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📹 Available cameras:', videoDevices.map(d => d.label || 'Camera'));
            
            if (videoDevices.length === 0) {
                throw new Error('No cameras found on this device');
            }
            
            const realCamera = videoDevices.find(device => 
                device.label.includes('HD Pro Webcam') || 
                device.label.includes('C920') ||
                (!device.label.includes('Virtual') && 
                 !device.label.includes('OBS') && 
                 !device.label.includes('Elgato'))
            ) || videoDevices[0];
            
            if (realCamera && realCamera.label) {
                console.log('✅ Selected professional camera:', realCamera.label);
            }
            
            const constraints = {
                video: {
                    deviceId: realCamera ? { exact: realCamera.deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment'
                }
            };
            
            console.log('📷 Requesting camera permission...');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraStreamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStatus('ready');
                    setCameraError(null);
                    setCameraRetryCount(0);
                    console.log('✅ Professional camera ready:', `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    showCameraMessage('✅ Camera ready for scanning!', 'success');
                };
            }
            
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            setCameraStatus('error');
            handleCameraError(error);
        }
    }, [cameraRetryCount]);

    // Initialize services
    const initializeServices = useCallback(() => {
        console.log('🔧 Initializing MTG Scanner Pro...');
        
        try {
            visionServiceRef.current = new ClaudeVisionService();
            console.log('✅ Gemini Vision Service initialized successfully');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
        }
    }, []);

    // Load saved cards
    const loadSavedCards = useCallback(() => {
        try {
            const saved = localStorage.getItem('mtg_saved_cards');
            if (saved) {
                setSavedCards(JSON.parse(saved));
                console.log('📁 Loaded saved cards from storage');
            }
        } catch (error) {
            console.error('❌ Failed to load saved cards:', error);
        }
    }, []);

    // Initialize services and camera automatically
    useEffect(() => {
        initializeServices();
        
        const initCamera = async () => {
            console.log('🚀 MTG Scanner: Auto-initializing camera...');
            await setupCamera();
        };
        
        const cameraTimer = setTimeout(initCamera, 1000);
        loadSavedCards();
        
        return () => {
            clearTimeout(cameraTimer);
            cleanup();
        };
    }, [initializeServices, setupCamera, loadSavedCards, cleanup]);

    // Auto-initialize camera when scanner tab becomes active
    useEffect(() => {
        if (activeTab === 'scanner' && cameraStatus !== 'ready' && !permissionRequested) {
            console.log('🎯 Scanner tab active, ensuring camera is ready...');
            setupCamera();
        }
    }, [activeTab, cameraStatus, permissionRequested, setupCamera]);

    // Handle camera errors
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
                setTimeout(() => setupCameraFallback(), 1000);
                break;
            default:
                errorMessage = error.message || 'Camera error';
                errorAction = 'Please check your camera and try again';
                canRetry = true;
        }

        setCameraError({ message: errorMessage, action: errorAction, canRetry });
        
        if (canRetry && cameraRetryCount < 3 && error.name !== 'NotAllowedError') {
            const retryDelay = (cameraRetryCount + 1) * 2000;
            console.log(`🔄 Auto-retrying camera setup in ${retryDelay/1000}s (attempt ${cameraRetryCount + 1}/3)`);
            
            setTimeout(() => {
                setCameraRetryCount(prev => prev + 1);
                setupCamera();
            }, retryDelay);
        }
    };

    // Fallback camera setup
    const setupCameraFallback = async () => {
        try {
            console.log('🔄 Trying fallback camera settings...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
            
            cameraStreamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStatus('ready');
                    setCameraError(null);
                    console.log('✅ Camera ready with fallback settings');
                    showCameraMessage('✅ Camera ready (basic settings)', 'success');
                };
            }
            
        } catch (fallbackError) {
            console.error('❌ Fallback camera settings also failed:', fallbackError);
            handleCameraError(fallbackError);
        }
    };

    // Manual camera retry
    const retryCameraSetup = () => {
        console.log('🔄 Manual camera retry requested');
        setCameraRetryCount(0);
        setCameraError(null);
        setupCamera();
    };

    // Show camera messages
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
        
        if (scanMode === 'continuous') {
            setContinuousCount(0);
            console.log('🔄 Continuous mode: Reset counter to 0');
        }
        
        scanIntervalRef.current = setInterval(async () => {
            try {
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 70) {
                    console.log('🎯 MTG Card detected:', result.cardName, `(${result.confidence}%)`);
                    
                    if (scanMode === 'single') {
                        stopScanning();
                    }
                    
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
                    const match = cardNameNormalized === searchNameNormalized;
                    
                    if (!match) {
                        console.log(`❌ Filtered out: "${card.name}" (${card.set_name})`);
                    }
                    return match;
                });
                
                console.log(`🎯 Found ${exactMatches.length} exact name matches for "${cardName}"`);
                
                exactMatches.forEach((card, index) => {
                    console.log(`   ${index + 1}. ${card.set_name} (${card.set.toUpperCase()}) - ${card.released_at}`);
                });
                
                if (exactMatches.length > 1) {
                    if (scanMode === 'single') {
                        console.log('⏹️ SINGLE MODE: Stopping for edition selection');
                        stopScanning();
                        
                        setPendingCardData(detectedCard);
                        setAvailableEditions(exactMatches);
                        setShowEditionSelector(true);
                        
                        setScanResult(null);
                        setCurrentCard(null);
                        return;
                        
                    } else if (scanMode === 'continuous') {
                        console.log('🔄 CONTINUOUS MODE: Auto-selecting best edition');
                        
                        const bestEdition = selectBestEdition(exactMatches);
                        console.log(`✅ Auto-selected: ${bestEdition.set_name} (${bestEdition.set.toUpperCase()})`);
                        
                        const enhancedCard = enhanceCardWithScryfall(detectedCard, bestEdition);
                        displayCard(enhancedCard);
                        
                        if (autoSaveEnabled) {
                            saveCardToCollection(enhancedCard);
                            console.log(`💾 AUTO-SAVED: ${enhancedCard.cardName} to collection`);
                        }
                        
                        handleContinuousCounterAndLimit();
                        showAutoSelectionToast(bestEdition.set_name);
                        return;
                    }
                    
                } else if (exactMatches.length === 1) {
                    console.log(`✅ Single edition found: ${exactMatches[0].set_name} (${exactMatches[0].set.toUpperCase()})`);
                    const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                    displayCard(enhancedCard);
                    
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        saveCardToCollection(enhancedCard);
                        console.log(`💾 AUTO-SAVED: ${enhancedCard.cardName} to collection`);
                        handleContinuousCounterAndLimit();
                    }
                    
                } else {
                    console.log('⚠️ No exact Scryfall matches found, using original detection');
                    displayCard(detectedCard);
                    
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        saveCardToCollection(detectedCard);
                        console.log(`💾 AUTO-SAVED: ${detectedCard.cardName} to collection (no Scryfall match)`);
                        handleContinuousCounterAndLimit();
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

    const selectBestEdition = (editions) => {
        const standardSets = ['mkm', 'otj', 'blb', 'dsk', 'fdn'];
        const standardCard = editions.find(card => standardSets.includes(card.set));
        if (standardCard) {
            console.log('🎯 Auto-selected Standard-legal edition:', standardCard.set_name);
            return standardCard;
        }
        
        const mostRecent = editions[0];
        if (mostRecent) {
            console.log('🆕 Auto-selected most recent edition:', mostRecent.set_name);
            return mostRecent;
        }
        
        return editions[0];
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

    const showAutoSelectionToast = (setName) => {
        const toast = document.createElement('div');
        toast.className = 'auto-selection-toast';
        toast.innerHTML = `📦 Auto-selected: ${setName}`;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            z-index: 9999;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 2000);
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
            scryfallVerified: true
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

    const handleEditionSelected = (selectedEdition) => {
        if (pendingCardData && selectedEdition) {
            const enhancedCard = enhanceCardWithScryfall(pendingCardData, selectedEdition);
            displayCard(enhancedCard);
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
    };

    const handleEditionCancelled = () => {
        if (pendingCardData) {
            displayCard(pendingCardData);
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
    };

    const stopScanning = () => {
        console.log('⏹️ Stopping MTG Scanner...');
        setIsScanning(false);
        
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    };

    const saveCardToCollection = (card) => {
        try {
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
            
        } catch (error) {
            console.error('❌ Failed to save card:', error);
            setScanResult(prev => ({
                ...prev,
                message: `❌ Failed to save ${card.cardName}`
            }));
        }
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
                        <span className="app-subtitle">Smart Bulk Scanning + Precise Control</span>
                    </div>
                </div>
                
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Accuracy:</span>
                        <span className="stat-value">98%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Database:</span>
                        <span className="stat-value">34,983 cards</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Saved:</span>
                        <span className="stat-value">{savedCards.length}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scanner')}
                >
                    🔍 Scanner
                </button>
                <button
                    className={`tab-btn ${activeTab === 'deck' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deck')}
                >
                    🃏 Collection ({savedCards.length})
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
                                {isScanning && (
                                    <div className="scanning-overlay">
                                        <div className="scan-frame"></div>
                                        <div className="scan-instructions">
                                            🔍 Position MTG card in frame
                                            <div className="scan-tech">
                                                {scanMode === 'continuous' ? 
                                                    `🔄 Auto-saving to collection (${continuousCount}/10)` : 
                                                    '📷 Single shot precision mode'
                                                }
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
                                            disabled={isScanning}
                                        >
                                            🔄 Continuous {scanMode === 'continuous' && `(${continuousCount}/10)`}
                                        </button>
                                        <button
                                            className={`mode-btn ${scanMode === 'single' ? 'active' : ''}`}
                                            onClick={() => setScanMode('single')}
                                            disabled={isScanning}
                                        >
                                            📷 Single Shot
                                        </button>
                                    </div>
                                </div>

                                {/* Start/Stop Button */}
                                <button
                                    className={`scan-btn ${isScanning ? 'scanning' : 'ready'}`}
                                    onClick={isScanning ? stopScanning : startScanning}
                                    disabled={cameraStatus !== 'ready'}
                                >
                                    {isScanning ? '⏹️ Stop Scanning' : `▶️ Start ${scanMode === 'single' ? 'Single' : 'Continuous'} Scan`}
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
                                        console.log('🧪 Testing smart scanning for Lightning Bolt...');
                                        handleCardDetection({
                                            cardName: 'Lightning Bolt',
                                            confidence: 95,
                                            timestamp: new Date().toISOString(),
                                            hasCard: true
                                        });
                                    }}
                                    title="Test smart scanning"
                                >
                                    🧪 Test Smart Scan
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
                        />
                    </div>
                )}

                {/* Knowledge Tab */}
                {activeTab === 'knowledge' && (
                    <div className="knowledge-tab">
                        <MTGKnowledgeBase 
                            currentCard={currentCard}
                            savedCards={savedCards}
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
                    <span className="status-item">🧠 Powered by Gemini AI</span>
                    <span className="status-item">📡 Scryfall Database</span>
                    <span className="status-item">📷 {scanMode} Mode</span>
                </div>
            </div>

            {/* Edition Selector Modal */}
            {showEditionSelector && (
                <EditionSelector
                    cardName={pendingCardData?.cardName}
                    availableEditions={availableEditions}
                    onEditionSelected={handleEditionSelected}
                    onCancel={handleEditionCancelled}
                />
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
                            You've successfully scanned <strong>10 cards</strong> in continuous mode.
                        </p>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            Auto-saved to your collection: <strong>{savedCards.length}</strong> total cards
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
                            <span>📁 Collection: {savedCards.length} total</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scanner;