// ProfessionalComponents.js - Enhanced UI Components for Production-Ready Look

import React from 'react';

// 🔥 Professional Loading Screen Component
export const LoadingScreen = ({ isVisible, progress, status }) => {
    if (!isVisible) return null;

    return (
        <div className="loading-screen">
            <div className="loading-logo">
                MTG<br/>SCAN
            </div>
            <div className="loading-title">MTG Scanner Pro</div>
            <div className="loading-subtitle">
                🔥 Advanced AI Card Recognition • Smart Cooldown System • Professional Grade
            </div>
            <div className="loading-progress">
                <div 
                    className="loading-bar" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="loading-status">
                {status}
            </div>
        </div>
    );
};

// 🎯 Enhanced Cooldown Status Display
export const ProfessionalCooldownStatus = ({ cooldownStatus, isVisible }) => {
    if (!isVisible || !cooldownStatus) return null;

    const getStatusClass = () => {
        if (cooldownStatus.longPauseRemaining > 0) return 'long-pause';
        return cooldownStatus.canScan ? 'can-scan' : 'cooldown-active';
    };

    const getStatusText = () => {
        if (cooldownStatus.longPauseRemaining > 0) {
            return `Long Pause: ${Math.ceil(cooldownStatus.longPauseRemaining / 1000)}s`;
        }
        return cooldownStatus.canScan ? '✅ Ready to Scan' : '⏳ Cooldown Active';
    };

    return (
        <div className="cooldown-status-overlay">
            <div className="cooldown-header">
                Smart Cooldown System
            </div>
            
            <div className="cooldown-item">
                <span className="cooldown-label">API:</span>
                <span className={`cooldown-value ${cooldownStatus.apiCooldown > 2000 ? 'warning' : ''}`}>
                    {Math.ceil(cooldownStatus.apiCooldown / 1000)}s
                </span>
            </div>
            
            <div className="cooldown-item">
                <span className="cooldown-label">Same Card:</span>
                <span className={`cooldown-value ${cooldownStatus.sameCardCooldown > 10000 ? 'error' : ''}`}>
                    {Math.ceil(cooldownStatus.sameCardCooldown / 1000)}s
                </span>
            </div>
            
            <div className="cooldown-item">
                <span className="cooldown-label">Consecutive:</span>
                <span className={`cooldown-value ${cooldownStatus.consecutiveDetections >= 2 ? 'warning' : ''}`}>
                    {cooldownStatus.consecutiveDetections}/2
                </span>
            </div>
            
            <div className="cooldown-item">
                <span className="cooldown-label">Stability:</span>
                <span className="cooldown-value">
                    {cooldownStatus.detectionBufferSize || 0}/{cooldownStatus.stabilityRequired || 3}
                </span>
            </div>
            
            {cooldownStatus.longPauseRemaining > 0 && (
                <div className="cooldown-item">
                    <span className="cooldown-label">Long Pause:</span>
                    <span className="cooldown-value error">
                        {Math.ceil(cooldownStatus.longPauseRemaining / 1000)}s
                    </span>
                </div>
            )}
            
            <div className="cooldown-item">
                <span className="cooldown-label">Edition:</span>
                <span className={`cooldown-value ${cooldownStatus.isEditionSelectorOpen ? 'warning' : ''}`}>
                    {cooldownStatus.isEditionSelectorOpen ? '🎭 Open' : '✅ Closed'}
                </span>
            </div>
            
            <div className={`scan-status-indicator ${getStatusClass()}`}>
                {getStatusText()}
            </div>
        </div>
    );
};

// 📱 Professional Camera Status
export const ProfessionalCameraStatus = ({ cameraStatus, cameraInitialized }) => {
    const getStatusInfo = () => {
        switch (cameraStatus) {
            case 'initializing':
                return { text: 'Initializing Camera...', class: 'status-initializing' };
            case 'requesting':
                return { text: 'Requesting Camera Access...', class: 'status-requesting' };
            case 'ready':
                return { 
                    text: `HD Camera Ready${cameraInitialized ? ' • Persistent Mode' : ''}`, 
                    class: 'status-ready' 
                };
            case 'error':
                return { text: 'Camera Error', class: 'status-error' };
            default:
                return { text: 'Setting up camera...', class: 'status-initializing' };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="camera-status-overlay">
            <div className={statusInfo.class}>
                {statusInfo.text}
            </div>
        </div>
    );
};

// 🎮 Professional Scan Controls
export const ProfessionalScanControls = ({ 
    scanMode, 
    setScanMode, 
    isScanning, 
    onStartScanning, 
    onStopScanning, 
    cameraStatus, 
    showEditionSelector,
    scanningPausedForSelection,
    cooldownStatus
}) => {
    const getScanButtonText = () => {
        if (showEditionSelector) return '🎭 Choose Edition Below';
        if (scanningPausedForSelection) return '⏸️ Paused for Selection';
        if (isScanning) return '⏹️ Stop Smart Scanning';
        return `🔥 Start Smart ${scanMode === 'single' ? 'Single' : 'Continuous'} Scan`;
    };

    const getScanButtonClass = () => {
        let baseClass = 'btn scan-btn';
        if (isScanning) baseClass += ' scanning';
        return baseClass;
    };

    return (
        <div className="scanner-controls">
            {/* Scan Mode Selection */}
            <div className="scan-mode-section">
                <label className="scan-mode-label">
                    Scan Mode
                </label>
                <div className="scan-mode-toggle">
                    <button
                        className={`mode-btn ${scanMode === 'continuous' ? 'active' : ''}`}
                        onClick={() => setScanMode('continuous')}
                        disabled={isScanning || showEditionSelector}
                    >
                        <span>🔥 Smart Continuous</span>
                    </button>
                    <button
                        className={`mode-btn ${scanMode === 'single' ? 'active' : ''}`}
                        onClick={() => setScanMode('single')}
                        disabled={isScanning || showEditionSelector}
                    >
                        <span>📷 Smart Single Shot</span>
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                <button
                    className={getScanButtonClass()}
                    onClick={isScanning ? onStopScanning : onStartScanning}
                    disabled={cameraStatus !== 'ready' || showEditionSelector}
                >
                    {getScanButtonText()}
                    {isScanning && <div className="loading"></div>}
                </button>
                
                {cameraStatus === 'error' && (
                    <button
                        className="btn secondary-btn"
                        onClick={() => window.location.reload()}
                    >
                        🔄 Fix Camera
                    </button>
                )}
            </div>

            {/* Cooldown Info */}
            {cooldownStatus && !cooldownStatus.canScan && (
                <div style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '16px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#fbbf24', fontWeight: '600', marginBottom: '8px' }}>
                        ⏳ Smart Cooldown Active
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                        Scanning paused to prevent API spam and ensure stable detection
                    </div>
                </div>
            )}
        </div>
    );
};

// 💎 Professional Card Result Display
export const ProfessionalCardResult = ({ 
    scanResult, 
    currentCard, 
    onSaveCard, 
    onOpenScryfall 
}) => {
    if (!currentCard && !scanResult) {
        return (
            <div className="card-display">
                <h3>Card Recognition</h3>
                <div className="no-card">
                    No card detected. Position an MTG card clearly in the camera view.
                    <br/>
                    <small style={{ color: '#64b5f6', marginTop: '8px', display: 'block' }}>
                        💡 Ensure good lighting and hold the card steady for best results
                    </small>
                </div>
            </div>
        );
    }

    if (scanResult && !scanResult.hasCard) {
        return (
            <div className="card-display">
                <h3>Card Recognition</h3>
                <div className="no-card">
                    {scanResult.message || 'No MTG card detected'}
                    <br/>
                    <small style={{ color: '#94a3b8', marginTop: '8px', display: 'block' }}>
                        Try adjusting the angle, lighting, or distance to the card
                    </small>
                </div>
            </div>
        );
    }

    const card = currentCard || scanResult;

    return (
        <div className="card-display">
            <h3>Card Recognition</h3>
            
            <div className="card-result">
                <div className="card-name">{card.cardName}</div>
                
                <div className="card-details">
                    <div className="card-detail">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{card.cardType || 'Unknown'}</span>
                    </div>
                    <div className="card-detail">
                        <span className="detail-label">Mana Cost:</span>
                        <span className="detail-value">{card.manaCost || 'N/A'}</span>
                    </div>
                    <div className="card-detail">
                        <span className="detail-label">Set:</span>
                        <span className="detail-value">{card.setInfo || 'Unknown'}</span>
                    </div>
                    <div className="card-detail">
                        <span className="detail-label">Confidence:</span>
                        <span className="detail-value">{card.confidence}%</span>
                    </div>
                    <div className="card-detail">
                        <span className="detail-label">Method:</span>
                        <span className="detail-value">
                            {card.isVerified ? '✅ Scryfall Verified' : '🧠 AI Detection'}
                        </span>
                    </div>
                </div>
                
                <div className="confidence-bar">
                    <div 
                        className="confidence-fill" 
                        style={{ width: `${card.confidence}%` }}
                    ></div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    marginTop: '20px'
                }}>
                    {onSaveCard && (
                        <button
                            className="btn secondary-btn"
                            onClick={() => onSaveCard(card)}
                            style={{ fontSize: '13px', padding: '10px 16px' }}
                        >
                            💾 Save to Collection
                        </button>
                    )}
                    {onOpenScryfall && (
                        <button
                            className="btn secondary-btn"
                            onClick={() => onOpenScryfall(card)}
                            style={{ fontSize: '13px', padding: '10px 16px' }}
                        >
                            🔗 View on Scryfall
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// 🎭 Professional Edition Selector
export const ProfessionalEditionSelector = ({ 
    cardName, 
    availableEditions, 
    onEditionSelected, 
    onCancel,
    aiRecommendation 
}) => {
    if (!availableEditions || availableEditions.length === 0) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>🎭 Multiple Editions Found</h3>
                <p style={{ marginBottom: '24px', color: '#94a3b8' }}>
                    Choose the correct edition for <strong style={{ color: '#4a90e2' }}>{cardName}</strong>:
                </p>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '24px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '0 8px'
                }}>
                    {availableEditions.map((edition, index) => (
                        <div
                            key={index}
                            className={`edition-option ${
                                aiRecommendation && edition.set === aiRecommendation ? 'recommended' : ''
                            }`}
                            onClick={() => onEditionSelected(edition)}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                {edition.set_name || edition.name}
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#94a3b8',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>Set: {(edition.set || edition.setCode || 'Unknown').toUpperCase()}</span>
                                <span>{edition.released_at || edition.releaseDate || 'Unknown date'}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="modal-buttons">
                    <button 
                        className="modal-btn secondary"
                        onClick={onCancel}
                    >
                        Skip Edition Selection
                    </button>
                </div>
                
                <div style={{
                    marginTop: '20px',
                    fontSize: '12px',
                    color: '#64b5f6',
                    textAlign: 'center'
                }}>
                    💡 Your selection will be remembered for future scans
                </div>
            </div>
        </div>
    );
};

// 📊 Professional Stats Dashboard
export const ProfessionalStats = ({ 
    accuracy = 98,
    scannedCount = 0,
    savedCount = 0,
    aiLearned = 0,
    isPremium = false,
    cooldownActive = false
}) => {
    return (
        <div className="header-stats">
            <div className="stat-item">
                <span className="stat-label">Accuracy:</span>
                <span className="stat-value">{accuracy}%</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Scanned:</span>
                <span className="stat-value">{scannedCount}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Collection:</span>
                <span className="stat-value">{savedCount}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">AI Learned:</span>
                <span className="stat-value">{aiLearned}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Cooldown:</span>
                <span className="stat-value">{cooldownActive ? '⏸️' : '✅'}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Status:</span>
                <span className="stat-value">
                    {isPremium ? '💎' : '🆓'}
                </span>
            </div>
        </div>
    );
};

// 🎯 Professional Toast Notifications
export const showProfessionalToast = (message, type = 'info', duration = 3000) => {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
};

// 🎨 Professional Tab Navigation
export const ProfessionalTabs = ({ activeTab, onTabChange, savedCards, isPremium }) => {
    const tabs = [
        { 
            id: 'scanner', 
            label: '🔍 Scanner', 
            badge: null 
        },
        { 
            id: 'collection', 
            label: '🃏 Collection', 
            badge: savedCards?.length || 0 
        },
        { 
            id: 'knowledge', 
            label: '📚 MTG Knowledge', 
            badge: isPremium ? '💎' : null 
        }
    ];

    return (
        <div className="tab-navigation">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
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

export default {
    LoadingScreen,
    ProfessionalCooldownStatus,
    ProfessionalCameraStatus,
    ProfessionalScanControls,
    ProfessionalCardResult,
    ProfessionalEditionSelector,
    ProfessionalStats,
    showProfessionalToast,
    ProfessionalTabs
};