// Scanner.js - Updated with Card Display UI Integration
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import CardDisplayUI from './CardDisplayUI';
import DeckManager from './DeckManager';
import MTGKnowledgeBase from './MTGKnowledgeBase';
import './CardDisplay.css';

const Scanner = () => {
    // Core scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('initializing');
    const [currentCard, setCurrentCard] = useState(null);
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner'); // scanner, deck, knowledge
    const [scanHistory, setScanHistory] = useState([]);
    const [isUIVisible, setIsUIVisible] = useState(true);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const deckManagerRef = useRef(null);

    // Initialize services
    useEffect(() => {
        initializeServices();
        setupCamera();
        
        return () => {
            cleanup();
        };
    }, []);

    const initializeServices = () => {
        console.log('🔧 Initializing MTG Scanner services...');
        
        try {
            visionServiceRef.current = new ClaudeVisionService();
            console.log('✅ Services initialized successfully');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
        }
    };

    const setupCamera = async () => {
        console.log('🎥 Setting up camera...');
        setCameraStatus('requesting');
        
        try {
            // Get available cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📹 Available cameras:', videoDevices.map(d => d.label));
            
            // Prioritize real cameras over virtual ones
            const realCamera = videoDevices.find(device => 
                device.label.includes('HD Pro Webcam') || 
                device.label.includes('C920') ||
                (!device.label.includes('Virtual') && !device.label.includes('OBS'))
            ) || videoDevices[0];
            
            if (realCamera) {
                console.log('✅ Selected camera:', realCamera.label);
            }
            
            // Request camera stream
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
                    console.log('✅ Camera ready:', `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                };
            }
            
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            setCameraStatus('error');
        }
    };

    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ Scanner not ready');
            return;
        }
        
        console.log('▶️ Starting MTG card scanning...');
        setIsScanning(true);
        
        scanIntervalRef.current = setInterval(async () => {
            try {
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 70) {
                    console.log('🎯 Card detected:', result.cardName, `(${result.confidence}%)`);
                    
                    // Update current card
                    setCurrentCard(result);
                    setScanResult(result);
                    
                    // Add to history (avoid duplicates)
                    setScanHistory(prev => {
                        const isDuplicate = prev.some(card => 
                            card.cardName === result.cardName && 
                            Math.abs(new Date(card.timestamp) - new Date(result.timestamp)) < 5000
                        );
                        
                        if (!isDuplicate) {
                            return [result, ...prev.slice(0, 19)]; // Keep last 20 cards
                        }
                        return prev;
                    });
                } else if (result && !result.hasCard) {
                    setScanResult({ hasCard: false, message: result.message || 'No MTG card detected' });
                }
                
            } catch (error) {
                console.error('❌ Scanning error:', error);
                setScanResult({ hasCard: false, message: 'Scanner error - please try again' });
            }
        }, 1000); // Scan every second
    };

    const stopScanning = () => {
        console.log('⏹️ Stopping scan...');
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

    // Card actions
    const saveCardToDeck = (card) => {
        if (deckManagerRef.current) {
            try {
                deckManagerRef.current.addCard(card);
                console.log('💾 Card saved to deck:', card.cardName);
                // Could add a success notification here
            } catch (error) {
                console.error('❌ Failed to save card:', error);
            }
        }
    };

    const openCardInScryfall = (card) => {
        if (card.scryfallUri) {
            window.open(card.scryfallUri, '_blank');
        } else {
            const searchUrl = `https://scryfall.com/search?q=${encodeURIComponent(card.cardName)}`;
            window.open(searchUrl, '_blank');
        }
    };

    const toggleUIVisibility = () => {
        setIsUIVisible(!isUIVisible);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'deck':
                return <DeckManager ref={deckManagerRef} scanHistory={scanHistory} />;
            case 'knowledge':
                return <MTGKnowledgeBase currentCard={currentCard} />;
            default:
                return null;
        }
    };

    const getCameraStatusMessage = () => {
        switch (cameraStatus) {
            case 'initializing':
                return '🔧 Initializing camera...';
            case 'requesting':
                return '📷 Requesting camera access...';
            case 'ready':
                return '✅ Camera ready';
            case 'error':
                return '❌ Camera error - please check permissions';
            default:
                return '⏳ Setting up...';
        }
    };

    return (
        <div className="mtg-scanner-app">
            {/* Main Scanner Interface */}
            <div className="scanner-container">
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
                        <div className={`status-indicator ${cameraStatus}`}>
                            {getCameraStatusMessage()}
                        </div>
                    </div>
                    
                    {/* Scanning Overlay */}
                    {isScanning && (
                        <div className="scanning-overlay">
                            <div className="scan-frame"></div>
                            <div className="scan-instructions">
                                🔍 Position MTG card in frame
                            </div>
                        </div>
                    )}
                </div>

                {/* Scanner Controls */}
                <div className="scanner-controls">
                    <button
                        className={`scan-btn ${isScanning ? 'scanning' : 'ready'}`}
                        onClick={isScanning ? stopScanning : startScanning}
                        disabled={cameraStatus !== 'ready'}
                    >
                        {isScanning ? '⏹️ Stop Scanning' : '▶️ Start Scanning'}
                    </button>
                    
                    <button
                        className="ui-toggle-btn"
                        onClick={toggleUIVisibility}
                        title="Toggle card info display"
                    >
                        {isUIVisible ? '👁️ Hide UI' : '👁️ Show UI'}
                    </button>
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
                        🃏 Deck Builder
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
                        onClick={() => setActiveTab('knowledge')}
                    >
                        📚 MTG Knowledge
                    </button>
                </div>
            </div>

            {/* Card Display UI - Only show for scanner tab */}
            {isUIVisible && activeTab === 'scanner' && (
                <CardDisplayUI
                    scanResult={scanResult}
                    isScanning={isScanning}
                    onSaveCard={saveCardToDeck}
                    onOpenScryfall={openCardInScryfall}
                    scanHistory={scanHistory}
                />
            )}

            {/* Tab Content */}
            {activeTab !== 'scanner' && (
                <div className="tab-content">
                    {renderTabContent()}
                </div>
            )}

            {/* Quick Stats */}
            {scanHistory.length > 0 && (
                <div className="quick-stats">
                    <div className="stat">
                        📊 Scanned: {scanHistory.length}
                    </div>
                    {currentCard && (
                        <div className="stat">
                            🎯 Last: {currentCard.cardName} ({currentCard.confidence}%)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Scanner;
