import React, { useState, useRef, useEffect } from 'react';

// 🔥 ULTIMATE MTG SCANNER PRO - PRODUCTION READY
// Combines all advanced features: smart cooldowns, edition selection, card art, PayPal monetization

// 🧠 ENHANCED SMART COOLDOWN SYSTEM - BURST THEN PAUSE PATTERN
class UltimateSmartCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.detectionBuffer = [];
        this.isEditionSelectorOpen = false;
        
        // 🔥 BURST SCAN PATTERN: Fast initial → Long cooldown after success
        this.BURST_SCAN_INTERVAL = 1500;      // 1.5s for initial fast scanning
        this.SAME_CARD_COOLDOWN = 12000;      // 12s after successful detection
        this.DETECTION_STABILITY = 2;         // Need 2 consistent detections
        this.MAX_CONSECUTIVE = 3;             // Max before long pause
        this.LONG_PAUSE_DURATION = 20000;    // 20s pause after max consecutive
        
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
        this.currentMode = 'burst'; // 'burst' or 'cooldown'
    }

    shouldScan(cardName = null) {
        const now = Date.now();
        
        // Don't scan if edition selector is open
        if (this.isEditionSelectorOpen) {
            return false;
        }
        
        // Check long pause
        if (this.isLongPauseActive) {
            const pauseRemaining = this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime);
            if (pauseRemaining > 0) {
                return false;
            } else {
                this.isLongPauseActive = false;
                this.consecutiveDetections = 0;
                this.currentMode = 'burst';
            }
        }
        
        // Smart interval based on mode
        const interval = this.currentMode === 'burst' ? this.BURST_SCAN_INTERVAL : this.SAME_CARD_COOLDOWN;
        if (now - this.lastApiCall < interval) {
            return false;
        }
        
        // Same card extended cooldown
        if (cardName && cardName === this.lastDetectedCard && this.currentMode === 'cooldown') {
            const timeSinceLastDetection = now - this.lastDetectionTime;
            if (timeSinceLastDetection < this.SAME_CARD_COOLDOWN) {
                return false;
            }
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
        this.currentMode = 'cooldown'; // Switch to cooldown mode after successful detection
        
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
            sameCardCooldown: this.lastDetectedCard ? Math.max(0, this.SAME_CARD_COOLDOWN - (now - this.lastDetectionTime)) : 0,
            consecutiveDetections: this.consecutiveDetections,
            longPauseRemaining,
            isEditionSelectorOpen: this.isEditionSelectorOpen,
            canScan: this.shouldScan(this.lastDetectedCard),
            detectionBufferSize: this.detectionBuffer.length,
            stabilityRequired: this.DETECTION_STABILITY
        };
    }
}

// 🧠 AI LEARNING SYSTEM FOR EDITION PREFERENCES
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
        this.preferences[cardKey] = {
            setCode: selectedEdition.set,
            setName: selectedEdition.set_name,
            learnedAt: new Date().toISOString(),
            useCount: (this.preferences[cardKey]?.useCount || 0) + 1
        };
        this.savePreferences();
    }

    getRecommendation(cardName) {
        const cardKey = cardName.toLowerCase().trim();
        return this.preferences[cardKey];
    }

    sortEditionsByPreference(cardName, editions) {
        const recommendation = this.getRecommendation(cardName);
        if (!recommendation) return editions;

        return editions.sort((a, b) => {
            if (a.set === recommendation.setCode) return -1;
            if (b.set === recommendation.setCode) return 1;
            return 0;
        });
    }
}

// 🎭 EDITION SELECTION MODAL COMPONENT
const EditionSelector = ({ 
    isOpen, 
    cardName, 
    editions, 
    onSelect, 
    onCancel, 
    aiRecommendation 
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                border: '2px solid #4a90e2', borderRadius: '16px', padding: '32px',
                maxWidth: '600px', width: '90%', maxHeight: '80vh',
                color: 'white', animation: 'slideIn 0.3s ease-out'
            }}>
                <h3 style={{ 
                    color: '#4a90e2', marginBottom: '20px', textAlign: 'center',
                    fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}>
                    🎭 Multiple Editions Found
                </h3>
                
                <p style={{ 
                    marginBottom: '24px', color: '#94a3b8', textAlign: 'center', fontSize: '16px'
                }}>
                    Choose the correct edition for <strong style={{ color: '#4a90e2' }}>{cardName}</strong>
                </p>
                
                <div style={{ 
                    maxHeight: '400px', overflowY: 'auto', marginBottom: '24px',
                    padding: '8px'
                }}>
                    {editions.map((edition, index) => {
                        const isRecommended = aiRecommendation && edition.set === aiRecommendation.setCode;
                        
                        return (
                            <div key={index} onClick={() => onSelect(edition)}
                                style={{
                                    padding: '16px', margin: '12px 0',
                                    background: isRecommended ? 
                                        'linear-gradient(135deg, rgba(74, 144, 226, 0.2), rgba(74, 144, 226, 0.1))' :
                                        'rgba(255, 255, 255, 0.05)',
                                    border: isRecommended ? 
                                        '2px solid #4a90e2' : 
                                        '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isRecommended) {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isRecommended) {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}>
                                
                                {isRecommended && (
                                    <div style={{
                                        position: 'absolute', top: '8px', right: '12px',
                                        background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                                        color: 'white', padding: '4px 8px', borderRadius: '12px',
                                        fontSize: '10px', fontWeight: 'bold'
                                    }}>
                                        🧠 AI PICK
                                    </div>
                                )}
                                
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
                        );
                    })}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={onCancel}
                        style={{
                            padding: '12px 24px', background: 'transparent',
                            border: '2px solid #666', color: '#94a3b8',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                            fontWeight: '600', transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = '#4a90e2';
                            e.target.style.color = '#4a90e2';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = '#666';
                            e.target.style.color = '#94a3b8';
                        }}>
                        Skip Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

// 💰 PREMIUM PAYWALL MODAL
const PremiumPaywallModal = ({ isOpen, onClose, onUpgrade, cardsScanned, limit }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                border: '2px solid #4a90e2', borderRadius: '16px', padding: '32px',
                maxWidth: '500px', width: '90%', color: 'white',
                animation: 'slideIn 0.3s ease-out', textAlign: 'center'
            }}>
                <h3 style={{ 
                    color: '#4a90e2', marginBottom: '20px', fontSize: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}>
                    💎 Upgrade to Premium
                </h3>
                
                <div style={{
                    background: 'rgba(220, 53, 69, 0.1)', border: '1px solid #dc3545',
                    borderRadius: '12px', padding: '20px', marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545', marginBottom: '8px' }}>
                        🚫 Free Limit Reached
                    </div>
                    <div style={{ color: '#94a3b8' }}>
                        You've scanned <strong>{cardsScanned}</strong> cards (limit: {limit})
                    </div>
                </div>
                
                <div style={{
                    background: 'rgba(74, 144, 226, 0.1)', padding: '24px',
                    borderRadius: '12px', margin: '24px 0', textAlign: 'left'
                }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#4a90e2', textAlign: 'center' }}>
                        🔥 Premium Features:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li><strong>Unlimited scanning</strong> and collection storage</li>
                        <li><strong>Advanced AI learning</strong> for edition preferences</li>
                        <li><strong>Collection analytics</strong> and insights</li>
                        <li><strong>Price tracking</strong> and market alerts</li>
                        <li><strong>Priority support</strong> and early access features</li>
                        <li><strong>Export to all platforms</strong> (Moxfield, EDHREC, etc.)</li>
                    </ul>
                </div>
                
                <div style={{
                    background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                    padding: '20px', borderRadius: '12px', marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Only $9.99/month
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                        Cancel anytime • 7-day money-back guarantee
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={onUpgrade}
                        style={{
                            padding: '16px 32px', background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                            border: 'none', color: 'white', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                        }}>
                        💎 Upgrade to Premium
                    </button>
                    <button onClick={onClose}
                        style={{
                            padding: '16px 24px', background: 'transparent',
                            border: '2px solid #666', color: '#94a3b8',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                        }}>
                        Maybe Later
                    </button>
                </div>
                
                <div style={{ 
                    fontSize: '12px', color: '#666', marginTop: '20px',
                    borderTop: '1px solid #333', paddingTop: '16px'
                }}>
                    💳 Secure payment via PayPal • No long-term commitment
                </div>
            </div>
        </div>
    );
};

// 🖼️ CARD IMAGE COMPONENT WITH LOADING STATES
const CardImage = ({ card, size = 'medium' }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    const sizes = {
        small: { width: '60px', height: '84px' },
        medium: { width: '120px', height: '168px' },
        large: { width: '180px', height: '252px' }
    };
    
    const currentSize = sizes[size];
    
    const imageUrl = card.scryfallImageUrl || card.imageUri || 
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.cardName)}&format=image&version=normal`;
    
    if (error) {
        return (
            <div style={{
                ...currentSize, background: 'linear-gradient(135deg, #333, #444)',
                borderRadius: '8px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                border: '1px solid #666', color: '#999', fontSize: '10px', textAlign: 'center'
            }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🃏</div>
                <div>No Image</div>
            </div>
        );
    }
    
    return (
        <div style={{ position: 'relative', ...currentSize }}>
            {loading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, ...currentSize,
                    background: 'linear-gradient(135deg, #4a90e2, #64b5f6)',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '12px'
                }}>
                    <div style={{ 
                        animation: 'spin 1s linear infinite',
                        fontSize: '20px'
                    }}>⟳</div>
                </div>
            )}
            <img 
                src={imageUrl}
                alt={card.cardName}
                style={{
                    ...currentSize, borderRadius: '8px', objectFit: 'cover',
                    border: '1px solid #4a90e2', opacity: loading ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                }}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
            />
        </div>
    );
};

// 📊 PREMIUM PROGRESS INDICATOR
const PremiumProgressIndicator = ({ current, limit, isPremium }) => {
    if (isPremium) {
        return (
            <div style={{
                background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                padding: '12px 20px', borderRadius: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '12px'
            }}>
                <div style={{ fontSize: '20px' }}>💎</div>
                <div>
                    <div style={{ fontWeight: 'bold', color: 'white' }}>Premium Active</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                        Unlimited scanning • {current} cards in collection
                    </div>
                </div>
            </div>
        );
    }
    
    const percentage = (current / limit) * 100;
    const isNearLimit = percentage >= 80;
    const isAtLimit = current >= limit;
    
    return (
        <div style={{
            background: isAtLimit ? 'rgba(220, 53, 69, 0.1)' : 
                      isNearLimit ? 'rgba(251, 191, 36, 0.1)' : 'rgba(74, 144, 226, 0.1)',
            border: `1px solid ${isAtLimit ? '#dc3545' : 
                              isNearLimit ? '#fbbf24' : '#4a90e2'}`,
            borderRadius: '12px', padding: '16px', marginBottom: '20px'
        }}>
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '12px'
            }}>
                <div>
                    <span style={{ 
                        color: isAtLimit ? '#dc3545' : isNearLimit ? '#fbbf24' : '#4a90e2',
                        fontWeight: 'bold'
                    }}>
                        {isAtLimit ? '🚫' : isNearLimit ? '⚠️' : '📊'} Free Tier Progress
                    </span>
                </div>
                <div style={{ 
                    color: isAtLimit ? '#dc3545' : isNearLimit ? '#fbbf24' : '#4a90e2',
                    fontWeight: 'bold'
                }}>
                    {current} / {limit}
                </div>
            </div>
            
            <div style={{
                width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px', overflow: 'hidden'
            }}>
                <div style={{
                    width: `${Math.min(percentage, 100)}%`, height: '100%',
                    background: isAtLimit ? 'linear-gradient(90deg, #dc3545, #b91c1c)' :
                               isNearLimit ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' :
                               'linear-gradient(90deg, #4a90e2, #64b5f6)',
                    borderRadius: '4px', transition: 'width 0.3s ease'
                }}></div>
            </div>
            
            {isNearLimit && (
                <div style={{ 
                    fontSize: '12px', color: '#94a3b8', marginTop: '8px',
                    textAlign: 'center'
                }}>
                    {isAtLimit ? 
                        'Upgrade to Premium for unlimited scanning!' :
                        `${limit - current} scans remaining before limit`
                    }
                </div>
            )}
        </div>
    );
};

// 🔥 ENHANCED COOLDOWN STATUS DISPLAY
const EnhancedCooldownStatus = ({ cooldownStatus, isVisible }) => {
    if (!isVisible || !cooldownStatus) return null;

    return (
        <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.9)', color: 'white', padding: '12px',
            borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace',
            border: '1px solid #4a90e2', minWidth: '200px', zIndex: 1000
        }}>
            <div style={{color: '#4a90e2', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center'}}>
                🔥 SMART SCANNER STATUS
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
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                <span>Consecutive:</span>
                <span style={{color: '#64b5f6'}}>{cooldownStatus.consecutiveDetections}/3</span>
            </div>
            
            {cooldownStatus.longPauseRemaining > 0 && (
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span>Long Pause:</span>
                    <span style={{color: '#ffc107'}}>{Math.ceil(cooldownStatus.longPauseRemaining / 1000)}s</span>
                </div>
            )}
            
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

// 🎯 TOAST NOTIFICATION SYSTEM
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
        animation: slideToastIn 0.3s ease-out;
        max-width: 300px; font-size: 14px;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideToastIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideToastOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideToastOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
};

// 🔥 MAIN ULTIMATE SCANNER COMPONENT
const UltimateMTGScanner = () => {
    // Core scanning state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('initializing');
    const [currentCard, setCurrentCard] = useState(null);
    const [scanMode, setScanMode] = useState('continuous');
    
    // Collection and premium state
    const [savedCards, setSavedCards] = useState([]);
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const FREE_COLLECTION_LIMIT = 100;
    
    // Edition selection state
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    const [aiRecommendation, setAiRecommendation] = useState(null);
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [cooldownStatus, setCooldownStatus] = useState({});
    const [scanHistory, setScanHistory] = useState([]);
    
    // Refs and systems
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const cooldownSystemRef = useRef(new UltimateSmartCooldown());
    const editionLearningRef = useRef(new EditionLearningSystem());
    
    // Mock vision service (replace with your actual Gemini service)
    const mockVisionService = useRef({
        processVideoFrame: async (videoElement) => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
            
            // Random card detection for demo
            if (Math.random() > 0.7) {
                const mockCards = [
                    'Lightning Bolt', 'Counterspell', 'Sol Ring', 'Birds of Paradise',
                    'Path to Exile', 'Swords to Plowshares', 'Dark Ritual', 'Giant Growth'
                ];
                const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];
                
                return {
                    hasCard: true,
                    cardName: randomCard,
                    confidence: 85 + Math.random() * 13,
                    cardType: 'Instant',
                    manaCost: '{R}',
                    method: 'gemini_vision',
                    timestamp: new Date().toISOString()
                };
            }
            
            return {
                hasCard: false,
                message: 'No MTG card detected',
                confidence: 0
            };
        }
    });

    // Initialize component
    useEffect(() => {
        console.log('🚀 Initializing Ultimate MTG Scanner...');
        loadSavedData();
        setupMockCamera();
        
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500);
        
        return () => {
            console.log('🧹 Cleaning up...');
            clearInterval(cooldownUpdateInterval);
            cleanup();
        };
    }, []);

    const loadSavedData = () => {
        try {
            const saved = localStorage.getItem('mtg_saved_cards_ultimate');
            if (saved) {
                setSavedCards(JSON.parse(saved));
            }
            
            const premium = localStorage.getItem('mtg_premium_status');
            if (premium === 'true') {
                setIsPremiumUser(true);
            }
            
            const history = localStorage.getItem('mtg_scan_history');
            if (history) {
                setScanHistory(JSON.parse(history));
            }
        } catch (error) {
            console.error('❌ Failed to load saved data:', error);
        }
    };

    const setupMockCamera = async () => {
        setCameraStatus('requesting');
        
        // Simulate camera setup delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setCameraStatus('ready');
        showToast('📷 Camera ready for MTG scanning!', 'success');
    };

    const startScanning = () => {
        if (cameraStatus !== 'ready') {
            showToast('❌ Camera not ready', 'error');
            return;
        }
        
        console.log(`▶️ Starting Ultimate Scanner - ${scanMode} mode...`);
        setIsScanning(true);
        cooldownSystemRef.current.resetCooldowns();
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        
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

                const result = await mockVisionService.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 85) {
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
                
            } catch (error) {
                console.error('❌ Scanning error:', error);
                setScanResult({ hasCard: false, message: 'Scanner error - please try again' });
            }
        }, 1000);
    };

    const handleCardDetection = async (detectedCard) => {
        try {
            // Add to scan history
            addToScanHistory(detectedCard);
            
            // Check if at free limit
            if (!isPremiumUser && savedCards.length >= FREE_COLLECTION_LIMIT) {
                setShowPaywallModal(true);
                displayCard(detectedCard);
                return;
            }
            
            // Mock Scryfall edition lookup
            const mockEditions = [
                {
                    set: 'lea', set_name: 'Limited Edition Alpha', released_at: '1993-08-05',
                    prices: { usd: '150.00' }
                },
                {
                    set: 'leb', set_name: 'Limited Edition Beta', released_at: '1993-10-01',
                    prices: { usd: '75.00' }
                },
                {
                    set: 'dom', set_name: 'Dominaria', released_at: '2018-04-27',
                    prices: { usd: '2.50' }
                }
            ];
            
            if (mockEditions.length > 1) {
                // Sort by AI preference
                const sortedEditions = editionLearningRef.current.sortEditionsByPreference(
                    detectedCard.cardName, 
                    mockEditions
                );
                
                const recommendation = editionLearningRef.current.getRecommendation(detectedCard.cardName);
                
                setPendingCardData(detectedCard);
                setAvailableEditions(sortedEditions);
                setAiRecommendation(recommendation);
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
            
            // Learn preference
            editionLearningRef.current.learnPreference(pendingCardData.cardName, selectedEdition);
            
            await saveCardToCollection(enhancedCard);
            
            showToast(`✅ ${enhancedCard.cardName} saved with ${selectedEdition.set_name}!`, 'success');
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setAiRecommendation(null);
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
        setAiRecommendation(null);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
    };

    const enhanceCardWithScryfall = (originalCard, scryfallCard) => {
        return {
            ...originalCard,
            cardType: scryfallCard.type_line || originalCard.cardType,
            setInfo: scryfallCard.set_name,
            setCode: scryfallCard.set,
            prices: scryfallCard.prices,
            scryfallImageUrl: `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(originalCard.cardName)}&format=image&version=normal`,
            scryfallUri: `https://scryfall.com/search?q=${encodeURIComponent(originalCard.cardName)}`,
            isVerified: true
        };
    };

    const displayCard = (card) => {
        setCurrentCard(card);
        setScanResult(card);
        
        // Enhanced feedback
        const accuracyText = card.confidence >= 95 ? 'Excellent' :
                            card.confidence >= 90 ? 'Great' :
                            card.confidence >= 85 ? 'Good' : 'Fair';
        
        showToast(`🎯 ${accuracyText} detection: ${card.cardName} (${card.confidence}%)`, 'success');
    };

    const addToScanHistory = (card) => {
        const historyEntry = {
            ...card,
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString()
        };
        
        setScanHistory(prev => {
            const newHistory = [historyEntry, ...prev.slice(0, 49)];
            localStorage.setItem('mtg_scan_history', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const saveCardToCollection = async (card) => {
        try {
            if (!isPremiumUser && savedCards.length >= FREE_COLLECTION_LIMIT) {
                setShowPaywallModal(true);
                return false;
            }
            
            const cardWithId = {
                ...card,
                id: Date.now() + Math.random(),
                addedAt: new Date().toISOString()
            };
            
            setSavedCards(prev => {
                const newCollection = [cardWithId, ...prev];
                localStorage.setItem('mtg_saved_cards_ultimate', JSON.stringify(newCollection));
                return newCollection;
            });
            
            return true;
        } catch (error) {
            console.error('❌ Failed to save card:', error);
            return false;
        }
    };

    const handlePremiumUpgrade = () => {
        // Open PayPal link
        const paypalLink = `https://www.paypal.com/paypalme/yourusername/9.99`;
        window.open(paypalLink, '_blank');
        
        // Simulate successful upgrade after delay
        setTimeout(() => {
            setIsPremiumUser(true);
            localStorage.setItem('mtg_premium_status', 'true');
            setShowPaywallModal(false);
            showToast('💎 Premium upgrade successful! Unlimited scanning unlocked!', 'success');
        }, 3000);
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
    };

    const removeCardFromCollection = (cardId) => {
        setSavedCards(prev => {
            const newCollection = prev.filter(card => card.id !== cardId);
            localStorage.setItem('mtg_saved_cards_ultimate', JSON.stringify(newCollection));
            return newCollection;
        });
        showToast('🗑️ Card removed from collection', 'info');
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
        showToast('📤 Collection exported to Moxfield format!', 'success');
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
                        }}>Ultimate MTG Scanner</h1>
                        <span style={{ fontSize: '0.9rem', color: '#b0bec5' }}>
                            🔥 Smart Cooldowns • 🎭 Edition Selection • 🖼️ Card Art • 💰 Premium Ready
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
                    <div style={{
                        background: isPremiumUser ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        padding: '8px 12px', borderRadius: '20px',
                        border: `1px solid ${isPremiumUser ? '#22c55e' : '#fbbf24'}`,
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: isPremiumUser ? '#22c55e' : '#fbbf24', fontWeight: 'bold' }}>
                            {isPremiumUser ? '💎 Premium' : '🆓 Free'}
                        </span>
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
                    { id: 'collection', label: '🖼️ Collection', badge: savedCards.length },
                    { id: 'history', label: '📊 History', badge: scanHistory.length }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1, padding: '12px 16px', border: 'none',
                            background: activeTab === tab.id ? 'linear-gradient(45deg, #4a90e2, #64b5f6)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#94a3b8',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'all 0.2s ease'
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

            {/* Premium Progress Indicator */}
            <PremiumProgressIndicator 
                current={savedCards.length}
                limit={FREE_COLLECTION_LIMIT}
                isPremium={isPremiumUser}
            />

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
                                {/* Mock Camera Display */}
                                <div ref={videoRef}
                                    style={{
                                        width: '100%', maxWidth: '640px', height: '360px',
                                        borderRadius: '12px', border: '2px solid #4a90e2',
                                        background: 'linear-gradient(135deg, #000, #333)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#666', fontSize: '18px', position: 'relative'
                                    }}>
                                    {cameraStatus === 'ready' ? '📷 Camera Feed Ready (Demo Mode)' : '📷 Initializing Camera...'}
                                </div>
                                
                                {/* Enhanced Cooldown Status */}
                                <EnhancedCooldownStatus
                                    cooldownStatus={cooldownStatus}
                                    isVisible={isScanning}
                                />
                                
                                {/* Scanning Overlay */}
                                {isScanning && (
                                    <div style={{
                                        position: 'absolute', top: '10px', left: '10px',
                                        background: 'rgba(74, 144, 226, 0.8)', color: 'white',
                                        padding: '8px 12px', borderRadius: '6px',
                                        fontSize: '14px', fontWeight: '600'
                                    }}>
                                        🔍 Smart scanning active...
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
                                        opacity: cameraStatus !== 'ready' ? 0.6 : 1,
                                        transition: 'all 0.2s ease'
                                    }}>
                                    {isScanning ? '⏹️ Stop Smart Scanner' : `🔥 Start ${scanMode} Scan`}
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
                                        borderRadius: '12px', padding: '20px',
                                        display: 'flex', gap: '20px', alignItems: 'flex-start'
                                    }}>
                                        {/* Card Image */}
                                        <CardImage card={currentCard} size="large" />
                                        
                                        {/* Card Details */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ 
                                                fontSize: '24px', fontWeight: 'bold', color: '#22c55e',
                                                marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'
                                            }}>
                                                {currentCard.cardName}
                                                {currentCard.isVerified && <span style={{fontSize: '16px'}}>✅</span>}
                                            </div>
                                            
                                            <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.8', marginBottom: '16px' }}>
                                                {currentCard.cardType && <div><strong>Type:</strong> {currentCard.cardType}</div>}
                                                {currentCard.setInfo && <div><strong>Set:</strong> {currentCard.setInfo}</div>}
                                                {currentCard.prices?.usd && <div><strong>Price:</strong> ${currentCard.prices.usd}</div>}
                                                <div><strong>Confidence:</strong> {currentCard.confidence}%</div>
                                                <div><strong>Method:</strong> {currentCard.isVerified ? 'Scryfall Verified' : 'AI Detection'}</div>
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
                                <p style={{ color: '#94a3b8' }}>Start scanning cards to build your digital collection with beautiful card art!</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '20px'
                            }}>
                                {savedCards.map((card, index) => (
                                    <div key={card.id || index}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            padding: '16px', transition: 'all 0.2s ease',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(74, 144, 226, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}>
                                        
                                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                                            <CardImage card={card} size="medium" />
                                        </div>
                                        
                                        <h4 style={{ 
                                            color: '#4a90e2', marginBottom: '8px', fontSize: '14px',
                                            textAlign: 'center', fontWeight: '600'
                                        }}>
                                            {card.cardName}
                                        </h4>
                                        
                                        <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '12px' }}>
                                            {card.setInfo && <div>{card.setInfo}</div>}
                                            {card.prices?.usd && <div>${card.prices.usd}</div>}
                                            <div>{card.confidence}% confidence</div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {card.scryfallUri && (
                                                <button onClick={() => window.open(card.scryfallUri, '_blank')}
                                                    style={{
                                                        flex: 1, padding: '6px 8px', background: 'rgba(74, 144, 226, 0.2)',
                                                        border: '1px solid #4a90e2', color: '#4a90e2',
                                                        borderRadius: '4px', cursor: 'pointer', fontSize: '11px'
                                                    }}>
                                                    🔗
                                                </button>
                                            )}
                                            <button onClick={() => removeCardFromCollection(card.id)}
                                                style={{
                                                    flex: 1, padding: '6px 8px', background: 'rgba(220, 53, 69, 0.2)',
                                                    border: '1px solid #dc3545', color: '#dc3545',
                                                    borderRadius: '4px', cursor: 'pointer', fontSize: '11px'
                                                }}>
                                                🗑️
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
                aiRecommendation={aiRecommendation}
            />

            {/* Premium Paywall Modal */}
            <PremiumPaywallModal
                isOpen={showPaywallModal}
                onClose={() => setShowPaywallModal(false)}
                onUpgrade={handlePremiumUpgrade}
                cardsScanned={savedCards.length}
                limit={FREE_COLLECTION_LIMIT}
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
                    <div style={{ fontWeight: 'bold', color: '#4a90e2' }}>Ultimate MTG Scanner Pro</div>
                    {currentCard && (
                        <span style={{ fontSize: '14px' }}>
                            🎯 Last: {currentCard.cardName} ({currentCard.confidence}%)
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontSize: '14px' }}>
                    <span>📷 {cameraStatus === 'ready' ? 'Ready ✅' : 'Setup ⏳'}</span>
                    <span>🧠 Gemini AI</span>
                    <span>🎭 Smart Editions</span>
                    <span>⚡ {cooldownStatus.mode || 'Ready'} Mode</span>
                    <span>{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
                </div>
            </div>
        </div>
    );
};

export default UltimateMTGScanner;