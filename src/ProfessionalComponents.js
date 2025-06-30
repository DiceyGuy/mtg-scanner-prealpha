// ProfessionalComponents.js - FIXED VERSION (No Duplicates)
import React from 'react';

// 🎯 Enhanced Cooldown Status Display
export const ProfessionalCooldownStatus = ({ cooldownStatus, isVisible }) => {
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
                🔥 PROFESSIONAL Cooldown System
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

// 📱 Professional Camera Status
export const ProfessionalCameraStatus = ({ cameraStatus, cameraInitialized }) => {
    const getStatusInfo = () => {
        switch (cameraStatus) {
            case 'ready':
                return { text: `✅ HD Camera Ready${cameraInitialized ? ' • Professional' : ''}`, class: 'status-ready' };
            case 'error':
                return { text: '❌ Camera Error', class: 'status-error' };
            default:
                return { text: '🔧 Setting up camera...', class: 'status-initializing' };
        }
    };

    const statusInfo = getStatusInfo();
    return (
        <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            border: '1px solid #4a90e2'
        }}>
            {statusInfo.text}
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
    cooldownStatus
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
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
                onClick={isScanning ? onStopScanning : onStartScanning}
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
                {isScanning ? '⏹️ Stop Smart Scanning' : `🔥 Start Smart ${scanMode} Scan`}
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
    );
};

// 💎 Professional Card Result Display
export const ProfessionalCardResult = ({ scanResult, currentCard, onSaveCard }) => {
    if (!currentCard && !scanResult) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '16px' }}>🎯 Card Recognition</h3>
                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    No card detected. Position an MTG card in the camera view.
                </div>
            </div>
        );
    }

    if (scanResult && !scanResult.hasCard) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3 style={{ color: '#4a90e2', marginBottom: '16px' }}>🎯 Card Recognition</h3>
                <div style={{ color: '#94a3b8' }}>
                    {scanResult.message || 'No MTG card detected'}
                </div>
            </div>
        );
    }

    const card = currentCard || scanResult;

    return (
        <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#4a90e2', marginBottom: '20px' }}>🎯 Card Recognition</h3>
            
            <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px'
            }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e', marginBottom: '12px' }}>
                    {card.cardName}
                </div>
                
                <div style={{ textAlign: 'left', fontSize: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Type:</span>
                        <span style={{ color: 'white', fontWeight: '600' }}>{card.cardType || 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Confidence:</span>
                        <span style={{ color: 'white', fontWeight: '600' }}>{card.confidence}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#94a3b8' }}>Method:</span>
                        <span style={{ color: 'white', fontWeight: '600' }}>
                            {card.isVerified ? '✅ Scryfall Verified' : '🧠 AI Detection'}
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
                        width: `${card.confidence}%`,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                    }}></div>
                </div>

                {/* Save Button */}
                {onSaveCard && (
                    <button
                        onClick={() => onSaveCard(card)}
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
                )}
            </div>
        </div>
    );
};

// 🎭 Professional Edition Selector
export const ProfessionalEditionSelector = ({ cardName, availableEditions, onEditionSelected, onCancel }) => {
    if (!availableEditions || availableEditions.length === 0) return null;

    return (
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
                    Choose the correct edition for <strong style={{ color: '#4a90e2' }}>{cardName}</strong>:
                </p>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                    {availableEditions.map((edition, index) => (
                        <div
                            key={index}
                            onClick={() => onEditionSelected(edition)}
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
                    onClick={onCancel}
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
    );
};

// 📊 Professional Stats Dashboard
export const ProfessionalStats = ({ accuracy, scannedCount, savedCount, aiLearned, isPremium, cooldownActive }) => {
    return (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                fontSize: '13px'
            }}>
                <span style={{ color: '#94a3b8' }}>Accuracy: </span>
                <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{accuracy}%</span>
            </div>
            <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                fontSize: '13px'
            }}>
                <span style={{ color: '#94a3b8' }}>Scanned: </span>
                <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{scannedCount}</span>
            </div>
            <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                fontSize: '13px'
            }}>
                <span style={{ color: '#94a3b8' }}>Collection: </span>
                <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{savedCount}</span>
            </div>
            <div style={{
                background: 'rgba(74, 144, 226, 0.1)',
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                fontSize: '13px'
            }}>
                <span style={{ color: '#94a3b8' }}>Cooldown: </span>
                <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{cooldownActive ? '⏸️' : '✅'}</span>
            </div>
        </div>
    );
};

// 🎯 Professional Toast Notifications
export const showProfessionalToast = (message, type = 'info', duration = 3000) => {
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

// 🎨 Professional Tab Navigation
export const ProfessionalTabs = ({ activeTab, onTabChange, savedCards }) => {
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

export default {
    ProfessionalCooldownStatus,
    ProfessionalCameraStatus,
    ProfessionalScanControls,
    ProfessionalCardResult,
    ProfessionalEditionSelector,
    ProfessionalStats,
    showProfessionalToast,
    ProfessionalTabs
};