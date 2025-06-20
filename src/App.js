// src/App.js - FIXED VERSION (NO PREMIUM SCANNER YET)
import React, { useState } from 'react';
import Scanner from '../Scanner';  // Your working scanner

function App() {
  const [currentView, setCurrentView] = useState('home');

  const renderContent = () => {
    switch (currentView) {
      case 'scanner':
        return <Scanner />;
        
      case 'premium-scanner':
        return (
          <div className="max-w-4xl mx-auto p-6 text-center">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-purple-800 mb-4">👑 Premium Scanner Coming Soon!</h2>
              <p className="text-purple-600 mb-4">
                Edition detection and pricing features are in development.
              </p>
              <button
                onClick={() => setCurrentView('scanner')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔵 Use Original Scanner Instead
              </button>
            </div>
          </div>
        );
        
      case 'collection':
        return (
          <div className="max-w-4xl mx-auto p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 Collection Management</h2>
            <p className="text-gray-600">Collection features coming in Phase 3!</p>
            <button
              onClick={() => setCurrentView('home')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        );
        
      default:
        return (
          <div className="max-w-4xl mx-auto p-6">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🃏 MTG Infinity Scanner</h1>
              <p className="text-xl text-gray-600">95% Accuracy OCR with Real Camera Detection</p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">📹</span>
                  <h3 className="text-xl font-semibold text-gray-900">🔵 Original Scanner</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Your proven 95% accuracy scanner. 
                  Fast card name detection with OCR + fuzzy matching.
                  Perfect for identification needs.
                </p>
                <button
                  onClick={() => setCurrentView('scanner')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full"
                >
                  🎯 Start Scanning
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-purple-200">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">👑</span>
                  <h3 className="text-xl font-semibold text-gray-900">🟣 Premium Scanner</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Coming Soon! Edition detection with 100% accuracy guarantee.
                  Visual confirmation, pricing data, and professional features.
                </p>
                <button
                  onClick={() => setCurrentView('premium-scanner')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors w-full"
                >
                  👑 Preview Premium
                </button>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-green-800">📹 Enhanced Scanner</p>
                    <p className="text-sm text-green-600">Physical camera + OCR ready</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-blue-800">🧠 95% Accuracy</p>
                    <p className="text-sm text-blue-600">Proven OCR + fuzzy matching</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-purple-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-purple-800">👑 Premium Features</p>
                    <p className="text-sm text-purple-600">Edition detection coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Message */}
            <div className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">🚀 MTG Scanner Ready!</h2>
              <p className="text-lg">95% OCR Accuracy + Real Camera Detection</p>
              <p className="text-sm mt-1 opacity-90">
                📹 HD Camera ✓ 🧠 95% OCR ✓ 🔍 Fuzzy Matching ✓ 💯 Proven Working ✓
              </p>
            </div>

            {/* Quick Start */}
            <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🚀 Quick Start</h3>
              <p className="text-gray-600">
                Click "Start Scanning" above → Point camera at MTG card → Get instant results!
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => setCurrentView('home')}
              className="text-white text-xl font-bold hover:text-blue-200 transition-colors"
            >
              🃏 MTG Infinity Scanner
            </button>
            <nav className="space-x-2">
              <button
                onClick={() => setCurrentView('scanner')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'scanner'
                    ? 'bg-blue-700 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                🔵 Scanner
              </button>
              <button
                onClick={() => setCurrentView('premium-scanner')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'premium-scanner'
                    ? 'bg-purple-700 text-white shadow-lg'
                    : 'text-purple-100 hover:bg-purple-500 hover:text-white'
                }`}
              >
                👑 Premium
              </button>
              <button
                onClick={() => setCurrentView('collection')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'collection'
                    ? 'bg-green-700 text-white shadow-lg'
                    : 'text-green-100 hover:bg-green-500 hover:text-white'
                }`}
              >
                📚 Collection
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;