// Scanner.js - COMPLETE INTEGRATED VERSION with Working Cooldown & Knowledge Base + LOADING SCREEN FIX
import React, { useState, useRef, useEffect } from 'react';
import ClaudeVisionService from './ClaudeVisionService';
import './CardDisplay.css';

// 🔥 INTEGRATED PROFESSIONAL COMPONENTS
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

// 🔥 INTEGRATED MTG KNOWLEDGE BASE COMPONENT
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
            return 'This creature can attack and block. Consider its power, toughness, and any special abilities when building your deck.';
        } else if (type.includes('instant')) {
            return 'This instant can be played at any time you have priority, including during your opponent\'s turn or in response to other spells.';
        } else if (type.includes('sorcery')) {
            return 'This sorcery can only be played during your main phases when the stack is empty and you have priority.';
        } else if (type.includes('enchantment')) {
            return 'This enchantment provides ongoing effects while it remains on the battlefield.';
        } else if (type.includes('artifact')) {
            return 'This artifact is colorless and can fit into any deck, but may be vulnerable to artifact removal.';
        } else if (type.includes('land')) {
            return 'This land can produce mana to cast your spells. Most decks play lands every turn.';
        } else if (type.includes('planeswalker')) {
            return 'This planeswalker is a powerful ally that can use loyalty abilities. Protect it from attacks!';
        }
        
        return 'This card has a unique type. Check its rules text for specific interactions.';
    };

    const insights = getCollectionInsights();

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h2 style={{ color: '#4a90e2', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📚 MTG Knowledge Base
            </h2>
            
            {/* Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
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
                            </div>

                            <div style={{ 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                padding: '16px', 
                                borderRadius: '8px',
                                marginTop: '16px'
                            }}>
                                <h4 style={{ color: '#e2e8f0', marginBottom: '8px' }}>💡 Quick Analysis</h4>
                                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
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
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e', marginBottom: '8px' }}>
                                    {insights.totalCards}
                                </div>
                                <div style={{ color: '#94a3b8' }}>Total Cards Scanned</div>
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
                                                <span style={{ color: getColorName(color) }}>
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
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
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
                        <h4 style={{ color: '#4a90e2', marginBottom: '12px' }}>⚡ Quick Rules</h4>
                        <div style={{ display: 'grid', gap: '12px', fontSize: '14px', lineHeight: '1.5' }}>
                            <div><strong>Turn Order:</strong> Untap → Upkeep → Draw → Main 1 → Combat → Main 2 → End</div>
                            <div><strong>Priority:</strong> Active player gets priority first, then passes around</div>
                            <div><strong>Stack:</strong> Last spell cast resolves first (LIFO)</div>
                            <div><strong>Summoning Sickness:</strong> Creatures can't attack or use tap abilities on first turn</div>
                        </div>
                    </div>

                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '20px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h4 style={{ color: '#4a90e2', marginBottom: '12px' }}>🛡️ Combat Basics</h4>
                        <div style={{ display: 'grid', gap: '12px', fontSize: '14px', lineHeight: '1.5' }}>
                            <div><strong>Flying:</strong> Can only be blocked by creatures with flying or reach</div>
                            <div><strong>First Strike:</strong> Deals damage before normal combat damage</div>
                            <div><strong>Deathtouch:</strong> Any damage dealt destroys the creature</div>
                            <div><strong>Trample:</strong> Excess damage goes to defending player</div>
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
                                🔍 Scryfall
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 🔥 SIMPLE DECK MANAGER COMPONENT
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

            {/* Controls */}
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '24px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px',
                        minWidth: '200px'
                    }}
                />
                
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px'
                    }}
                >
                    <option value="name">Sort by Name</option>
                    <option value="type">Sort by Type</option>
                    <option value="set">Sort by Set</option>
                    <option value="date">Sort by Date Added</option>
                </select>

                <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(74, 144, 226, 0.2)',
                        border: '1px solid #4a90e2',
                        color: '#4a90e2',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {viewMode === 'grid' ? '📋 List View' : '🔲 Grid View'}
                </button>

                <button
                    onClick={exportToMoxfield}
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e',
                        color: '#22c55e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    📤 Export Collection
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
                        {searchTerm ? 'No matching cards found' : 'No Cards in Collection'}
                    </h3>
                    <p style={{ color: '#94a3b8' }}>
                        {searchTerm ? 'Try a different search term' : 'Start scanning cards to build your collection'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: viewMode === 'grid' ? 'grid' : 'block',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
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
                                gap: viewMode === 'list' ? '16px' : '0'
                            }}
                        >
                            <div style={{ flex: viewMode === 'list' ? '1' : 'auto' }}>
                                <h4 style={{ color: '#4a90e2', marginBottom: '8px', fontSize: '16px' }}>
                                    {card.cardName}
                                </h4>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                                    {card.cardType && <div>Type: {card.cardType}</div>}
                                    {card.setInfo && <div>Set: {card.setInfo}</div>}
                                    {card.scannedAt && <div>Added: {card.scannedAt}</div>}
                                </div>
                            </div>
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px',
                                marginTop: viewMode === 'grid' ? '12px' : '0'
                            }}>
                                <button
                                    onClick={() => onOpenScryfall(card)}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2',
                                        color: '#4a90e2',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    🔗 Scryfall
                                </button>
                                <button
                                    onClick={() => onRemoveCard(card.id)}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(220, 53, 69, 0.2)',
                                        border: '1px solid #dc3545',
                                        color: '#dc3545',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
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

// 🔥 IMPROVED Smart Cooldown System with Better Debugging
class MTGScannerCooldown {
    constructor() {
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.lastApiCall = 0;
        this.consecutiveDetections = 0;
        this.isEditionSelectorOpen = false;
        this.detectionBuffer = [];
        
        // 🔥 ADJUSTED Cooldown periods for better user experience
        this.SAME_CARD_COOLDOWN = 12000;      // 12 seconds for same card
        this.MIN_API_INTERVAL = 3000;         // 3 seconds between API calls
        this.DETECTION_STABILITY = 2;         // Need 2 consistent detections (was 3)
        this.MAX_CONSECUTIVE = 3;             // Max consecutive before pause (was 2)
        this.LONG_PAUSE_DURATION = 20000;    // 20 second pause (was 30)
        
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
    }

    shouldScan(cardName = null) {
        const now = Date.now();
        
        console.log(`🔍 COOLDOWN CHECK for "${cardName}" at ${new Date(now).toLocaleTimeString()}`);
        
        // 1. Don't scan if edition selector is open
        if (this.isEditionSelectorOpen) {
            console.log("🚫 BLOCKED: Edition selector open");
            return false;
        }
        
        // 2. Check long pause
        if (this.isLongPauseActive) {
            const pauseRemaining = this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime);
            if (pauseRemaining > 0) {
                console.log(`🚫 BLOCKED: Long pause active (${Math.ceil(pauseRemaining/1000)}s remaining)`);
                return false;
            } else {
                this.isLongPauseActive = false;
                this.consecutiveDetections = 0;
                console.log("✅ Long pause ended, scanning can resume");
            }
        }
        
        // 3. Enforce minimum API interval
        if (now - this.lastApiCall < this.MIN_API_INTERVAL) {
            const waitTime = this.MIN_API_INTERVAL - (now - this.lastApiCall);
            console.log(`🚫 BLOCKED: API cooldown (${Math.ceil(waitTime/1000)}s remaining)`);
            return false;
        }
        
        // 4. Same card cooldown
        if (cardName && cardName === this.lastDetectedCard) {
            const timeSinceLastDetection = now - this.lastDetectionTime;
            if (timeSinceLastDetection < this.SAME_CARD_COOLDOWN) {
                const waitTime = this.SAME_CARD_COOLDOWN - timeSinceLastDetection;
                console.log(`🚫 BLOCKED: Same card "${cardName}" cooldown (${Math.ceil(waitTime/1000)}s remaining)`);
                return false;
            }
        }
        
        console.log("✅ COOLDOWN PASSED - can scan");
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
        
        const isStable = recentSameCard.length >= this.DETECTION_STABILITY;
        
        console.log(`📊 STABILITY CHECK: ${recentSameCard.length}/${this.DETECTION_STABILITY} for "${cardName}" - ${isStable ? 'STABLE' : 'NOT STABLE'}`);
        
        return isStable;
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
        
        console.log(`✅ DETECTION RECORDED: "${cardName}" (consecutive: ${this.consecutiveDetections})`);
        
        if (this.consecutiveDetections >= this.MAX_CONSECUTIVE) {
            this.isLongPauseActive = true;
            this.longPauseStartTime = now;
            console.log(`🛑 LONG PAUSE ACTIVATED (${this.MAX_CONSECUTIVE} consecutive detections)`);
        }
    }

    resetCooldowns() {
        console.log("🔄 COOLDOWNS RESET");
        this.consecutiveDetections = 0;
        this.lastDetectedCard = null;
        this.lastDetectionTime = 0;
        this.detectionBuffer = [];
        this.isLongPauseActive = false;
        this.longPauseStartTime = 0;
    }

    setEditionSelectorOpen(isOpen) {
        this.isEditionSelectorOpen = isOpen;
        console.log(`🎭 Edition selector ${isOpen ? 'OPENED' : 'CLOSED'}`);
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
    
    // 🔥 Cooldown system state
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
    
    // Collection limits and premium features
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const FREE_COLLECTION_LIMIT = 100;
    
    // Camera state
    const [cameraError, setCameraError] = useState(null);
    const [cameraRetryCount, setCameraRetryCount] = useState(0);
    const [cameraInitializationComplete, setCameraInitializationComplete] = useState(false);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const initializationPromiseRef = useRef(null);
    
    // 🔥 Cooldown system ref
    const cooldownSystemRef = useRef(new MTGScannerCooldown());

    // Initialize services and camera
    useEffect(() => {
        console.log('🔧 Component mounting - initializing services...');
        initializeServices();
        loadSavedData();
        
        if (!initializationPromiseRef.current) {
            console.log('🚀 Starting camera initialization...');
            initializationPromiseRef.current = enumerateCameras().then(() => setupCamera());
        }
        
        // Update cooldown status periodically
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500); // More frequent updates for better debugging
        
        // 🔥 HIDE LOADING SCREEN WHEN SCANNER IS READY
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

    // Handle tab switching
    useEffect(() => {
        console.log(`🎯 Tab switched to: ${activeTab}`);
        
        if (activeTab === 'scanner' && cameraStreamRef.current && cameraStreamRef.current.active) {
            if (videoRef.current && !videoRef.current.srcObject) {
                console.log('📷 Reconnecting video element to persistent stream...');
                videoRef.current.srcObject = cameraStreamRef.current;
                videoRef.current.play();
            }
        }
        
        if (activeTab !== 'scanner' && isScanning) {
            console.log('⏸️ Pausing scanning - left scanner tab');
            stopScanning();
        }
    }, [activeTab, isScanning]);

    const initializeServices = () => {
        console.log('🔧 Initializing MTG Scanner Pro...');
        
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

    const enumerateCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('📷 Available cameras:', videoDevices.length);
            
            setAvailableCameras(videoDevices);
            
            // Auto-select best camera
            const logitechCamera = videoDevices.find(device => 
                device.label.toLowerCase().includes('logitech') || 
                device.label.toLowerCase().includes('c920')
            );
            
            if (logitechCamera) {
                setSelectedCameraId(logitechCamera.deviceId);
                console.log('✅ Auto-selected Logitech camera');
            } else if (videoDevices.length > 0) {
                setSelectedCameraId(videoDevices[0].deviceId);
                console.log('✅ Auto-selected first available camera');
            }
            
        } catch (error) {
            console.error('❌ Failed to enumerate cameras:', error);
        }
    };

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
                    console.log('✅ Camera ready:', `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    showProfessionalToast('✅ Camera ready!', 'success');
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
        
        if (canRetry && cameraRetryCount < 2 && error.name !== 'NotAllowedError') {
            const retryDelay = (cameraRetryCount + 1) * 2000;
            console.log(`🔄 Auto-retrying camera setup in ${retryDelay/1000}s`);
            
            setTimeout(() => {
                setCameraRetryCount(prev => prev + 1);
                setupCamera();
            }, retryDelay);
        }
    };

    // 🔥 IMPROVED scanning with better cooldown integration
    const startScanning = () => {
        if (!visionServiceRef.current || cameraStatus !== 'ready') {
            console.log('⚠️ Scanner not ready');
            if (cameraStatus === 'error') {
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
        
        // 🔥 IMPROVED scanning interval
        scanIntervalRef.current = setInterval(async () => {
            try {
                const currentCardName = currentCard?.cardName;
                
                // 🔥 Check cooldown system first
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
        }, scanMode === 'single' ? 1500 : 2500); // Adjusted intervals
    };

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
                    // Show edition selector
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
        
        console.log('📷 Camera stream preserved');
    };

    const cleanup = () => {
        console.log('🧹 Cleaning up MTG Scanner...');
        stopScanning();
        
        if (cameraStreamRef.current) {
            console.log('📷 Stopping camera stream...');
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
            setCameraInitializationComplete(false);
        }
        
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        
        initializationPromiseRef.current = null;
    };

    const saveCardToCollection = async (card) => {
        try {
            if (!isPremiumUser && savedCards.length >= FREE_COLLECTION_LIMIT) {
                console.log('🚨 Free collection limit reached');
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

    const handleUpgradeToPremium = () => {
        console.log('💎 Initiating premium upgrade...');
        
        const paypalLink = `https://www.paypal.com/paypalme/thediceyguy/9.99`;
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
        
        if (newTab === 'scanner' && cameraStreamRef.current && videoRef.current) {
            setTimeout(() => {
                if (!videoRef.current.srcObject) {
                    console.log('📷 Reconnecting video element...');
                    videoRef.current.srcObject = cameraStreamRef.current;
                    videoRef.current.play();
                }
            }, 100);
        }
    };

    const retryCameraSetup = () => {
        console.log('🔄 Manual camera retry requested');
        setCameraRetryCount(0);
        setCameraError(null);
        setCameraInitializationComplete(false);
        initializationPromiseRef.current = null;
        setupCamera();
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
                            🔥 Smart Cooldown System • Professional Grade
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
                                
                                {/* Camera Error Overlay */}
                                {cameraError && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(0,0,0,0.9)',
                                        color: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        border: '2px solid #dc3545'
                                    }}>
                                        <h3>📹 Camera Issue</h3>
                                        <p><strong>{cameraError.message}</strong></p>
                                        <p>{cameraError.action}</p>
                                        {cameraError.canRetry && (
                                            <button 
                                                onClick={retryCameraSetup}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: '#4a90e2',
                                                    border: 'none',
                                                    color: 'white',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    marginTop: '10px'
                                                }}
                                            >
                                                🔄 Try Again
                                            </button>
                                        )}
                                    </div>
                                )}
                                
                                {/* Scanning Overlay */}
                                {isScanning && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        background: 'rgba(74, 144, 226, 0.8)',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '600'
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
                                {/* Scan Mode */}
                                <div>
                                    <label style={{ color: '#b0bec5', marginBottom: '8px', display: 'block' }}>
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
                                                background: scanMode === 'continuous' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                cursor: isScanning ? 'not-allowed' : 'pointer',
                                                fontSize: '13px'
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
                                                background: scanMode === 'single' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                                                color: 'white',
                                                borderRadius: '8px',
                                                cursor: isScanning ? 'not-allowed' : 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            📷 Smart Single
                                        </button>
                                    </div>
                                </div>

                                {/* Start/Stop Button */}
                                <button
                                    onClick={isScanning ? stopScanning : startScanning}
                                    disabled={cameraStatus !== 'ready'}
                                    style={{
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

                        {/* Card Display */}
                        {isUIVisible && (
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
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => saveCardToCollection(currentCard)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'rgba(74, 144, 226, 0.2)',
                                                    border: '1px solid #4a90e2',
                                                    color: '#4a90e2',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                💾 Save to Collection
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
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    🔗 View on Scryfall
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                            {scanResult && !scanResult.hasCard ? 
                                                (scanResult.message || 'No MTG card detected') :
                                                'No card detected. Position an MTG card in the camera view.'
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* Scan History */}
                                {scanHistory.length > 0 && (
                                    <div style={{marginTop: '24px'}}>
                                        <h4 style={{color: '#4a90e2', marginBottom: '16px', fontSize: '16px'}}>
                                            📊 Recent Scans
                                        </h4>
                                        <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                            {scanHistory.map((card, index) => (
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
                                                    <span style={{color: '#64b5f6', fontWeight: '700'}}>{card.confidence}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 'bold', color: '#4a90e2' }}>
                        MTG Scanner Pro
                    </div>
                    <span style={{ fontSize: '14px' }}>
                        🔥 Cooldown: {cooldownStatus.canScan ? 'Ready' : 'Active'}
                    </span>
                    <span style={{ fontSize: '14px' }}>
                        📷 Camera: {cameraStatus === 'ready' ? 'Ready ✅' : 'Initializing ⏳'}
                    </span>
                    <span style={{ fontSize: '14px' }}>🧠 AI: Gemini Vision</span>
                    <span style={{ fontSize: '14px' }}>{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
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
                                <li>🧠 <strong>Advanced AI learning</strong></li>
                                <li>📊 <strong>Collection analytics</strong></li>
                                <li>💰 <strong>Price tracking & alerts</strong></li>
                                <li>🎯 <strong>Deck optimization tools</strong></li>
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
                                💎 Upgrade for $9.99/month
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
                            AI learned <strong>{Object.keys(editionPreferences).length}</strong> edition preferences.
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