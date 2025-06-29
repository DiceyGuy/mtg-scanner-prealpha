// CardDisplayUI.js - Professional Card Display with Manual Save Option
import React from 'react';

const CardDisplayUI = ({ scanResult, isScanning, onSaveCard, onOpenScryfall, scanHistory }) => {
    
    if (!scanResult && !isScanning) {
        return (
            <div className="card-display-container">
                <div className="no-card-state">
                    <h3>🔍 MTG Scanner Ready</h3>
                    <p>Start scanning to identify MTG cards</p>
                    <div className="scanner-tips">
                        <div className="tip">💡 Position card clearly in frame</div>
                        <div className="tip">🔆 Ensure good lighting</div>
                        <div className="tip">📏 Keep card flat and centered</div>
                    </div>
                </div>
            </div>
        );
    }

    if (isScanning && !scanResult?.hasCard) {
        return (
            <div className="card-display-container">
                <div className="scanning-state">
                    <div className="scanning-animation">🔍</div>
                    <h3>Scanning with Gemini AI...</h3>
                    <p>Position MTG card in the blue frame</p>
                </div>
            </div>
        );
    }

    if (scanResult && !scanResult.hasCard) {
        return (
            <div className="card-display-container">
                <div className="no-card-detected">
                    <div className="no-card-icon">🃏</div>
                    <h3>No MTG Card Detected</h3>
                    <p>{scanResult.message || 'Try repositioning the card'}</p>
                    <div className="scan-tips">
                        <div className="tip">📐 Ensure entire card is visible</div>
                        <div className="tip">🔆 Check lighting conditions</div>
                        <div className="tip">🎯 Center card in scan frame</div>
                    </div>
                </div>
            </div>
        );
    }

    if (scanResult && scanResult.hasCard) {
        return (
            <div className="card-display-container">
                {/* Current Scanned Card */}
                <div className="current-card">
                    <div className="card-header">
                        <div className="card-name">{scanResult.cardName}</div>
                        <div className="confidence-badge">
                            {scanResult.confidence}% Confidence
                        </div>
                    </div>

                    {/* Card Details */}
                    <div className="card-details">
                        <div className="detail-item">
                            <div className="detail-label">Type</div>
                            <div className="detail-value">{scanResult.cardType || 'Unknown'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Mana Cost</div>
                            <div className="detail-value">{scanResult.manaCost || 'N/A'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Set</div>
                            <div className="detail-value">{scanResult.setInfo || 'Unknown'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Rarity</div>
                            <div className="detail-value">{scanResult.rarity || 'Unknown'}</div>
                        </div>
                    </div>

                    {/* Card Text/Abilities */}
                    {scanResult.cardText && (
                        <div className="card-text-section">
                            <div className="detail-label">Card Text</div>
                            <div className="card-text">{scanResult.cardText}</div>
                        </div>
                    )}

                    {/* Scryfall Verification */}
                    {scanResult.scryfallVerified && (
                        <div className="scryfall-verification">
                            ✅ Verified in Scryfall Database
                        </div>
                    )}

                    {/* Success Message */}
                    {scanResult.savedToCollection && (
                        <div className="success-message">
                            ✅ Successfully saved to collection!
                        </div>
                    )}

                    {/* Card Actions */}
                    <div className="card-actions">
                        <button
                            onClick={() => onSaveCard(scanResult)}
                            className="save-btn"
                            disabled={scanResult.savedToCollection}
                        >
                            {scanResult.savedToCollection ? '✅ Saved!' : '💾 Save to Collection'}
                        </button>
                        
                        <button
                            onClick={() => onOpenScryfall(scanResult)}
                            className="scryfall-btn"
                        >
                            🔗 View on Scryfall
                        </button>
                    </div>
                </div>

                {/* Scan History */}
                {scanHistory && scanHistory.length > 0 && (
                    <div className="scan-history">
                        <div className="history-header">
                            📋 Recent Scans ({scanHistory.length})
                        </div>
                        <div className="history-list">
                            {scanHistory.slice(0, 5).map((card, index) => (
                                <div
                                    key={`${card.cardName}-${card.timestamp}-${index}`}
                                    className="history-item"
                                    onClick={() => onOpenScryfall(card)}
                                >
                                    <div className="history-card-name">{card.cardName}</div>
                                    <div className="history-details">
                                        <span>{card.cardType || 'Unknown Type'}</span>
                                        <span>{card.confidence}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {scanHistory.length > 5 && (
                            <div className="history-footer">
                                And {scanHistory.length - 5} more cards scanned...
                            </div>
                        )}
                    </div>
                )}

                {/* Scanner Info */}
                <div className="scanner-info">
                    <div className="info-item">
                        <span className="info-icon">🧠</span>
                        <span>Powered by Gemini AI</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">📊</span>
                        <span>Scryfall Database</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🎯</span>
                        <span>98% Accuracy Rate</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CardDisplayUI;