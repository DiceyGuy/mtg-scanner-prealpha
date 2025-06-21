// MTGKnowledgeBase.js - Complete MTG FAQ, Combos & Authenticity Guide
import React, { useState, useEffect } from 'react';

const MTGKnowledgeBase = ({ currentCard = null }) => {
    const [activeSection, setActiveSection] = useState('combos');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [authenticityMode, setAuthenticityMode] = useState('overview');

    // COMBO DATABASE
    const comboDatabase = [
        {
            id: 'thoracle_consultation',
            name: 'Thassa\'s Oracle + Demonic Consultation',
            colors: ['U', 'B'],
            cmc: 4,
            pieces: ['Thassa\'s Oracle', 'Demonic Consultation'],
            description: 'Win the game instantly by exiling your entire library',
            setup: [
                '1. Cast Demonic Consultation, name a card not in your deck',
                '2. Exile your entire library',
                '3. Cast Thassa\'s Oracle with empty library',
                '4. Win the game when Oracle enters'
            ],
            competitiveness: 'cEDH',
            formats: ['Commander', 'Legacy', 'Vintage'],
            price: '$$$',
            counters: ['Stifle', 'Torpor Orb', 'Containment Priest'],
            variations: ['Tainted Pact version', 'Jace version']
        },
        {
            id: 'splinter_twin',
            name: 'Splinter Twin + Deceiver Exarch',
            colors: ['U', 'R'],
            cmc: 7,
            pieces: ['Splinter Twin', 'Deceiver Exarch'],
            description: 'Create infinite hasty creatures for immediate win',
            setup: [
                '1. Cast Deceiver Exarch (or Pestermite)',
                '2. Untap a land with Exarch trigger',
                '3. Cast Splinter Twin on Exarch',
                '4. Tap Exarch to create copy, untap original, repeat'
            ],
            competitiveness: 'Competitive',
            formats: ['Modern (Banned)', 'Pioneer', 'Commander'],
            price: '$$',
            counters: ['Lightning Bolt', 'Path to Exile', 'Abrupt Decay'],
            variations: ['Kiki-Jiki version', 'Restoration Angel package']
        },
        {
            id: 'dramatic_scepter',
            name: 'Dramatic Reversal + Isochron Scepter',
            colors: ['U'],
            cmc: 4,
            pieces: ['Dramatic Reversal', 'Isochron Scepter', 'Mana rocks'],
            description: 'Generate infinite mana with artifacts producing 3+ mana',
            setup: [
                '1. Have 2+ mana rocks producing 3+ total mana',
                '2. Cast Isochron Scepter, imprinting Dramatic Reversal',
                '3. Activate Scepter to cast Dramatic Reversal',
                '4. Untap all artifacts, repeat for infinite mana'
            ],
            competitiveness: 'cEDH',
            formats: ['Commander', 'Legacy', 'Vintage'],
            price: '$',
            counters: ['Null Rod', 'Stony Silence', 'Collector Ouphe'],
            variations: ['Walking Ballista finish', 'Blue Sun\'s Zenith finish']
        }
    ];

    // FAQ DATABASE
    const faqDatabase = [
        {
            category: 'Scanning & Recognition',
            questions: [
                {
                    q: 'Why is my card not being recognized?',
                    a: 'Try improving lighting, ensure the card is flat and fully in frame, clean the camera lens, or use better positioning. Some very new or obscure cards might not be in the database yet.'
                },
                {
                    q: 'How accurate is the AI recognition?',
                    a: 'Our Gemini AI achieves 95%+ accuracy on well-positioned cards with good lighting. Recognition is most accurate for cards from major sets and in English.'
                },
                {
                    q: 'Can it recognize foil or alternate art cards?',
                    a: 'Yes, but foil cards may require better lighting to avoid glare. Alternate art and special treatments are recognized but may show lower confidence initially.'
                }
            ]
        },
        {
            category: 'Deck Building',
            questions: [
                {
                    q: 'What formats does the deck builder support?',
                    a: 'All major formats: Standard, Pioneer, Modern, Legacy, Vintage, Commander, Pauper, and casual formats. Format legality checking is included.'
                },
                {
                    q: 'Can I export my deck to other platforms?',
                    a: 'Yes! Export to Moxfield, EDHREC, Archidekt, TappedOut, and text formats. JSON export is also available for custom integration.'
                }
            ]
        }
    ];

    // AUTHENTICITY GUIDE
    const authenticityGuide = {
        overview: {
            title: 'Card Authenticity Overview',
            content: [
                {
                    category: 'High-Value Targets for Counterfeiting',
                    items: [
                        'Power 9 cards (Black Lotus, Moxes, Ancestral Recall, etc.)',
                        'Dual Lands (Underground Sea, Volcanic Island, etc.)',
                        'Reserved List cards',
                        'Modern/Legacy staples over $100'
                    ]
                },
                {
                    category: 'Red Flags to Watch For',
                    items: [
                        'Price too good to be true',
                        'Seller with no feedback/history',
                        'Blurry or stock photos only',
                        'Unusual printing or coloring'
                    ]
                }
            ]
        },
        physical_tests: {
            title: 'Physical Authentication Tests',
            tests: [
                {
                    name: 'Light Test',
                    description: 'Shine a bright light through the card',
                    authentic: 'Real cards show a blue core layer between two layers of cardboard',
                    fake: 'Fakes often show different colors, no blue layer, or uneven opacity',
                    difficulty: 'Easy',
                    reliability: 'High'
                },
                {
                    name: 'Bend Test',
                    description: 'Gently bend the card (risky for valuable cards)',
                    authentic: 'Real cards have elasticity and return to shape',
                    fake: 'Fakes may crease, feel stiff, or not return to original shape',
                    difficulty: 'Easy',
                    reliability: 'Medium',
                    warning: '⚠️ Risk of damage - use with caution'
                }
            ]
        }
    };

    // FILTERING AND SEARCH
    const filteredCombos = comboDatabase.filter(combo => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            combo.name.toLowerCase().includes(query) ||
            combo.pieces.some(piece => piece.toLowerCase().includes(query)) ||
            combo.description.toLowerCase().includes(query)
        );
    });

    const filteredFAQ = faqDatabase.map(category => ({
        ...category,
        questions: category.questions.filter(qa =>
            !searchQuery || 
            qa.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            qa.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

    // RENDER METHODS
    const renderCombos = () => (
        <div className="combos-section">
            <div className="section-header">
                <h2>⚡ MTG Combo Database</h2>
                <input
                    type="text"
                    placeholder="Search combos, cards, or colors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="combos-grid">
                {filteredCombos.map(combo => (
                    <div
                        key={combo.id}
                        className={`combo-card ${selectedCombo?.id === combo.id ? 'selected' : ''}`}
                        onClick={() => setSelectedCombo(combo)}
                    >
                        <div className="combo-header">
                            <h3>{combo.name}</h3>
                            <div className="combo-colors">
                                {combo.colors.map(color => (
                                    <span key={color} className={`mana-symbol ${color.toLowerCase()}`}>
                                        {color}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="combo-info">
                            <div className="combo-pieces">
                                <strong>Key pieces:</strong> {combo.pieces.join(', ')}
                            </div>
                            <div className="combo-description">{combo.description}</div>
                            
                            <div className="combo-meta">
                                <span className={`competitiveness ${combo.competitiveness.toLowerCase().replace(' ', '-')}`}>
                                    {combo.competitiveness}
                                </span>
                                <span className="combo-price">{combo.price}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedCombo && (
                <div className="combo-details">
                    <h3>📋 {selectedCombo.name} - Detailed Guide</h3>
                    
                    <div className="combo-setup">
                        <h4>🔧 Setup Instructions:</h4>
                        <ol>
                            {selectedCombo.setup.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    </div>

                    <div className="combo-details-grid">
                        <div className="detail-section">
                            <h4>🎯 Formats</h4>
                            <ul>
                                {selectedCombo.formats.map((format, index) => (
                                    <li key={index}>{format}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="detail-section">
                            <h4>🛡️ Common Counters</h4>
                            <ul>
                                {selectedCombo.counters.map((counter, index) => (
                                    <li key={index}>{counter}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderAuthenticity = () => (
        <div className="authenticity-section">
            <div className="section-header">
                <h2>🔍 Card Authenticity Guide</h2>
                <div className="auth-nav">
                    {Object.keys(authenticityGuide).map(section => (
                        <button
                            key={section}
                            className={authenticityMode === section ? 'active' : ''}
                            onClick={() => setAuthenticityMode(section)}
                        >
                            {section.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="auth-content">
                {authenticityMode === 'overview' && (
                    <div className="overview-content">
                        <h3>{authenticityGuide.overview.title}</h3>
                        {authenticityGuide.overview.content.map((section, index) => (
                            <div key={index} className="overview-section">
                                <h4>{section.category}</h4>
                                <ul>
                                    {section.items.map((item, itemIndex) => (
                                        <li key={itemIndex}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                {authenticityMode === 'physical_tests' && (
                    <div className="tests-content">
                        <h3>{authenticityGuide.physical_tests.title}</h3>
                        {authenticityGuide.physical_tests.tests.map((test, index) => (
                            <div key={index} className="test-card">
                                <h4>{test.name} <span className={`difficulty ${test.difficulty.toLowerCase()}`}>{test.difficulty}</span></h4>
                                <p><strong>Method:</strong> {test.description}</p>
                                <div className="test-results">
                                    <div className="authentic-result">
                                        <strong>✅ Authentic:</strong> {test.authentic}
                                    </div>
                                    <div className="fake-result">
                                        <strong>❌ Fake:</strong> {test.fake}
                                    </div>
                                </div>
                                <div className="test-meta">
                                    <span className="reliability">Reliability: {test.reliability}</span>
                                    {test.warning && <span className="warning">{test.warning}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderFAQ = () => (
        <div className="faq-section">
            <div className="section-header">
                <h2>❓ Frequently Asked Questions</h2>
                <input
                    type="text"
                    placeholder="Search FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="faq-content">
                {filteredFAQ.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="faq-category">
                        <h3>{category.category}</h3>
                        {category.questions.map((qa, qaIndex) => (
                            <div key={qaIndex} className="faq-item">
                                <div className="faq-question">
                                    <strong>Q: {qa.q}</strong>
                                </div>
                                <div className="faq-answer">
                                    A: {qa.a}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="mtg-knowledge-base">
            <div className="knowledge-nav">
                <button
                    className={activeSection === 'combos' ? 'active' : ''}
                    onClick={() => setActiveSection('combos')}
                >
                    ⚡ Combos
                </button>
                <button
                    className={activeSection === 'authenticity' ? 'active' : ''}
                    onClick={() => setActiveSection('authenticity')}
                >
                    🔍 Authenticity
                </button>
                <button
                    className={activeSection === 'faq' ? 'active' : ''}
                    onClick={() => setActiveSection('faq')}
                >
                    ❓ FAQ
                </button>
            </div>

            <div className="knowledge-content">
                {activeSection === 'combos' && renderCombos()}
                {activeSection === 'authenticity' && renderAuthenticity()}
                {activeSection === 'faq' && renderFAQ()}
            </div>
        </div>
    );
};

export default MTGKnowledgeBase;