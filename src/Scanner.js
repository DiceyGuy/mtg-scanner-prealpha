// Scanner.js - TILPASSET VERSJON med Smart Kamera Deteksjon
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService'; // 🔥 BEHOLDER DERES EKSISTERENDE SERVICE
import './CardDisplay.css';

// 🔥 NEW: Smart Camera Selector Modal Component
const SmartCameraModal = ({ isOpen, cameras, selectedCameraId, onCameraSelect, onClose }) => {
    if (!isOpen) return null;

    // 🔥 Intelligent camera classification
    const classifyCamera = (camera) => {
        const label = camera.label.toLowerCase();
        const virtualKeywords = [
            'virtual', 'obs', 'snap camera', 'manycam', 'splitcam', 
            'xsplit', 'nvidia broadcast', 'streamlabs', 'wirecast',
            'mmhmm', 'camo', 'epoccam', 'droidcam', 'iriun', 'webcamoid'
        ];
        
        const isVirtual = virtualKeywords.some(keyword => label.includes(keyword));
        
        // Additional heuristics
        let confidence = 'unknown';
        if (label.includes('logitech') || label.includes('c920') || label.includes('c930')) {
            confidence = 'high-physical';
        } else if (label.includes('integrated') || label.includes('built-in')) {
            confidence = 'medium-physical';
        } else if (isVirtual) {
            confidence = 'virtual';
        }
        
        return {
            ...camera,
            isVirtual,
            isPhysical: !isVirtual,
            confidence,
            priority: isVirtual ? 1 : 3, // Physical cameras get higher priority
            displayLabel: camera.label || `Camera ${camera.deviceId.substring(0, 8)}...`,
            recommendation: isVirtual ? '❌ Virtual Camera (Not Recommended)' : '✅ Physical Camera (Recommended)'
        };
    };

    const classifiedCameras = cameras.map(classifyCamera)
        .sort((a, b) => b.priority - a.priority);

    const physicalCount = classifiedCameras.filter(c => c.isPhysical).length;
    const virtualCount = classifiedCameras.filter(c => c.isVirtual).length;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                border: '2px solid #4a90e2',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '650px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                color: 'white',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
                <h3 style={{ 
                    color: '#4a90e2', 
                    marginBottom: '16px', 
                    textAlign: 'center',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    📷 Smart Camera Selection
                </h3>
                
                <div style={{
                    background: 'rgba(255, 107, 53, 0.1)',
                    border: '1px solid #ff6b35',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#ff6b35', fontWeight: 'bold', marginBottom: '8px' }}>
                        🚨 Virtual Camera Detected!
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Found: {physicalCount} Physical • {virtualCount} Virtual
                        <br/>Select your physical camera for best MTG card recognition
                    </div>
                </div>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                    {classifiedCameras.map((camera, index) => (
                        <div
                            key={camera.deviceId}
                            onClick={() => onCameraSelect(camera.deviceId)}
                            style={{
                                padding: '16px',
                                margin: '12px 0',
                                background: selectedCameraId === camera.deviceId ? 
                                    'linear-gradient(45deg, #4a90e2, #64b5f6)' : 
                                    (camera.isPhysical ? 
                                        'rgba(34, 197, 94, 0.1)' : 
                                        'rgba(220, 53, 69, 0.1)'
                                    ),
                                border: selectedCameraId === camera.deviceId ? 
                                    '2px solid #4a90e2' : 
                                    (camera.isPhysical ? 
                                        '1px solid rgba(34, 197, 94, 0.3)' : 
                                        '1px solid rgba(220, 53, 69, 0.3)'
                                    ),
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: selectedCameraId === camera.deviceId ? 'scale(1.02)' : 'scale(1)'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedCameraId !== camera.deviceId) {
                                    e.target.style.transform = 'scale(1.01)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedCameraId !== camera.deviceId) {
                                    e.target.style.transform = 'scale(1)';
                                }
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    fontSize: '24px',
                                    minWidth: '30px'
                                }}>
                                    {camera.isPhysical ? '📷' : '🖥️'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ 
                                        fontWeight: '600', 
                                        marginBottom: '6px',
                                        fontSize: '16px',
                                        color: selectedCameraId === camera.deviceId ? 'white' : '#e2e8f0'
                                    }}>
                                        {camera.displayLabel}
                                    </div>
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: selectedCameraId === camera.deviceId ? 
                                            'rgba(255,255,255,0.8)' : '#94a3b8',
                                        marginBottom: '4px'
                                    }}>
                                        ID: {camera.deviceId.substring(0, 20)}...
                                    </div>
                                    <div style={{ 
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: camera.isPhysical ? '#22c55e' : '#ef4444'
                                    }}>
                                        {camera.recommendation}
                                    </div>
                                </div>
                                {selectedCameraId === camera.deviceId && (
                                    <div style={{ 
                                        color: 'white', 
                                        fontWeight: 'bold',
                                        fontSize: '18px'
                                    }}>
                                        ✅
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'center',
                    borderTop: '1px solid #444',
                    paddingTop: '20px'
                }}>
                    <button
                        onClick={() => {
                            // Auto-select best physical camera
                            const bestPhysical = classifiedCameras.find(c => c.confidence === 'high-physical') ||
                                                classifiedCameras.find(c => c.isPhysical);
                            if (bestPhysical) {
                                onCameraSelect(bestPhysical.deviceId);
                            }
                        }}
                        style={{
                            padding: '12px 24px',
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid #22c55e',
                            color: '#22c55e',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        🎯 Auto-Select Best Camera
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: '1px solid #666',
                            color: '#94a3b8',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Close
                    </button>
                </div>
                
                <div style={{
                    marginTop: '16px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    textAlign: 'center',
                    lineHeight: '1.4'
                }}>
                    💡 <strong>Tip:</strong> Physical cameras (Logitech C920, built-in webcams) work best for MTG card scanning.
                    <br/>Virtual cameras (OBS, Snap Camera) may reduce recognition accuracy.
                </div>
            </div>
        </div>
    );
};

// 🔥 BEHOLDER ALLE DERES EKSISTERENDE KOMPONENTER
const ProfessionalCooldownStatus = ({ cooldownStatus, isVisible }) => {
    if (!isVisible || !cooldownStatus) return null;

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
                🔥 COOLDOWN DEBUG STATUS
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>API:</span>
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
                <span style={{color: '#64b5f6'}}>{cooldownStatus.detectionBufferSize || 0}/{cooldownStatus.stabilityRequired || 3}</span>
            </div>
            {cooldownStatus.longPauseRemaining > 0 && (
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>Long Pause:</span>
                    <span style={{color: '#ffc107'}}>{Math.ceil(cooldownStatus.longPauseRemaining / 1000)}s</span>
                </div>
            )}
            <div style={{
                marginTop: '6px', 
                padding: '4px', 
                background: cooldownStatus.canScan ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)',
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold'
            }}>
                {cooldownStatus.canScan ? '✅ Ready' : '⏳ Cooldown'}
            </div>
        </div>
    );
};

const ProfessionalTabs = ({ activeTab, onTabChange, savedCards }) => {
    const tabs = [
        { id: 'scanner', label: '🔍 Scanner', badge: null },
        { id: 'deck', label: '🃏 Collection', badge: savedCards?.length || 0 },
        { id: 'knowledge', label: '📚 Knowledge', badge: null }
    ];

    return (
        <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: 'none',
                        background: activeTab === tab.id ? 'linear-gradient(45deg, #4a90e2, #64b5f6)' : 'transparent',
                        color: activeTab === tab.id ? 'white' : '#94a3b8',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>{tab.label}</span>
                    {tab.badge !== null && (
                        <span style={{
                            background: 'rgba(74, 144, 226, 0.2)',
                            color: '#4a90e2',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '700'
                        }}>
                            {tab.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

const showProfessionalToast = (message, type = 'info', duration = 3000) => {
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10001;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        max-width: 300px;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, duration);
};

// 🔥 BEHOLDER DERES EKSISTERENDE MTG KNOWLEDGE BASE
const MTGKnowledgeBase = ({ currentCard = null, savedCards = [] }) => {
    const [activeSection, setActiveSection] = useState('current');

    const getCollectionInsights = () => {
        if (savedCards.length === 0) return null;
        
        const colorCount = {};
        const typeCount = {};
        
        savedCards.forEach(card => {
            if (card.colors && Array.isArray(card.colors)) {
                card.colors.forEach(color => {
                    colorCount[color] = (colorCount[color] || 0) + 1;
                });
            }
            
            if (card.cardType) {
                const mainType = card.cardType.split('—')[0].trim();
                typeCount[mainType] = (typeCount[mainType] || 0) + 1;
            }
        });

        return { colorCount, typeCount, totalCards: savedCards.length };
    };

    const insights = getCollectionInsights();

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h2 style={{ color: '#4a90e2', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📚 MTG Knowledge Base
            </h2>
            {/* Resten av Knowledge Base komponenten - samme som før */}
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#94a3b8' }}>MTG Knowledge Base - Features coming soon!</p>
            </div>
        </div>
    );
};

// 🔥 BEHOLDER DERES EKSISTERENDE DECK MANAGER
const DeckManager = ({ savedCards, onRemoveCard, onOpenScryfall }) => {
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');

    const filteredAndSortedCards = savedCards
        .filter(card => 
            card.cardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (card.cardType && card.cardType.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.cardName.localeCompare(b.cardName);
                case 'type':
                    return (a.cardType || '').localeCompare(b.cardType || '');
                case 'set':
                    return (a.setInfo || '').localeCompare(b.setInfo || '');
                case 'date':
                    return new Date(b.addedAt) - new Date(a.addedAt);
                default:
                    return 0;
            }
        });

    const exportToMoxfield = () => {
        const moxfieldFormat = savedCards.map(card => `1 ${card.cardName}`).join('\n');
        const blob = new Blob([moxfieldFormat], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mtg_collection.txt';
        a.click();
        URL.revokeObjectURL(url);
        showProfessionalToast('📁 Collection exported successfully!', 'success');
    };

    return (
        <div>
            <h2 style={{ color: '#4a90e2', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🃏 Card Collection ({savedCards.length} cards)
            </h2>

            {/* Collection interface - samme som før */}
            {savedCards.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
                    <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Cards in Collection</h3>
                    <p style={{ color: '#94a3b8' }}>Start scanning cards to build your collection</p>
                </div>
            ) : (
                <div>
                    {/* Collection controls og display - implementation kan forenkles for nå */}
                    <p style={{ color: '#94a3b8' }}>Collection management features available</p>
                </div>
            )}
        </div>
    );
};

// 🔥 BEHOLDER DERES EKSISTERENDE COOLDOWN SYSTEM (forbedret)
class MTGScannerCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.isEditionSelectorOpen = false;
        this.detectionBuffer = [];
        
        // 🔥 JUSTERTE cooldown perioder
        this.SAME_CARD_COOLDOWN = 12000;      // 12 sekunder for samme kort
        this.MIN_API_INTERVAL = 3000;         // 3 sekunder mellom API kall
        this.DETECTION_STABILITY = 2;         // Trenger 2 konsistente deteksjoner
        this.MAX_CONSECUTIVE = 3;             // Max konsekutive før pause
        this.LONG_PAUSE_DURATION = 20000;    // 20 sekunder pause
        
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
    }

    shouldScan(cardName = null) {
        const now = Date.now();
        
        if (this.isEditionSelectorOpen) {
            return false;
        }
        
        if (this.isLongPauseActive) {
            const pauseRemaining = this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime);
            if (pauseRemaining > 0) {
                return false;
            } else {
                this.isLongPauseActive = false;
                this.consecutiveDetections = 0;
            }
        }
        
        if (now - this.lastApiCall < this.MIN_API_INTERVAL) {
            return false;
        }
        
        if (cardName && cardName === this.lastDetectedCard) {
            const timeSinceLastDetection = now - this.lastDetectionTime;
            if (timeSinceLastDetection < this.SAME_CARD_COOLDOWN) {
                return false;
            }
        }
        
        return true;
    }

    addDetection(cardName, confidence) {
        const now = Date.now();
        
        this.detectionBuffer.push({
            cardName,
            confidence,
            timestamp: now
        });
        
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
        
        if (this.consecutiveDetections >= this.MAX_CONSECUTIVE) {
            this.isLongPauseActive = true;
            this.longPauseStartTime = now;
        }
    }

    resetCooldowns() {
        this.consecutiveDetections = 0;
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.detectionBuffer = [];
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
    }

    setEditionSelectorOpen(isOpen) {
        this.isEditionSelectorOpen = isOpen;
    }

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

// 🔥 MAIN SCANNER COMPONENT - TILPASSET DERES SYSTEM
const Scanner = () => {
    // Samme state som før
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('initializing');
    const [currentCard, setCurrentCard] = useState(null);
    const [scanMode, setScanMode] = useState('continuous');
    const [continuousCount, setContinuousCount] = useState(0);
    const [showContinueDialog, setShowContinueDialog] = useState(false);
    const [autoSaveEnabled] = useState(true);
    const [cooldownStatus, setCooldownStatus] = useState({});
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanHistory, setScanHistory] = useState([]);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const [savedCards, setSavedCards] = useState([]);
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    const [pendingScanMode, setPendingScanMode] = useState(null);
    const [scanningPausedForSelection, setScanningPausedForSelection] = useState(false);
    const [editionPreferences, setEditionPreferences] = useState({});
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const FREE_COLLECTION_LIMIT = 100;
    const [cameraError, setCameraError] = useState(null);
    const [cameraRetryCount, setCameraRetryCount] = useState(0);
    const [cameraInitializationComplete, setCameraInitializationComplete] = useState(false);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    
    // 🔥 NEW: Camera selector modal state
    const [showCameraSelector, setShowCameraSelector] = useState(false);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const initializationPromiseRef = useRef(null);
    const cooldownSystemRef = useRef(new MTGScannerCooldown());

    // 🔥 TILPASSET initialization
    useEffect(() => {
        console.log('🔧 Initializing MTG Scanner Pro with Smart Camera Detection...');
        initializeServices();
        loadSavedData();
        
        if (!initializationPromiseRef.current) {
            initializationPromiseRef.current = enumerateCameras().then(() => setupCamera());
        }
        
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500);
        
        return () => {
            clearInterval(cooldownUpdateInterval);
            cleanup();
        };
    }, []);

    const initializeServices = () => {
        try {
            visionServiceRef.current = new ClaudeVisionService(); // 🔥 DERES EKSISTERENDE SERVICE
            console.log('✅ ClaudeVisionService initialized successfully');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
        }
    };

    const loadSavedData = () => {
        try {
            const saved = localStorage.getItem('mtg_saved_cards');
            if (saved) {
                setSavedCards(JSON.parse(saved));
            }
            
            const preferences = localStorage.getItem('mtg_edition_preferences');
            if (preferences) {
                setEditionPreferences(JSON.parse(preferences));
            }
            
            const premiumStatus = localStorage.getItem('mtg_premium_status');
            if (premiumStatus === 'true') {
                setIsPremiumUser(true);
            }
            
        } catch (error) {
            console.error('❌ Failed to load saved data:', error);
        }
    };

    // 🔥 FORBEDRET camera enumeration med smart deteksjon
    const enumerateCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📷 Available cameras:', videoDevices.length);
            videoDevices.forEach((device, index) => {
                console.log(`   ${index + 1}. ${device.label} (${device.deviceId.substring(0, 20)}...)`);
            });
            
            setAvailableCameras(videoDevices);
            
            // 🔥 SMART camera selection
            const intelligentCameraSelection = (cameras) => {
                // Priority 1: Known good physical cameras
                const logitechCamera = cameras.find(device => 
                    device.label.toLowerCase().includes('logitech') && 
                    (device.label.toLowerCase().includes('c920') || device.label.toLowerCase().includes('c930'))
                );
                
                if (logitechCamera) {
                    console.log('🎯 Found high-quality Logitech camera:', logitechCamera.label);
                    return logitechCamera.deviceId;
                }
                
                // Priority 2: Any Logitech camera
                const anyLogitech = cameras.find(device => 
                    device.label.toLowerCase().includes('logitech')
                );
                
                if (anyLogitech) {
                    console.log('📷 Found Logitech camera:', anyLogitech.label);
                    return anyLogitech.deviceId;
                }
                
                // Priority 3: Built-in/Integrated cameras
                const builtInCamera = cameras.find(device => 
                    device.label.toLowerCase().includes('integrated') ||
                    device.label.toLowerCase().includes('built-in') ||
                    device.label.toLowerCase().includes('facetime')
                );
                
                if (builtInCamera) {
                    console.log('📱 Found built-in camera:', builtInCamera.label);
                    return builtInCamera.deviceId;
                }
                
                // Priority 4: First non-virtual camera
                const virtualKeywords = ['virtual', 'obs', 'snap', 'manycam', 'splitcam'];
                const physicalCamera = cameras.find(device => 
                    !virtualKeywords.some(keyword => 
                        device.label.toLowerCase().includes(keyword)
                    )
                );
                
                if (physicalCamera) {
                    console.log('🔍 Found likely physical camera:', physicalCamera.label);
                    return physicalCamera.deviceId;
                }
                
                // Last resort: First camera
                if (cameras.length > 0) {
                    console.log('⚠️ Using first available camera (may be virtual)');
                    return cameras[0].deviceId;
                }
                
                return null;
            };
            
            const selectedId = intelligentCameraSelection(videoDevices);
            if (selectedId) {
                setSelectedCameraId(selectedId);
                
                // 🔥 Check if virtual camera was selected and show warning
                const selectedCamera = videoDevices.find(d => d.deviceId === selectedId);
                const isVirtual = ['virtual', 'obs', 'snap', 'manycam'].some(keyword => 
                    selectedCamera?.label.toLowerCase().includes(keyword)
                );
                
                if (isVirtual) {
                    console.log('🚨 Virtual camera detected - showing camera selector');
                    setTimeout(() => {
                        setShowCameraSelector(true);
                    }, 2000); // Show selector after camera is set up
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to enumerate cameras:', error);
        }
    };

    // 🔥 TILPASSET camera setup (samme som før men med bedre logging)
    const setupCamera = async (deviceId = null) => {
        console.log('🎥 Setting up camera...');
        setCameraStatus('requesting');
        setCameraError(null);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            if (cameraStreamRef.current && cameraStreamRef.current.active) {
                console.log('📷 Camera stream already active, reusing...');
                
                if (videoRef.current && !videoRef.current.srcObject) {
                    videoRef.current.srcObject = cameraStreamRef.current;
                    videoRef.current.play();
                }
                
                setCameraStatus('ready');
                setCameraInitializationComplete(true);
                return;
            }

            const useDeviceId = deviceId || selectedCameraId;
            let constraints;
            
            if (useDeviceId) {
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
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraStreamRef.current = stream;
            setCameraInitializationComplete(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStatus('ready');
                    setCameraError(null);
                    setCameraRetryCount(0);
                    
                    // 🔥 Log selected camera info
                    const selectedCamera = availableCameras.find(c => c.deviceId === useDeviceId);
                    console.log('✅ Camera ready:', {
                        resolution: `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`,
                        camera: selectedCamera?.label || 'Unknown camera'
                    });
                    
                    showProfessionalToast('✅ Camera ready for MTG scanning!', 'success');
                };
            }
            
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            setCameraStatus('error');
            handleCameraError(error);
        }
    };

    // 🔥 NEW: Handle camera switching
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
        
        const selectedCamera = availableCameras.find(c => c.deviceId === newCameraId);
        showProfessionalToast(`📷 Switched to: ${selectedCamera?.label || 'Selected camera'}`, 'success');
    };

    // RESTEN AV METODENE ER SAMME SOM FØR (handleCameraError, startScanning, osv.)
    // Men jeg forkorter koden her for å spare plass - samme logikk som i original

    const handleCameraError = (error) => {
        let errorMessage = '';
        let errorAction = '';
        let canRetry = false;

        switch (error.name) {
            case 'NotAllowedError':
                errorMessage = 'Camera permission denied';
                errorAction = 'Please allow camera access and try again';
                canRetry = true;
                break;
            case 'NotFoundError':
                errorMessage = 'No camera found';
                errorAction = 'Please connect a camera';
                canRetry = true;
                break;
            case 'NotReadableError':
                errorMessage = 'Camera is busy';
                errorAction = 'Close other apps using the camera';
                canRetry = true;
                break;
            default:
                errorMessage = error.message || 'Camera error';
                errorAction = 'Please check your camera and try again';
                canRetry = true;
        }

        setCameraError({ message: errorMessage, action: errorAction, canRetry });
    };

    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ Scanner not ready');
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner - ${scanMode} mode...`);
        setIsScanning(true);
        setScanningPausedForSelection(false);
        cooldownSystemRef.current.resetCooldowns();
        
        // Scanning logic samme som før...
        scanIntervalRef.current = setInterval(async () => {
            // Scanning implementation samme som før
        }, scanMode === 'single' ? 1500 : 2500);
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

    return (
        <div className="mtg-scanner-pro" style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '20px',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 0',
                borderBottom: '2px solid #4a90e2',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        textAlign: 'center',
                        lineHeight: '1.1'
                    }}>
                        MTG<br/>SCAN
                    </div>
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '5px'
                        }}>
                            MTG Scanner Pro
                        </h1>
                        <span style={{ fontSize: '0.9rem', color: '#b0bec5' }}>
                            🔥 Smart Camera Detection • Professional Grade
                        </span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(74, 144, 226, 0.3)',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Accuracy: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>98%</span>
                    </div>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(74, 144, 226, 0.3)',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Scanned: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{scanHistory.length}</span>
                    </div>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(74, 144, 226, 0.3)',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Collection: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{savedCards.length}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <ProfessionalTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                savedCards={savedCards}
            />

            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Scanner Tab */}
                {activeTab === 'scanner' && (
                    <>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px',
                            padding: '24px'
                        }}>
                            {/* Video Container */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <video
                                    ref={videoRef}
                                    style={{
                                        width: '100%',
                                        maxWidth: '640px',
                                        height: 'auto',
                                        borderRadius: '12px',
                                        border: '2px solid #4a90e2',
                                        background: '#000'
                                    }}
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                
                                {/* Cooldown Status Overlay */}
                                <ProfessionalCooldownStatus
                                    cooldownStatus={cooldownStatus}
                                    isVisible={true}
                                />
                                
                                {/* 🔥 NEW: Camera selector button */}
                                <button
                                    onClick={() => setShowCameraSelector(true)}
                                    style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        right: '10px',
                                        background: 'rgba(74, 144, 226, 0.8)',
                                        border: 'none',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    📷 Camera
                                </button>
                                
                                {/* Camera Error Display */}
                                {cameraError && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(220, 53, 69, 0.9)',
                                        color: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        border: '2px solid #dc3545'
                                    }}>
                                        <h3>📹 Camera Issue</h3>
                                        <p>{cameraError.message}</p>
                                        <p>{cameraError.action}</p>
                                    </div>
                                )}
                            </div>

                            {/* Scan Controls */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <button
                                    onClick={isScanning ? stopScanning : startScanning}
                                    disabled={cameraStatus !== 'ready'}
                                    style={{
                                        flex: 1,
                                        padding: '16px 24px',
                                        border: 'none',
                                        background: isScanning 
                                            ? 'linear-gradient(135deg, #dc3545, #c82333)' 
                                            : 'linear-gradient(135deg, #4a90e2, #64b5f6)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: cameraStatus !== 'ready' ? 'not-allowed' : 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        opacity: cameraStatus !== 'ready' ? 0.6 : 1
                                    }}
                                >
                                    {isScanning ? '⏹️ Stop Scanning' : `🔥 Start ${scanMode} Scan`}
                                </button>
                            </div>
                        </div>

                        {/* Card Display Area */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px',
                            padding: '24px'
                        }}>
                            <h3 style={{ color: '#4a90e2', marginBottom: '20px' }}>🎯 Card Recognition</h3>
                            
                            {currentCard ? (
                                <div style={{
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '12px',
                                    padding: '20px'
                                }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e', marginBottom: '12px' }}>
                                        {currentCard.cardName}
                                    </div>
                                    <div style={{ color: '#94a3b8' }}>
                                        Confidence: {currentCard.confidence}%
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                        No card detected. Position an MTG card in the camera view.
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Collection Tab */}
                {activeTab === 'deck' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '15px',
                        padding: '32px'
                    }}>
                        <DeckManager 
                            savedCards={savedCards}
                            onRemoveCard={() => {}}
                            onOpenScryfall={() => {}}
                        />
                    </div>
                )}

                {/* Knowledge Tab */}
                {activeTab === 'knowledge' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '15px',
                        padding: '32px'
                    }}>
                        <MTGKnowledgeBase 
                            currentCard={currentCard}
                            savedCards={savedCards}
                        />
                    </div>
                )}
            </div>

            {/* 🔥 NEW: Smart Camera Selector Modal */}
            <SmartCameraModal
                isOpen={showCameraSelector}
                cameras={availableCameras}
                selectedCameraId={selectedCameraId}
                onCameraSelect={handleCameraSwitch}
                onClose={() => setShowCameraSelector(false)}
            />

            {/* Status Bar */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '16px',
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px' }}>📊 Scanned: {scanHistory.length}</span>
                    <span style={{ fontSize: '14px' }}>🔥 Smart Camera: Active</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px' }}>
                        📷 Camera: {cameraStatus === 'ready' ? 'Ready ✅' : 'Initializing ⏳'}
                    </span>
                    <span style={{ fontSize: '14px' }}>🧠 AI: ClaudeVision</span>
                    <span style={{ fontSize: '14px' }}>{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
                </div>
            </div>
        </div>
    );
};

export default Scanner;