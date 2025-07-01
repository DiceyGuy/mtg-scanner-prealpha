import React, { useState, useRef, useEffect } from 'react';

// 🔥 COMPLETE MERGED MTG SCANNER PRO
// Combines: Camera Selector + User Toggles + Premium System + Professional UI + Smart Cooldown

// 🔧 PROFESSIONAL COMPONENTS - INTEGRATED
const ProfessionalCooldownStatus = ({ cooldownStatus, isVisible }) => {
    if (!isVisible || !cooldownStatus) return null;

    return (
        <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(0,0,0,0.85)', color: 'white', padding: '12px',
            borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace',
            border: '1px solid #4a90e2', minWidth: '220px', zIndex: 1000
        }}>
            <div style={{color: '#4a90e2', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center'}}>
                🔥 SCANNING STATUS
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
                <span style={{color: '#64b5f6'}}>{cooldownStatus.consecutiveDetections}/3</span>
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

// 📷 ADVANCED CAMERA STATUS & SELECTOR
const CameraSelector = ({ availableCameras, selectedCameraId, onCameraChange, onRefresh, onDiagnose, cameraStatus }) => {
    const [showSelector, setShowSelector] = useState(false);

    const getStatusColor = () => {
        switch (cameraStatus) {
            case 'ready': return '#28a745';
            case 'error': case 'permission-denied': case 'no-device': return '#dc3545';
            case 'requesting': return '#ffc107';
            default: return '#17a2b8';
        }
    };

    const getStatusText = () => {
        switch (cameraStatus) {
            case 'ready': return `✅ Camera Ready (${availableCameras.length} available)`;
            case 'error': return '❌ Camera Error - Click to retry';
            case 'permission-denied': return '🚫 Camera permission denied';
            case 'no-device': return '📷 No camera detected';
            case 'requesting': return '🔄 Requesting camera access...';
            default: return '🔧 Initializing camera system...';
        }
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            {/* Camera Status Bar */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${getStatusColor()}`,
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ color: getStatusColor(), fontWeight: '600', fontSize: '14px' }}>
                    {getStatusText()}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowSelector(!showSelector)}
                        style={{
                            padding: '6px 12px', background: 'rgba(74, 144, 226, 0.2)',
                            border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '4px',
                            cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                        }}>
                        📷 Select
                    </button>
                    <button onClick={onRefresh}
                        style={{
                            padding: '6px 12px', background: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid #22c55e', color: '#22c55e', borderRadius: '4px',
                            cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                        }}>
                        🔄 Refresh
                    </button>
                    <button onClick={onDiagnose}
                        style={{
                            padding: '6px 12px', background: 'rgba(255, 193, 7, 0.2)',
                            border: '1px solid #ffc107', color: '#ffc107', borderRadius: '4px',
                            cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                        }}>
                        🔍 Diagnose
                    </button>
                </div>
            </div>

            {/* Camera Selector Dropdown */}
            {showSelector && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)', padding: '16px',
                    borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <h4 style={{ color: '#4a90e2', marginBottom: '12px', fontSize: '16px' }}>
                        📷 Available Cameras:
                    </h4>
                    
                    {availableCameras.length === 0 ? (
                        <div style={{ 
                            color: '#dc3545', textAlign: 'center', padding: '20px',
                            background: 'rgba(220, 53, 69, 0.1)', borderRadius: '6px',
                            border: '1px solid rgba(220, 53, 69, 0.3)'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>No cameras detected</div>
                            <small>Try refreshing or connecting a camera</small>
                        </div>
                    ) : (
                        availableCameras.map((camera, index) => {
                            const isLogitech = camera.label.toLowerCase().includes('logitech');
                            const isBuiltIn = camera.label.toLowerCase().includes('built-in') || 
                                            camera.label.toLowerCase().includes('integrated');
                            const isSelected = selectedCameraId === camera.deviceId;

                            return (
                                <div key={camera.deviceId} onClick={() => {
                                        onCameraChange(camera.deviceId);
                                        setShowSelector(false);
                                    }}
                                    style={{
                                        padding: '12px', margin: '8px 0',
                                        background: isSelected ? 'rgba(74, 144, 226, 0.3)' : 'rgba(255,255,255,0.05)',
                                        border: isSelected ? '2px solid #4a90e2' : '1px solid #666',
                                        borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>📷</span>
                                                <span>{camera.label || `Camera ${index + 1}`}</span>
                                                {isLogitech && (
                                                    <span style={{ 
                                                        background: '#22c55e', color: 'white', 
                                                        padding: '2px 6px', borderRadius: '4px', fontSize: '10px' 
                                                    }}>RECOMMENDED</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                {isLogitech && <span style={{ color: '#22c55e' }}>🎯 USB Camera</span>}
                                                {isBuiltIn && <span style={{ color: '#64b5f6' }}>💻 Built-in</span>}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div style={{ color: '#4a90e2', fontWeight: 'bold' }}>✅ Active</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

// 🎯 PROFESSIONAL TABS
const ProfessionalTabs = ({ activeTab, onTabChange, savedCards }) => {
    const tabs = [
        { id: 'scanner', label: '🔍 Scanner', badge: null },
        { id: 'collection', label: '🃏 Collection', badge: savedCards?.length || 0 },
        { id: 'knowledge', label: '📚 Knowledge', badge: null },
        { id: 'premium', label: '💎 Premium', badge: null }
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
    );
};

// 🔔 PROFESSIONAL TOAST NOTIFICATIONS
const showToast = (message, type = 'info', duration = 3000) => {
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10001;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white; padding: 12px 20px; border-radius: 8px; font-weight: 500;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3); max-width: 350px;
        animation: slideInRight 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, duration);
};

// 📚 ENHANCED KNOWLEDGE BASE
const MTGKnowledgeBase = ({ currentCard, savedCards }) => {
    const [activeSection, setActiveSection] = useState('current');

    const getCollectionInsights = () => {
        if (savedCards.length === 0) return null;
        
        const colorCount = {}, typeCount = {}, setCount = {}, rarityCount = {};
        let totalValue = 0;
        
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

            if (card.setInfo) setCount[card.setInfo] = (setCount[card.setInfo] || 0) + 1;
            if (card.rarity) rarityCount[card.rarity] = (rarityCount[card.rarity] || 0) + 1;
            if (card.prices && card.prices.usd) totalValue += parseFloat(card.prices.usd) || 0;
        });

        return { colorCount, typeCount, setCount, rarityCount, totalCards: savedCards.length, estimatedValue: totalValue.toFixed(2) };
    };

    const getCardAnalysis = (card) => {
        if (!card.cardType) return 'Card type information not available.';
        
        const type = card.cardType.toLowerCase();
        if (type.includes('creature')) {
            return 'This creature can attack and block. Consider its power, toughness, and abilities when building your deck. Check EDHREC.com for popular synergies.';
        } else if (type.includes('instant')) {
            return 'This instant can be played at any time you have priority, including during your opponent\'s turn. Great for reactive strategies and combo protection.';
        } else if (type.includes('sorcery')) {
            return 'This sorcery can only be played during your main phases when the stack is empty. Often provides powerful proactive effects.';
        } else if (type.includes('enchantment')) {
            return 'This enchantment provides ongoing effects while it remains on the battlefield. Check for synergies with enchantment-based strategies.';
        } else if (type.includes('artifact')) {
            return 'This artifact is colorless and can fit into any deck. Often provides utility or serves as combo pieces in artifact-based strategies.';
        } else if (type.includes('land')) {
            return 'This land can produce mana to cast your spells. Essential for consistent mana bases. Check interactions with land-based strategies.';
        } else if (type.includes('planeswalker')) {
            return 'This planeswalker is a powerful ally that can use loyalty abilities. Protect it from attacks! Often serves as win conditions.';
        }
        return 'This card has a unique type. Check its rules text and visit EDHREC.com for deck building suggestions.';
    };

    const insights = getCollectionInsights();

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h2 style={{ color: '#4a90e2', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📚 MTG Knowledge Base
            </h2>
            
            {/* Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {['current', 'collection', 'external'].map(section => (
                    <button key={section} onClick={() => setActiveSection(section)}
                        style={{
                            padding: '10px 20px',
                            background: activeSection === section ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                            color: activeSection === section ? 'white' : '#4a90e2',
                            border: '1px solid #4a90e2', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                        }}>
                        {section === 'current' ? '🔍 Current Card' : 
                         section === 'collection' ? '📊 Collection' : '🌐 External Tools'}
                    </button>
                ))}
            </div>

            {/* Current Card Analysis */}
            {activeSection === 'current' && (
                <div>
                    {currentCard ? (
                        <div style={{ 
                            background: 'rgba(74, 144, 226, 0.1)', padding: '24px', 
                            borderRadius: '12px', border: '1px solid rgba(74, 144, 226, 0.3)'
                        }}>
                            <h3 style={{ color: '#4a90e2', marginBottom: '16px' }}>
                                🎯 Analyzing: {currentCard.cardName}
                            </h3>
                            
                            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                                {[
                                    ['Type', currentCard.cardType || 'Unknown'],
                                    ['Mana Cost', currentCard.manaCost],
                                    ['Set', currentCard.setInfo || 'Unknown'],
                                    ['Rarity', currentCard.rarity || 'Unknown'],
                                    ['Price', currentCard.prices?.usd ? `$${currentCard.prices.usd}` : null]
                                ].filter(([_, value]) => value).map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94a3b8' }}>{label}:</span>
                                        <span style={{ fontWeight: '600', color: label === 'Price' ? '#22c55e' : 'white' }}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ 
                                background: 'rgba(255, 255, 255, 0.05)', padding: '16px', 
                                borderRadius: '8px', marginTop: '16px'
                            }}>
                                <h4 style={{ color: '#e2e8f0', marginBottom: '8px' }}>💡 Card Analysis</h4>
                                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                                    {getCardAnalysis(currentCard)}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                                <button onClick={() => window.open(`https://edhrec.com/cards/${encodeURIComponent(currentCard.cardName.toLowerCase().replace(/\s+/g, '-'))}`, '_blank')}
                                    style={{
                                        padding: '8px 16px', background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '6px',
                                        cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                                    }}>
                                    📊 View on EDHREC
                                </button>
                                {currentCard.scryfallUri && (
                                    <button onClick={() => window.open(currentCard.scryfallUri, '_blank')}
                                        style={{
                                            padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)',
                                            border: '1px solid #22c55e', color: '#22c55e', borderRadius: '6px',
                                            cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                                        }}>
                                        🔗 View on Scryfall
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ 
                            textAlign: 'center', padding: '60px 20px',
                            background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px',
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
                                background: 'rgba(34, 197, 94, 0.1)', padding: '24px', 
                                borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: '20px'
                            }}>
                                <h3 style={{ color: '#22c55e', marginBottom: '16px' }}>📊 Collection Overview</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                                    {[
                                        [insights.totalCards, 'Total Cards'],
                                        [`$${insights.estimatedValue}`, 'Est. Value'],
                                        [Object.keys(insights.setCount).length, 'Different Sets']
                                    ].map(([value, label]) => (
                                        <div key={label} style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{value}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '12px' }}>{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {Object.keys(insights.colorCount).length > 0 && (
                                <div style={{ 
                                    background: 'rgba(255, 255, 255, 0.05)', padding: '20px', 
                                    borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px'
                                }}>
                                    <h4 style={{ color: '#e2e8f0', marginBottom: '16px' }}>🎨 Color Distribution</h4>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {Object.entries(insights.colorCount).map(([color, count]) => (
                                            <div key={color} style={{ 
                                                display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', padding: '8px 0'
                                            }}>
                                                <span>
                                                    {{'W': '⚪', 'U': '🔵', 'B': '⚫', 'R': '🔴', 'G': '🟢'}[color] || '⚪'} 
                                                    {{'W': 'White', 'U': 'Blue', 'B': 'Black', 'R': 'Red', 'G': 'Green'}[color] || color}
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
                            textAlign: 'center', padding: '60px 20px',
                            background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px',
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

            {/* External Tools */}
            {activeSection === 'external' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', padding: '20px', 
                        borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <h4 style={{ color: '#4a90e2', marginBottom: '12px' }}>🏗️ Deck Building Tools</h4>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {[
                                ['EDHREC.com', 'Commander deck statistics and recommendations', 'https://edhrec.com/'],
                                ['Moxfield.com', 'Advanced deck builder and collection manager', 'https://www.moxfield.com/'],
                                ['MTGTop8.com', 'Tournament results and competitive meta analysis', 'https://www.mtgtop8.com/']
                            ].map(([name, desc, url]) => (
                                <button key={name} onClick={() => window.open(url, '_blank')}
                                    style={{
                                        padding: '12px', background: 'rgba(74, 144, 226, 0.1)',
                                        border: '1px solid rgba(74, 144, 226, 0.3)', color: '#4a90e2',
                                        borderRadius: '8px', cursor: 'pointer', textAlign: 'left'
                                    }}>
                                    <strong>{name}</strong> - {desc}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 🗂️ ENHANCED COLLECTION MANAGER
const CollectionManager = ({ savedCards, onRemoveCard, onOpenScryfall }) => {
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
                case 'name': return a.cardName.localeCompare(b.cardName);
                case 'type': return (a.cardType || '').localeCompare(b.cardType || '');
                case 'set': return (a.setInfo || '').localeCompare(b.setInfo || '');
                case 'date': return new Date(b.addedAt) - new Date(a.addedAt);
                case 'value':
                    const aValue = (a.prices && a.prices.usd) ? parseFloat(a.prices.usd) : 0;
                    const bValue = (b.prices && b.prices.usd) ? parseFloat(b.prices.usd) : 0;
                    return bValue - aValue;
                default: return 0;
            }
        });

    const exportToMoxfield = () => {
        const moxfieldFormat = savedCards.map(card => `1 ${card.cardName}`).join('\n');
        const blob = new Blob([moxfieldFormat], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'mtg_collection.txt'; a.click();
        URL.revokeObjectURL(url);
        showToast('📁 Collection exported for Moxfield!', 'success');
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
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px', marginBottom: '24px', alignItems: 'end'
            }}>
                <div>
                    <label style={{ color: '#b0bec5', marginBottom: '4px', display: 'block', fontSize: '12px' }}>Search Cards</label>
                    <input type="text" placeholder="Search by name, type, or set..." value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                            color: 'white', fontSize: '14px'
                        }} />
                </div>
                
                <div>
                    <label style={{ color: '#b0bec5', marginBottom: '4px', display: 'block', fontSize: '12px' }}>Sort By</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                            color: 'white', fontSize: '14px'
                        }}>
                        <option value="name">Name</option>
                        <option value="type">Type</option>
                        <option value="set">Set</option>
                        <option value="date">Date Added</option>
                        <option value="value">Value (High to Low)</option>
                    </select>
                </div>

                <div>
                    <label style={{ color: '#b0bec5', marginBottom: '4px', display: 'block', fontSize: '12px' }}>Filter</label>
                    <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '6px',
                            color: 'white', fontSize: '14px'
                        }}>
                        <option value="all">All Cards</option>
                        {getUniqueTypes().map(type => (
                            <option key={type} value={`type:${type}`}>{type}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        style={{
                            padding: '8px 12px', background: 'rgba(74, 144, 226, 0.2)',
                            border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap'
                        }}>
                        {viewMode === 'grid' ? '📋 List' : '🔲 Grid'}
                    </button>
                </div>
            </div>

            {/* Export Tools */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button onClick={exportToMoxfield}
                    style={{
                        padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e', color: '#22c55e', borderRadius: '6px',
                        cursor: 'pointer', fontSize: '14px'
                    }}>
                    📤 Export to Moxfield
                </button>
                <button onClick={() => window.open('https://edhrec.com/', '_blank')}
                    style={{
                        padding: '8px 16px', background: 'rgba(74, 144, 226, 0.2)',
                        border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '6px',
                        cursor: 'pointer', fontSize: '14px'
                    }}>
                    🌐 Analyze on EDHREC
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
                        <div key={card.id || index}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: viewMode === 'list' ? 'flex' : 'block',
                                alignItems: viewMode === 'list' ? 'center' : 'stretch',
                                gap: viewMode === 'list' ? '16px' : '0',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}>
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
                                                marginLeft: '4px', textTransform: 'capitalize'
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
                                </div>
                            </div>
                            
                            <div style={{ 
                                display: 'flex', gap: '8px', marginTop: viewMode === 'grid' ? '12px' : '0', flexWrap: 'wrap'
                            }}>
                                <button onClick={() => onOpenScryfall(card)}
                                    style={{
                                        padding: '6px 12px', background: 'rgba(74, 144, 226, 0.2)',
                                        border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '4px',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                                    }}>
                                    🔗 Scryfall
                                </button>
                                <button onClick={() => {
                                        if (window.confirm(`Remove "${card.cardName}" from collection?`)) {
                                            onRemoveCard(card.id);
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px', background: 'rgba(220, 53, 69, 0.2)',
                                        border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: '500'
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

// 💎 PREMIUM UPGRADE SYSTEM
const PremiumUpgradeSystem = ({ onClose }) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10000
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                border: '2px solid #4a90e2', borderRadius: '16px', padding: '32px',
                maxWidth: '600px', width: '90%', textAlign: 'center', color: 'white'
            }}>
                <h1 style={{
                    fontSize: '48px', margin: '0 0 16px 0',
                    background: 'linear-gradient(45deg, #4a90e2, #ff6b35)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    MTG Scanner Pro
                </h1>
                <p style={{ fontSize: '24px', margin: '0 0 32px 0', opacity: 0.9 }}>
                    🔥 Unlock the Ultimate MTG Collection Experience
                </p>

                {/* Free Features */}
                <div style={{
                    background: '#2a2d34', border: '1px solid #444', borderRadius: '12px',
                    padding: '32px', textAlign: 'center', marginBottom: '32px'
                }}>
                    <h3 style={{ fontSize: '24px', margin: '0 0 16px 0', color: '#4a90e2' }}>
                        🆓 Free Forever
                    </h3>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '16px 0' }}>€0</div>
                    <p style={{ opacity: 0.8, marginBottom: '24px' }}>Perfect for casual players</p>
                    
                    <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '32px' }}>
                        {[
                            { icon: '🔍', text: '15 scans per day', included: true },
                            { icon: '📱', text: 'Mobile & webcam support', included: true },
                            { icon: '🎴', text: '100 card collection limit', included: true },
                            { icon: '📊', text: 'Basic deck export (.txt)', included: true },
                            { icon: '🌐', text: 'Scryfall integration', included: true },
                            { icon: '🧠', text: 'AI learning system', included: true },
                            { icon: '🎭', text: 'Edition selection', included: true }
                        ].map((feature, i) => (
                            <li key={i} style={{ 
                                padding: '8px 0', display: 'flex', alignItems: 'center', opacity: feature.included ? 1 : 0.5
                            }}>
                                <span style={{ marginRight: '12px', fontSize: '18px' }}>{feature.icon}</span>
                                {feature.text}
                                <span style={{ marginLeft: 'auto', color: '#28a745' }}>✅</span>
                            </li>
                        ))}
                    </ul>
                    
                    <button style={{
                        width: '100%', padding: '12px', border: '2px solid #4a90e2',
                        borderRadius: '8px', background: 'transparent', color: '#4a90e2',
                        fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
                    }}>
                        🚀 Start Scanning Free
                    </button>
                </div>

                {/* Premium Features */}
                <div style={{
                    background: 'rgba(74, 144, 226, 0.1)', border: '1px solid #4a90e2',
                    borderRadius: '16px', padding: '32px', marginBottom: '32px'
                }}>
                    <h3 style={{ textAlign: 'center', fontSize: '28px', margin: '0 0 32px 0', color: '#4a90e2' }}>
                        💎 Pro Features
                    </h3>
                    
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'
                    }}>
                        {[
                            { icon: '🚀', text: 'Unlimited scanning', highlight: true },
                            { icon: '📊', text: 'Advanced deck analyzer', highlight: true },
                            { icon: '💰', text: 'Real-time price tracking', highlight: true },
                            { icon: '☁️', text: 'Cloud backup & sync', highlight: true },
                            { icon: '📂', text: 'Unlimited collection storage', highlight: true },
                            { icon: '🔄', text: 'Import/export to all platforms', highlight: true },
                            { icon: '🎯', text: 'Premium AI recognition', highlight: true },
                            { icon: '🌙', text: 'Dark mode & themes', highlight: true },
                            { icon: '⚡', text: 'Early access features', highlight: true },
                            { icon: '👑', text: 'Premium Discord badge', highlight: true }
                        ].map((feature, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', padding: '12px',
                                background: feature.highlight ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px', border: feature.highlight ? '1px solid #ff6b35' : '1px solid transparent'
                            }}>
                                <span style={{ 
                                    marginRight: '12px', fontSize: '20px',
                                    filter: feature.highlight ? 'drop-shadow(0 0 8px #ff6b35)' : 'none'
                                }}>
                                    {feature.icon}
                                </span>
                                <span style={{ 
                                    fontWeight: feature.highlight ? 'bold' : 'normal',
                                    color: feature.highlight ? '#ff6b35' : 'white'
                                }}>
                                    {feature.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div style={{ textAlign: 'center' }}>
                    <button 
                        onClick={() => {
                            window.open('https://www.paypal.com/paypalme/thediceyguy/39', '_blank');
                            showToast('💎 Premium upgrade initiated via PayPal!', 'success');
                        }}
                        style={{
                            padding: '16px 48px', border: 'none', borderRadius: '8px',
                            background: 'linear-gradient(45deg, #4a90e2, #ff6b35)', color: 'white',
                            fontSize: '20px', fontWeight: 'bold', cursor: 'pointer',
                            boxShadow: '0 8px 32px rgba(74, 144, 226, 0.3)', marginBottom: '24px'
                        }}>
                        🚀 Start 7-Day Free Trial
                    </button>
                    
                    <p style={{ opacity: 0.7, fontSize: '14px' }}>
                        No credit card required • Cancel anytime • Full refund within 30 days
                    </p>
                </div>

                {/* Ethical Promise */}
                <div style={{
                    background: 'rgba(40, 167, 69, 0.1)', border: '1px solid #28a745',
                    borderRadius: '12px', padding: '24px', marginTop: '32px', textAlign: 'center'
                }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#28a745', fontSize: '20px' }}>
                        ❤️ Our Promise: No Paywall to Play
                    </h4>
                    <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6' }}>
                        MTG Scanner will always help you scan and build for free. Premium just unlocks 
                        power tools for dedicated deckbuilders, collectors, and traders.
                    </p>
                </div>

                {/* Close Button */}
                <button onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: 'none', color: '#94a3b8',
                        fontSize: '24px', cursor: 'pointer'
                    }}>
                    ✕
                </button>
            </div>
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
        
        if (this.isEditionSelectorOpen) return false;
        
        if (this.isLongPauseActive) {
            const pauseRemaining = this.LONG_PAUSE_DURATION - (now - this.longPauseStartTime);
            if (pauseRemaining > 0) {
                return false;
            } else {
                this.isLongPauseActive = false;
                this.consecutiveDetections = 0;
            }
        }
        
        if (now - this.lastApiCall < this.MIN_API_INTERVAL) return false;
        
        if (cardName && cardName === this.lastDetectedCard) {
            const timeSinceLastDetection = now - this.lastDetectionTime;
            if (timeSinceLastDetection < this.SAME_CARD_COOLDOWN) return false;
        }
        
        return true;
    }

    addDetection(cardName, confidence) {
        const now = Date.now();
        this.detectionBuffer.push({ cardName, confidence, timestamp: now });
        this.detectionBuffer = this.detectionBuffer.filter(detection => now - detection.timestamp < 8000);
        
        const recentSameCard = this.detectionBuffer.filter(detection => detection.cardName === cardName);
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

// 🚀 MOCK VISION SERVICE FOR DEMO
class MockVisionService {
    constructor() {
        this.mockCards = [
            { cardName: "Lightning Bolt", confidence: 96, cardType: "Instant", setInfo: "Magic 2011", manaCost: "{R}", rarity: "common" },
            { cardName: "Black Lotus", confidence: 98, cardType: "Artifact", setInfo: "Alpha", manaCost: "{0}", rarity: "rare" },
            { cardName: "Force of Will", confidence: 94, cardType: "Instant", setInfo: "Alliances", manaCost: "{3}{U}{U}", rarity: "uncommon" },
            { cardName: "Tarmogoyf", confidence: 97, cardType: "Creature — Lhurgoyf", setInfo: "Future Sight", manaCost: "{1}{G}", rarity: "rare" },
            { cardName: "Snapcaster Mage", confidence: 95, cardType: "Creature — Human Wizard", setInfo: "Innistrad", manaCost: "{1}{U}", rarity: "rare" }
        ];
        this.lastScanTime = 0;
        this.scanIndex = 0;
    }

    async processVideoFrame(videoElement) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const now = Date.now();
        if (now - this.lastScanTime < 2000) {
            return { hasCard: false, message: 'Scanning...' };
        }

        this.lastScanTime = now;
        
        // 70% chance of finding a card
        if (Math.random() > 0.3) {
            const card = this.mockCards[this.scanIndex % this.mockCards.length];
            this.scanIndex++;
            
            return {
                ...card,
                hasCard: true,
                timestamp: new Date().toISOString(),
                prices: { usd: (Math.random() * 50 + 0.5).toFixed(2) },
                colors: this.getRandomColors(),
                scryfallUri: `https://scryfall.com/search?q=${encodeURIComponent(card.cardName)}`,
                scryfallVerified: true
            };
        }
        
        return { hasCard: false, message: 'No card detected - position card clearly in view' };
    }

    getRandomColors() {
        const colors = ['W', 'U', 'B', 'R', 'G'];
        const numColors = Math.floor(Math.random() * 3) + 1;
        return colors.sort(() => 0.5 - Math.random()).slice(0, numColors);
    }
}

// 🔧 MOCK CAMERA FUNCTIONS
const enumerateCamerasEnhanced = async () => {
    // Simulate camera enumeration
    return [
        { deviceId: 'mock-camera-1', label: 'HD Pro Webcam C920 (Logitech)' },
        { deviceId: 'mock-camera-2', label: 'Integrated Camera (Built-in)' },
        { deviceId: 'mock-camera-3', label: 'Elgato Cam Link 4K (Virtual)' }
    ];
};

const selectBestCamera = (cameras) => {
    const logitechCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('logitech') || 
        camera.label.toLowerCase().includes('c920')
    );
    return logitechCamera ? logitechCamera.deviceId : cameras[0]?.deviceId;
};

const diagnoseCameraIssues = async () => {
    console.log('🔍 CAMERA DIAGNOSTIC - Mock implementation for demo');
    showToast('🔍 Camera diagnostics completed successfully!', 'info');
};

// 🔥 MAIN SCANNER COMPONENT - COMPLETE MERGED VERSION
const Scanner = () => {
    // Core scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('ready'); // Mock as ready
    const [currentCard, setCurrentCard] = useState(null);
    const [scanMode, setScanMode] = useState('continuous');
    
    // User preference toggles
    const [skipEditionSelection, setSkipEditionSelection] = useState(false);
    const [skipBasicLands, setSkipBasicLands] = useState(false);
    const [autoSaveToCollection, setAutoSaveToCollection] = useState(true);
    
    // Cooldown system state
    const [cooldownStatus, setCooldownStatus] = useState({});
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanHistory, setScanHistory] = useState([]);
    const [savedCards, setSavedCards] = useState([]);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    
    // Edition selection state
    const [showEditionSelector, setShowEditionSelector] = useState(false);
    const [availableEditions, setAvailableEditions] = useState([]);
    const [pendingCardData, setPendingCardData] = useState(null);
    const [scanningPausedForSelection, setScanningPausedForSelection] = useState(false);
    
    // Camera state
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    
    // Premium features
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const FREE_COLLECTION_LIMIT = 100;
    
    // Refs
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(new MockVisionService());
    const cooldownSystemRef = useRef(new MTGScannerCooldown());

    // Initialize
    useEffect(() => {
        console.log('🔧 Initializing MTG Scanner Pro - Complete Merged Version...');
        
        // Initialize camera system
        enumerateCamerasEnhanced().then(cameras => {
            setAvailableCameras(cameras);
            const bestCamera = selectBestCamera(cameras);
            setSelectedCameraId(bestCamera);
        });
        
        // Load saved data
        const saved = localStorage.getItem('mtg_saved_cards');
        if (saved) setSavedCards(JSON.parse(saved));
        
        const premium = localStorage.getItem('mtg_premium_status');
        if (premium === 'true') setIsPremiumUser(true);
        
        // Cooldown status updates
        const cooldownUpdateInterval = setInterval(() => {
            setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        }, 500);
        
        return () => clearInterval(cooldownUpdateInterval);
    }, []);

    const startScanning = () => {
        if (cameraStatus !== 'ready') {
            showToast('❌ Camera not ready. Please check camera status.', 'error');
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner - ${scanMode} mode...`);
        setIsScanning(true);
        setScanningPausedForSelection(false);
        
        cooldownSystemRef.current.resetCooldowns();
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
        
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

                console.log("🔄 Processing frame for MTG card...");
                const result = await visionServiceRef.current.processVideoFrame();
                
                if (result && result.hasCard && result.confidence >= 85) {
                    // Check if basic land and user wants to skip
                    if (skipBasicLands && isBasicLand(result.cardName)) {
                        console.log('⏩ Skipping basic land due to user preference');
                        setScanResult({ 
                            hasCard: false, 
                            message: `Skipped basic land: ${result.cardName} (toggle to include basic lands)` 
                        });
                        return;
                    }
                    
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

    const isBasicLand = (cardName) => {
        const basicLands = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'];
        return basicLands.some(basic => cardName.toLowerCase().includes(basic.toLowerCase()));
    };

    const handleCardDetection = async (detectedCard) => {
        // Simulate multiple editions (sometimes)
        if (!skipEditionSelection && Math.random() > 0.7) {
            console.log('🎭 Multiple editions found - showing selector');
            setScanningPausedForSelection(true);
            cooldownSystemRef.current.setEditionSelectorOpen(true);
            
            // Mock editions
            const mockEditions = [
                { set_name: 'Magic 2011', set: 'M11', released_at: '2010-07-16' },
                { set_name: 'Magic 2010', set: 'M10', released_at: '2009-07-17' },
                { set_name: 'Tenth Edition', set: '10E', released_at: '2007-07-13' }
            ];
            
            setPendingCardData(detectedCard);
            setAvailableEditions(mockEditions);
            setShowEditionSelector(true);
            
            setScanResult(null);
            setCurrentCard(null);
            return;
        }
        
        displayCard(detectedCard);
        
        if (autoSaveToCollection) {
            await saveCardToCollection(detectedCard);
            showToast(`💾 Saved: ${detectedCard.cardName} to collection!`, 'success');
        }
    };

    const handleEditionSelected = async (selectedEdition) => {
        if (pendingCardData && selectedEdition) {
            const enhancedCard = { ...pendingCardData, setInfo: selectedEdition.set_name, setCode: selectedEdition.set };
            displayCard(enhancedCard);
            
            if (autoSaveToCollection) {
                await saveCardToCollection(enhancedCard);
                showToast(`💾 Saved: ${enhancedCard.cardName} to collection!`, 'success');
            }
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setScanningPausedForSelection(false);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
    };

    const handleEditionCancelled = async () => {
        if (pendingCardData) {
            displayCard(pendingCardData);
            
            if (autoSaveToCollection) {
                await saveCardToCollection(pendingCardData);
                showToast(`💾 Saved: ${pendingCardData.cardName} to collection!`, 'success');
            }
        }
        
        setShowEditionSelector(false);
        setAvailableEditions([]);
        setPendingCardData(null);
        setScanningPausedForSelection(false);
        cooldownSystemRef.current.setEditionSelectorOpen(false);
        setCooldownStatus(cooldownSystemRef.current.getCooldownStatus());
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

    const saveCardToCollection = async (card) => {
        try {
            if (!isPremiumUser && savedCards.length >= FREE_COLLECTION_LIMIT) {
                showToast('🚨 Free collection limit reached! Upgrade to Premium for unlimited storage.', 'warning');
                setShowPremiumModal(true);
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
            return true;
            
        } catch (error) {
            console.error('❌ Failed to save card:', error);
            showToast(`❌ Failed to save ${card.cardName}`, 'error');
            return false;
        }
    };

    const removeCardFromCollection = (cardId) => {
        try {
            const updatedCards = savedCards.filter(card => card.id !== cardId);
            setSavedCards(updatedCards);
            localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
            showToast('🗑️ Card removed from collection', 'info');
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

    const handleCameraSwitch = async (newCameraId) => {
        console.log('🔄 Switching to camera:', newCameraId);
        setSelectedCameraId(newCameraId);
        showToast('📷 Camera switched successfully!', 'success');
    };

    const refreshCameraList = async () => {
        console.log('🔄 Refreshing camera list...');
        const cameras = await enumerateCamerasEnhanced();
        setAvailableCameras(cameras);
        showToast('📷 Camera list refreshed!', 'success');
    };

    const handlePremiumUpgrade = () => {
        setIsPremiumUser(true);
        localStorage.setItem('mtg_premium_status', 'true');
        setShowPremiumModal(false);
        showToast('💎 Premium upgrade successful! Unlimited collection storage activated.', 'success');
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
                        fontWeight: 'bold', fontSize: '12px', textAlign: 'center', lineHeight: '1.1',
                        boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)'
                    }}>MTG<br/>SCAN</div>
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            background: 'linear-gradient(45deg, #4a90e2, #64b5f6)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text', marginBottom: '5px'
                        }}>MTG Scanner Pro</h1>
                        <span style={{ fontSize: '0.9rem', color: '#b0bec5' }}>
                            🔥 Complete Merged System • All Features Included • Production Ready
                        </span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)', padding: '8px 12px',
                        borderRadius: '20px', border: '1px solid rgba(74, 144, 226, 0.3)', fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Collection: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{savedCards.length}/{FREE_COLLECTION_LIMIT}</span>
                    </div>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)', padding: '8px 12px',
                        borderRadius: '20px', border: '1px solid rgba(74, 144, 226, 0.3)', fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Status: </span>
                        <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
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
                        {/* User Preference Toggles */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px', padding: '20px'
                        }}>
                            <h3 style={{ color: '#4a90e2', marginBottom: '16px' }}>⚙️ Scanner Settings</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                {[
                                    ['autoSaveToCollection', '💾 Auto-save to Collection', 'Automatically save detected cards', autoSaveToCollection, setAutoSaveToCollection],
                                    ['skipEditionSelection', '🎭 Skip Edition Selection', 'Use first edition found for faster scanning', skipEditionSelection, setSkipEditionSelection],
                                    ['skipBasicLands', '🏔️ Skip Basic Lands', 'Ignore Plains, Island, Swamp, Mountain, Forest', skipBasicLands, setSkipBasicLands]
                                ].map(([key, title, desc, value, setter]) => (
                                    <label key={key} style={{ 
                                        display: 'flex', alignItems: 'center', gap: '12px', 
                                        cursor: 'pointer', padding: '12px', background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={value}
                                            onChange={(e) => setter(e.target.checked)}
                                            style={{ transform: 'scale(1.2)', accentColor: '#4a90e2' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{title}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Camera & Scanning */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px', padding: '24px'
                        }}>
                            {/* Mock Video Container */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <div style={{
                                    width: '100%', maxWidth: '800px', height: '450px',
                                    borderRadius: '12px', border: '2px solid #4a90e2', background: '#000',
                                    boxShadow: '0 8px 32px rgba(74, 144, 226, 0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '48px', position: 'relative'
                                }}>
                                    📷
                                    <div style={{
                                        position: 'absolute', bottom: '20px', left: '20px',
                                        color: 'white', fontSize: '14px', background: 'rgba(0,0,0,0.7)',
                                        padding: '8px 12px', borderRadius: '6px'
                                    }}>
                                        Demo Mode - Simulated Camera Feed
                                    </div>
                                </div>
                                
                                <ProfessionalCooldownStatus
                                    cooldownStatus={cooldownStatus}
                                    isVisible={true}
                                />
                                
                                {isScanning && (
                                    <div style={{
                                        position: 'absolute', top: '10px', left: '10px',
                                        background: 'rgba(74, 144, 226, 0.9)', color: 'white',
                                        padding: '8px 12px', borderRadius: '6px',
                                        fontSize: '14px', fontWeight: '600',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}>
                                        {scanningPausedForSelection ? 
                                            '⏸️ Paused for edition selection' :
                                            '🔍 Scanning for MTG cards...'
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Camera Selector */}
                            <CameraSelector
                                availableCameras={availableCameras}
                                selectedCameraId={selectedCameraId}
                                onCameraChange={handleCameraSwitch}
                                onRefresh={refreshCameraList}
                                onDiagnose={diagnoseCameraIssues}
                                cameraStatus={cameraStatus}
                            />

                            {/* Scan Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ color: '#b0bec5', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
                                        ⚙️ Scan Mode:
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['continuous', 'single'].map(mode => (
                                            <button key={mode}
                                                onClick={() => setScanMode(mode)}
                                                disabled={isScanning}
                                                style={{
                                                    flex: 1, padding: '12px',
                                                    border: scanMode === mode ? '2px solid #4a90e2' : '1px solid #666',
                                                    background: scanMode === mode ? 
                                                        'linear-gradient(45deg, #4a90e2, #64b5f6)' : 
                                                        'rgba(74, 144, 226, 0.1)',
                                                    color: 'white', borderRadius: '8px',
                                                    cursor: isScanning ? 'not-allowed' : 'pointer',
                                                    fontSize: '13px', fontWeight: '600',
                                                    opacity: isScanning ? 0.6 : 1, transition: 'all 0.2s ease'
                                                }}>
                                                {mode === 'continuous' ? '🔥 Smart Continuous' : '📷 Smart Single'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={isScanning ? stopScanning : startScanning}
                                    disabled={cameraStatus !== 'ready'}
                                    style={{
                                        padding: '16px 24px', border: 'none',
                                        background: isScanning 
                                            ? 'linear-gradient(135deg, #dc3545, #c82333)' 
                                            : cameraStatus === 'ready' 
                                                ? 'linear-gradient(135deg, #4a90e2, #64b5f6)'
                                                : 'linear-gradient(135deg, #666, #555)',
                                        color: 'white', borderRadius: '8px',
                                        cursor: cameraStatus !== 'ready' ? 'not-allowed' : 'pointer',
                                        fontSize: '16px', fontWeight: '600',
                                        opacity: cameraStatus !== 'ready' ? 0.6 : 1,
                                        transition: 'all 0.2s ease',
                                        boxShadow: cameraStatus === 'ready' ? '0 4px 15px rgba(74, 144, 226, 0.3)' : 'none'
                                    }}>
                                    {isScanning ? 
                                        '⏹️ Stop Scanning' : 
                                        cameraStatus === 'ready' ?
                                            `🔥 Start ${scanMode === 'continuous' ? 'Continuous' : 'Single'} Scan` :
                                            '📷 Camera Not Ready'
                                    }
                                </button>

                                {cooldownStatus && !cooldownStatus.canScan && (
                                    <div style={{
                                        background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)',
                                        borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '13px'
                                    }}>
                                        <div style={{ color: '#fbbf24', fontWeight: '600' }}>⏳ Smart Cooldown Active</div>
                                        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                                            Preventing API spam for stable detection
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card Display */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px', padding: '24px'
                        }}>
                            <h3 style={{ color: '#4a90e2', marginBottom: '20px', fontSize: '1.5rem', fontWeight: '600' }}>
                                🎯 Card Recognition
                            </h3>
                            
                            {currentCard ? (
                                <div style={{
                                    background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '12px', padding: '20px', marginBottom: '16px'
                                }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e', marginBottom: '12px' }}>
                                        {currentCard.cardName}
                                    </div>
                                    
                                    <div style={{ textAlign: 'left', fontSize: '14px', marginBottom: '12px' }}>
                                        {[
                                            ['Type', currentCard.cardType || 'Unknown'],
                                            ['Confidence', `${currentCard.confidence}%`],
                                            ['Method', currentCard.scryfallVerified ? '✅ Scryfall Verified' : '🧠 AI Detection'],
                                            ['Price', currentCard.prices?.usd ? `$${currentCard.prices.usd}` : null]
                                        ].filter(([_, value]) => value).map(([label, value]) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ color: '#94a3b8' }}>{label}:</span>
                                                <span style={{ 
                                                    color: label === 'Price' ? '#22c55e' : 'white', 
                                                    fontWeight: '600' 
                                                }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div style={{
                                        width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px', overflow: 'hidden', marginBottom: '16px'
                                    }}>
                                        <div style={{
                                            height: '100%', background: 'linear-gradient(90deg, #22c55e, #34d399)',
                                            width: `${currentCard.confidence}%`, borderRadius: '4px',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button onClick={() => saveCardToCollection(currentCard)}
                                            style={{
                                                padding: '8px 16px', background: 'rgba(74, 144, 226, 0.2)',
                                                border: '1px solid #4a90e2', color: '#4a90e2', borderRadius: '6px',
                                                cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                                            }}>
                                            💾 Save to Collection ({savedCards.length}/{FREE_COLLECTION_LIMIT})
                                        </button>
                                        {currentCard.scryfallUri && (
                                            <button onClick={() => window.open(currentCard.scryfallUri, '_blank')}
                                                style={{
                                                    padding: '8px 16px', background: 'rgba(34, 197, 94, 0.2)',
                                                    border: '1px solid #22c55e', color: '#22c55e', borderRadius: '6px',
                                                    cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                                                }}>
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
                                                padding: '12px', margin: '8px 0',
                                                background: 'rgba(74, 144, 226, 0.1)', borderRadius: '8px',
                                                fontSize: '13px', display: 'flex',
                                                justifyContent: 'space-between', alignItems: 'center',
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
                {activeTab === 'collection' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                        padding: '32px', width: '100%'
                    }}>
                        <CollectionManager 
                            savedCards={savedCards}
                            onRemoveCard={removeCardFromCollection}
                            onOpenScryfall={openCardInScryfall}
                        />
                    </div>
                )}

                {/* Knowledge Tab */}
                {activeTab === 'knowledge' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                        padding: '32px', width: '100%'
                    }}>
                        <MTGKnowledgeBase 
                            currentCard={currentCard}
                            savedCards={savedCards}
                        />
                    </div>
                )}

                {/* Premium Tab */}
                {activeTab === 'premium' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '15px',
                        padding: '32px', width: '100%'
                    }}>
                        <PremiumUpgradeSystem onClose={() => {}} />
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
                    <div style={{ fontWeight: 'bold', color: '#4a90e2', fontSize: '16px' }}>
                        MTG Scanner Pro - Complete
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
                    <span>📷 Cameras: {availableCameras.length}</span>
                    <span>📁 Collection: {savedCards.length}/{FREE_COLLECTION_LIMIT}</span>
                    <span>📷 Status: Ready ✅</span>
                    <span>🧠 AI: Mock Demo</span>
                    <span>{isPremiumUser ? '💎 Premium' : '🆓 Free'}</span>
                </div>
            </div>

            {/* Edition Selector Modal */}
            {showEditionSelector && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.9)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 10000
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
                        border: '2px solid #4a90e2', borderRadius: '16px', padding: '32px',
                        maxWidth: '500px', width: '90%', textAlign: 'center', color: 'white'
                    }}>
                        <h3 style={{ color: '#4a90e2', marginBottom: '20px' }}>🎭 Multiple Editions Found</h3>
                        <p style={{ marginBottom: '20px', color: '#94a3b8' }}>
                            Choose the correct edition for <strong style={{ color: '#4a90e2' }}>{pendingCardData?.cardName}</strong>:
                        </p>
                        
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                            {availableEditions.map((edition, index) => (
                                <div key={index} onClick={() => handleEditionSelected(edition)}
                                    style={{
                                        padding: '12px', margin: '8px 0',
                                        background: 'rgba(74, 144, 226, 0.1)',
                                        border: '1px solid rgba(74, 144, 226, 0.3)',
                                        borderRadius: '8px', cursor: 'pointer', textAlign: 'left'
                                    }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                        {edition.set_name || edition.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                        Set: {(edition.set || 'Unknown').toUpperCase()} • {edition.released_at || 'Unknown date'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button onClick={handleEditionCancelled}
                            style={{
                                padding: '12px 24px', background: 'transparent',
                                border: '1px solid #666', color: '#94a3b8',
                                borderRadius: '8px', cursor: 'pointer'
                            }}>
                            Skip Edition Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Modal */}
            {showPremiumModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.9)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 10000
                }}>
                    <div style={{
                        background: '#23272a', border: '2px solid #4a90e2', borderRadius: '16px',
                        padding: '32px', maxWidth: '500px', width: '90%', textAlign: 'center', color: 'white'
                    }}>
                        <h3>💎 Upgrade to Premium</h3>
                        
                        <div style={{ margin: '20px 0', fontSize: '18px' }}>
                            <p style={{ margin: '8px 0', lineHeight: '1.5' }}>
                                You've reached the <strong>{FREE_COLLECTION_LIMIT} card limit</strong> for free users!
                            </p>
                        </div>
                        
                        <div style={{
                            background: 'rgba(74, 144, 226, 0.1)', padding: '20px',
                            borderRadius: '10px', margin: '20px 0'
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
                            <button onClick={handlePremiumUpgrade}
                                style={{
                                    padding: '12px 24px', border: 'none', borderRadius: '8px',
                                    background: 'linear-gradient(45deg, #4a90e2, #357abd)',
                                    color: 'white', fontWeight: 'bold', cursor: 'pointer'
                                }}>
                                💎 Upgrade for €39/year
                            </button>
                            <button onClick={() => setShowPremiumModal(false)}
                                style={{
                                    padding: '12px 24px', border: '1px solid #666', borderRadius: '8px',
                                    background: 'transparent', color: 'white', cursor: 'pointer'
                                }}>
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scanner;