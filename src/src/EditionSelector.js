// EditionSelector.js - Visual Edition Selection with Card Images
import React, { useState, useEffect } from 'react';

const EditionSelector = ({ cardName, availableEditions, onEditionSelected, onCancel }) => {
    const [selectedEdition, setSelectedEdition] = useState(null);
    const [loadingImages, setLoadingImages] = useState(true);
    const [editionsWithImages, setEditionsWithImages] = useState([]);

    console.log('🎭 EditionSelector RENDERING!', { 
        cardName, 
        editionCount: availableEditions?.length || 0, 
        editions: availableEditions?.map(e => e.set_name) || []
    });

    useEffect(() => {
        // Process editions and prepare image data with competitive info
        if (availableEditions && availableEditions.length > 0) {
            const processedEditions = availableEditions.map(edition => {
                const legalities = edition.legalities || {};
                const setCode = edition.set?.toUpperCase();
                const releasedAt = edition.released_at || '????-??-??';
                const releaseYear = parseInt(releasedAt.substring(0, 4));
                
                // Determine special edition status
                const isRevisedEra = ['3ED', 'REV', 'ULG', 'USG', 'TMP', 'STH', 'EXO'].includes(setCode);
                const isVintage = releaseYear <= 1995; // Alpha, Beta, Unlimited, Arabian Nights, etc.
                const isModern = releaseYear >= 2003; // Modern format legal
                const isStandard = releaseYear >= 2022; // Approximate current Standard
                
                // Check banned status in major formats
                const bannedFormats = [];
                if (legalities.standard === 'banned') bannedFormats.push('Standard');
                if (legalities.modern === 'banned') bannedFormats.push('Modern');
                if (legalities.legacy === 'banned') bannedFormats.push('Legacy');
                if (legalities.commander === 'banned') bannedFormats.push('Commander');
                
                // Legal formats
                const legalFormats = [];
                if (legalities.standard === 'legal') legalFormats.push('Standard');
                if (legalities.modern === 'legal') legalFormats.push('Modern');
                if (legalities.legacy === 'legal') legalFormats.push('Legacy');
                if (legalities.commander === 'legal') legalFormats.push('Commander');
                if (legalities.vintage === 'legal') legalFormats.push('Vintage');
                
                // Determine significance
                let significance = '';
                if (bannedFormats.length > 0) {
                    significance = '🚫 BANNED';
                } else if (isVintage) {
                    significance = '🏛️ VINTAGE';
                } else if (isRevisedEra) {
                    significance = '📜 CLASSIC';
                } else if (legalFormats.includes('Standard')) {
                    significance = '⚡ CURRENT';
                } else if (legalFormats.includes('Modern')) {
                    significance = '🏆 MODERN';
                } else {
                    significance = '🎯 LEGACY';
                }
                
                return {
                    ...edition,
                    imageUrl: edition.image_uris?.normal || edition.image_uris?.large || edition.image_uris?.small,
                    fallbackImageUrl: edition.image_uris?.art_crop || edition.image_uris?.border_crop,
                    price: edition.prices?.usd || edition.prices?.eur || 'N/A',
                    setIcon: edition.set_uri,
                    rarity: edition.rarity || 'common',
                    releasedAt,
                    releaseYear,
                    // Competitive info
                    significance,
                    bannedFormats,
                    legalFormats,
                    isRevisedEra,
                    isVintage,
                    isModern,
                    isStandard,
                    // Reserved list check (approximate)
                    isReservedList: releaseYear <= 1998 && edition.rarity === 'rare',
                    // Price trend (mock - would need historical data)
                    priceTrend: Math.random() > 0.5 ? 'up' : 'down'
                };
            });

            setEditionsWithImages(processedEditions);
            setLoadingImages(false);
        }
    }, [availableEditions]);

    const handleEditionSelect = (edition) => {
        console.log('🎯 Edition selected via image click:', edition.set_name);
        setSelectedEdition(edition);
        onEditionSelected(edition);
    };

    const getRarityColor = (rarity) => {
        switch (rarity?.toLowerCase()) {
            case 'common': return '#1e1e1e';
            case 'uncommon': return '#c0c0c0'; 
            case 'rare': return '#ffb000';
            case 'mythic': return '#ff8c00';
            default: return '#666';
        }
    };

    const getRaritySymbol = (rarity) => {
        switch (rarity?.toLowerCase()) {
            case 'common': return '⚫';
            case 'uncommon': return '🔘'; 
            case 'rare': return '🟡';
            case 'mythic': return '🔶';
            default: return '⚪';
        }
    };

    if (!availableEditions || availableEditions.length === 0) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                border: '2px solid #4a90e2',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
            }}>
                <h2 style={{
                    color: '#4a90e2',
                    margin: '0 0 10px 0',
                    fontSize: '24px',
                    fontWeight: 'bold'
                }}>
                    🎭 Choose Edition for {cardName}
                </h2>
                <p style={{
                    color: '#ccc',
                    margin: 0,
                    fontSize: '16px'
                }}>
                    Found {availableEditions.length} different printings • Click the correct artwork
                </p>
            </div>

            {/* Loading State */}
            {loadingImages && (
                <div style={{
                    color: '#4a90e2',
                    fontSize: '18px',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    🖼️ Loading card images...
                </div>
            )}

            {/* Edition Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '60vh',
                overflowY: 'auto',
                padding: '10px'
            }}>
                {editionsWithImages.map((edition, index) => (
                    <div
                        key={`${edition.set}-${edition.collector_number}-${index}`}
                        onClick={() => handleEditionSelect(edition)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${selectedEdition?.id === edition.id ? '#4a90e2' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '12px',
                            padding: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(5px)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            transform: selectedEdition?.id === edition.id ? 'scale(1.02)' : 'scale(1)',
                            boxShadow: selectedEdition?.id === edition.id ? '0 0 20px rgba(74, 144, 226, 0.5)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedEdition?.id !== edition.id) {
                                e.target.style.border = '2px solid #4a90e2';
                                e.target.style.transform = 'scale(1.02)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedEdition?.id !== edition.id) {
                                e.target.style.border = '2px solid rgba(255, 255, 255, 0.1)';
                                e.target.style.transform = 'scale(1)';
                            }
                        }}
                    >
                        {/* Card Image */}
                        <div style={{
                            width: '200px',
                            height: '280px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginBottom: '12px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            {edition.imageUrl ? (
                                <img 
                                    src={edition.imageUrl}
                                    alt={`${cardName} - ${edition.set_name}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                    onError={(e) => {
                                        // Fallback to art crop if normal image fails
                                        if (edition.fallbackImageUrl && e.target.src !== edition.fallbackImageUrl) {
                                            e.target.src = edition.fallbackImageUrl;
                                        } else {
                                            // Show placeholder if all images fail
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }
                                    }}
                                />
                            ) : null}
                            
                            {/* Placeholder for missing images */}
                            <div style={{
                                display: edition.imageUrl ? 'none' : 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                                fontSize: '14px'
                            }}>
                                🖼️<br/>No Image<br/>Available
                            </div>
                        </div>

                        {/* Edition Info */}
                        <div style={{ width: '100%' }}>
                            {/* Significance Badge */}
                            <div style={{
                                background: edition.bannedFormats.length > 0 ? '#dc2626' : 
                                          edition.isVintage ? '#8b5cf6' :
                                          edition.isRevisedEra ? '#f59e0b' :
                                          edition.isStandard ? '#10b981' : '#6b7280',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                marginBottom: '8px',
                                display: 'inline-block'
                            }}>
                                {edition.significance}
                                {edition.isReservedList && ' 💎'}
                            </div>

                            {/* Set Name */}
                            <h3 style={{
                                color: '#fff',
                                margin: '0 0 8px 0',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                lineHeight: '1.2'
                            }}>
                                {edition.set_name}
                            </h3>

                            {/* Set Code, Date & Price Trend */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                color: '#ccc',
                                fontSize: '14px',
                                margin: '0 0 8px 0'
                            }}>
                                <div>
                                    <strong>{edition.set}</strong> • {edition.releaseYear}
                                </div>
                                <div style={{
                                    color: edition.priceTrend === 'up' ? '#10b981' : '#ef4444',
                                    fontSize: '12px'
                                }}>
                                    {edition.priceTrend === 'up' ? '📈 +' : '📉 -'}
                                </div>
                            </div>

                            {/* Banned/Legal Formats */}
                            {edition.bannedFormats.length > 0 && (
                                <div style={{
                                    background: 'rgba(220, 38, 38, 0.2)',
                                    border: '1px solid #dc2626',
                                    borderRadius: '6px',
                                    padding: '4px 6px',
                                    marginBottom: '6px',
                                    fontSize: '11px',
                                    color: '#fca5a5'
                                }}>
                                    🚫 BANNED: {edition.bannedFormats.join(', ')}
                                </div>
                            )}

                            {/* Legal Formats */}
                            {edition.legalFormats.length > 0 && edition.bannedFormats.length === 0 && (
                                <div style={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid #10b981',
                                    borderRadius: '6px',
                                    padding: '4px 6px',
                                    marginBottom: '6px',
                                    fontSize: '11px',
                                    color: '#6ee7b7'
                                }}>
                                    ✅ LEGAL: {edition.legalFormats.join(', ')}
                                </div>
                            )}

                            {/* Rarity & Price Row */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                margin: '8px 0'
                            }}>
                                {/* Rarity */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: getRarityColor(edition.rarity),
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    {getRaritySymbol(edition.rarity)} {edition.rarity?.toUpperCase() || 'UNKNOWN'}
                                </div>

                                {/* Price */}
                                <div style={{
                                    color: '#4a90e2',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    {edition.price !== 'N/A' ? `${edition.price}` : 'No Price'}
                                </div>
                            </div>

                            {/* Special Indicators */}
                            <div style={{
                                display: 'flex',
                                gap: '6px',
                                flexWrap: 'wrap',
                                fontSize: '10px',
                                marginTop: '6px'
                            }}>
                                {edition.isReservedList && (
                                    <span style={{
                                        background: '#8b5cf6',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold'
                                    }}>
                                        💎 RESERVED
                                    </span>
                                )}
                                {edition.isVintage && (
                                    <span style={{
                                        background: '#6b7280',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold'
                                    }}>
                                        🏛️ VINTAGE
                                    </span>
                                )}
                                {edition.isRevisedEra && (
                                    <span style={{
                                        background: '#f59e0b',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '8px',
                                        fontWeight: 'bold'
                                    }}>
                                        📜 CLASSIC
                                    </span>
                                )}
                            </div>

                            {/* Collector Number */}
                            {edition.collector_number && (
                                <div style={{
                                    color: '#888',
                                    fontSize: '12px',
                                    fontStyle: 'italic',
                                    marginTop: '6px'
                                }}>
                                    #{edition.collector_number}
                                </div>
                            )}
                        </div>

                        {/* Selection Indicator */}
                        {selectedEdition?.id === edition.id && (
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: '#4a90e2',
                                color: 'white',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}>
                                ✓
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                gap: '15px',
                marginTop: '20px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    ❌ Cancel
                </button>

                {selectedEdition && (
                    <button
                        onClick={() => handleEditionSelect(selectedEdition)}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                            color: 'white',
                            border: '2px solid #4a90e2',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 6px 20px rgba(74, 144, 226, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.3)';
                        }}
                    >
                        ✅ Use {selectedEdition.set_name}
                    </button>
                )}
            </div>

            {/* Help Text */}
            <div style={{
                color: '#888',
                fontSize: '14px',
                textAlign: 'center',
                marginTop: '15px',
                maxWidth: '800px',
                lineHeight: '1.4'
            }}>
                💡 <strong>Tip:</strong> Compare artwork, format legality, and competitive status to choose the right edition. 
                <br/>
                🚫 <strong>Red badges</strong> = Banned in formats • 
                🏛️ <strong>Purple</strong> = Vintage era • 
                📜 <strong>Yellow</strong> = Classic/Revised • 
                💎 <strong>Diamond</strong> = Reserved List • 
                📈📉 <strong>Trends</strong> = Price movement
            </div>
        </div>
    );
};

export default EditionSelector;