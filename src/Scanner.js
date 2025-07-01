// MTG Scanner Pro - ULTIMATE ENHANCED VERSION
// Combines: Smart Cooldowns + Edition Selection + Card Art + PayPal Monetization
import React, { useState, useRef, useEffect } from 'react';

// 🔥 SMART COOLDOWN SYSTEM - Enhanced with burst scanning
class EnhancedMTGCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.detectionBuffer = [];
        this.isEditionSelectorOpen = false;
        
        // 🚀 BURST SCANNING: Fast initial, longer pause after success
        this.INITIAL_SCAN_INTERVAL = 1500;    // Fast initial scanning
        this.POST_SUCCESS_COOLDOWN = 12000;   // 12s after successful detection
        this.SAME_CARD_COOLDOWN = 15000;      // 15s for same card
        this.DETECTION_STABILITY = 2;         // Need 2 consistent detections
        this.MAX_CONSECUTIVE = 3;             // Max before long pause
        this.LONG_PAUSE_DURATION = 20000;    // 20s long pause
        
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
        this.burstModeActive = true;
    }

    shouldScan(cardName = null) {
        const now = Date.now();
        
        if (this.isEditionSelectorOpen) {
            console.log("🚫 BLOCKED: Edition selector open");
            return false;
        }
        
        if (this.isLongPauseActive) {
            const pauseRemaining = this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime);
            if (pauseRemaining > 0) {
                return false;
            } else {
                this.isLongPauseActive = false;
                this.consecutiveDetections = 0;
                this.burstModeActive = true; // Re-enable burst mode
            }
        }
        
        // 🚀 BURST MODE: Use different intervals based on recent success
        const intervalToUse = this.burstModeActive ? 
            this.INITIAL_SCAN_INTERVAL : this.POST_SUCCESS_COOLDOWN;
            
        if (now - this.lastApiCall < intervalToUse) {
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
        
        // 🚀 Switch to slower mode after successful detection
        this.burstModeActive = false;
        
        if (this.consecutiveDetections >= this.MAX_CONSECUTIVE) {
            this.isLongPauseActive = true;
            this.longPauseStartTime = now;
        }
    }

    setEditionSelectorOpen(isOpen) {
        this.isEditionSelectorOpen = isOpen;
        if (!isOpen) {
            // Reset to burst mode when closing edition selector
            this.burstModeActive = true;
        }
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

    resetCooldowns() {
        this.consecutiveDetections = 0;
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.detectionBuffer = [];
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
        this.burstModeActive = true;
    }

    getCooldownStatus() {
        const now = Date.now();
        
        let longPauseRemaining = 0;
        if (this.isLongPauseActive) {
            longPauseRemaining = Math.max(0, this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime));
        }
        
        const intervalToUse = this.burstModeActive ? 
            this.INITIAL_SCAN_INTERVAL : this.POST_SUCCESS_COOLDOWN;
        
        return {
            sameCardCooldown: this.lastDetectedCard ? Math.max(0, this.SAME_CARD_COOLDOWN - (now - this.lastDetectionTime)) : 0,
            apiCooldown: Math.max(0, intervalToUse - (now - this.lastApiCall)),
            consecutiveDetections: this.consecutiveDetections,
            longPauseRemaining,
            canScan: this.shouldScan(this.lastDetectedCard),
            detectionBufferSize: this.detectionBuffer.length,
            stabilityRequired: this.DETECTION_STABILITY,
            burstModeActive: this.burstModeActive,
            currentInterval: intervalToUse
        };
    }
}

// 🧠 AI LEARNING SYSTEM for edition preferences
class EditionLearningSystem {
    constructor() {
        this.preferences = this.loadPreferences();
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('mtg_edition_preferences');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    savePreferences() {
        localStorage.setItem('mtg_edition_preferences', JSON.stringify(this.preferences));
    }

    learnPreference(cardName, selectedEdition) {
        const cardKey = cardName.toLowerCase().trim();
        this.preferences[cardKey] = selectedEdition.set;
        this.savePreferences();
        console.log(`🧠 AI Learning: Remembered ${selectedEdition.set_name} for ${cardName}`);
    }

    getPreference(cardName) {
        const cardKey = cardName.toLowerCase().trim();
        return this.preferences[cardKey];
    }

    sortByPreference(cardName, editions) {
        const preference = this.getPreference(cardName);
        if (preference) {
            return editions.sort((a, b) => {
                if (a.set === preference) return -1;
                if (b.set === preference) return 1;
                return 0;
            });
        }
        return editions;
    }
}

// 🎨 PROFESSIONAL UI COMPONENTS
const EnhancedCooldownDisplay = ({ cooldownStatus, isVisible }) => {
    if (!isVisible || !cooldownStatus) return null;

    return (
        <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.9)', color: 'white', padding: '12px',
            borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace',
            border: '1px solid #4a90e2', minWidth: '220px', zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
            <div style={{color: '#4a90e2', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center'}}>
                🚀 SMART SCANNING
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Mode:</span>
                <span style={{color: cooldownStatus.burstModeActive ? '#00ff00' : '#ffa500'}}>
                    {cooldownStatus.burstModeActive ? 'Burst' : 'Cooldown'}
                </span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Next Scan:</span>
                <span style={{color: '#64b5f6'}}>{Math.ceil(cooldownStatus.apiCooldown / 1000)}s</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Stability:</span>
                <span style={{color: '#64b5f6'}}>{cooldownStatus.detectionBufferSize}/{cooldownStatus.stabilityRequired}</span>
            </div>
            <div style={{
                marginTop: '6px', padding: '4px', 
                background: cooldownStatus.canScan ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)',
                borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'
            }}>
                {cooldownStatus.canScan ? '✅ Ready' : '⏳ Waiting'}
            </div>
        </div>
    );
};

const PremiumProgressIndicator = ({ collectionCount, maxFreeCards, isPremium }) => {
    if (isPremium) return null;
    
    const percentage = Math.min((collectionCount / maxFreeCards) * 100, 100);
    const isNearLimit = percentage > 80;
    
    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '12px',
            border: `1px solid ${isNearLimit ? '#f59e0b' : '#4a90e2'}`, marginBottom: '20px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Free Tier Progress</span>
                <span style={{ color: isNearLimit ? '#f59e0b' : '#4a90e2', fontWeight: 'bold' }}>
                    {collectionCount}/{maxFreeCards} cards
                </span>
            </div>
            <div style={{
                width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px', overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%', 
                    background: isNearLimit ? 
                        'linear-gradient(90deg, #f59e0b, #d97706)' : 
                        'linear-gradient(90deg, #4a90e2, #64b5f6)',
                    width: `${percentage}%`,
                    transition: 'width 0.3s ease'
                }}></div>
            </div>
            {isNearLimit && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#f59e0b' }}>
                    ⚠️ Approaching free tier limit. Upgrade to Premium for unlimited cards!
                </div>
            )}
        </div>
    );
};

const EditionSelector = ({ 
    cardName, 
    availableEditions, 
    onEditionSelected, 
    onCancel,
    aiRecommendation 
}) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.95)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            animation: 'modalFadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                border: '2px solid #4a90e2', borderRadius: '16px', padding: '32px',
                maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
            }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '16px', textAlign: 'center' }}>
                    🎭 Multiple Editions Found
                </h3>
                <p style={{ marginBottom: '20px', color: '#94a3b8', textAlign: 'center' }}>
                    Choose the correct edition for <strong style={{ color: '#4a90e2' }}>{cardName}</strong>:
                </p>
                
                {aiRecommendation && (
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e',
                        borderRadius: '8px', padding: '12px', marginBottom: '16px'
                    }}>
                        <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600' }}>
                            🧠 AI Recommendation: {aiRecommendation}
                        </div>
                    </div>
                )}
                
                <div style={{ 
                    maxHeight: '300px', overflowY: 'auto', marginBottom: '20px',
                    paddingRight: '8px'
                }}>
                    {availableEditions.map((edition, index) => (
                        <div key={index} onClick={() => onEditionSelected(edition)}
                            style={{
                                padding: '16px', margin: '8px 0',
                                background: edition.set === aiRecommendation ? 
                                    'rgba(34, 197, 94, 0.1)' : 'rgba(74, 144, 226, 0.1)',
                                border: `1px solid ${edition.set === aiRecommendation ? '#22c55e' : '#4a90e2'}`,
                                borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            {edition.set === aiRecommendation && (
                                <div style={{
                                    position: 'absolute', top: '-8px', right: '12px',
                                    background: '#22c55e', color: 'white',
                                    padding: '2px 8px', borderRadius: '12px',
                                    fontSize: '10px', fontWeight: 'bold'
                                }}>
                                    🧠 AI PICK
                                </div>
                            )}
                            <div style={{ fontWeight: '600', marginBottom: '6px', color: 'white' }}>
                                {edition.set_name || edition.name}
                            </div>
                            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                <strong>Set:</strong> {(edition.set || 'Unknown').toUpperCase()} • 
                                <strong> Released:</strong> {edition.released_at || 'Unknown'} •
                                <strong> Rarity:</strong> {edition.rarity || 'Unknown'}
                            </div>
                            {edition.prices?.usd && (
                                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                                    💰 ${edition.prices.usd}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={onCancel}
                        style={{
                            padding: '12px 24px', background: 'transparent',
                            border: '1px solid #666', color: '#94a3b8',
                            borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                        }}>
                        Skip Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

const PaywallModal = ({ onUpgrade, onCancel, collectionCount, maxFreeCards }) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.95)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                border: '2px solid #4a90e2', borderRadius: '16px', padding: '32px',
                maxWidth: '500px', width: '90%', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
            }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '16px' }}>💎 Upgrade to Premium</h3>
                
                <div style={{ 
                    background: 'rgba(220, 53, 69, 0.1)', border: '1px solid #dc3545',
                    borderRadius: '12px', padding: '20px', marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '24px', color: '#dc3545', marginBottom: '8px' }}>
                        🚫 Free Tier Limit Reached
                    </div>
                    <p style={{ color: '#e2e8f0', margin: 0 }}>
                        You've scanned <strong>{collectionCount}</strong> cards and reached the free limit of <strong>{maxFreeCards}</strong> cards.
                    </p>
                </div>
                
                <div style={{
                    background: 'rgba(74, 144, 226, 0.1)', border: '1px solid #4a90e2',
                    borderRadius: '12px', padding: '24px', marginBottom: '24px'
                }}>
                    <h4 style={{ color: '#4a90e2', marginBottom: '16px' }}>🚀 Premium Features</h4>
                    <ul style={{ textAlign: 'left', lineHeight: '1.8', margin: 0, paddingLeft: '20px', color: '#e2e8f0' }}>
                        <li>🔥 <strong>Unlimited card scanning and collection</strong></li>
                        <li>🎨 <strong>High-resolution card art display</strong></li>
                        <li>📊 <strong>Advanced collection analytics</strong></li>
                        <li>💰 <strong>Real-time price tracking</strong></li>
                        <li>🧠 <strong>Enhanced AI learning system</strong></li>
                        <li>⚡ <strong>Priority customer support</strong></li>
                    </ul>
                </div>
                
                <div style={{
                    background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e',
                    borderRadius: '8px', padding: '16px', marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>
                        $9.99/month
                    </div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                        Cancel anytime • 30-day money-back guarantee
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button onClick={onUpgrade}
                        style={{
                            padding: '16px 32px', background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                            border: 'none', color: 'white', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '16px', fontWeight: '700',
                            boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                        }}>
                        💎 Upgrade via PayPal
                    </button>
                    <button onClick={onCancel}
                        style={{
                            padding: '16px 32px', background: 'transparent',
                            border: '1px solid #666', color: '#94a3b8',
                            borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                        }}>
                        Maybe Later
                    </button>
                </div>
                
                <div style={{
                    marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #444',
                    fontSize: '12px', color: '#94a3b8'
                }}>
                    🔒 Secure payment via PayPal • No long-term commitment
                </div>
            </div>
        </div>
    );
};

const CardImageDisplay = ({ card, onRemove, onOpenScryfall }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    const imageUrl = card.scryfallImageUrl || card.imageUri;
    
    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden',
            transition: 'all 0.3s ease', cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            {/* Card Image */}
            <div style={{ position: 'relative', paddingBottom: '139.5%', background: '#000' }}>
                {imageUrl && !imageError ? (
                    <>
                        {!imageLoaded && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%',
                                transform: 'translate(-50%, -50%)', color: '#94a3b8'
                            }}>
                                <div style={{ animation: 'spin 1s linear infinite', fontSize: '24px' }}>⟳</div>
                            </div>
                        )}
                        <img 
                            src={imageUrl}
                            alt={card.cardName}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                width: '100%', height: '100%', objectFit: 'cover',
                                opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease'
                            }}
                        />
                    </>
                ) : (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)', textAlign: 'center',
                        color: '#94a3b8', padding: '20px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🃏</div>
                        <div style={{ fontSize: '14px' }}>No Image</div>
                    </div>
                )}
                
                {/* Overlay with card info */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    padding: '20px 16px 16px', color: 'white'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>
                        {card.cardName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {card.setInfo && <span>{card.setInfo}</span>}
                        {card.rarity && <span> • {card.rarity}</span>}
                    </div>
                    {card.prices?.usd && (
                        <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                            💰 ${card.prices.usd}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Action buttons */}
            <div style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                {card.scryfallUri && (
                    <button onClick={(e) => { e.stopPropagation(); onOpenScryfall(card); }}
                        style={{
                            flex: 1, padding: '8px', background: 'rgba(74, 144, 226, 0.2)',
                            border: '1px solid #4a90e2', color: '#4a90e2',
                            borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
                        }}>
                        🔗 Scryfall
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onRemove(card.id); }}
                    style={{
                        flex: 1, padding: '8px', background: 'rgba(220, 53, 69, 0.2)',
                        border: '1px solid #dc3545', color: '#dc3545',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
                    }}>
                    🗑️ Remove
                </button>
            </div>
        </div>
    );
};

// 🚀 MOCK VISION SERVICE (Replace with your actual Gemini service)
class MockVisionService {
    constructor() {
        this.lastApiCall = 0;
        this.rateLimitDelay = 2000;
    }

    async processVideoFrame(videoElement) {
        // Rate limiting
        const now = Date.now();
        if (now - this.lastApiCall < this.rateLimitDelay) {
            return { hasCard: false, message: 'Rate limited' };
        }
        this.lastApiCall = now;

        // Mock card detection - replace with your actual Gemini integration
        const mockCards = [
            { cardName: 'Lightning Bolt', confidence: 96, cardType: 'Instant', manaCost: '{R}' },
            { cardName: 'Black Lotus', confidence: 98, cardType: 'Artifact', manaCost: '{0}' },
            { cardName: 'Counterspell', confidence: 94, cardType: 'Instant', manaCost: '{U}{U}' },
            { cardName: 'Sol Ring', confidence: 97, cardType: 'Artifact', manaCost: '{1}' },
            { cardName: 'Birds of Paradise', confidence: 95, cardType: 'Creature', manaCost: '{G}' }
        ];

        // Simulate random detection
        if (Math.random() > 0.7) {
            const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];
            return {
                hasCard: true,
                ...randomCard,
                timestamp: new Date().toISOString(),
                method: 'mock_detection'
            };
        }

        return { hasCard: false, message: 'No card detected' };
    }
}

// 🎯 MAIN SCANNER COMPONENT
const UltimateMTGScanner = () => {
    // Core scanning state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [currentCard, setCurrentCard] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('initializing');
    const [scanMode, setScanMode] = useState('continuous');
    
    // Enhanced cooldown system
    const [cooldownStatus, setCooldownStatus] = useState({});
    
    // Collection and premium state
    const [savedCards, setSavedCards] = useState([]);
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const FREE_COLLECTION_LIMIT = 100;
    
    // Edition selection state
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    const [scanningPausedForSelection, setScanningPausedForSelection] = useState(false);
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanHistory, setScanHistory] = useState([]);
    
    // Refs and systems
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(new MockVisionService()); // Replace with your actual service
    const cooldownSystemRef = useRef(new EnhancedMTGCooldown());
    const editionLearningRef = useRef(new EditionLearningSystem());

    // Initialize
    useEffect(() => {
        console.log('🚀 Initializing Ultimate MTG Scanner...');
        loadSavedData();
        setupMockCamera(); // Replace with your actual camera setup
        
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500);
        
        return () => {
            clearInterval(cooldownUpdateInterval);
            cleanup();
        };
    }, []);

    const loadSavedData = () => {
        try {
            const saved = localStorage.getItem('mtg_saved_cards');
            if (saved) {
                setSavedCards(JSON.parse(saved));
            }
            
            const premiumStatus = localStorage.getItem('mtg_premium_status');
            if (premiumStatus === 'true') {
                setIsPremiumUser(true);
            }
        } catch (error) {
            console.error('Failed to load saved data:', error);
        }
    };

    const setupMockCamera = () => {
        // Mock camera setup - replace with your actual camera initialization
        setTimeout(() => {
            setCameraStatus('ready');
        }, 1000);
    };

    const startScanning = () => {
        if (cameraStatus !== 'ready') {
            console.log('Camera not ready');
            return;
        }
        
        console.log(`Starting ${scanMode} scanning with enhanced cooldown...`);
        setIsScanning(true);
        setScanningPausedForSelection(false);
        cooldownSystemRef.current.resetCooldowns();
        
        // 🚀 Enhanced scanning with dynamic intervals
        const scanLoop = async () => {
            try {
                const currentCardName = currentCard?.cardName;
                
                if (!cooldownSystemRef.current.shouldScan(currentCardName)) {
                    setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                    
                    // Schedule next check based on cooldown status
                    const status = cooldownSystemRef.current.getCooldownStatus();
                    const nextCheck = Math.min(status.apiCooldown || 1000, 1000);
                    setTimeout(scanLoop, nextCheck);
                    return;
                }

                if (scanningPausedForSelection || showEditionSelector) {
                    cooldownSystemRef.current.setEditionSelectorOpen(true);
                    setTimeout(scanLoop, 1000);
                    return;
                } else {
                    cooldownSystemRef.current.setEditionSelectorOpen(false);
                }

                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 85) {
                    console.log(`Card detected: ${result.cardName} (${result.confidence}%)`);
                    
                    const isStable = cooldownSystemRef.current.addDetection(result.cardName, result.confidence);
                    
                    if (isStable) {
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
                
                // Continue scanning if still active
                if (isScanning) {
                    const status = cooldownSystemRef.current.getCooldownStatus();
                    const nextInterval = status.burstModeActive ? 1500 : 3000;
                    setTimeout(scanLoop, nextInterval);
                }
                
            } catch (error) {
                console.error('Scanning error:', error);
                setScanResult({ hasCard: false, message: 'Scanner error - please try again' });
                
                if (isScanning) {
                    setTimeout(scanLoop, 2000);
                }
            }
        };
        
        // Start the scanning loop
        scanLoop();
    };

    const stopScanning = () => {
        console.log('Stopping scanner...');
        setIsScanning(false);
        setScanningPausedForSelection(false);
    };

    const handleCardDetection = async (detectedCard) => {
        try {
            // Check for multiple editions via Scryfall
            const cardName = detectedCard.cardName.trim();
            const searchQuery = `!"${cardName}"`;
            const encodedQuery = encodeURIComponent(searchQuery);
            
            const editionsResponse = await fetch(
                `https://api.scryfall.com/cards/search?q=${encodedQuery}&unique=prints&order=released&dir=desc`
            );
            
            if (editionsResponse.ok) {
                const editionsData = await editionsResponse.json();
                const editions = editionsData.data || [];
                
                const exactMatches = editions.filter(card => {
                    const cardNameNormalized = card.name.toLowerCase().trim();
                    const searchNameNormalized = cardName.toLowerCase().trim();
                    return cardNameNormalized === searchNameNormalized;
                });
                
                if (exactMatches.length > 1) {
                    // Show edition selector
                    setScanningPausedForSelection(true);
                    cooldownSystemRef.current.setEditionSelectorOpen(true);
                    
                    const sortedEditions = editionLearningRef.current.sortByPreference(cardName, exactMatches);
                    
                    setPendingCardData(detectedCard);
                    setAvailableEditions(sortedEditions);
                    setShowEditionSelector(true);
                    
                    setScanResult(null);
                    setCurrentCard(null);
                    return;
                    
                } else if (exactMatches.length === 1) {
                    const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                    displayCard(enhancedCard);
                    await saveCardToCollection(enhancedCard);
                } else {
                    displayCard(detectedCard);
                    await saveCardToCollection(detectedCard);
                }
            } else {
                displayCard(detectedCard);
                await saveCardToCollection(detectedCard);
            }
        } catch (error) {
            console.error('Edition lookup error:', error);
            displayCard(detectedCard);
            await saveCardToCollection(detectedCard);
        }
    };

    const handleEditionSelected = async (selectedEdition) => {
        if (pendingCardData && selectedEdition) {
            const enhancedCard = enhanceCardWithScryfall(pendingCardData, selectedEdition);
            displayCard(enhancedCard);
            
            // Learn user preference
            editionLearningRef.current.learnPreference(pendingCardData.cardName, selectedEdition);
            
            await saveCardToCollection(enhancedCard);
        }
        
        // Close edition selector and resume scanning
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setScanningPausedForSelection(false);
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
        setScanningPausedForSelection(false);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
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
            isVerified: true,
            setCode: scryfallCard.set,
            colors: scryfallCard.colors
        };
    };

    const displayCard = (card) => {
        setCurrentCard(card);
        setScanResult(card);
        
        setScanHistory(prev => {
            const newHistory = [card, ...prev.slice(0, 19)];
            return newHistory;
        });
    };

    const saveCardToCollection = async (card) => {
        // Check premium limits
        if (!isPremiumUser && savedCards.length >= FREE_COLLECTION_LIMIT) {
            setShowPaywallModal(true);
            return false;
        }
        
        try {
            const cardWithId = {
                ...card,
                id: Date.now() + Math.random(),
                addedAt: new Date().toISOString()
            };
            
            const updatedCards = [cardWithId, ...savedCards];
            setSavedCards(updatedCards);
            localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
            
            console.log('Card saved to collection:', card.cardName);
            return true;
        } catch (error) {
            console.error('Failed to save card:', error);
            return false;
        }
    };

    const removeCardFromCollection = (cardId) => {
        const updatedCards = savedCards.filter(card => card.id !== cardId);
        setSavedCards(updatedCards);
        localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
    };

    const openCardInScryfall = (card) => {
        if (card.scryfallUri) {
            window.open(card.scryfallUri, '_blank');
        } else {
            const searchUrl = `https://scryfall.com/search?q=${encodeURIComponent(card.cardName)}`;
            window.open(searchUrl, '_blank');
        }
    };

    const handleUpgradeToPremium = () => {
        // PayPal integration
        const paypalLink = `https://www.paypal.com/paypalme/thediceyguy/9.99`;
        window.open(paypalLink, '_blank');
        
        // Simulate upgrade (replace with actual payment verification)
        setTimeout(() => {
            setIsPremiumUser(true);
            localStorage.setItem('mtg_premium_status', 'true');
            setShowPaywallModal(false);
            alert('🎉 Premium upgrade successful! You now have unlimited card storage.');
        }, 5000);
    };

    const cleanup = () => {
        stopScanning();
        // Add actual camera cleanup here
    };

    return (
        <div style={{
            maxWidth: '1400px', margin: '0 auto', padding: '20px', minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* CSS for animations */}
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            
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
                    }}>MTG<br/>SCAN</div>
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text', marginBottom: '5px'
                        }}>MTG Scanner Pro</h1>
                        <span style={{ fontSize: '0.9rem', color: '#b0bec5' }}>
                            🚀 Smart Scanning • 🎭 Edition Selection • 💎 Premium Features
                        </span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)', padding: '8px 12px',
                        borderRadius: '20px', border: '1px solid rgba(74, 144, 226, 0.3)',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Collection: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{savedCards.length}</span>
                        {!isPremiumUser && <span style={{ color: '#f59e0b' }}>/{FREE_COLLECTION_LIMIT}</span>}
                    </div>
                    <div style={{
                        background: isPremiumUser ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        padding: '8px 12px', borderRadius: '20px',
                        border: `1px solid ${isPremiumUser ? '#22c55e' : '#f59e0b'}`,
                        fontSize: '0.85rem', color: isPremiumUser ? '#22c55e' : '#f59e0b',
                        fontWeight: 'bold'
                    }}>
                        {isPremiumUser ? '💎 Premium' : '🆓 Free'}
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
                    { id: 'scanner', label: '🔍 Scanner', badge: null },
                    { id: 'collection', label: '🖼️ Collection', badge: savedCards.length }
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
                                background: 'rgba(74, 144, 226, 0.2)', color: '#4a90e2',
                                padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700'
                            }}>{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Premium Progress Indicator */}
            <PremiumProgressIndicator 
                collectionCount={savedCards.length}
                maxFreeCards={FREE_COLLECTION_LIMIT}
                isPremium={isPremiumUser}
            />

            {/* Main Content */}
            {activeTab === 'scanner' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Scanner Interface */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                        padding: '24px'
                    }}>
                        {/* Video Container */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <div style={{
                                width: '100%', maxWidth: '640px', height: '480px',
                                borderRadius: '12px', border: '2px solid #4a90e2', background: '#000',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#94a3b8', fontSize: '16px'
                            }}>
                                📷 Camera View (Mock - Replace with actual video element)
                            </div>
                            
                            {/* Enhanced Cooldown Display */}
                            <EnhancedCooldownDisplay
                                cooldownStatus={cooldownStatus}
                                isVisible={isScanning}
                            />
                            
                            {/* Scanning Status */}
                            {isScanning && (
                                <div style={{
                                    position: 'absolute', top: '10px', left: '10px',
                                    background: 'rgba(74, 144, 226, 0.9)', color: 'white',
                                    padding: '8px 12px', borderRadius: '6px',
                                    fontSize: '14px', fontWeight: '600'
                                }}>
                                    {scanningPausedForSelection ? 
                                        '⏸️ Paused for edition selection' :
                                        '🚀 Smart scanning active'
                                    }
                                </div>
                            )}
                        </div>

                        {/* Scan Controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ color: '#b0bec5', marginBottom: '8px', display: 'block' }}>
                                    ⚙️ Scan Mode:
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setScanMode('continuous')} disabled={isScanning}
                                        style={{
                                            flex: 1, padding: '12px',
                                            border: scanMode === 'continuous' ? '2px solid #4a90e2' : '1px solid #666',
                                            background: scanMode === 'continuous' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                                            color: 'white', borderRadius: '8px',
                                            cursor: isScanning ? 'not-allowed' : 'pointer', fontSize: '13px'
                                        }}>
                                        🚀 Smart Continuous
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
                                {isScanning ? '⏹️ Stop Smart Scanning' : `🚀 Start ${scanMode} Scan`}
                            </button>
                        </div>
                    </div>

                    {/* Current Card Display */}
                    {currentCard && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                            padding: '24px'
                        }}>
                            <h3 style={{ color: '#4a90e2', marginBottom: '20px' }}>🎯 Card Detected</h3>
                            
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '12px', padding: '20px'
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e', marginBottom: '12px' }}>
                                    {currentCard.cardName}
                                </div>
                                
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                                    <div><strong>Type:</strong> {currentCard.cardType || 'Unknown'}</div>
                                    <div><strong>Confidence:</strong> {currentCard.confidence}%</div>
                                    {currentCard.setInfo && <div><strong>Set:</strong> {currentCard.setInfo}</div>}
                                    {currentCard.isVerified && <div><strong>Verified:</strong> ✅ Scryfall Database</div>}
                                </div>
                                
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

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => saveCardToCollection(currentCard)}
                                        style={{
                                            padding: '8px 16px', background: 'rgba(74, 144, 226, 0.2)',
                                            border: '1px solid #4a90e2', color: '#4a90e2',
                                            borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
                                        }}>
                                        💾 Save to Collection
                                    </button>
                                    {currentCard.scryfallUri && (
                                        <button onClick={() => openCardInScryfall(currentCard)}
                                            style={{
                                                padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)',
                                                border: '1px solid #22c55e', color: '#22c55e',
                                                borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
                                            }}>
                                            🔗 View on Scryfall
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Collection Tab with Card Images */}
            {activeTab === 'collection' && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                    padding: '32px'
                }}>
                    <h2 style={{ color: '#4a90e2', marginBottom: '24px' }}>🖼️ Card Collection</h2>
                    
                    {savedCards.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '60px 20px',
                            background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
                            <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Cards in Collection</h3>
                            <p style={{ color: '#94a3b8' }}>Start scanning cards to build your collection</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '20px'
                        }}>
                            {savedCards.map((card, index) => (
                                <CardImageDisplay
                                    key={card.id || index}
                                    card={card}
                                    onRemove={removeCardFromCollection}
                                    onOpenScryfall={openCardInScryfall}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edition Selector Modal */}
            {showEditionSelector && (
                <EditionSelector
                    cardName={pendingCardData?.cardName}
                    availableEditions={availableEditions}
                    onEditionSelected={handleEditionSelected}
                    onCancel={handleEditionCancelled}
                    aiRecommendation={editionLearningRef.current.getPreference(pendingCardData?.cardName)}
                />
            )}

            {/* PayPal Paywall Modal */}
            {showPaywallModal && (
                <PaywallModal
                    onUpgrade={handleUpgradeToPremium}
                    onCancel={() => setShowPaywallModal(false)}
                    collectionCount={savedCards.length}
                    maxFreeCards={FREE_COLLECTION_LIMIT}
                />
            )}
        </div>
    );
};

export default UltimateMTGScanner;