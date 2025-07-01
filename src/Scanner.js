// Scanner.js - MTG Scanner Pro - Production Ready with Gemini AI
import React, { useState, useRef, useEffect } from 'react';

// 🔥 PROFESSIONAL TOAST NOTIFICATIONS
const showToast = (message, type = 'info', duration = 3000) => {
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10001;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white; padding: 12px 20px; border-radius: 6px;
        font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, duration);
};

// 🧠 GEMINI VISION SERVICE - PRODUCTION READY
class GeminiVisionService {
    constructor() {
        this.geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.lastApiCall = 0;
        this.rateLimitDelay = 2000; // 2 seconds between calls
        this.consecutiveErrors = 0;
        this.maxRetries = 3;
        
        console.log('🧠 Gemini Vision Service initialized');
        if (!this.geminiApiKey) {
            console.error('❌ GEMINI_API_KEY not found in environment variables');
        }
    }

    async processVideoFrame(videoElement) {
        const startTime = performance.now();
        
        try {
            // Rate limiting
            const now = Date.now();
            const timeSinceLastCall = now - this.lastApiCall;
            if (timeSinceLastCall < this.rateLimitDelay) {
                const waitTime = this.rateLimitDelay - timeSinceLastCall;
                console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            this.lastApiCall = Date.now();

            // Capture frame
            const frameData = this.captureFrame(videoElement);
            const imageBase64 = frameData.canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = imageBase64.split(',')[1];

            // Call Gemini API
            const result = await this.callGeminiAPI(base64Data);
            
            if (result.hasCard) {
                this.consecutiveErrors = 0;
                
                // Enhance with Scryfall data
                const enhancedResult = await this.enhanceWithScryfall(result);
                
                const processingTime = Math.round(performance.now() - startTime);
                return {
                    ...enhancedResult,
                    processingTime,
                    timestamp: new Date().toISOString()
                };
            }
            
            return result;
            
        } catch (error) {
            this.consecutiveErrors++;
            console.error('❌ Vision processing error:', error);
            
            const processingTime = Math.round(performance.now() - startTime);
            return {
                hasCard: false,
                message: `Scanner error: ${error.message}`,
                confidence: 0,
                processingTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    captureFrame(videoElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(videoElement, 0, 0);
        
        return { canvas, width: canvas.width, height: canvas.height };
    }

    async callGeminiAPI(base64Data) {
        if (!this.geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

        const prompt = `Analyze this image for Magic: The Gathering cards. If you see a clear MTG card:

1. Identify the exact card name
2. Determine confidence level (80-100 for clear cards only)
3. Note any visible mana cost or type information

Respond in this exact format:
CARD_NAME: [exact name]
CONFIDENCE: [80-100]
TYPE: [card type if visible]
MANA_COST: [mana cost if visible]

If no clear MTG card is visible, respond with: NO_MTG_CARD`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 200
            }
        };

        const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            if (response.status === 429) {
                // Rate limited - increase delay
                this.rateLimitDelay = Math.min(this.rateLimitDelay * 1.5, 15000);
                throw new Error(`Rate limited - reducing scan speed`);
            }
            throw new Error(`Gemini API error: ${response.status}`);
        }

        // Reset delay on successful call
        this.rateLimitDelay = Math.max(this.rateLimitDelay * 0.9, 2000);

        const data = await response.json();
        const responseText = data.candidates[0]?.content?.parts[0]?.text || '';
        
        return this.parseGeminiResponse(responseText);
    }

    parseGeminiResponse(responseText) {
        if (!responseText || responseText.includes('NO_MTG_CARD')) {
            return {
                hasCard: false,
                message: 'No MTG card detected',
                confidence: 0
            };
        }

        const lines = responseText.split('\n');
        let cardName = '';
        let confidence = 0;
        let cardType = '';
        let manaCost = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('CARD_NAME:')) {
                cardName = trimmed.replace('CARD_NAME:', '').trim();
            } else if (trimmed.startsWith('CONFIDENCE:')) {
                confidence = parseInt(trimmed.replace('CONFIDENCE:', '').trim()) || 0;
            } else if (trimmed.startsWith('TYPE:')) {
                cardType = trimmed.replace('TYPE:', '').trim();
            } else if (trimmed.startsWith('MANA_COST:')) {
                manaCost = trimmed.replace('MANA_COST:', '').trim();
            }
        }

        if (!cardName || cardName.length < 3 || confidence < 80) {
            return {
                hasCard: false,
                message: confidence < 80 ? `Low confidence: ${confidence}%` : 'Invalid card name detected',
                confidence: confidence
            };
        }

        return {
            hasCard: true,
            cardName,
            confidence,
            cardType,
            manaCost,
            method: 'gemini_vision'
        };
    }

    async enhanceWithScryfall(result) {
        try {
            const encodedName = encodeURIComponent(result.cardName);
            const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodedName}`);
            
            if (response.ok) {
                const scryfallCard = await response.json();
                return {
                    ...result,
                    cardType: scryfallCard.type_line,
                    manaCost: scryfallCard.mana_cost || '',
                    setInfo: scryfallCard.set_name,
                    rarity: scryfallCard.rarity,
                    scryfallId: scryfallCard.id,
                    scryfallUri: scryfallCard.scryfall_uri,
                    imageUri: scryfallCard.image_uris?.normal,
                    prices: scryfallCard.prices,
                    colors: scryfallCard.colors || [],
                    setCode: scryfallCard.set,
                    collectorNumber: scryfallCard.collector_number,
                    isVerified: true
                };
            }
        } catch (error) {
            console.log('⚠️ Scryfall enhancement failed:', error.message);
        }
        
        return result;
    }
}

// 🔥 SMART COOLDOWN SYSTEM
class MTGScannerCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.detectionBuffer = [];
        
        // Gentler cooldown settings
        this.SAME_CARD_COOLDOWN = 8000;      // 8 seconds for same card
        this.MIN_API_INTERVAL = 2000;        // 2 seconds between API calls
        this.DETECTION_STABILITY = 2;        // Need 2 consistent detections
        this.MAX_CONSECUTIVE = 3;            // Max consecutive before pause
        this.LONG_PAUSE_DURATION = 15000;   // 15 second pause (reduced from 30)
        
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
    }

    shouldScan(cardName = null) {
        const now = Date.now();
        
        // Check long pause
        if (this.isLongPauseActive) {
            const pauseRemaining = this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime);
            if (pauseRemaining > 0) {
                return false;
            } else {
                this.isLongPauseActive = false;
                this.consecutiveDetections = 0;
                console.log("✅ Long pause ended, scanning can resume");
            }
        }
        
        // Enforce minimum API interval
        if (now - this.lastApiCall < this.MIN_API_INTERVAL) {
            return false;
        }
        
        // Same card cooldown
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
        
        if (this.consecutiveDetections >= this.MAX_CONSECUTIVE) {
            this.isLongPauseActive = true;
            this.longPauseStartTime = now;
            console.log(`🛑 Activating gentler pause (${this.LONG_PAUSE_DURATION/1000}s)`);
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
            canScan: this.shouldScan(this.lastDetectedCard),
            detectionBufferSize: this.detectionBuffer.length,
            stabilityRequired: this.DETECTION_STABILITY
        };
    }
}

// 🎨 PROFESSIONAL UI COMPONENTS
const CooldownStatus = ({ cooldownStatus, isVisible }) => {
    if (!isVisible || !cooldownStatus) return null;

    return (
        <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.85)', color: 'white', padding: '12px',
            borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace',
            border: '1px solid #4a90e2', minWidth: '200px', zIndex: 1000
        }}>
            <div style={{color: '#4a90e2', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center'}}>
                🔥 SCANNER STATUS
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
                <span>Stability:</span>
                <span style={{color: '#64b5f6'}}>{cooldownStatus.detectionBufferSize}/{cooldownStatus.stabilityRequired}</span>
            </div>
            <div style={{
                marginTop: '6px', padding: '4px', 
                background: cooldownStatus.canScan ? 'rgba(40, 167, 69, 0.3)' : 'rgba(220, 53, 69, 0.3)',
                borderRadius: '4px', textAlign: 'center', fontWeight: 'bold'
            }}>
                {cooldownStatus.canScan ? '✅ Ready' : '⏳ Cooldown'}
            </div>
        </div>
    );
};

const TabNavigation = ({ activeTab, onTabChange, savedCards }) => {
    const tabs = [
        { id: 'scanner', label: '🔍 Scanner', badge: null },
        { id: 'collection', label: '🃏 Collection', badge: savedCards?.length || 0 },
        { id: 'history', label: '📊 History', badge: null }
    ];

    return (
        <div style={{
            display: 'flex', gap: '4px', marginBottom: '20px',
            background: 'rgba(255, 255, 255, 0.05)', padding: '4px',
            borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => onTabChange(tab.id)}
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
                            background: 'rgba(74, 144, 226, 0.2)', color: '#4a90e2',
                            padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700'
                        }}>{tab.badge}</span>
                    )}
                </button>
            ))}
        </div>
    );
};

// 📱 COLLECTION MANAGER
const CollectionManager = ({ savedCards, onRemoveCard, onOpenScryfall, onExportToMoxfield }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('grid');

    const filteredAndSortedCards = savedCards
        .filter(card => 
            card.cardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (card.cardType && card.cardType.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (card.setInfo && card.setInfo.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.cardName.localeCompare(b.cardName);
                case 'type': return (a.cardType || '').localeCompare(b.cardType || '');
                case 'set': return (a.setInfo || '').localeCompare(b.setInfo || '');
                case 'date': return new Date(b.addedAt) - new Date(a.addedAt);
                case 'confidence': return (b.confidence || 0) - (a.confidence || 0);
                default: return 0;
            }
        });

    const getTotalValue = () => {
        return savedCards.reduce((total, card) => {
            const price = parseFloat(card.prices?.usd || 0);
            return total + price;
        }, 0).toFixed(2);
    };

    const getColorDistribution = () => {
        const colors = {};
        savedCards.forEach(card => {
            if (card.colors && Array.isArray(card.colors)) {
                card.colors.forEach(color => {
                    colors[color] = (colors[color] || 0) + 1;
                });
            }
        });
        return colors;
    };

    const colorSymbols = { W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ color: '#4a90e2', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🃏 Collection ({savedCards.length} cards)
                    {savedCards.length > 0 && (
                        <span style={{ fontSize: '16px', color: '#22c55e', fontWeight: 'normal' }}>
                            ~ ${getTotalValue()}
                        </span>
                    )}
                </h2>
                
                <button onClick={onExportToMoxfield} disabled={savedCards.length === 0}
                    style={{
                        padding: '10px 20px', background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                        border: 'none', color: 'white', borderRadius: '8px',
                        cursor: savedCards.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: '600',
                        opacity: savedCards.length === 0 ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                    }}>
                    📤 Export to Moxfield
                </button>
            </div>

            {/* Color Distribution */}
            {savedCards.length > 0 && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '12px',
                    marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <h4 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '14px' }}>🎨 Color Distribution</h4>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {Object.entries(getColorDistribution()).map(([color, count]) => (
                            <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '16px' }}>{colorSymbols[color] || '⚪'}</span>
                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filter Controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="text" placeholder="🔍 Search cards..." value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '10px 14px', background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px',
                        color: 'white', fontSize: '14px', minWidth: '200px',
                        outline: 'none'
                    }} />
                
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        padding: '10px 14px', background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px',
                        color: 'white', fontSize: '14px', outline: 'none'
                    }}>
                    <option value="name">Sort by Name</option>
                    <option value="type">Sort by Type</option>
                    <option value="set">Sort by Set</option>
                    <option value="date">Sort by Date Added</option>
                    <option value="confidence">Sort by Confidence</option>
                </select>

                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    style={{
                        padding: '10px 16px', background: 'rgba(74, 144, 226, 0.2)',
                        border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '8px',
                        cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                    }}>
                    {viewMode === 'grid' ? '📋 List' : '🔲 Grid'}
                </button>
            </div>

            {/* Cards Display */}
            {filteredAndSortedCards.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
                    <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>
                        {searchTerm ? 'No matching cards found' : 'No Cards in Collection'}
                    </h3>
                    <p style={{ color: '#94a3b8' }}>
                        {searchTerm ? 'Try a different search term' : 'Start scanning cards to build your collection'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: viewMode === 'grid' ? 'grid' : 'block',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
                    gap: '16px'
                }}>
                    {filteredAndSortedCards.map((card, index) => (
                        <div key={card.id || index}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: viewMode === 'list' ? 'flex' : 'block',
                                alignItems: viewMode === 'list' ? 'center' : 'stretch',
                                gap: viewMode === 'list' ? '20px' : '0',
                                transition: 'all 0.2s ease',
                                ':hover': { transform: 'translateY(-2px)' }
                            }}>
                            
                            <div style={{ flex: viewMode === 'list' ? '1' : 'auto' }}>
                                <h4 style={{ 
                                    color: '#4a90e2', marginBottom: '12px', fontSize: '18px',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    {card.cardName}
                                    {card.isVerified && <span style={{fontSize: '12px'}}>✅</span>}
                                </h4>
                                
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.5' }}>
                                    {card.cardType && <div><strong>Type:</strong> {card.cardType}</div>}
                                    {card.setInfo && <div><strong>Set:</strong> {card.setInfo}</div>}
                                    {card.manaCost && <div><strong>Mana:</strong> {card.manaCost}</div>}
                                    {card.rarity && <div><strong>Rarity:</strong> {card.rarity}</div>}
                                    {card.prices?.usd && <div><strong>Price:</strong> ${card.prices.usd}</div>}
                                    <div><strong>Confidence:</strong> {card.confidence}%</div>
                                    {card.addedAt && <div><strong>Added:</strong> {new Date(card.addedAt).toLocaleDateString()}</div>}
                                </div>
                            </div>
                            
                            <div style={{ 
                                display: 'flex', gap: '8px', flexDirection: viewMode === 'list' ? 'row' : 'column',
                                marginTop: viewMode === 'grid' ? '16px' : '0'
                            }}>
                                {card.scryfallUri && (
                                    <button onClick={() => onOpenScryfall(card)}
                                        style={{
                                            padding: '8px 16px', background: 'rgba(74, 144, 226, 0.2)',
                                            border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '6px',
                                            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                            transition: 'all 0.2s ease'
                                        }}>
                                        🔗 Scryfall
                                    </button>
                                )}
                                <button onClick={() => onRemoveCard(card.id)}
                                    style={{
                                        padding: '8px 16px', background: 'rgba(220, 53, 69, 0.2)',
                                        border: '1px solid #dc3545', color: '#dc3545', borderRadius: '6px',
                                        cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                        transition: 'all 0.2s ease'
                                    }}>
                                    🗑️ Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 📊 SCAN HISTORY VIEWER
const ScanHistoryViewer = ({ scanHistory, onSaveCard }) => {
    const [sortBy, setSortBy] = useState('date');

    const sortedHistory = [...scanHistory].sort((a, b) => {
        switch (sortBy) {
            case 'name': return a.cardName.localeCompare(b.cardName);
            case 'confidence': return b.confidence - a.confidence;
            case 'date': return new Date(b.timestamp) - new Date(a.timestamp);
            default: return 0;
        }
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#4a90e2', margin: 0 }}>📊 Scan History ({scanHistory.length})</h2>
                
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                        color: 'white', fontSize: '14px'
                    }}>
                    <option value="date">Sort by Date</option>
                    <option value="name">Sort by Name</option>
                    <option value="confidence">Sort by Confidence</option>
                </select>
            </div>

            {sortedHistory.length === 0 ? (
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
                    {sortedHistory.map((card, index) => (
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
                                    {card.isVerified && <span style={{fontSize: '12px'}}>✅</span>}
                                </div>
                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                    {card.cardType && <span>{card.cardType} • </span>}
                                    {card.setInfo && <span>{card.setInfo} • </span>}
                                    <span>{new Date(card.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {card.scryfallUri && (
                                    <button onClick={() => window.open(card.scryfallUri, '_blank')}
                                        style={{
                                            padding: '6px 12px', background: 'rgba(74, 144, 226, 0.2)',
                                            border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '4px',
                                            cursor: 'pointer', fontSize: '12px'
                                        }}>
                                        🔗
                                    </button>
                                )}
                                <button onClick={() => onSaveCard(card)}
                                    style={{
                                        padding: '6px 12px', background: 'rgba(34, 197, 94, 0.2)',
                                        border: '1px solid #22c55e', color: '#22c55e', borderRadius: '4px',
                                        cursor: 'pointer', fontSize: '12px'
                                    }}>
                                    💾
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 🎥 MAIN SCANNER COMPONENT
const Scanner = () => {
    // Core scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('initializing');
    const [currentCard, setCurrentCard] = useState(null);
    const [scanMode, setScanMode] = useState('continuous');
    
    // Collection and history state
    const [savedCards, setSavedCards] = useState([]);
    const [scanHistory, setScanHistory] = useState([]);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [cooldownStatus, setCooldownStatus] = useState({});
    
    // Camera state
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const cooldownSystemRef = useRef(new MTGScannerCooldown());

    // Initialize
    useEffect(() => {
        console.log('🚀 Initializing MTG Scanner Pro...');
        initializeServices();
        loadSavedData();
        enumerateCameras().then(() => setupCamera());
        
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500);
        
        return () => {
            console.log('🧹 Cleaning up...');
            clearInterval(cooldownUpdateInterval);
            cleanup();
        };
    }, []);

    const initializeServices = () => {
        try {
            visionServiceRef.current = new GeminiVisionService();
            console.log('✅ Gemini Vision Service initialized');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
            showToast('Failed to initialize vision service', 'error');
        }
    };

    const loadSavedData = () => {
        try {
            // Load saved cards
            const savedCardsData = localStorage.getItem('mtg_saved_cards');
            if (savedCardsData) {
                setSavedCards(JSON.parse(savedCardsData));
                console.log('📁 Loaded saved cards from storage');
            }
            
            // Load scan history
            const historyData = localStorage.getItem('mtg_scan_history');
            if (historyData) {
                setScanHistory(JSON.parse(historyData));
                console.log('📊 Loaded scan history from storage');
            }
            
            // Load preferences
            const autoSavePref = localStorage.getItem('mtg_auto_save');
            if (autoSavePref) {
                setAutoSaveEnabled(JSON.parse(autoSavePref));
            }
        } catch (error) {
            console.error('❌ Failed to load saved data:', error);
        }
    };

    const enumerateCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📷 Available cameras:', videoDevices.length);
            setAvailableCameras(videoDevices);
            
            // Smart camera prioritization - favor Logitech C920
            const logitechCamera = videoDevices.find(device => 
                device.label.toLowerCase().includes('logitech') || 
                device.label.toLowerCase().includes('c920')
            );
            
            if (logitechCamera) {
                setSelectedCameraId(logitechCamera.deviceId);
                console.log('✅ Auto-selected Logitech C920');
                showToast('🎥 Logitech C920 detected - optimal for MTG scanning!', 'success');
            } else if (videoDevices.length > 0) {
                // Filter out virtual cameras if possible
                const physicalCameras = videoDevices.filter(device => 
                    !device.label.toLowerCase().includes('virtual') &&
                    !device.label.toLowerCase().includes('obs') &&
                    !device.label.toLowerCase().includes('elgato')
                );
                
                if (physicalCameras.length > 0) {
                    setSelectedCameraId(physicalCameras[0].deviceId);
                    console.log('✅ Auto-selected physical camera');
                } else {
                    setSelectedCameraId(videoDevices[0].deviceId);
                    console.log('⚠️ Using virtual camera (may have quality issues)');
                }
            }
        } catch (error) {
            console.error('❌ Failed to enumerate cameras:', error);
            showToast('Failed to detect cameras', 'error');
        }
    };

    const setupCamera = async (deviceId = null) => {
        console.log('🎥 Setting up camera...');
        setCameraStatus('requesting');
        setCameraError(null);
        
        try {
            if (cameraStreamRef.current && cameraStreamRef.current.active) {
                console.log('📷 Camera already active');
                if (videoRef.current && !videoRef.current.srcObject) {
                    videoRef.current.srcObject = cameraStreamRef.current;
                    videoRef.current.play();
                }
                setCameraStatus('ready');
                return;
            }

            const useDeviceId = deviceId || selectedCameraId;
            let constraints = {
                video: {
                    deviceId: useDeviceId ? { exact: useDeviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraStreamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraStatus('ready');
                    setCameraError(null);
                    console.log('✅ Camera ready:', `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    showToast('📷 Camera ready for MTG scanning!', 'success');
                };
            }
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            setCameraStatus('error');
            setCameraError({
                message: error.name === 'NotAllowedError' ? 'Camera permission denied' : 
                         error.name === 'NotFoundError' ? 'No camera found' :
                         error.name === 'NotReadableError' ? 'Camera is busy' : 'Camera error',
                action: error.name === 'NotAllowedError' ? 'Please allow camera access and try again' :
                        error.name === 'NotFoundError' ? 'Please connect a camera' :
                        'Please check camera and try again',
                canRetry: true
            });
            showToast('Camera setup failed', 'error');
        }
    };

    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ Scanner not ready');
            showToast('Camera not ready. Please wait for camera initialization.', 'error');
            return;
        }
        
        console.log(`▶️ Starting ${scanMode} scanning...`);
        setIsScanning(true);
        cooldownSystemRef.current.resetCooldowns();
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        
        scanIntervalRef.current = setInterval(async () => {
            try {
                const currentCardName = currentCard?.cardName;
                
                // Check cooldown system
                if (!cooldownSystemRef.current.shouldScan(currentCardName)) {
                    setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                    return;
                }

                console.log("🔄 Processing frame...");
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 85) {
                    console.log(`🎯 Card detected: ${result.cardName} (${result.confidence}%)`);
                    
                    // Check stability
                    const isStable = cooldownSystemRef.current.addDetection(result.cardName, result.confidence);
                    
                    if (isStable) {
                        console.log('✅ Detection stable, processing...');
                        
                        cooldownSystemRef.current.recordDetection(result.cardName);
                        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                        
                        // Stop scanning in single mode
                        if (scanMode === 'single') {
                            stopScanning();
                        }
                        
                        // Display card and add to history
                        displayCard(result);
                        addToScanHistory(result);
                        
                        // Auto-save if enabled
                        if (autoSaveEnabled) {
                            await saveCardToCollection(result);
                        }
                    }
                    
                } else if (result && !result.hasCard) {
                    setScanResult({ hasCard: false, message: result.message || 'No MTG card detected' });
                    setCurrentCard(null);
                }
                
                setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                
            } catch (error) {
                console.error('❌ Scanning error:', error);
                setScanResult({ hasCard: false, message: `Scanner error: ${error.message}` });
            }
        }, scanMode === 'single' ? 1500 : 2500);
    };

    const stopScanning = () => {
        console.log('⏹️ Stopping scanner...');
        setIsScanning(false);
        
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    };

    const displayCard = (card) => {
        setCurrentCard(card);
        setScanResult(card);
        showToast(`✅ ${card.cardName} recognized (${card.confidence}%)`, 'success');
    };

    const addToScanHistory = (card) => {
        const historyEntry = {
            ...card,
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString()
        };
        
        setScanHistory(prev => {
            const newHistory = [historyEntry, ...prev.slice(0, 99)]; // Keep last 100
            localStorage.setItem('mtg_scan_history', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const saveCardToCollection = async (card) => {
        try {
            const cardWithId = {
                ...card,
                id: Date.now() + Math.random(),
                addedAt: new Date().toISOString()
            };
            
            setSavedCards(prev => {
                const newCollection = [cardWithId, ...prev];
                localStorage.setItem('mtg_saved_cards', JSON.stringify(newCollection));
                return newCollection;
            });
            
            console.log('💾 Card saved to collection:', card.cardName);
            showToast(`💾 ${card.cardName} saved to collection!`, 'success');
            return true;
        } catch (error) {
            console.error('❌ Failed to save card:', error);
            showToast(`Failed to save ${card.cardName}`, 'error');
            return false;
        }
    };

    const removeCardFromCollection = (cardId) => {
        setSavedCards(prev => {
            const newCollection = prev.filter(card => card.id !== cardId);
            localStorage.setItem('mtg_saved_cards', JSON.stringify(newCollection));
            return newCollection;
        });
        showToast('Card removed from collection', 'info');
    };

    const openCardInScryfall = (card) => {
        if (card.scryfallUri) {
            window.open(card.scryfallUri, '_blank');
        } else {
            const searchUrl = `https://scryfall.com/search?q=${encodeURIComponent(card.cardName)}`;
            window.open(searchUrl, '_blank');
        }
        console.log('🔗 Opening Scryfall for:', card.cardName);
    };

    const exportToMoxfield = () => {
        if (savedCards.length === 0) {
            showToast('No cards in collection to export', 'error');
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

    const cleanup = () => {
        stopScanning();
        
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
    };

    const handleCameraChange = async (newCameraId) => {
        console.log('🔄 Switching camera:', newCameraId);
        
        // Stop current stream
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        
        setSelectedCameraId(newCameraId);
        await setupCamera(newCameraId);
        showToast('📷 Camera switched!', 'success');
    };

    const refreshCameraList = async () => {
        console.log('🔄 Refreshing camera list...');
        await enumerateCameras();
        showToast('📷 Camera list refreshed!', 'success');
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
                    }}>MTG<br/>SCAN</div>
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text', marginBottom: '5px'
                        }}>MTG Scanner Pro</h1>
                        <span style={{ fontSize: '0.9rem', color: '#b0bec5' }}>
                            🧠 Gemini AI • 📊 Scryfall Database • 🔥 Smart Cooldown
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
                </div>
            </div>

            {/* Tab Navigation */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                savedCards={savedCards}
            />

            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Scanner Tab */}
                {activeTab === 'scanner' && (
                    <>
                        {/* Scanner Settings */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                            padding: '20px'
                        }}>
                            <h3 style={{ color: '#4a90e2', marginBottom: '16px' }}>⚙️ Scanner Settings</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div>
                                    <label style={{ color: '#b0bec5', marginBottom: '8px', display: 'block' }}>
                                        🎥 Camera:
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select value={selectedCameraId || ''} onChange={(e) => handleCameraChange(e.target.value)}
                                            style={{
                                                flex: 1, padding: '8px', background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                                                color: 'white', fontSize: '13px'
                                            }}>
                                            {availableCameras.map((camera, index) => (
                                                <option key={camera.deviceId} value={camera.deviceId}>
                                                    {camera.label || `Camera ${index + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                        <button onClick={refreshCameraList}
                                            style={{
                                                padding: '8px 12px', background: 'rgba(74, 144, 226, 0.2)',
                                                border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '6px',
                                                cursor: 'pointer', fontSize: '12px'
                                            }}>
                                            🔄
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ color: '#b0bec5', marginBottom: '8px', display: 'block' }}>
                                        ⚙️ Mode:
                                    </label>
                                    <select value={scanMode} onChange={(e) => setScanMode(e.target.value)} disabled={isScanning}
                                        style={{
                                            width: '100%', padding: '8px', background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                                            color: 'white', fontSize: '13px'
                                        }}>
                                        <option value="continuous">🔄 Continuous</option>
                                        <option value="single">📷 Single Shot</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style={{ 
                                        display: 'flex', alignItems: 'center', gap: '8px', 
                                        cursor: 'pointer', color: '#b0bec5'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={autoSaveEnabled}
                                            onChange={(e) => {
                                                setAutoSaveEnabled(e.target.checked);
                                                localStorage.setItem('mtg_auto_save', JSON.stringify(e.target.checked));
                                            }}
                                            style={{ transform: 'scale(1.2)', accentColor: '#4a90e2' }}
                                        />
                                        💾 Auto-save to Collection
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Camera & Scanning */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                            padding: '24px'
                        }}>
                            {/* Video Container */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <video ref={videoRef}
                                    style={{
                                        width: '100%', maxWidth: '640px', height: 'auto',
                                        borderRadius: '12px', border: '2px solid #4a90e2', background: '#000'
                                    }}
                                    autoPlay playsInline muted />
                                
                                {/* Cooldown Status Overlay */}
                                <CooldownStatus
                                    cooldownStatus={cooldownStatus}
                                    isVisible={isScanning}
                                />
                                
                                {/* Camera Error Overlay */}
                                {cameraError && (
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%',
                                        transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.9)',
                                        color: 'white', padding: '20px', borderRadius: '12px',
                                        textAlign: 'center', border: '2px solid #dc3545'
                                    }}>
                                        <h3>📹 Camera Issue</h3>
                                        <p><strong>{cameraError.message}</strong></p>
                                        <p>{cameraError.action}</p>
                                        {cameraError.canRetry && (
                                            <button onClick={() => setupCamera()}
                                                style={{
                                                    padding: '10px 20px', background: '#4a90e2',
                                                    border: 'none', color: 'white', borderRadius: '6px',
                                                    cursor: 'pointer', marginTop: '10px'
                                                }}>
                                                🔄 Try Again
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                {/* Scanning Overlay */}
                                {isScanning && (
                                    <div style={{
                                        position: 'absolute', top: '10px', left: '10px',
                                        background: 'rgba(74, 144, 226, 0.8)', color: 'white',
                                        padding: '8px 12px', borderRadius: '6px',
                                        fontSize: '14px', fontWeight: '600'
                                    }}>
                                        🔍 Scanning for MTG cards...
                                    </div>
                                )}
                                
                                {/* Camera Status */}
                                <div style={{
                                    position: 'absolute', bottom: '10px', left: '10px',
                                    background: 'rgba(0,0,0,0.8)', color: 'white',
                                    padding: '6px 10px', borderRadius: '4px',
                                    fontSize: '12px', fontWeight: '500'
                                }}>
                                    📷 {cameraStatus === 'ready' ? 'Ready' : 
                                         cameraStatus === 'requesting' ? 'Initializing...' : 
                                         cameraStatus === 'error' ? 'Error' : 'Starting...'}
                                </div>
                            </div>

                            {/* Scan Control */}
                            <button onClick={isScanning ? stopScanning : startScanning}
                                disabled={cameraStatus !== 'ready'}
                                style={{
                                    width: '100%', padding: '16px 24px', border: 'none',
                                    background: isScanning 
                                        ? 'linear-gradient(135deg, #dc3545, #c82333)' 
                                        : 'linear-gradient(135deg, #4a90e2, #64b5f6)',
                                    color: 'white', borderRadius: '8px',
                                    cursor: cameraStatus !== 'ready' ? 'not-allowed' : 'pointer',
                                    fontSize: '16px', fontWeight: '600',
                                    opacity: cameraStatus !== 'ready' ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}>
                                {isScanning ? '⏹️ Stop Scanning' : `🔥 Start ${scanMode} Scan`}
                            </button>
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
                                        borderRadius: '12px', padding: '20px'
                                    }}>
                                        <div style={{ 
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                            marginBottom: '16px', flexWrap: 'wrap', gap: '12px'
                                        }}>
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <div style={{ 
                                                    fontSize: '20px', fontWeight: 'bold', color: '#22c55e',
                                                    marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'
                                                }}>
                                                    {currentCard.cardName}
                                                    {currentCard.isVerified && <span style={{fontSize: '14px'}}>✅</span>}
                                                </div>
                                                
                                                <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                                                    {currentCard.cardType && <div><strong>Type:</strong> {currentCard.cardType}</div>}
                                                    {currentCard.manaCost && <div><strong>Mana Cost:</strong> {currentCard.manaCost}</div>}
                                                    {currentCard.setInfo && <div><strong>Set:</strong> {currentCard.setInfo}</div>}
                                                    {currentCard.rarity && <div><strong>Rarity:</strong> {currentCard.rarity}</div>}
                                                    {currentCard.prices?.usd && <div><strong>Price:</strong> ${currentCard.prices.usd}</div>}
                                                    <div><strong>Confidence:</strong> {currentCard.confidence}%</div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                                                <button onClick={() => saveCardToCollection(currentCard)}
                                                    style={{
                                                        padding: '10px 16px', background: 'rgba(74, 144, 226, 0.2)',
                                                        border: '1px solid #4a90e2', color: '#4a90e2',
                                                        borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                                                    }}>
                                                    💾 Save to Collection
                                                </button>
                                                
                                                {currentCard.scryfallUri && (
                                                    <button onClick={() => openCardInScryfall(currentCard)}
                                                        style={{
                                                            padding: '10px 16px', background: 'rgba(34, 197, 94, 0.2)',
                                                            border: '1px solid #22c55e', color: '#22c55e',
                                                            borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                                                        }}>
                                                        🔗 View on Scryfall
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Confidence Bar */}
                                        <div style={{
                                            width: '100%', height: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%', background: 'linear-gradient(90deg, #22c55e, #34d399)',
                                                width: `${currentCard.confidence}%`, borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }}></div>
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
                        <CollectionManager 
                            savedCards={savedCards}
                            onRemoveCard={removeCardFromCollection}
                            onOpenScryfall={openCardInScryfall}
                            onExportToMoxfield={exportToMoxfield}
                        />
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                        padding: '32px'
                    }}>
                        <ScanHistoryViewer 
                            scanHistory={scanHistory}
                            onSaveCard={saveCardToCollection}
                        />
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                padding: '16px', marginTop: '24px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '16px'
            }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#4a90e2' }}>MTG Scanner Pro</div>
                    {currentCard && (
                        <span style={{ fontSize: '14px' }}>
                            🎯 Last: {currentCard.cardName} ({currentCard.confidence}%)
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontSize: '14px' }}>
                    <span>📷 {cameraStatus === 'ready' ? 'Ready ✅' : 'Setup ⏳'}</span>
                    <span>🧠 Gemini AI</span>
                    <span>📊 Scryfall DB</span>
                    <span>🔥 {cooldownStatus.canScan ? 'Ready' : 'Cooldown'}</span>
                    {autoSaveEnabled && <span>💾 Auto-save ON</span>}
                </div>
            </div>
        </div>
    );
};

export default Scanner;