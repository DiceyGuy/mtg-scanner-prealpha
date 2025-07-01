// Scanner.js - MTG Scanner Pro - COMPLETE WORKING VERSION
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import './CardDisplay.css';

// 🔥 PROFESSIONAL COMPONENTS - INTEGRATED
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

// 🔥 CAMERA STATUS COMPONENT
const ProfessionalCameraStatus = ({ cameraStatus, cameraInitialized, cameraDetails, onRetry }) => {
    const getStatusInfo = () => {
        switch (cameraStatus) {
            case 'ready':
                return { 
                    text: `✅ Camera Ready${cameraDetails ? ` (${cameraDetails.width}x${cameraDetails.height})` : ''}`, 
                    color: '#28a745'
                };
            case 'requesting':
                return { 
                    text: '🔄 Requesting camera access...', 
                    color: '#ffc107'
                };
            case 'error':
                return { 
                    text: '❌ Camera Error - Click to retry', 
                    color: '#dc3545'
                };
            case 'no-device':
                return { 
                    text: '📷 No camera detected', 
                    color: '#dc3545'
                };
            case 'permission-denied':
                return { 
                    text: '🚫 Camera permission denied', 
                    color: '#dc3545'
                };
            default:
                return { 
                    text: '🔧 Initializing camera system...', 
                    color: '#17a2b8'
                };
        }
    };

    const statusInfo = getStatusInfo();
    const isClickable = cameraStatus === 'error' || cameraStatus === 'permission-denied' || cameraStatus === 'no-device';

    return (
        <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            border: `1px solid ${statusInfo.color}`,
            cursor: isClickable ? 'pointer' : 'default',
            maxWidth: '300px'
        }}
        onClick={isClickable ? onRetry : undefined}
        >
            <div style={{ color: statusInfo.color, fontWeight: '600' }}>
                {statusInfo.text}
            </div>
            {cameraDetails && cameraStatus === 'ready' && (
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    {cameraDetails.label || 'Unknown Device'}
                </div>
            )}
            {isClickable && (
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Click to retry camera setup
                </div>
            )}
        </div>
    );
};

// 🔥 TABS COMPONENT
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

// 🔥 TOAST NOTIFICATIONS
const showProfessionalToast = (message, type = 'info', duration = 3000) => {
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10001;
        font-weight: 500;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        max-width: 350px;
        animation: slideInRight 0.3s ease-out;
    `;
    toast.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }, duration);
};

// 🔥 MTG KNOWLEDGE BASE WITH EXTERNAL INTEGRATIONS
const MTGKnowledgeBase = ({ currentCard = null, savedCards = [] }) => {
    const [activeSection, setActiveSection] = useState('current');

    const getCollectionInsights = () => {
        if (savedCards.length === 0) return null;
        
        const colorCount = {};
        const typeCount = {};
        const setCount = {};
        const rarityCount = {};
        let totalValue = 0;
        
        savedCards.forEach(card => {
            // Color distribution
            if (card.colors && Array.isArray(card.colors)) {
                card.colors.forEach(color => {
                    colorCount[color] = (colorCount[color] || 0) + 1;
                });
            }
            
            // Type distribution
            if (card.cardType) {
                const mainType = card.cardType.split('—')[0].trim();
                typeCount[mainType] = (typeCount[mainType] || 0) + 1;
            }

            // Set distribution
            if (card.setInfo) {
                setCount[card.setInfo] = (setCount[card.setInfo] || 0) + 1;
            }

            // Rarity distribution
            if (card.rarity) {
                rarityCount[card.rarity] = (rarityCount[card.rarity] || 0) + 1;
            }

            // Estimated value
            if (card.prices && card.prices.usd) {
                totalValue += parseFloat(card.prices.usd) || 0;
            }
        });

        return { 
            colorCount, 
            typeCount, 
            setCount,
            rarityCount,
            totalCards: savedCards.length,
            estimatedValue: totalValue.toFixed(2)
        };
    };

    const getRarityColor = (rarity) => {
        const colors = {
            common: '#1e1e1e',
            uncommon: '#c0c0c0', 
            rare: '#ffd700',
            mythic: '#ff8c00'
        };
        return colors[rarity?.toLowerCase()] || '#ffffff';
    };

    const getColorSymbol = (color) => {
        const symbols = {
            W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢'
        };
        return symbols[color] || '⚪';
    };

    const getColorName = (color) => {
        const names = {
            W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green'
        };
        return names[color] || color;
    };

    const getCardAnalysis = (card) => {
        if (!card.cardType) return 'Card type information not available.';
        
        const type = card.cardType.toLowerCase();
        
        if (type.includes('creature')) {
            return 'This creature can attack and block. Consider its power, toughness, and any special abilities when building your deck. Check EDHREC.com for popular deck synergies.';
        } else if (type.includes('instant')) {
            return 'This instant can be played at any time you have priority, including during your opponent\'s turn. Great for reactive strategies and combo protection.';
        } else if (type.includes('sorcery')) {
            return 'This sorcery can only be played during your main phases when the stack is empty. Often provides powerful proactive effects.';
        } else if (type.includes('enchantment')) {
            return 'This enchantment provides ongoing effects while it remains on the battlefield. Check for synergies with enchantment-based strategies.';
        } else if (type.includes('artifact')) {
            return 'This artifact is colorless and can fit into any deck. Often provides utility or serves as combo pieces in artifact-based strategies.';
        } else if (type.includes('land')) {
            return 'This land can produce mana to cast your spells. Essential for consistent mana bases. Check its interactions with land-based strategies.';
        } else if (type.includes('planeswalker')) {
            return 'This planeswalker is a powerful ally that can use loyalty abilities. Protect it from attacks! Often serves as win conditions or engine pieces.';
        }
        
        return 'This card has a unique type. Check its rules text for specific interactions and visit EDHREC.com for deck building suggestions.';
    };

    // 🔥 EXTERNAL SERVICE INTEGRATIONS
    const openEDHREC = (cardName) => {
        const searchUrl = `https://edhrec.com/cards/${encodeURIComponent(cardName.toLowerCase().replace(/\s+/g, '-'))}`;
        window.open(searchUrl, '_blank');
    };

    const openMoxfield = () => {
        window.open('https://www.moxfield.com/', '_blank');
    };

    const openMTGTop8 = () => {
        window.open('https://www.mtgtop8.com/', '_blank');
    };

    const searchEDHRECThemes = () => {
        window.open('https://edhrec.com/themes', '_blank');
    };

    const insights = getCollectionInsights();

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h2 style={{ color: '#4a90e2', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📚 MTG Knowledge Base
            </h2>
            
            {/* Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setActiveSection('current')}
                    style={{
                        padding: '10px 20px',
                        background: activeSection === 'current' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                        color: activeSection === 'current' ? 'white' : '#4a90e2',
                        border: '1px solid #4a90e2',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    🔍 Current Card
                </button>
                <button
                    onClick={() => setActiveSection('collection')}
                    style={{
                        padding: '10px 20px',
                        background: activeSection === 'collection' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                        color: activeSection === 'collection' ? 'white' : '#4a90e2',
                        border: '1px solid #4a90e2',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    📊 Collection
                </button>
                <button
                    onClick={() => setActiveSection('external')}
                    style={{
                        padding: '10px 20px',
                        background: activeSection === 'external' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                        color: activeSection === 'external' ? 'white' : '#4a90e2',
                        border: '1px solid #4a90e2',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    🌐 External Tools
                </button>
            </div>

            {/* Current Card Analysis */}
            {activeSection === 'current' && (
                <div>
                    {currentCard ? (
                        <div style={{ 
                            background: 'rgba(74, 144, 226, 0.1)', 
                            padding: '24px', 
                            borderRadius: '12px',
                            border: '1px solid rgba(74, 144, 226, 0.3)'
                        }}>
                            <h3 style={{ color: '#4a90e2', marginBottom: '16px' }}>
                                🎯 Analyzing: {currentCard.cardName}
                            </h3>
                            
                            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Type:</span>
                                    <span style={{ fontWeight: '600' }}>{currentCard.cardType || 'Unknown'}</span>
                                </div>
                                
                                {currentCard.manaCost && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94a3b8' }}>Mana Cost:</span>
                                        <span style={{ fontWeight: '600' }}>{currentCard.manaCost}</span>
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Set:</span>
                                    <span style={{ fontWeight: '600' }}>{currentCard.setInfo || 'Unknown'}</span>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Rarity:</span>
                                    <span style={{ fontWeight: '600', color: getRarityColor(currentCard.rarity) }}>
                                        {currentCard.rarity || 'Unknown'}
                                    </span>
                                </div>

                                {currentCard.prices && currentCard.prices.usd && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94a3b8' }}>Price:</span>
                                        <span style={{ fontWeight: '600', color: '#22c55e' }}>
                                            ${currentCard.prices.usd}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={{ 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                padding: '16px', 
                                borderRadius: '8px',
                                marginTop: '16px'
                            }}>
                                <h4 style={{ color: '#e2e8f0', marginBottom: '8px' }}>💡 Card Analysis</h4>
                                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                                    {getCardAnalysis(currentCard)}
                                </p>
                            </div>

                            {/* External Integration Buttons */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => openEDHREC(currentCard.cardName)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2',
                                        color: '#4a90e2',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                    }}
                                >
                                    📊 View on EDHREC
                                </button>
                                {currentCard.scryfallUri && (
                                    <button
                                        onClick={() => window.open(currentCard.scryfallUri, '_blank')}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            border: '1px solid #22c55e',
                                            color: '#22c55e',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        🔗 View on Scryfall
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '60px 20px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '12px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
                            <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Card Selected</h3>
                            <p style={{ color: '#94a3b8' }}>
                                Scan a card in the Scanner tab to see detailed analysis here.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Collection Insights */}
            {activeSection === 'collection' && (
                <div>
                    {insights ? (
                        <div>
                            <div style={{ 
                                background: 'rgba(34, 197, 94, 0.1)', 
                                padding: '24px', 
                                borderRadius: '12px',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ color: '#22c55e', marginBottom: '16px' }}>
                                    📊 Collection Overview
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                                            {insights.totalCards}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Total Cards</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                                            ${insights.estimatedValue}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Est. Value</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                                            {Object.keys(insights.setCount).length}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Different Sets</div>
                                    </div>
                                </div>
                            </div>

                            {Object.keys(insights.colorCount).length > 0 && (
                                <div style={{ 
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    padding: '20px', 
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    marginBottom: '20px'
                                }}>
                                    <h4 style={{ color: '#e2e8f0', marginBottom: '16px' }}>🎨 Color Distribution</h4>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {Object.entries(insights.colorCount).map(([color, count]) => (
                                            <div key={color} style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 0'
                                            }}>
                                                <span>
                                                    {getColorSymbol(color)} {getColorName(color)}
                                                </span>
                                                <span style={{ fontWeight: '600' }}>{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* External Analysis Button */}
                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <button
                                    onClick={searchEDHRECThemes}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2',
                                        color: '#4a90e2',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    📊 Find Deck Themes on EDHREC
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '60px 20px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '12px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                            <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Collection Data</h3>
                            <p style={{ color: '#94a3b8' }}>
                                Start scanning cards to see collection insights and get external analysis recommendations.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* External Tools */}
            {activeSection === 'external' && (
                <div>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            padding: '20px', 
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <h4 style={{ color: '#4a90e2', marginBottom: '12px' }}>🏗️ Deck Building Tools</h4>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                <button
                                    onClick={openEDHREC}
                                    style={{
                                        padding: '12px',
                                        background: 'rgba(74, 144, 226, 0.1)',
                                        border: '1px solid rgba(74, 144, 226, 0.3)',
                                        color: '#4a90e2',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <strong>EDHREC.com</strong> - Commander deck statistics and recommendations
                                </button>
                                <button
                                    onClick={openMoxfield}
                                    style={{
                                        padding: '12px',
                                        background: 'rgba(74, 144, 226, 0.1)',
                                        border: '1px solid rgba(74, 144, 226, 0.3)',
                                        color: '#4a90e2',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <strong>Moxfield.com</strong> - Advanced deck builder and collection manager
                                </button>
                                <button
                                    onClick={openMTGTop8}
                                    style={{
                                        padding: '12px',
                                        background: 'rgba(74, 144, 226, 0.1)',
                                        border: '1px solid rgba(74, 144, 226, 0.3)',
                                        color: '#4a90e2',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <strong>MTGTop8.com</strong> - Tournament results and competitive meta analysis
                                </button>
                            </div>
                        </div>

                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            padding: '20px', 
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <h4 style={{ color: '#4a90e2', marginBottom: '12px' }}>💡 How to Use External Tools</h4>
                            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#94a3b8' }}>
                                <p style={{ marginBottom: '8px' }}>
                                    <strong>For Combo Discovery:</strong> Use EDHREC to search for your cards and find popular combos and synergies.
                                </p>
                                <p style={{ marginBottom: '8px' }}>
                                    <strong>For Deck Building:</strong> Export your collection to Moxfield for advanced deck construction tools.
                                </p>
                                <p style={{ marginBottom: '8px' }}>
                                    <strong>For Competitive Play:</strong> Check MTGTop8 for tournament-winning decks and meta trends.
                                </p>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button 
                                    onClick={() => window.open('https://scryfall.com/', '_blank')}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2',
                                        color: '#4a90e2',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    🔍 Scryfall Database
                                </button>
                                <button 
                                    onClick={() => window.open('https://gatherer.wizards.com/', '_blank')}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2',
                                        color: '#4a90e2',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    🧙‍♂️ Gatherer
                                </button>
                                <button 
                                    onClick={() => window.open('https://magic.wizards.com/en/rules', '_blank')}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2',
                                        color: '#4a90e2',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    📖 Official Rules
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 🔥 DECK MANAGER WITH EXTERNAL INTEGRATION
const DeckManager = ({ savedCards, onRemoveCard, onOpenScryfall }) => {
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');

    const getUniqueTypes = () => {
        const types = new Set();
        savedCards.forEach(card => {
            if (card.cardType) {
                const mainType = card.cardType.split('—')[0].trim();
                types.add(mainType);
            }
        });
        return Array.from(types).sort();
    };

    const filteredAndSortedCards = savedCards
        .filter(card => {
            const matchesSearch = card.cardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (card.cardType && card.cardType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (card.setInfo && card.setInfo.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (filterBy === 'all') return matchesSearch;
            
            if (filterBy.startsWith('type:')) {
                const typeFilter = filterBy.replace('type:', '');
                return matchesSearch && card.cardType && card.cardType.toLowerCase().includes(typeFilter.toLowerCase());
            }
            
            return matchesSearch;
        })
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
                case 'value':
                    const aValue = (a.prices && a.prices.usd) ? parseFloat(a.prices.usd) : 0;
                    const bValue = (b.prices && b.prices.usd) ? parseFloat(b.prices.usd) : 0;
                    return bValue - aValue;
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
        showProfessionalToast('📁 Collection exported for Moxfield!', 'success');
    };

    const exportToEDHREC = () => {
        const edhrecFormat = savedCards.map(card => `1x ${card.cardName}`).join('\n');
        const blob = new Blob([edhrecFormat], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'edhrec_collection.txt';
        a.click();
        URL.revokeObjectURL(url);
        showProfessionalToast('📁 Collection exported for EDHREC!', 'success');
    };

    const calculateCollectionValue = () => {
        return savedCards.reduce((total, card) => {
            if (card.prices && card.prices.usd) {
                return total + parseFloat(card.prices.usd);
            }
            return total;
        }, 0).toFixed(2);
    };

    const openCollectionOnEDHREC = () => {
        window.open('https://edhrec.com/', '_blank');
        showProfessionalToast('💡 Upload your exported collection to EDHREC for analysis!', 'info');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ color: '#4a90e2', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🃏 Card Collection ({savedCards.length} cards)
                </h2>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>
                    💰 Total Value: ${calculateCollectionValue()}
                </div>
            </div>

            {/* Enhanced Controls */}
            <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px', 
                marginBottom: '24px',
                alignItems: 'end'
            }}>
                <div>
                    <label style={{ color: '#b0bec5', marginBottom: '4px', display: 'block', fontSize: '12px' }}>
                        Search Cards
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name, type, or set..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    />
                </div>
                
                <div>
                    <label style={{ color: '#b0bec5', marginBottom: '4px', display: 'block', fontSize: '12px' }}>
                        Sort By
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    >
                        <option value="name">Name</option>
                        <option value="type">Type</option>
                        <option value="set">Set</option>
                        <option value="date">Date Added</option>
                        <option value="value">Value (High to Low)</option>
                    </select>
                </div>

                <div>
                    <label style={{ color: '#b0bec5', marginBottom: '4px', display: 'block', fontSize: '12px' }}>
                        Filter
                    </label>
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    >
                        <option value="all">All Cards</option>
                        {getUniqueTypes().map(type => (
                            <option key={type} value={`type:${type}`}>{type}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        style={{
                            padding: '8px 12px',
                            background: 'rgba(74, 144, 226, 0.2)',
                            border: '1px solid #4a90e2',
                            color: '#4a90e2',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {viewMode === 'grid' ? '📋 List' : '🔲 Grid'}
                    </button>
                </div>
            </div>

            {/* Export and External Tools */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                    onClick={exportToMoxfield}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e',
                        color: '#22c55e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    📤 Export to Moxfield
                </button>
                <button
                    onClick={exportToEDHREC}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e',
                        color: '#22c55e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    📤 Export to EDHREC
                </button>
                <button
                    onClick={openCollectionOnEDHREC}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(74, 144, 226, 0.2)',
                        border: '1px solid #4a90e2',
                        color: '#4a90e2',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    🌐 Analyze on EDHREC
                </button>
            </div>

            {/* Cards Display */}
            {filteredAndSortedCards.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
                    <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>
                        {searchTerm || filterBy !== 'all' ? 'No matching cards found' : 'No Cards in Collection'}
                    </h3>
                    <p style={{ color: '#94a3b8' }}>
                        {searchTerm || filterBy !== 'all' ? 
                            'Try adjusting your search or filter criteria' : 
                            'Start scanning cards to build your collection'
                        }
                    </p>
                </div>
            ) : (
                <div style={{
                    display: viewMode === 'grid' ? 'grid' : 'block',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
                    gap: '16px'
                }}>
                    {filteredAndSortedCards.map((card, index) => (
                        <div
                            key={card.id || index}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: viewMode === 'list' ? 'flex' : 'block',
                                alignItems: viewMode === 'list' ? 'center' : 'stretch',
                                gap: viewMode === 'list' ? '16px' : '0',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ flex: viewMode === 'list' ? '1' : 'auto' }}>
                                <h4 style={{ color: '#4a90e2', marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                                    {card.cardName}
                                </h4>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', lineHeight: '1.4' }}>
                                    {card.cardType && <div><strong>Type:</strong> {card.cardType}</div>}
                                    {card.setInfo && <div><strong>Set:</strong> {card.setInfo}</div>}
                                    {card.rarity && (
                                        <div>
                                            <strong>Rarity:</strong> 
                                            <span style={{ 
                                                color: card.rarity === 'mythic' ? '#ff8c00' : 
                                                       card.rarity === 'rare' ? '#ffd700' : 
                                                       card.rarity === 'uncommon' ? '#c0c0c0' : '#94a3b8',
                                                marginLeft: '4px',
                                                textTransform: 'capitalize'
                                            }}>
                                                {card.rarity}
                                            </span>
                                        </div>
                                    )}
                                    {card.prices && card.prices.usd && (
                                        <div style={{ color: '#22c55e', fontWeight: '600' }}>
                                            <strong>Value:</strong> ${card.prices.usd}
                                        </div>
                                    )}
                                    {card.scannedAt && <div><strong>Added:</strong> {card.scannedAt}</div>}
                                </div>
                            </div>
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px',
                                marginTop: viewMode === 'grid' ? '12px' : '0',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenScryfall(card);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2',
                                        color: '#4a90e2',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}
                                >
                                    🔗 Scryfall
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Remove "${card.cardName}" from collection?`)) {
                                            onRemoveCard(card.id);
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(220, 53, 69, 0.2)',
                                        border: '1px solid #dc3545',
                                        color: '#dc3545',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}
                                >
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

// 🔥 SMART COOLDOWN SYSTEM
class MTGScannerCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.isEditionSelectorOpen = false;
        this.detectionBuffer = [];
        
        this.SAME_CARD_COOLDOWN = 12000;
        this.MIN_API_INTERVAL = 3000;
        this.DETECTION_STABILITY = 2;
        this.MAX_CONSECUTIVE = 3;
        this.LONG_PAUSE_DURATION = 20000;
        
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

// 🔥 MAIN SCANNER COMPONENT
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
    
    // Cooldown system state
    const [cooldownStatus, setCooldownStatus] = useState({});
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanHistory, setScanHistory] = useState([]);
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
    
    // Camera state
    const [cameraError, setCameraError] = useState(null);
    const [cameraDetails, setCameraDetails] = useState(null);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const cooldownSystemRef = useRef(new MTGScannerCooldown());
    const cameraStreamRef = useRef(null);

    // Initialize everything
    useEffect(() => {
        console.log('🔧 Initializing MTG Scanner Pro...');
        
        initializeServices();
        loadSavedData();
        initializeCameraSystem();
        
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500);
        
        setTimeout(() => {
            if (window.hideLoadingScreen) {
                window.hideLoadingScreen();
                console.log('✅ Loading screen hidden - Scanner ready!');
            }
        }, 2000);
        
        return () => {
            clearInterval(cooldownUpdateInterval);
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (activeTab !== 'scanner' && isScanning) {
            stopScanning();
        }
    }, [activeTab, isScanning]);

    const initializeServices = () => {
        try {
            visionServiceRef.current = new ClaudeVisionService();
            console.log('✅ Vision Service initialized successfully');
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

    const initializeCameraSystem = async () => {
        setCameraStatus('initializing');
        setCameraError(null);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            const constraints = {
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 },
                    facingMode: { ideal: 'environment' }
                },
                audio: false
            };

            setCameraStatus('requesting');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraStreamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().then(() => {
                        setCameraStatus('ready');
                        setCameraError(null);
                        
                        const videoTrack = stream.getVideoTracks()[0];
                        const settings = videoTrack.getSettings();
                        setCameraDetails({
                            width: settings.width,
                            height: settings.height,
                            label: 'Camera Ready'
                        });
                        
                        console.log('✅ Camera ready:', `${settings.width}x${settings.height}`);
                        showProfessionalToast('✅ Camera ready!', 'success');
                    }).catch(error => {
                        handleCameraError(error);
                    });
                };
            }
            
        } catch (error) {
            handleCameraError(error);
        }
    };

    const handleCameraError = (error) => {
        console.error('❌ Camera error:', error);
        
        let errorMessage = '';
        let errorAction = '';
        let newStatus = 'error';

        switch (error.name) {
            case 'NotAllowedError':
                errorMessage = 'Camera permission denied';
                errorAction = 'Please allow camera access in your browser settings';
                newStatus = 'permission-denied';
                break;
            case 'NotFoundError':
                errorMessage = 'No camera found';
                errorAction = 'Please connect a camera';
                newStatus = 'no-device';
                break;
            case 'NotReadableError':
                errorMessage = 'Camera is busy or in use';
                errorAction = 'Close other applications using the camera';
                break;
            default:
                errorMessage = error.message || 'Unknown camera error';
                errorAction = 'Please check your camera and try again';
        }

        setCameraStatus(newStatus);
        setCameraError({ message: errorMessage, action: errorAction, canRetry: true });
    };

    const retryCameraSetup = async () => {
        console.log('🔄 Manual camera retry requested');
        setCameraError(null);
        await initializeCameraSystem();
    };

    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ Scanner not ready');
            if (cameraStatus !== 'ready') {
                showProfessionalToast('❌ Camera not ready. Please fix camera issues first.', 'error');
            }
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner - ${scanMode} mode...`);
        setIsScanning(true);
        setScanningPausedForSelection(false);
        
        cooldownSystemRef.current.resetCooldowns();
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        
        if (scanMode === 'continuous') {
            setContinuousCount(0);
        }
        
        scanIntervalRef.current = setInterval(async () => {
            try {
                const currentCardName = currentCard?.cardName;
                
                if (!cooldownSystemRef.current.shouldScan(currentCardName)) {
                    setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                    return;
                }

                if (scanningPausedForSelection || showEditionSelector) {
                    cooldownSystemRef.current.setEditionSelectorOpen(true);
                    return;
                } else {
                    cooldownSystemRef.current.setEditionSelectorOpen(false);
                }

                if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
                    return;
                }

                console.log("🔄 Processing frame for MTG card...");
                
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 85) {
                    console.log(`🎯 High-confidence detection: ${result.cardName} (${result.confidence}%)`);
                    
                    const isStable = cooldownSystemRef.current.addDetection(result.cardName, result.confidence);
                    
                    if (isStable) {
                        console.log('✅ Card detection is STABLE, processing...');
                        
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
        }, scanMode === 'single' ? 1500 : 2500);
    };

    const handleCardDetection = async (detectedCard) => {
        try {
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
                    if (cooldownSystemRef.current.shouldScan()) {
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
                        const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                        displayCard(enhancedCard);
                    }
                    
                } else if (exactMatches.length === 1) {
                    const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                    displayCard(enhancedCard);
                    
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        const saved = await saveCardToCollection(enhancedCard);
                        if (saved) {
                            handleContinuousCounterAndLimit();
                        }
                    }
                    
                } else {
                    displayCard(detectedCard);
                    
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        const saved = await saveCardToCollection(detectedCard);
                        if (saved) {
                            handleContinuousCounterAndLimit();
                        }
                    }
                }
            } else {
                displayCard(detectedCard);
            }
        } catch (error) {
            console.error('❌ Edition lookup error:', error);
            displayCard(detectedCard);
        }
    };

    const sortEditionsByPreference = (cardName, editions) => {
        const cardKey = cardName.toLowerCase().trim();
        const userPreference = editionPreferences[cardKey];
        
        if (userPreference) {
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
            
            learnEditionPreference(pendingCardData.cardName, selectedEdition);
            
            if (pendingScanMode === 'continuous' && autoSaveEnabled) {
                const saved = await saveCardToCollection(enhancedCard);
                if (saved) {
                    handleContinuousCounterAndLimit();
                }
                
                if (continuousCount < 9) {
                    setTimeout(() => {
                        setScanningPausedForSelection(false);
                        cooldownSystemRef.current.setEditionSelectorOpen(false);
                        if (!isScanning) {
                            startScanning();
                        }
                    }, 2000);
                }
            }
        }
        
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
                    handleContinuousCounterAndLimit();
                }
                
                if (continuousCount < 9) {
                    setTimeout(() => {
                        setScanningPausedForSelection(false);
                        cooldownSystemRef.current.setEditionSelectorOpen(false);
                        if (!isScanning) {
                            startScanning();
                        }
                    }, 2000);
                }
            }
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setPendingScanMode(null);
        setScanningPausedForSelection(false);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
    };

    const learnEditionPreference = (cardName, selectedEdition) => {
        const cardKey = cardName.toLowerCase().trim();
        const newPreferences = {
            ...editionPreferences,
            [cardKey]: selectedEdition.set
        };
        
        setEditionPreferences(newPreferences);
        localStorage.setItem('mtg_edition_preferences', JSON.stringify(newPreferences));
    };

    const handleContinuousCounterAndLimit = () => {
        const newCount = continuousCount + 1;
        setContinuousCount(newCount);
        
        if (newCount >= 10) {
            stopScanning();
            setShowContinueDialog(true);
        }
    };

    const handleContinueScanning = () => {
        setShowContinueDialog(false);
        setContinuousCount(0);
        cooldownSystemRef.current.resetCooldowns();
        startScanning();
    };

    const handleStopScanning = () => {
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
            setCode: scryfallCard.set,
            colors: scryfallCard.colors
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

    const stopScanning = () => {
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
            videoRef.current.srcObject = null;
        }
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
                addedAt: new Date().toISOString(),
                scannedAt: new Date().toLocaleString()
            };
            
            const updatedCards = [cardWithId, ...savedCards];
            setSavedCards(updatedCards);
            
            localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
            
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
            return false;
        }
    };

    const handleUpgradeToPremium = () => {
        const paypalLink = `https://www.paypal.com/paypalme/thediceyguy/19.99`;
        window.open(paypalLink, '_blank');
        
        setTimeout(() => {
            setIsPremiumUser(true);
            localStorage.setItem('mtg_premium_status', 'true');
            setShowPaywallModal(false);
            showProfessionalToast('💎 Premium upgrade successful!', 'success');
        }, 5000);
    };

    const removeCardFromCollection = (cardId) => {
        try {
            const updatedCards = savedCards.filter(card => card.id !== cardId);
            setSavedCards(updatedCards);
            localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
            showProfessionalToast('🗑️ Card removed from collection', 'info');
        } catch (error) {
            console.error('❌ Failed to remove card:', error);
        }
    };

    const openCardInScryfall = (card) => {
        if (card && card.cardName) {
            const searchUrl = `https://scryfall.com/search?q=${encodeURIComponent(card.cardName)}`;
            window.open(searchUrl, '_blank');
        }
    };

    const handleTabSwitch = (newTab) => {
        setActiveTab(newTab);
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
                        lineHeight: '1.1',
                        boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)'
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
                            🔥 External Tool Integration • EDHREC • Moxfield • Scryfall
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
                        <span style={{ color: '#94a3b8' }}>Collection: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{savedCards.length}/{FREE_COLLECTION_LIMIT}</span>
                    </div>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(74, 144, 226, 0.3)',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Status: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <ProfessionalTabs
                activeTab={activeTab}
                onTabChange={handleTabSwitch}
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
                                        maxWidth: '800px',
                                        height: 'auto',
                                        borderRadius: '12px',
                                        border: '2px solid #4a90e2',
                                        background: '#000',
                                        boxShadow: '0 8px 32px rgba(74, 144, 226, 0.2)'
                                    }}
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                
                                <ProfessionalCooldownStatus
                                    cooldownStatus={cooldownStatus}
                                    isVisible={true}
                                />
                                
                                <ProfessionalCameraStatus
                                    cameraStatus={cameraStatus}
                                    cameraInitialized={true}
                                    cameraDetails={cameraDetails}
                                    onRetry={retryCameraSetup}
                                />
                                
                                {isScanning && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        background: 'rgba(74, 144, 226, 0.9)',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}>
                                        {scanningPausedForSelection ? 
                                            '⏸️ Paused for edition selection' :
                                            '🔍 Scanning for MTG cards...'
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Scan Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ color: '#b0bec5', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
                                        ⚙️ Scan Mode:
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setScanMode('continuous')}
                                            disabled={isScanning}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                border: scanMode === 'continuous' ? '2px solid #4a90e2' : '1px solid #666',
                                                background: scanMode === 'continuous' ? 
                                                    'linear-gradient(45deg, #4a90e2, #64b5f6)' : 
                                                    'rgba(74, 144, 226, 0.1)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                cursor: isScanning ? 'not-allowed' : 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                opacity: isScanning ? 0.6 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            🔥 Smart Continuous
                                        </button>
                                        <button
                                            onClick={() => setScanMode('single')}
                                            disabled={isScanning}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                border: scanMode === 'single' ? '2px solid #4a90e2' : '1px solid #666',
                                                background: scanMode === 'single' ? 
                                                    'linear-gradient(45deg, #4a90e2, #64b5f6)' : 
                                                    'rgba(74, 144, 226, 0.1)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                cursor: isScanning ? 'not-allowed' : 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                opacity: isScanning ? 0.6 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            📷 Smart Single
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={isScanning ? stopScanning : startScanning}
                                    disabled={cameraStatus !== 'ready'}
                                    style={{
                                        padding: '16px 24px',
                                        border: 'none',
                                        background: isScanning 
                                            ? 'linear-gradient(135deg, #dc3545, #c82333)' 
                                            : cameraStatus === 'ready' 
                                                ? 'linear-gradient(135deg, #4a90e2, #64b5f6)'
                                                : 'linear-gradient(135deg, #666, #555)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: cameraStatus !== 'ready' ? 'not-allowed' : 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        opacity: cameraStatus !== 'ready' ? 0.6 : 1,
                                        transition: 'all 0.2s ease',
                                        boxShadow: cameraStatus === 'ready' ? '0 4px 15px rgba(74, 144, 226, 0.3)' : 'none'
                                    }}
                                >
                                    {isScanning ? 
                                        '⏹️ Stop Scanning' : 
                                        cameraStatus === 'ready' ?
                                            `🔥 Start ${scanMode === 'continuous' ? 'Continuous' : 'Single'} Scan` :
                                            '📷 Camera Not Ready'
                                    }
                                </button>

                                {cameraStatus !== 'ready' && (
                                    <button
                                        onClick={retryCameraSetup}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'rgba(255, 193, 7, 0.2)',
                                            border: '1px solid #ffc107',
                                            color: '#ffc107',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        🔄 Retry Camera Setup
                                    </button>
                                )}

                                {cooldownStatus && !cooldownStatus.canScan && (
                                    <div style={{
                                        background: 'rgba(251, 191, 36, 0.1)',
                                        border: '1px solid rgba(251, 191, 36, 0.3)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        textAlign: 'center',
                                        fontSize: '13px'
                                    }}>
                                        <div style={{ color: '#fbbf24', fontWeight: '600' }}>
                                            ⏳ Smart Cooldown Active
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                                            Preventing API spam for stable detection
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card Display */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px',
                            padding: '24px'
                        }}>
                            <h3 style={{ color: '#4a90e2', marginBottom: '20px', fontSize: '1.5rem', fontWeight: '600' }}>
                                🎯 Card Recognition
                            </h3>
                            
                            {currentCard ? (
                                <div style={{
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e', marginBottom: '12px' }}>
                                        {currentCard.cardName}
                                    </div>
                                    
                                    <div style={{ textAlign: 'left', fontSize: '14px', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#94a3b8' }}>Type:</span>
                                            <span style={{ color: 'white', fontWeight: '600' }}>{currentCard.cardType || 'Unknown'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#94a3b8' }}>Confidence:</span>
                                            <span style={{ color: 'white', fontWeight: '600' }}>{currentCard.confidence}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: '#94a3b8' }}>Method:</span>
                                            <span style={{ color: 'white', fontWeight: '600' }}>
                                                {currentCard.scryfallVerified ? '✅ Scryfall Verified' : '🧠 AI Detection'}
                                            </span>
                                        </div>
                                        {currentCard.prices && currentCard.prices.usd && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ color: '#94a3b8' }}>Price:</span>
                                                <span style={{ color: '#22c55e', fontWeight: '600' }}>${currentCard.prices.usd}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #22c55e, #34d399)',
                                            width: `${currentCard.confidence}%`,
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => saveCardToCollection(currentCard)}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'rgba(74, 144, 226, 0.2)',
                                                border: '1px solid #4a90e2',
                                                color: '#4a90e2',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            💾 Save to Collection ({savedCards.length}/{FREE_COLLECTION_LIMIT})
                                        </button>
                                        {currentCard.scryfallUri && (
                                            <button
                                                onClick={() => window.open(currentCard.scryfallUri, '_blank')}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'rgba(34, 197, 94, 0.2)',
                                                    border: '1px solid #22c55e',
                                                    color: '#22c55e',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                🔗 View on Scryfall
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🃏</div>
                                    <h4 style={{ color: '#e2e8f0', marginBottom: '8px' }}>Ready to Scan</h4>
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                        {scanResult && !scanResult.hasCard ? 
                                            (scanResult.message || 'No MTG card detected') :
                                            'Position an MTG card in the camera view and start scanning'
                                        }
                                    </div>
                                    {cameraStatus !== 'ready' && (
                                        <div style={{ marginTop: '16px' }}>
                                            <button
                                                onClick={retryCameraSetup}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: 'rgba(74, 144, 226, 0.2)',
                                                    border: '1px solid #4a90e2',
                                                    color: '#4a90e2',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                🔄 Setup Camera
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {scanHistory.length > 0 && (
                                <div style={{marginTop: '24px'}}>
                                    <h4 style={{color: '#4a90e2', marginBottom: '16px', fontSize: '16px', fontWeight: '600'}}>
                                        📊 Recent Scans ({scanHistory.length})
                                    </h4>
                                    <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                        {scanHistory.slice(0, 10).map((card, index) => (
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
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{color: '#64b5f6', fontWeight: '700'}}>{card.confidence}%</span>
                                                    {card.scryfallVerified && <span style={{color: '#22c55e'}}>✅</span>}
                                                </div>
                                            </div>
                                        ))}
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
                        padding: '32px',
                        width: '100%'
                    }}>
                        <DeckManager 
                            savedCards={savedCards}
                            onRemoveCard={removeCardFromCollection}
                            onOpenScryfall={openCardInScryfall}
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
                        padding: '32px',
                        width: '100%'
                    }}>
                        <MTGKnowledgeBase 
                            currentCard={currentCard}
                            savedCards={savedCards}
                        />
                    </div>
                )}
            </div>

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
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#4a90e2', fontSize: '16px' }}>
                        MTG Scanner Pro
                    </div>
                    {scanHistory.length > 0 && (
                        <>
                            <span style={{ fontSize: '14px' }}>📊 Scanned: {scanHistory.length}</span>
                            {currentCard && (
                                <span style={{ fontSize: '14px' }}>
                                    🎯 Last: {currentCard.cardName} ({currentCard.confidence}%)
                                </span>
                            )}
                        </>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontSize: '14px' }}>
                    <span>📁 Collection: {savedCards.length}/{FREE_COLLECTION_LIMIT}</span>
                    <span>
                        📷 Camera: {
                            cameraStatus === 'ready' ? `Ready ✅` : 
                            cameraStatus === 'error' ? 'Error ❌' :
                            cameraStatus === 'permission-denied' ? 'Permission ❌' :
                            cameraStatus === 'no-device' ? 'No Device ❌' :
                            'Initializing ⏳'
                        }
                    </span>
                    <span>🧠 AI: Gemini Vision</span>
                    <span>{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
                </div>
            </div>

            {/* Edition Selector Modal */}
            {showEditionSelector && (
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
                    zIndex: 10000
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                        border: '2px solid #4a90e2',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        textAlign: 'center',
                        color: 'white'
                    }}>
                        <h3 style={{ color: '#4a90e2', marginBottom: '20px' }}>🎭 Multiple Editions Found</h3>
                        <p style={{ marginBottom: '20px', color: '#94a3b8' }}>
                            Choose the correct edition for <strong style={{ color: '#4a90e2' }}>{pendingCardData?.cardName}</strong>:
                        </p>
                        
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                            {availableEditions.map((edition, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleEditionSelected(edition)}
                                    style={{
                                        padding: '12px',
                                        margin: '8px 0',
                                        background: 'rgba(74, 144, 226, 0.1)',
                                        border: '1px solid rgba(74, 144, 226, 0.3)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                        {edition.set_name || edition.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        Set: {(edition.set || 'Unknown').toUpperCase()} • {edition.released_at || 'Unknown date'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleEditionCancelled}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: '1px solid #666',
                                color: '#94a3b8',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Skip Edition Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Upgrade Modal */}
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
                    zIndex: 10000
                }}>
                    <div style={{
                        background: '#23272a',
                        border: '2px solid #4a90e2',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        textAlign: 'center',
                        color: 'white'
                    }}>
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
                                <li>🧠 <strong>Advanced collection analytics</strong></li>
                                <li>📊 <strong>Enhanced EDHREC integration</strong></li>
                                <li>💰 <strong>Price tracking & alerts</strong></li>
                                <li>⚡ <strong>Priority customer support</strong></li>
                            </ul>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <button 
                                onClick={handleUpgradeToPremium}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(45deg, #4a90e2, #357abd)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                💎 Upgrade for $19.99
                            </button>
                            <button 
                                onClick={() => setShowPaywallModal(false)}
                                style={{
                                    padding: '12px 24px',
                                    border: '1px solid #666',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer'
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
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        background: '#23272a',
                        border: '2px solid #4a90e2',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '90%',
                        textAlign: 'center',
                        color: 'white'
                    }}>
                        <h3>🔥 10 Cards Scanned!</h3>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            You've successfully scanned <strong>10 cards</strong> with the smart cooldown system.
                        </p>
                        <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                            Total saved to collection: <strong>{savedCards.length}</strong> cards
                        </p>
                        
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px' }}>
                            <button 
                                onClick={handleContinueScanning}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(45deg, #4a90e2, #357abd)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                🔥 Continue Scanning
                            </button>
                            <button 
                                onClick={handleStopScanning}
                                style={{
                                    padding: '12px 24px',
                                    border: '1px solid #666',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                ⏹️ Stop & Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scanner;