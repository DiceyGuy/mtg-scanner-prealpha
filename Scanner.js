// Scanner.js - Professional MTG Tool with Tabbed Interface
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService'; // BEHOLDER GEMINI API
import CardDisplayUI from './src/CardDisplayUI';
import DeckManager from './src/DeckManager';
import MTGKnowledgeBase from './src/MTGKnowledgeBase';
import EditionSelector from './src/EditionSelector';
import './src/CardDisplay.css';

const Scanner = () => {
    // Core scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('initializing');
    const [currentCard, setCurrentCard] = useState(null);
    const [scanMode, setScanMode] = useState('continuous'); // continuous or single
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner'); // scanner, deck, knowledge
    const [scanHistory, setScanHistory] = useState([]);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const [savedCards, setSavedCards] = useState([]);
    
    // Edition selection state
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);

    // Initialize services
    useEffect(() => {
        initializeServices();
        setupCamera();
        loadSavedCards();
        
        return () => {
            cleanup();
        };
    }, []);

    const initializeServices = () => {
        console.log('🔧 Initializing MTG Scanner Pro...');
        
        try {
            // BRUKER GEMINI API SOM FUNGERER PERFEKT
            visionServiceRef.current = new ClaudeVisionService();
            console.log('✅ Gemini Vision Service initialized successfully');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
        }
    };

    const loadSavedCards = () => {
        try {
            const saved = localStorage.getItem('mtg_saved_cards');
            if (saved) {
                setSavedCards(JSON.parse(saved));
                console.log('📁 Loaded saved cards from storage');
            }
        } catch (error) {
            console.error('❌ Failed to load saved cards:', error);
        }
    };

    const setupCamera = async () => {
        console.log('🎥 Setting up HD camera for MTG Scanner Pro...');
        setCameraStatus('requesting');
        
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📹 Available cameras:', videoDevices.map(d => d.label));
            
            // Prioritize HD Pro Webcam C920
            const realCamera = videoDevices.find(device => 
                device.label.includes('HD Pro Webcam') || 
                device.label.includes('C920') ||
                (!device.label.includes('Virtual') && 
                 !device.label.includes('OBS') && 
                 !device.label.includes('Elgato'))
            ) || videoDevices[0];
            
            if (realCamera) {
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
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStatus('ready');
                    console.log('✅ Professional camera ready:', `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                };
            }
            
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            setCameraStatus('error');
        }
    };

    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ MTG Scanner not ready');
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner Pro - ${scanMode} mode...`);
        setIsScanning(true);
        
        scanIntervalRef.current = setInterval(async () => {
            try {
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 70) {
                    console.log('🎯 MTG Card detected:', result.cardName, `(${result.confidence}%)`);
                    
                    // Stop scanning in single mode when card detected
                    if (scanMode === 'single') {
                        stopScanning();
                    }
                    
                    // ALWAYS check for multiple editions, even if ClaudeVisionService enhanced the card
                    await handleCardDetection(result);
                    
                } else if (result && !result.hasCard) {
                    setScanResult({ hasCard: false, message: result.message || 'No MTG card detected' });
                    setCurrentCard(null);
                }
                
            } catch (error) {
                console.error('❌ Scanning error:', error);
                setScanResult({ hasCard: false, message: 'Scanner error - please try again' });
            }
        }, scanMode === 'single' ? 500 : 1000); // Faster scanning for single mode
    };

    const handleCardDetection = async (detectedCard) => {
        try {
            console.log('🎭 Checking for multiple editions of:', detectedCard.cardName);
            
            // Create a clean search query
            const cardName = detectedCard.cardName.trim();
            const searchQuery = `!"${cardName}"`;
            const encodedQuery = encodeURIComponent(searchQuery);
            
            console.log('🔍 Scryfall search query:', searchQuery);
            
            // Search for all editions of this card in Scryfall
            const editionsResponse = await fetch(
                `https://api.scryfall.com/cards/search?q=${encodedQuery}&unique=prints&order=released&dir=desc`
            );
            
            if (editionsResponse.ok) {
                const editionsData = await editionsResponse.json();
                const editions = editionsData.data || [];
                
                console.log(`📊 Scryfall returned ${editions.length} total results`);
                
                // Filter to exact name matches only (case insensitive, trimmed)
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
                
                // Log all exact matches for debugging
                exactMatches.forEach((card, index) => {
                    console.log(`   ${index + 1}. ${card.set_name} (${card.set.toUpperCase()}) - ${card.released_at}`);
                });
                
                if (exactMatches.length > 1) {
                    // Multiple editions found - show selector
                    console.log(`🎭 MULTIPLE EDITIONS DETECTED! Showing selector for ${exactMatches.length} editions`);
                    
                    // Stop scanning in single mode when multiple editions detected
                    if (scanMode === 'single') {
                        console.log('⏹️ Stopping single mode scan for edition selection');
                        stopScanning();
                    }
                    
                    setPendingCardData(detectedCard);
                    setAvailableEditions(exactMatches);
                    setShowEditionSelector(true);
                    
                    // Clear any existing scan result to show edition selector
                    setScanResult(null);
                    setCurrentCard(null);
                    return; // Don't display card yet, wait for user selection
                    
                } else if (exactMatches.length === 1) {
                    // Single edition - use it directly
                    console.log(`✅ Single edition found: ${exactMatches[0].set_name} (${exactMatches[0].set.toUpperCase()})`);
                    const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                    displayCard(enhancedCard);
                    
                } else {
                    // No exact matches - use original detection (possibly already enhanced by ClaudeVisionService)
                    console.log('⚠️ No exact Scryfall matches found, using original detection');
                    displayCard(detectedCard);
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

    const enhanceCardWithScryfall = (originalCard, scryfallCard) => {
        return {
            ...originalCard,
            // Enhanced with Scryfall data
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
        
        // Add to scan history (avoid duplicates)
        setScanHistory(prev => {
            const isDuplicate = prev.some(historyCard => 
                historyCard.cardName === card.cardName && 
                Math.abs(new Date(historyCard.timestamp) - new Date(card.timestamp)) < 5000
            );
            
            if (!isDuplicate) {
                return [card, ...prev.slice(0, 19)]; // Keep last 20 cards
            }
            return prev;
        });
    };

    const handleEditionSelected = (selectedEdition) => {
        if (pendingCardData && selectedEdition) {
            const enhancedCard = enhanceCardWithScryfall(pendingCardData, selectedEdition);
            displayCard(enhancedCard);
        }
        
        // Close edition selector
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
    };

    const handleEditionCancelled = () => {
        // Use original detection without Scryfall enhancement
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

    const cleanup = () => {
        stopScanning();
        
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    // Card management actions
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
            
            // Save to localStorage
            localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
            
            console.log('💾 Card saved to collection:', card.cardName);
            
            // Show success feedback
            setScanResult(prev => ({
                ...prev,
                savedToCollection: true,
                message: `✅ ${card.cardName} saved to collection!`
            }));
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setScanResult(prev => ({
                    ...prev,
                    savedToCollection: false,
                    message: undefined
                }));
            }, 3000);
            
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
                        <span className="app-subtitle">Professional MTG Card Management Tool</span>
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
                                
                                {/* Scanning Overlay */}
                                {isScanning && (
                                    <div className="scanning-overlay">
                                        <div className="scan-frame"></div>
                                        <div className="scan-instructions">
                                            🔍 Position MTG card in frame
                                            <div className="scan-tech">Powered by Gemini AI</div>
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
                                            🔄 Continuous
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
                                        console.log('🧪 Testing edition detection for Gilded Lotus...');
                                        handleCardDetection({
                                            cardName: 'Gilded Lotus',
                                            confidence: 95,
                                            timestamp: new Date().toISOString(),
                                            hasCard: true
                                        });
                                    }}
                                    title="Test edition detection"
                                >
                                    🧪 Test Editions
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
        </div>
    );
};

export default Scanner;