// DeckManager.js - Professional MTG Collection & Deck Builder
import React, { useState } from 'react';

const DeckManager = ({ savedCards, onRemoveCard, onOpenScryfall, scanHistory }) => {
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [sortBy, setSortBy] = useState('recent'); // recent, name, type, mana
    const [filterBy, setFilterBy] = useState('all'); // all, creatures, spells, lands
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCards, setSelectedCards] = useState([]);
    const [deckName, setDeckName] = useState('My MTG Collection');

    // Collection Statistics
    const getCollectionStats = () => {
        const totalCards = savedCards.length;
        const uniqueCards = new Set(savedCards.map(card => card.cardName)).size;
        const creatures = savedCards.filter(card => 
            card.cardType && card.cardType.toLowerCase().includes('creature')).length;
        const spells = savedCards.filter(card => 
            card.cardType && (card.cardType.toLowerCase().includes('instant') || 
            card.cardType.toLowerCase().includes('sorcery'))).length;
        const lands = savedCards.filter(card => 
            card.cardType && card.cardType.toLowerCase().includes('land')).length;
        
        return { totalCards, uniqueCards, creatures, spells, lands };
    };

    // Filter and sort cards
    const getFilteredAndSortedCards = () => {
        let filtered = [...savedCards];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(card =>
                card.cardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (card.cardType && card.cardType.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply type filter
        if (filterBy !== 'all') {
            filtered = filtered.filter(card => {
                if (!card.cardType) return false;
                const type = card.cardType.toLowerCase();
                switch (filterBy) {
                    case 'creatures':
                        return type.includes('creature');
                    case 'spells':
                        return type.includes('instant') || type.includes('sorcery');
                    case 'lands':
                        return type.includes('land');
                    default:
                        return true;
                }
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.cardName.localeCompare(b.cardName);
                case 'type':
                    return (a.cardType || '').localeCompare(b.cardType || '');
                case 'mana':
                    const getManaValue = (card) => {
                        if (!card.manaCost) return 0;
                        const match = card.manaCost.match(/\{(\d+)\}/);
                        return match ? parseInt(match[1]) : 0;
                    };
                    return getManaValue(a) - getManaValue(b);
                case 'recent':
                default:
                    return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
            }
        });

        return filtered;
    };

    const toggleCardSelection = (cardId) => {
        setSelectedCards(prev => 
            prev.includes(cardId) 
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId]
        );
    };

    const exportToMoxfield = () => {
        const collectionList = savedCards.map(card => `1 ${card.cardName}`).join('\n');
        const blob = new Blob([collectionList], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deckName.replace(/\s+/g, '_')}_Collection.txt`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('📤 Collection exported for Moxfield/EDHREC import');
    };

    const removeSelectedCards = () => {
        selectedCards.forEach(cardId => {
            onRemoveCard(cardId);
        });
        setSelectedCards([]);
        console.log(`🗑️ Removed ${selectedCards.length} cards from collection`);
    };

    const stats = getCollectionStats();
    const displayedCards = getFilteredAndSortedCards();

    return (
        <div className="deck-manager">
            {/* Collection Header */}
            <div className="collection-header">
                <div className="collection-title">
                    <h2>🃏 My MTG Collection</h2>
                    <input
                        type="text"
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        className="deck-name-input"
                        placeholder="Enter collection name..."
                    />
                </div>

                {/* Collection Statistics */}
                <div className="collection-stats">
                    <div className="stat-card">
                        <div className="stat-number">{stats.totalCards}</div>
                        <div className="stat-label">Total Cards</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.uniqueCards}</div>
                        <div className="stat-label">Unique Cards</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.creatures}</div>
                        <div className="stat-label">Creatures</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.spells}</div>
                        <div className="stat-label">Spells</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.lands}</div>
                        <div className="stat-label">Lands</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="collection-controls">
                {/* Search */}
                <div className="search-section">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="🔍 Search cards..."
                        className="search-input"
                    />
                </div>

                {/* Filters and Sort */}
                <div className="filter-section">
                    <select 
                        value={filterBy} 
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Types</option>
                        <option value="creatures">Creatures</option>
                        <option value="spells">Spells</option>
                        <option value="lands">Lands</option>
                    </select>

                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="recent">Recently Added</option>
                        <option value="name">Name A-Z</option>
                        <option value="type">Type</option>
                        <option value="mana">Mana Cost</option>
                    </select>

                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="view-toggle-btn"
                    >
                        {viewMode === 'grid' ? '📋 List' : '🔳 Grid'}
                    </button>
                </div>

                {/* Actions */}
                <div className="action-section">
                    {selectedCards.length > 0 && (
                        <button
                            onClick={removeSelectedCards}
                            className="remove-selected-btn"
                        >
                            🗑️ Remove ({selectedCards.length})
                        </button>
                    )}
                    
                    <button
                        onClick={exportToMoxfield}
                        className="export-btn"
                        disabled={savedCards.length === 0}
                    >
                        📤 Export Collection
                    </button>
                </div>
            </div>

            {/* Card Display */}
            {savedCards.length === 0 ? (
                <div className="empty-collection">
                    <div className="empty-icon">🃏</div>
                    <h3>No Cards in Collection</h3>
                    <p>Start scanning MTG cards to build your collection!</p>
                    <div className="empty-suggestions">
                        <div className="suggestion">
                            <span>🔍</span>
                            <span>Go to Scanner tab and scan your first card</span>
                        </div>
                        <div className="suggestion">
                            <span>💾</span>
                            <span>Click "Save to Collection" when you find a card</span>
                        </div>
                        <div className="suggestion">
                            <span>🎯</span>
                            <span>Build decks and track your MTG collection</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`card-collection ${viewMode}`}>
                    {displayedCards.map((card) => (
                        <div
                            key={card.id}
                            className={`collection-card ${selectedCards.includes(card.id) ? 'selected' : ''}`}
                            onClick={() => toggleCardSelection(card.id)}
                        >
                            {/* Card Image Placeholder */}
                            <div className="card-image-placeholder">
                                {card.scryfallImageUrl ? (
                                    <img 
                                        src={card.scryfallImageUrl} 
                                        alt={card.cardName}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : null}
                                <div className="card-image-fallback" style={{display: card.scryfallImageUrl ? 'none' : 'block'}}>
                                    <div className="card-icon">🃏</div>
                                    <div className="card-name-short">{card.cardName}</div>
                                </div>
                            </div>

                            {/* Card Info */}
                            <div className="card-info">
                                <div className="card-name">{card.cardName}</div>
                                <div className="card-type">{card.cardType || 'Unknown Type'}</div>
                                <div className="card-mana">{card.manaCost || 'No Cost'}</div>
                                {card.setInfo && (
                                    <div className="card-set">{card.setInfo}</div>
                                )}
                            </div>

                            {/* Card Actions */}
                            <div className="card-actions">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenScryfall(card);
                                    }}
                                    className="scryfall-link-btn"
                                    title="View on Scryfall"
                                >
                                    🔗
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveCard(card.id);
                                    }}
                                    className="remove-card-btn"
                                    title="Remove from collection"
                                >
                                    🗑️
                                </button>
                            </div>

                            {/* Selection Indicator */}
                            {selectedCards.includes(card.id) && (
                                <div className="selection-indicator">✓</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Collection Footer */}
            {savedCards.length > 0 && (
                <div className="collection-footer">
                    <div className="footer-stats">
                        Showing {displayedCards.length} of {savedCards.length} cards
                        {selectedCards.length > 0 && (
                            <span className="selection-count">
                                | {selectedCards.length} selected
                            </span>
                        )}
                    </div>
                    <div className="footer-actions">
                        <span className="powered-by">Powered by Scryfall Database</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeckManager;