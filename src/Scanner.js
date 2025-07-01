import React, { useState, useRef, useEffect } from 'react';

// 🔥 MTG COMBO DETECTION ENGINE
class MTGComboEngine {
    constructor() {
        this.combos = [
            {
                id: 1,
                name: "Lightning Bolt + Snapcaster Mage",
                cards: ["lightning bolt", "snapcaster mage"],
                description: "Play Lightning Bolt, then Snapcaster Mage to get Lightning Bolt back for 6 damage total",
                colors: ["R", "U"],
                type: "Burn Combo",
                difficulty: "Easy"
            },
            {
                id: 2,
                name: "Thassa's Oracle + Demonic Consultation",
                cards: ["thassa's oracle", "demonic consultation"],
                description: "Cast Demonic Consultation naming a card not in your deck, then play Thassa's Oracle to win",
                colors: ["U", "B"],
                type: "Win Condition",
                difficulty: "Advanced"
            },
            {
                id: 3,
                name: "Sol Ring + Any 2-Drop",
                cards: ["sol ring"],
                description: "Turn 1 Sol Ring enables turn 2 four-mana plays",
                colors: [],
                type: "Ramp Combo",
                difficulty: "Easy"
            },
            {
                id: 4,
                name: "Counterspell + Card Draw",
                cards: ["counterspell"],
                description: "Hold up counterspells while drawing cards to maintain control",
                colors: ["U"],
                type: "Control Package",
                difficulty: "Medium"
            },
            {
                id: 5,
                name: "Craterhoof Behemoth + Token Army",
                cards: ["craterhoof behemoth"],
                description: "Play Craterhoof with multiple creatures for massive alpha strike",
                colors: ["G"],
                type: "Finisher Combo",
                difficulty: "Medium"
            },
            {
                id: 6,
                name: "Dark Ritual + High CMC Spell",
                cards: ["dark ritual"],
                description: "Turn 1 Dark Ritual enables turn 1 four-mana plays",
                colors: ["B"],
                type: "Fast Mana",
                difficulty: "Easy"
            },
            {
                id: 7,
                name: "Swords to Plowshares + Creature Deck",
                cards: ["swords to plowshares"],
                description: "Efficient removal that gains life while dealing with threats",
                colors: ["W"],
                type: "Removal Package",
                difficulty: "Easy"
            },
            {
                id: 8,
                name: "Birds of Paradise + Three-Color Mana Base",
                cards: ["birds of paradise"],
                description: "Turn 1 mana dork enables consistent three-color casting",
                colors: ["G"],
                type: "Mana Fixing",
                difficulty: "Medium"
            }
        ];
    }

    findCombosInCollection(collection) {
        const cardNames = collection.map(card => card.cardName.toLowerCase().trim());
        const foundCombos = [];

        this.combos.forEach(combo => {
            const hasAllCards = combo.cards.every(comboCard => 
                cardNames.some(collectionCard => 
                    collectionCard.includes(comboCard) || comboCard.includes(collectionCard)
                )
            );

            if (hasAllCards) {
                const matchedCards = combo.cards.map(comboCard => {
                    const match = collection.find(collectionCard => 
                        collectionCard.cardName.toLowerCase().includes(comboCard) ||
                        comboCard.includes(collectionCard.cardName.toLowerCase())
                    );
                    return match ? match.cardName : comboCard;
                });

                foundCombos.push({
                    ...combo,
                    matchedCards,
                    collectionCards: collection.filter(card => 
                        combo.cards.some(comboCard => 
                            card.cardName.toLowerCase().includes(comboCard) ||
                            comboCard.includes(card.cardName.toLowerCase())
                        )
                    )
                });
            }
        });

        // Sort by difficulty (Easy first, then Medium, then Advanced)
        return foundCombos.sort((a, b) => {
            const order = { "Easy": 1, "Medium": 2, "Advanced": 3 };
            return order[a.difficulty] - order[b.difficulty];
        });
    }

    suggestMissingCards(collection) {
        const cardNames = collection.map(card => card.cardName.toLowerCase().trim());
        const suggestions = [];

        this.combos.forEach(combo => {
            const hasCards = combo.cards.filter(comboCard => 
                cardNames.some(collectionCard => 
                    collectionCard.includes(comboCard) || comboCard.includes(collectionCard)
                )
            );

            const missingCards = combo.cards.filter(comboCard => 
                !cardNames.some(collectionCard => 
                    collectionCard.includes(comboCard) || comboCard.includes(collectionCard)
                )
            );

            if (hasCards.length > 0 && missingCards.length > 0) {
                suggestions.push({
                    ...combo,
                    hasCards,
                    missingCards,
                    completionPercentage: Math.round((hasCards.length / combo.cards.length) * 100)
                });
            }
        });

        return suggestions.sort((a, b) => b.completionPercentage - a.completionPercentage);
    }
}

// 🔥 COMBO SUGGESTIONS COMPONENT
const ComboSuggestions = ({ savedCards, isPremiumUser, onUpgrade }) => {
    const [comboEngine] = useState(new MTGComboEngine());
    const [activeSection, setActiveSection] = useState('found');
    const [freeUsagesLeft, setFreeUsagesLeft] = useState(() => {
        const stored = localStorage.getItem('mtg_combo_free_usages');
        return stored ? parseInt(stored) : 3;
    });
    const [showPaywall, setShowPaywall] = useState(false);

    const foundCombos = comboEngine.findCombosInCollection(savedCards);
    const suggestions = comboEngine.suggestMissingCards(savedCards);

    const handleComboView = () => {
        if (!isPremiumUser && freeUsagesLeft <= 0) {
            setShowPaywall(true);
            return;
        }

        if (!isPremiumUser) {
            const newUsages = freeUsagesLeft - 1;
            setFreeUsagesLeft(newUsages);
            localStorage.setItem('mtg_combo_free_usages', newUsages.toString());
        }
    };

    useEffect(() => {
        if (activeSection === 'found' || activeSection === 'suggestions') {
            handleComboView();
        }
    }, [activeSection]);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return '#22c55e';
            case 'Medium': return '#f59e0b';
            case 'Advanced': return '#dc2626';
            default: return '#64b5f6';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Win Condition': return '🏆';
            case 'Burn Combo': return '🔥';
            case 'Ramp Combo': return '⚡';
            case 'Control Package': return '🛡️';
            case 'Finisher Combo': return '💥';
            case 'Fast Mana': return '💎';
            case 'Removal Package': return '⚔️';
            case 'Mana Fixing': return '🌈';
            default: return '🎯';
        }
    };

    if (savedCards.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
                <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Cards in Collection</h3>
                <p style={{ color: '#94a3b8' }}>
                    Start scanning cards to get AI-powered combo suggestions!
                </p>
            </div>
        );
    }

    return (
        <div style={{ color: 'white' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '24px' 
            }}>
                <h2 style={{ color: '#4a90e2', margin: 0 }}>
                    🎯 AI Combo Suggestions
                </h2>
                {!isPremiumUser && (
                    <div style={{
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '20px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#fbbf24',
                        fontWeight: '600'
                    }}>
                        🆓 {freeUsagesLeft} free views left
                    </div>
                )}
            </div>
            
            {/* Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveSection('found')}
                    style={{
                        padding: '10px 20px',
                        background: activeSection === 'found' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                        color: activeSection === 'found' ? 'white' : '#4a90e2',
                        border: '1px solid #4a90e2',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    🔍 Found Combos ({foundCombos.length})
                </button>
                <button
                    onClick={() => setActiveSection('suggestions')}
                    style={{
                        padding: '10px 20px',
                        background: activeSection === 'suggestions' ? '#4a90e2' : 'rgba(74, 144, 226, 0.1)',
                        color: activeSection === 'suggestions' ? 'white' : '#4a90e2',
                        border: '1px solid #4a90e2',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    💡 Missing Cards ({suggestions.length})
                </button>
            </div>

            {/* Content */}
            {showPaywall ? (
                <div style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '2px solid rgba(220, 38, 38, 0.3)',
                    borderRadius: '12px',
                    padding: '32px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#dc2626', marginBottom: '16px' }}>
                        🔒 Premium Feature
                    </h3>
                    <p style={{ marginBottom: '20px', color: '#e2e8f0' }}>
                        You've used all 3 free combo analyses! Upgrade to Premium for unlimited AI combo suggestions.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={onUpgrade}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(45deg, #4a90e2, #357abd)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            💎 Upgrade to Premium
                        </button>
                        <button
                            onClick={() => setShowPaywall(false)}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: '1px solid #666',
                                color: '#94a3b8',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            ) : activeSection === 'found' ? (
                <div>
                    {foundCombos.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '12px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                            <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Combos Found</h3>
                            <p style={{ color: '#94a3b8' }}>
                                Scan more cards to discover powerful synergies in your collection!
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {foundCombos.map((combo, index) => (
                                <div key={combo.id} style={{
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '12px',
                                    padding: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <h4 style={{ color: '#22c55e', margin: '0 0 8px 0', fontSize: '18px' }}>
                                                {getTypeIcon(combo.type)} {combo.name}
                                            </h4>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{
                                                    background: getDifficultyColor(combo.difficulty),
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {combo.difficulty}
                                                </span>
                                                <span style={{
                                                    background: 'rgba(74, 144, 226, 0.2)',
                                                    color: '#4a90e2',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {combo.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p style={{ color: '#e2e8f0', marginBottom: '16px', lineHeight: '1.5' }}>
                                        {combo.description}
                                    </p>
                                    
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                                            Cards in your collection:
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {combo.matchedCards.map((cardName, idx) => (
                                                <span key={idx} style={{
                                                    background: 'rgba(34, 197, 94, 0.2)',
                                                    color: '#22c55e',
                                                    padding: '4px 8px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {cardName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {suggestions.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '12px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
                            <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>No Suggestions Available</h3>
                            <p style={{ color: '#94a3b8' }}>
                                Your collection doesn't have partial matches for known combos yet.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {suggestions.map((suggestion, index) => (
                                <div key={suggestion.id} style={{
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                    borderRadius: '12px',
                                    padding: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <h4 style={{ color: '#fbbf24', margin: '0 0 8px 0', fontSize: '18px' }}>
                                                {getTypeIcon(suggestion.type)} {suggestion.name}
                                            </h4>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{
                                                    background: '#fbbf24',
                                                    color: 'black',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {suggestion.completionPercentage}% Complete
                                                </span>
                                                <span style={{
                                                    background: getDifficultyColor(suggestion.difficulty),
                                                    color: 'white',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {suggestion.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p style={{ color: '#e2e8f0', marginBottom: '16px', lineHeight: '1.5' }}>
                                        {suggestion.description}
                                    </p>
                                    
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div>
                                            <div style={{ color: '#22c55e', fontSize: '14px', marginBottom: '8px' }}>
                                                ✅ You have:
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {suggestion.hasCards.map((cardName, idx) => (
                                                    <span key={idx} style={{
                                                        background: 'rgba(34, 197, 94, 0.2)',
                                                        color: '#22c55e',
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {cardName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '8px' }}>
                                                ❌ You need:
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {suggestion.missingCards.map((cardName, idx) => (
                                                    <span key={idx} style={{
                                                        background: 'rgba(220, 38, 38, 0.2)',
                                                        color: '#dc2626',
                                                        padding: '4px 8px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {cardName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// 🔥 MOCK VISION SERVICE (Replace with your actual ClaudeVisionService)
class MockVisionService {
    constructor() {
        this.mockCards = [
            { cardName: "Lightning Bolt", confidence: 95, cardType: "Instant", colors: ["R"] },
            { cardName: "Sol Ring", confidence: 98, cardType: "Artifact", colors: [] },
            { cardName: "Counterspell", confidence: 92, cardType: "Instant", colors: ["U"] },
            { cardName: "Thassa's Oracle", confidence: 89, cardType: "Creature", colors: ["U"] },
            { cardName: "Dark Ritual", confidence: 96, cardType: "Instant", colors: ["B"] },
            { cardName: "Swords to Plowshares", confidence: 94, cardType: "Instant", colors: ["W"] },
            { cardName: "Birds of Paradise", confidence: 91, cardType: "Creature", colors: ["G"] }
        ];
        this.currentIndex = 0;
    }

    async processVideoFrame(videoElement) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return a random card from our mock list
        const card = this.mockCards[this.currentIndex % this.mockCards.length];
        this.currentIndex++;
        
        return {
            hasCard: true,
            ...card,
            timestamp: new Date().toISOString(),
            method: 'mock_detection'
        };
    }
}

// 🔥 MAIN SCANNER COMPONENT
const MTGScannerPro = () => {
    // Core scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('ready'); // Mock as ready
    const [currentCard, setCurrentCard] = useState(null);
    const [scanMode, setScanMode] = useState('single');
    
    // UI state
    const [activeTab, setActiveTab] = useState('scanner');
    const [scanHistory, setScanHistory] = useState([]);
    const [savedCards, setSavedCards] = useState([]);
    
    // Premium features
    const [isPremiumUser, setIsPremiumUser] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);
    const FREE_COLLECTION_LIMIT = 200;
    
    // Refs
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const visionServiceRef = useRef(new MockVisionService());

    // Load saved data on mount
    useEffect(() => {
        loadSavedData();
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

    const startScanning = () => {
        if (!visionServiceRef.current) {
            console.log('⚠️ Vision service not ready');
            return;
        }
        
        console.log(`▶️ Starting MTG Scanner - ${scanMode} mode...`);
        setIsScanning(true);
        
        scanIntervalRef.current = setInterval(async () => {
            try {
                console.log("🔄 Processing frame for MTG card...");
                
                const result = await visionServiceRef.current.processVideoFrame(videoRef.current);
                
                if (result && result.hasCard && result.confidence >= 85) {
                    console.log(`🎯 Detection: ${result.cardName} (${result.confidence}%)`);
                    
                    displayCard(result);
                    
                    if (scanMode === 'single') {
                        stopScanning();
                    }
                }
            } catch (error) {
                console.error('❌ Scanning error:', error);
            }
        }, 2000);
    };

    const stopScanning = () => {
        console.log('⏹️ Stopping MTG Scanner...');
        setIsScanning(false);
        
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
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
            
            console.log('💾 Card saved to collection:', card.cardName);
            return true;
        } catch (error) {
            console.error('❌ Failed to save card:', error);
            return false;
        }
    };

    const removeCardFromCollection = (cardId) => {
        const updatedCards = savedCards.filter(card => card.id !== cardId);
        setSavedCards(updatedCards);
        localStorage.setItem('mtg_saved_cards', JSON.stringify(updatedCards));
    };

    const handleUpgradeToPremium = () => {
        const paypalLink = `https://www.paypal.com/paypalme/thediceyguy/19.99`;
        window.open(paypalLink, '_blank');
        
        setTimeout(() => {
            setIsPremiumUser(true);
            localStorage.setItem('mtg_premium_status', 'true');
            setShowPaywallModal(false);
            alert('💎 Premium upgrade successful!');
        }, 3000);
    };

    return (
        <div style={{
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
                            🔥 AI Combo Suggestions • 3 Free Analyses • $19.99 Premium
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
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {[
                    { id: 'scanner', label: '🔍 Scanner', badge: null },
                    { id: 'collection', label: '🃏 Collection', badge: savedCards.length },
                    { id: 'combos', label: '🎯 AI Combos', badge: null }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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
                            {/* Mock Camera Display */}
                            <div style={{ 
                                position: 'relative', 
                                marginBottom: '20px',
                                background: '#000',
                                borderRadius: '12px',
                                border: '2px solid #4a90e2',
                                height: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                                    <div>Camera Feed</div>
                                    <div style={{ fontSize: '12px', marginTop: '8px' }}>
                                        (Demo mode - click Start Scanning to simulate detection)
                                    </div>
                                </div>
                                
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
                                        🔍 Scanning for MTG cards...
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
                                            🔥 Continuous
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
                                            📷 Single
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={isScanning ? stopScanning : startScanning}
                                    style={{
                                        padding: '16px 24px',
                                        border: 'none',
                                        background: isScanning 
                                            ? 'linear-gradient(135deg, #dc3545, #c82333)' 
                                            : 'linear-gradient(135deg, #4a90e2, #64b5f6)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {isScanning ? '⏹️ Stop Scanning' : `🔥 Start ${scanMode} Scan`}
                                </button>
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
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                        No card detected. Start scanning to detect MTG cards.
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
                    </>
                )}

                {/* Collection Tab */}
                {activeTab === 'collection' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '15px',
                        padding: '32px'
                    }}>
                        <h2 style={{ color: '#4a90e2', marginBottom: '24px' }}>
                            🃏 Card Collection ({savedCards.length} cards)
                        </h2>

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
                                <p style={{ color: '#94a3b8' }}>
                                    Start scanning cards to build your collection
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '16px'
                            }}>
                                {savedCards.map((card, index) => (
                                    <div
                                        key={card.id || index}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        <h4 style={{ color: '#4a90e2', marginBottom: '8px', fontSize: '16px' }}>
                                            {card.cardName}
                                        </h4>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                                            {card.cardType && <div>Type: {card.cardType}</div>}
                                            {card.scannedAt && <div>Added: {card.scannedAt}</div>}
                                        </div>
                                        
                                        <button
                                            onClick={() => removeCardFromCollection(card.id)}
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
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* AI Combos Tab */}
                {activeTab === 'combos' && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '15px',
                        padding: '32px'
                    }}>
                        <ComboSuggestions 
                            savedCards={savedCards}
                            isPremiumUser={isPremiumUser}
                            onUpgrade={() => setShowPaywallModal(true)}
                        />
                    </div>
                )}
            </div>

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
                                Unlock unlimited AI combo suggestions and advanced features!
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
                                <li>🎯 <strong>Unlimited AI combo suggestions</strong></li>
                                <li>🔥 <strong>Unlimited collection storage</strong></li>
                                <li>📊 <strong>Advanced collection analytics</strong></li>
                                <li>💰 <strong>Price tracking & alerts</strong></li>
                                <li>🏆 <strong>Tournament deck optimization</strong></li>
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
                                    cursor: 'pointer',
                                    fontSize: '16px'
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
                            <p>💳 <strong>Secure payment via PayPal</strong></p>
                            <p>📧 Payment to: <strong>thediceyguy@gmail.com</strong></p>
                            <p>🔒 One-time payment • Lifetime premium access</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MTGScannerPro;