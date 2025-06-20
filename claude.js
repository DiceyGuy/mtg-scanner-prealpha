// api/claude.js - Vercel Serverless Function for Claude AI Proxy
export default async function handler(req, res) {
    console.log('🌐 Claude AI proxy request received');
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        console.log('❌ Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔑 Using Claude API key from environment');
        
        // Get Claude API key from environment variables
        const claudeApiKey = process.env.CLAUDE_API_KEY;
        
        if (!claudeApiKey) {
            console.error('❌ CLAUDE_API_KEY not found in environment variables');
            return res.status(500).json({ error: 'API key not configured' });
        }

        console.log('📤 Forwarding request to Claude AI...');
        
        // Forward request to Claude AI API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        console.log('📥 Claude AI response status:', response.status);

        // Check if request was successful
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Claude AI error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: 'Claude AI request failed',
                details: errorText 
            });
        }

        // Get response data
        const data = await response.json();
        console.log('✅ Claude AI response successful');

        // Set CORS headers for browser compatibility
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version');

        // Return the Claude AI response
        return res.status(200).json(data);

    } catch (error) {
        console.error('❌ Serverless function error:', error.message);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

// Handle OPTIONS requests for CORS preflight
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Allow larger image uploads
        },
    },
}