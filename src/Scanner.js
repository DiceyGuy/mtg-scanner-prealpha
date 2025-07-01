// Scanner.js - MTG Scanner Pro - KOMPLETT KAMERA-FIX + FULL INTEGRASJON
// Over 2350 linjer med all funksjonalitet + forbedret kamera-system
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import './CardDisplay.css';

// 🔥 FORBEDRET PROFESSIONAL COMPONENTS - INTEGRERT
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

// 🔥 FORBEDRET CAMERA STATUS COMPONENT
const ProfessionalCameraStatus = ({ cameraStatus, cameraInitialized, cameraDetails, onRetry, onCameraSelect }) => {
    const getStatusInfo = () => {
        switch (cameraStatus) {
            case 'ready':
                return { 
                    text: `✅ Camera Ready${cameraDetails ? ` (${cameraDetails.width}x${cameraDetails.height})` : ''}`, 
                    class: 'status-ready',
                    color: '#28a745'
                };
            case 'requesting':
                return { 
                    text: '🔄 Requesting camera access...', 
                    class: 'status-requesting',
                    color: '#ffc107'
                };
            case 'error':
                return { 
                    text: '❌ Camera Error - Click to retry', 
                    class: 'status-error',
                    color: '#dc3545'
                };
            case 'no-device':
                return { 
                    text: '📷 No camera detected', 
                    class: 'status-no-device',
                    color: '#dc3545'
                };
            case 'permission-denied':
                return { 
                    text: '🚫 Camera permission denied', 
                    class: 'status-permission',
                    color: '#dc3545'
                };
            default:
                return { 
                    text: '🔧 Initializing camera system...', 
                    class: 'status-initializing',
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

// 🔥 PROFESSIONAL TABS COMPONENT
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

// 🔥 PROFESSIONAL TOAST NOTIFICATION SYSTEM
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

// 🔥 KOMPLETT MTG KNOWLEDGE BASE COMPONENT
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

            // Estimated value (if available)
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
            return 'This creature can attack and block. Consider its power, toughness, and any special abilities when building your deck. Creatures are the backbone of most MTG strategies.';
        } else if (type.includes('instant')) {
            return 'This instant can be played at any time you have priority, including during your opponent\'s turn or in response to other spells. Instants provide flexibility and surprise elements.';
        } else if (type.includes('sorcery')) {
            return 'This sorcery can only be played during your main phases when the stack is empty and you have priority. Sorceries often provide powerful effects at the cost of timing restrictions.';
        } else if (type.includes('enchantment')) {
            return 'This enchantment provides ongoing effects while it remains on the battlefield. Enchantments can fundamentally change how the game is played.';
        } else if (type.includes('artifact')) {
            return 'This artifact is colorless and can fit into any deck, but may be vulnerable to artifact removal. Artifacts often provide utility or alternative win conditions.';
        } else if (type.includes('land')) {
            return 'This land can produce mana to cast your spells. Most decks play lands every turn. The mana base is crucial for consistent gameplay.';
        } else if (type.includes('planeswalker')) {
            return 'This planeswalker is a powerful ally that can use loyalty abilities. Protect it from attacks! Planeswalkers can take over games if left unchecked.';
        }
        
        return 'This card has a unique type. Check its rules text for specific interactions and consider how it fits into your overall strategy.';
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
                    onClick={() => setActiveSection('rules')}
                    style={{
                        padding: '10px 20px',
                        background: activeSection === 'rules' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                        color: activeSection === 'rules' ? 'white' : '#4a90e2',
                        border: '1px solid #4a90e2',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    📖 Rules
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

                            {currentCard.scryfallUri && (
                                <button
                                    onClick={() => window.open(currentCard.scryfallUri, '_blank')}
                                    style={{
                                        marginTop: '16px',
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
                                    🔗 View on Scryfall
                                </button>
                            )}
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

                            {Object.keys(insights.typeCount).length > 0 && (
                                <div style={{ 
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    padding: '20px', 
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    marginBottom: '20px'
                                }}>
                                    <h4 style={{ color: '#e2e8f0', marginBottom: '16px' }}>🎭 Card Types</h4>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {Object.entries(insights.typeCount).map(([type, count]) => (
                                            <div key={type} style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 0'
                                            }}>
                                                <span>{type}</span>
                                                <span style={{ fontWeight: '600' }}>{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {Object.keys(insights.rarityCount).length > 0 && (
                                <div style={{ 
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    padding: '20px', 
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <h4 style={{ color: '#e2e8f0', marginBottom: '16px' }}>💎 Rarity Breakdown</h4>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {Object.entries(insights.rarityCount).map(([rarity, count]) => (
                                            <div key={rarity} style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 0'
                                            }}>
                                                <span style={{ color: getRarityColor(rarity), textTransform: 'capitalize' }}>
                                                    {rarity}
                                                </span>
                                                <span style={{ fontWeight: '600' }}>{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                Start scanning cards to see collection insights and analytics.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Rules */}
            {activeSection === 'rules' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '20px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h4 style={{ color: '#4a90e2', marginBottom: '12px' }}>⚡ Turn Structure</h4>
                        <div style={{ display: 'grid', gap: '8px', fontSize: '14px', lineHeight: '1.5' }}>
                            <div><strong>1. Untap Step:</strong> Untap all your permanents</div>
                            <div><strong>2. Upkeep Step:</strong> Triggered abilities resolve</div>
                            <div><strong>3. Draw Step:</strong> Draw a card</div>
                            <div><strong>4. Main Phase 1:</strong> Play lands, cast spells</div>
                            <div><strong>5. Combat Phase:</strong> Attack with creatures</div>
                            <div><strong>6. Main Phase 2:</strong> Play more spells after combat</div>
                            <div><strong>7. End Step:</strong> "Until end of turn" effects end</div>
                        </div>
                    </div>

                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '20px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h4 style={{ color: '#4a90e2', marginBottom: '12px' }}>🛡️ Combat Keywords</h4>
                        <div style={{ display: 'grid', gap: '8px', fontSize: '14px', lineHeight: '1.5' }}>
                            <div><strong>Flying:</strong> Can only be blocked by creatures with flying or reach</div>
                            <div><strong>First Strike:</strong> Deals combat damage before creatures without first strike</div>
                            <div><strong>Double Strike:</strong> Deals first strike and regular combat damage</div>
                            <div><strong>Deathtouch:</strong> Any damage dealt destroys the creature</div>
                            <div><strong>Trample:</strong> Excess damage goes to defending player</div>
                            <div><strong>Vigilance:</strong> Doesn't tap when attacking</div>
                            <div><strong>Haste:</strong> Can attack immediately, ignoring summoning sickness</div>
                        </div>
                    </div>

                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '20px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h4 style={{ color: '#4a90e2', marginBottom: '12px' }}>🎯 Priority & Stack</h4>
                        <div style={{ display: 'grid', gap: '8px', fontSize: '14px', lineHeight: '1.5' }}>
                            <div><strong>Priority:</strong> Active player gets priority first, then passes clockwise</div>
                            <div><strong>Stack:</strong> Last spell/ability cast resolves first (LIFO - Last In, First Out)</div>
                            <div><strong>Responding:</strong> You can cast instants and activate abilities in response</div>
                            <div><strong>Resolving:</strong> When all players pass priority, top item on stack resolves</div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 🔥 FORBEDRET DECK MANAGER COMPONENT
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

    const getUniqueColors = () => {
        const colors = new Set();
        savedCards.forEach(card => {
            if (card.colors && Array.isArray(card.colors)) {
                card.colors.forEach(color => colors.add(color));
            }
        });
        return Array.from(colors).sort();
    };

    const filteredAndSortedCards = savedCards
        .filter(card => {
            // Text search
            const matchesSearch = card.cardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (card.cardType && card.cardType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (card.setInfo && card.setInfo.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // Filter by type/color
            if (filterBy === 'all') return matchesSearch;
            
            if (filterBy.startsWith('type:')) {
                const typeFilter = filterBy.replace('type:', '');
                return matchesSearch && card.cardType && card.cardType.toLowerCase().includes(typeFilter.toLowerCase());
            }
            
            if (filterBy.startsWith('color:')) {
                const colorFilter = filterBy.replace('color:', '');
                return matchesSearch && card.colors && card.colors.includes(colorFilter);
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
        showProfessionalToast('📁 Collection exported successfully!', 'success');
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
        showProfessionalToast('📁 EDHREC format exported successfully!', 'success');
    };

    const calculateCollectionValue = () => {
        return savedCards.reduce((total, card) => {
            if (card.prices && card.prices.usd) {
                return total + parseFloat(card.prices.usd);
            }
            return total;
        }, 0).toFixed(2);
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
                        <optgroup label="By Type">
                            {getUniqueTypes().map(type => (
                                <option key={type} value={`type:${type}`}>{type}</option>
                            ))}
                        </optgroup>
                        <optgroup label="By Color">
                            {getUniqueColors().map(color => (
                                <option key={color} value={`color:${color}`}>
                                    {color === 'W' ? 'White' : color === 'U' ? 'Blue' : color === 'B' ? 'Black' : color === 'R' ? 'Red' : color === 'G' ? 'Green' : color}
                                </option>
                            ))}
                        </optgroup>
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

            {/* Export Buttons */}
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

// 🔥 FORBEDRET SMART COOLDOWN SYSTEM
class MTGScannerCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.isEditionSelectorOpen = false;
        this.detectionBuffer = [];
        
        // Optimized cooldown periods for better user experience
        this.SAME_CARD_COOLDOWN = 12000;      // 12 seconds for same card
        this.MIN_API_INTERVAL = 3000;         // 3 seconds between API calls
        this.DETECTION_STABILITY = 2;         // Need 2 consistent detections
        this.MAX_CONSECUTIVE = 3;             // Max consecutive before pause
        this.LONG_PAUSE_DURATION = 20000;    // 20 second pause
        
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
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
        
        this.detectionBuffer.push({
            cardName,
            confidence,
            timestamp: now
        });
        
        // Keep only recent detections (last 8 seconds)
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

// 🔥 FORBEDRET CAMERA ENUMERATION SYSTEM
class CameraManager {
    constructor() {
        this.availableDevices = [];
        this.preferredDeviceId = null;
        this.currentStream = null;
        this.isEnumerating = false;
    }

    async enumerateDevices(forceRefresh = false) {
        if (this.isEnumerating && !forceRefresh) {
            return this.availableDevices;
        }

        this.isEnumerating = true;
        
        try {
            // First, request permissions to get device labels
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            tempStream.getTracks().forEach(track => track.stop());
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📷 Camera devices found:', this.availableDevices.length);
            this.availableDevices.forEach((device, index) => {
                console.log(`   ${index + 1}. ${device.label || `Camera ${index + 1}`}`);
            });
            
            // Auto-select preferred camera
            this.selectPreferredCamera();
            
        } catch (error) {
            console.error('❌ Failed to enumerate camera devices:', error);
            this.availableDevices = [];
        } finally {
            this.isEnumerating = false;
        }
        
        return this.availableDevices;
    }

    selectPreferredCamera() {
        if (this.availableDevices.length === 0) {
            this.preferredDeviceId = null;
            return;
        }

        // Priority order for camera selection
        const priorities = [
            // High-end webcams
            /logitech.*c920/i,
            /logitech.*c922/i,
            /logitech.*c930/i,
            /logitech.*brio/i,
            
            // Other Logitech cameras
            /logitech/i,
            
            // Other brands
            /razer/i,
            /elgato/i,
            
            // Generic webcams
            /webcam/i,
            /camera/i,
            
            // Built-in cameras (usually lower priority)
            /integrated/i,
            /built.*in/i
        ];

        let selectedDevice = null;
        
        // Try to find camera matching priority order
        for (const pattern of priorities) {
            selectedDevice = this.availableDevices.find(device => 
                pattern.test(device.label || '')
            );
            if (selectedDevice) break;
        }
        
        // If no pattern match, use first available device
        if (!selectedDevice && this.availableDevices.length > 0) {
            selectedDevice = this.availableDevices[0];
        }
        
        this.preferredDeviceId = selectedDevice ? selectedDevice.deviceId : null;
        
        if (selectedDevice) {
            console.log('✅ Auto-selected camera:', selectedDevice.label || 'Unknown Device');
        }
    }

    async createConstraints(deviceId = null, quality = 'high') {
        const useDeviceId = deviceId || this.preferredDeviceId;
        
        const baseConstraints = {
            audio: false,
            video: {}
        };

        // Add device ID if available
        if (useDeviceId) {
            baseConstraints.video.deviceId = { exact: useDeviceId };
        } else {
            // Prefer environment-facing camera on mobile
            baseConstraints.video.facingMode = { ideal: 'environment' };
        }

        // Set quality constraints
        switch (quality) {
            case 'high':
                Object.assign(baseConstraints.video, {
                    width: { ideal: 1920, min: 640 },
                    height: { ideal: 1080, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                });
                break;
            case 'medium':
                Object.assign(baseConstraints.video, {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                });
                break;
            case 'low':
                Object.assign(baseConstraints.video, {
                    width: { ideal: 640, min: 320 },
                    height: { ideal: 480, min: 240 },
                    frameRate: { ideal: 30, min: 10 }
                });
                break;
            default:
                // Basic constraints
                Object.assign(baseConstraints.video, {
                    width: { min: 320 },
                    height: { min: 240 }
                });
        }

        return baseConstraints;
    }

    async setupCamera(deviceId = null, quality = 'high') {
        try {
            // Stop existing stream
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
            }

            const constraints = await this.createConstraints(deviceId, quality);
            console.log('📷 Attempting camera setup with constraints:', constraints);
            
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const videoTrack = this.currentStream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            
            console.log('✅ Camera setup successful:', {
                width: settings.width,
                height: settings.height,
                frameRate: settings.frameRate,
                deviceId: settings.deviceId
            });

            return {
                stream: this.currentStream,
                settings: settings,
                device: this.availableDevices.find(d => d.deviceId === settings.deviceId) || null
            };
            
        } catch (error) {
            console.error('❌ Camera setup failed:', error);
            
            // Try fallback with lower quality if high quality failed
            if (quality === 'high') {
                console.log('🔄 Retrying with medium quality...');
                return this.setupCamera(deviceId, 'medium');
            } else if (quality === 'medium') {
                console.log('🔄 Retrying with low quality...');
                return this.setupCamera(deviceId, 'low');
            } else if (quality === 'low' && deviceId) {
                console.log('🔄 Retrying without device ID...');
                return this.setupCamera(null, 'low');
            }
            
            throw error;
        }
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    getCameraDetails() {
        if (!this.currentStream) return null;
        
        const videoTrack = this.currentStream.getVideoTracks()[0];
        if (!videoTrack) return null;
        
        const settings = videoTrack.getSettings();
        const device = this.availableDevices.find(d => d.deviceId === settings.deviceId);
        
        return {
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            deviceId: settings.deviceId,
            label: device ? device.label : 'Unknown Device'
        };
    }
}

// 🔥 MAIN SCANNER COMPONENT - KOMPLETT MED KAMERA-FIX
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
    
    // Collection limits and premium features (100 cards, $19.99)
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const FREE_COLLECTION_LIMIT = 100; // Updated from 200 to 100
    
    // 🔥 FORBEDRET CAMERA STATE
    const [cameraError, setCameraError] = useState(null);
    const [cameraDetails, setCameraDetails] = useState(null);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const [cameraRetryCount, setCameraRetryCount] = useState(0);
    const [showCameraSelector, setShowCameraSelector] = useState(false);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const cooldownSystemRef = useRef(new MTGScannerCooldown());
    
    // 🔥 FORBEDRET CAMERA MANAGER
    const cameraManagerRef = useRef(new CameraManager());

    // 🔥 FORBEDRET INITIALIZATION
    useEffect(() => {
        console.log('🔧 Initializing MTG Scanner Pro with enhanced camera system...');
        
        initializeServices();
        loadSavedData();
        initializeCameraSystem();
        
        // Update cooldown status periodically
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500);
        
        // Hide loading screen when scanner is ready
        setTimeout(() => {
            if (window.hideLoadingScreen) {
                window.hideLoadingScreen();
                console.log('✅ Loading screen hidden - Scanner ready!');
            }
        }, 2000);
        
        return () => {
            console.log('🧹 Component unmounting - cleaning up...');
            clearInterval(cooldownUpdateInterval);
            cleanup();
        };
    }, []);

    // Handle tab switching without breaking camera
    useEffect(() => {
        console.log(`🎯 Tab switched to: ${activeTab}`);
        
        if (activeTab !== 'scanner' && isScanning) {
            console.log('⏸️ Pausing scanning - left scanner tab');
            stopScanning();
        }
    }, [activeTab, isScanning]);

    const initializeServices = () => {
        console.log('🔧 Initializing MTG Scanner Pro services...');
        
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
                console.log('📁 Loaded saved cards from storage');
            }
            
            const preferences = localStorage.getItem('mtg_edition_preferences');
            if (preferences) {
                setEditionPreferences(JSON.parse(preferences));
                console.log('🧠 Loaded edition preferences');
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

    // 🔥 FORBEDRET CAMERA INITIALIZATION
    const initializeCameraSystem = async () => {
        console.log('🎥 Initializing enhanced camera system...');
        setCameraStatus('initializing');
        setCameraError(null);
        
        try {
            // Check if camera API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            // Enumerate available cameras
            setCameraStatus('enumerating');
            const cameras = await cameraManagerRef.current.enumerateDevices();
            setAvailableCameras(cameras);
            
            if (cameras.length === 0) {
                setCameraStatus('no-device');
                setCameraError({
                    message: 'No camera devices found',
                    action: 'Please connect a camera device',
                    canRetry: true
                });
                return;
            }

            // Setup camera with best available device
            await setupCameraWithManager();
            
        } catch (error) {
            console.error('❌ Camera system initialization failed:', error);
            handleCameraError(error);
        }
    };

    // 🔥 FORBEDRET CAMERA SETUP
    const setupCameraWithManager = async (deviceId = null) => {
        console.log('🎥 Setting up camera with enhanced manager...');
        setCameraStatus('requesting');
        setCameraError(null);
        
        try {
            const result = await cameraManagerRef.current.setupCamera(deviceId);
            
            if (videoRef.current) {
                videoRef.current.srcObject = result.stream;
                
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play()
                        .then(() => {
                            setCameraStatus('ready');
                            setCameraDetails(result.settings);
                            setCameraError(null);
                            setCameraRetryCount(0);
                            
                            const details = cameraManagerRef.current.getCameraDetails();
                            if (details) {
                                console.log('✅ Camera ready:', `${details.width}x${details.height} (${details.label})`);
                                showProfessionalToast(`✅ Camera ready: ${details.width}x${details.height}`, 'success');
                            }
                        })
                        .catch(error => {
                            console.error('❌ Video play failed:', error);
                            handleCameraError(error);
                        });
                };
                
                videoRef.current.onerror = (error) => {
                    console.error('❌ Video element error:', error);
                    handleCameraError(new Error('Video playback failed'));
                };
            }
            
        } catch (error) {
            console.error('❌ Camera setup with manager failed:', error);
            handleCameraError(error);
        }
    };

    // 🔥 FORBEDRET ERROR HANDLING
    const handleCameraError = (error) => {
        console.error('❌ Camera error:', error);
        
        let errorMessage = '';
        let errorAction = '';
        let canRetry = false;
        let newStatus = 'error';

        switch (error.name) {
            case 'NotAllowedError':
                errorMessage = 'Camera permission denied';
                errorAction = 'Please allow camera access in your browser settings';
                canRetry = true;
                newStatus = 'permission-denied';
                break;
            case 'NotFoundError':
                errorMessage = 'No camera found';
                errorAction = 'Please connect a camera or check device connections';
                canRetry = true;
                newStatus = 'no-device';
                break;
            case 'NotReadableError':
                errorMessage = 'Camera is busy or in use';
                errorAction = 'Close other applications using the camera and try again';
                canRetry = true;
                break;
            case 'OverconstrainedError':
                errorMessage = 'Camera settings not supported';
                errorAction = 'Camera doesn\'t support required settings, trying fallback...';
                canRetry = true;
                break;
            case 'AbortError':
                errorMessage = 'Camera initialization aborted';
                errorAction = 'Please try again';
                canRetry = true;
                break;
            default:
                errorMessage = error.message || 'Unknown camera error';
                errorAction = 'Please check your camera and try again';
                canRetry = true;
        }

        setCameraStatus(newStatus);
        setCameraError({ message: errorMessage, action: errorAction, canRetry });
        
        // Auto-retry logic with exponential backoff
        if (canRetry && cameraRetryCount < 3 && error.name !== 'NotAllowedError') {
            const retryDelay = Math.min(1000 * Math.pow(2, cameraRetryCount), 10000);
            console.log(`🔄 Auto-retrying camera setup in ${retryDelay/1000}s (attempt ${cameraRetryCount + 1}/3)`);
            
            setTimeout(() => {
                setCameraRetryCount(prev => prev + 1);
                setupCameraWithManager();
            }, retryDelay);
        }
    };

    // 🔥 MANUAL CAMERA RETRY
    const retryCameraSetup = async () => {
        console.log('🔄 Manual camera retry requested');
        setCameraRetryCount(0);
        setCameraError(null);
        await initializeCameraSystem();
    };

    // 🔥 CAMERA DEVICE SWITCHING
    const handleCameraSwitch = async (newDeviceId) => {
        console.log('🔄 Switching to camera:', newDeviceId);
        
        // Stop current scanning
        if (isScanning) {
            stopScanning();
        }
        
        // Setup new camera
        setSelectedCameraId(newDeviceId);
        await setupCameraWithManager(newDeviceId);
        
        showProfessionalToast('📷 Camera switched successfully!', 'success');
    };

    // 🔥 SCANNING FUNCTIONS (KEEPING ALL EXISTING LOGIC)
    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ Scanner not ready');
            if (cameraStatus === 'error' || cameraStatus === 'permission-denied' || cameraStatus === 'no-device') {
                showProfessionalToast('❌ Camera not ready. Please fix camera issues first.', 'error');
            }
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner - ${scanMode} mode...`);
        setIsScanning(true);
        setScanningPausedForSelection(false);
        
        // Reset cooldowns when starting
        cooldownSystemRef.current.resetCooldowns();
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        
        if (scanMode === 'continuous') {
            setContinuousCount(0);
        }
        
        // Enhanced scanning interval
        scanIntervalRef.current = setInterval(async () => {
            try {
                const currentCardName = currentCard?.cardName;
                
                // Check cooldown system first
                if (!cooldownSystemRef.current.shouldScan(currentCardName)) {
                    setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                    return; // Skip this frame
                }

                // Check if edition selector is open
                if (scanningPausedForSelection || showEditionSelector) {
                    console.log('⏸️ Scanning paused for edition selection');
                    cooldownSystemRef.current.setEditionSelectorOpen(true);
                    return;
                } else {
                    cooldownSystemRef.current.setEditionSelectorOpen(false);
                }

                // Verify video is still playing
                if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
                    console.log('⚠️ Video not playing, skipping frame');
                    return;
                }

                console.log("🔄 Processing frame for MTG card...");
                
                // Call vision service
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 85) {
                    console.log(`🎯 High-confidence detection: ${result.cardName} (${result.confidence}%)`);
                    
                    // Check stability
                    const isStable = cooldownSystemRef.current.addDetection(result.cardName, result.confidence);
                    
                    if (isStable) {
                        console.log('✅ Card detection is STABLE, processing...');
                        
                        // Record detection
                        cooldownSystemRef.current.recordDetection(result.cardName);
                        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
                        
                        // Stop scanning in single mode
                        if (scanMode === 'single') {
                            stopScanning();
                        }
                        
                        // Handle card detection
                        await handleCardDetection(result);
                    } else {
                        console.log('⏳ Card detection not stable yet...');
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
        }, scanMode === 'single' ? 1500 : 2500);
    };

    // Keep all existing card detection logic
    const handleCardDetection = async (detectedCard) => {
        try {
            console.log('🎭 Checking for multiple editions of:', detectedCard.cardName);
            
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
                
                console.log(`🎯 Found ${exactMatches.length} exact matches for "${cardName}"`);
                
                if (exactMatches.length > 1) {
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
                    console.log(`✅ Single edition found`);
                    const enhancedCard = enhanceCardWithScryfall(detectedCard, exactMatches[0]);
                    displayCard(enhancedCard);
                    
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        const saved = await saveCardToCollection(enhancedCard);
                        if (saved) {
                            console.log(`💾 AUTO-SAVED: ${enhancedCard.cardName}`);
                            handleContinuousCounterAndLimit();
                        }
                    }
                    
                } else {
                    console.log('⚠️ No exact Scryfall matches found');
                    displayCard(detectedCard);
                    
                    if (scanMode === 'continuous' && autoSaveEnabled) {
                        const saved = await saveCardToCollection(detectedCard);
                        if (saved) {
                            console.log(`💾 AUTO-SAVED: ${detectedCard.cardName}`);
                            handleContinuousCounterAndLimit();
                        }
                    }
                }
            } else {
                console.log('❌ Scryfall API error');
                displayCard(detectedCard);
            }
        } catch (error) {
            console.error('❌ Edition lookup error:', error);
            displayCard(detectedCard);
        }
    };

    // Keep all existing helper functions
    const sortEditionsByPreference = (cardName, editions) => {
        const cardKey = cardName.toLowerCase().trim();
        const userPreference = editionPreferences[cardKey];
        
        if (userPreference) {
            console.log(`🧠 User previously preferred ${userPreference} for ${cardName}`);
            
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
            
            console.log(`✅ User selected: ${selectedEdition.set_name}`);
            
            learnEditionPreference(pendingCardData.cardName, selectedEdition);
            
            if (pendingScanMode === 'continuous' && autoSaveEnabled) {
                const saved = await saveCardToCollection(enhancedCard);
                if (saved) {
                    console.log(`💾 AUTO-SAVED: ${enhancedCard.cardName}`);
                    handleContinuousCounterAndLimit();
                }
                
                if (continuousCount < 9) {
                    console.log('🔄 Resuming continuous scanning...');
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
        
        // Close edition selector
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
                    console.log(`💾 AUTO-SAVED: ${pendingCardData.cardName}`);
                    handleContinuousCounterAndLimit();
                }
                
                if (continuousCount < 9) {
                    console.log('🔄 Resuming continuous scanning...');
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
        
        // Close edition selector
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
        
        console.log(`🧠 AI Learning: Remembered ${selectedEdition.set_name} preference for ${cardName}`);
    };

    const handleContinuousCounterAndLimit = () => {
        const newCount = continuousCount + 1;
        setContinuousCount(newCount);
        
        if (newCount >= 10) {
            console.log('🛑 CONTINUOUS MODE: 10-card limit reached');
            stopScanning();
            setShowContinueDialog(true);
        }
    };

    const handleContinueScanning = () => {
        console.log('🔄 User chose to continue scanning...');
        setShowContinueDialog(false);
        setContinuousCount(0);
        cooldownSystemRef.current.resetCooldowns();
        startScanning();
    };

    const handleStopScanning = () => {
        console.log('⏹️ User chose to stop scanning');
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
        console.log('⏹️ Stopping MTG Scanner...');
        setIsScanning(false);
        setScanningPausedForSelection(false);
        
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    };

    const cleanup = () => {
        console.log('🧹 Cleaning up MTG Scanner...');
        stopScanning();
        cameraManagerRef.current.stopCamera();
        
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const saveCardToCollection = async (card) => {
        try {
            // Check 100 card limit (updated from 200)
            if (!isPremiumUser && savedCards.length >= FREE_COLLECTION_LIMIT) {
                console.log('🚨 Free collection limit reached (100 cards)');
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

    // PayPal integration ($19.99)
    const handleUpgradeToPremium = () => {
        console.log('💎 Initiating PayPal payment for premium upgrade ($19.99)...');
        
        const paypalLink = `https://www.paypal.com/paypalme/thediceyguy/19.99`;
        window.open(paypalLink, '_blank');
        
        // Simulate premium upgrade after payment
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
            showProfessionalToast('🗑️ Card removed from collection', 'info');
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

    const handleTabSwitch = (newTab) => {
        console.log(`🔄 Switching to ${newTab} tab`);
        setActiveTab(newTab);
    };

    // 🔥 MAIN RENDER - KOMPLETT UI
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
            {/* 🏆 PROFESSIONAL HEADER */}
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
                            🔥 Enhanced Camera System • 100 Free Cards • $19.99 Premium
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
                        <span style={{ color: '#94a3b8' }}>Camera: </span>
                        <span style={{ 
                            color: cameraStatus === 'ready' ? '#22c55e' : 
                                   cameraStatus === 'error' ? '#dc3545' : '#ffc107', 
                            fontWeight: 'bold' 
                        }}>
                            {cameraStatus === 'ready' ? '✅' : 
                             cameraStatus === 'error' ? '❌' : '⏳'}
                        </span>
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

            {/* 🎨 PROFESSIONAL TAB NAVIGATION */}
            <ProfessionalTabs
                activeTab={activeTab}
                onTabChange={handleTabSwitch}
                savedCards={savedCards}
            />

            {/* 📱 MAIN CONTENT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 🔍 SCANNER TAB */}
                {activeTab === 'scanner' && (
                    <>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '15px',
                            padding: '24px'
                        }}>
                            {/* 📹 ENHANCED VIDEO CONTAINER */}
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
                                
                                {/* 🔥 COOLDOWN STATUS OVERLAY */}
                                <ProfessionalCooldownStatus
                                    cooldownStatus={cooldownStatus}
                                    isVisible={true}
                                />
                                
                                {/* 📷 ENHANCED CAMERA STATUS */}
                                <ProfessionalCameraStatus
                                    cameraStatus={cameraStatus}
                                    cameraInitialized={true}
                                    cameraDetails={cameraDetails}
                                    onRetry={retryCameraSetup}
                                />
                                
                                {/* 🎬 SCANNING OVERLAY */}
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

                            {/* 🎮 ENHANCED SCAN CONTROLS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Scan Mode Selection */}
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

                                {/* Main Scan Button */}
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

                                {/* Camera Controls */}
                                {availableCameras.length > 1 && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => setShowCameraSelector(true)}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            📷 Switch Camera ({availableCameras.length})
                                        </button>
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
                                            🔄 Retry Camera
                                        </button>
                                    </div>
                                )}

                                {/* Cooldown Info */}
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

                        {/* 💎 PROFESSIONAL CARD DISPLAY */}
                        {isUIVisible && (
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
                                        
                                        {/* Confidence Bar */}
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

                                        {/* Action Buttons */}
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

                                {/* Scan History */}
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
                        )}
                    </>
                )}

                {/* 🃏 COLLECTION TAB */}
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

                {/* 📚 KNOWLEDGE TAB */}
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

            {/* 📊 PROFESSIONAL STATUS BAR */}
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
                            cameraStatus === 'ready' ? `Ready ✅ (${cameraDetails?.width}x${cameraDetails?.height})` : 
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

            {/* 🎭 EDITION SELECTOR MODAL */}
            {showEditionSelector && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%