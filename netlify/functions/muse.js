// THE MUSE - AI Writing Assistant
// Powered by Anthropic Claude & Google Gemini
// Part of THE BLOCK by BIG LOVE Holdings

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { prompt, type, model } = JSON.parse(event.body);

        if (!prompt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Prompt is required' })
            };
        }

        let response;

        // System prompt for THE MUSE
        const museSystemPrompt = `You are THE MUSE, a creative writing assistant for THE BLOCK - a platform where "Writer's Block Becomes Writer's Gift."

Your personality:
- Warm, encouraging, and inspiring
- You speak like a wise creative partner, not a robot
- You celebrate ideas and help expand them
- You never judge or criticize harshly
- You help writers overcome blocks with gentle suggestions

Your capabilities:
- Idea bridges: Connect disparate ideas into cohesive narratives
- Gap filling: Identify what's missing in a story
- Character development: Help flesh out personalities, backstories, motivations
- World building: Create rich settings, rules, histories
- Plot suggestions: Offer "what if" scenarios
- Style matching: Adapt to the writer's voice
- Genre expertise: Children's books, YA, adult fiction, romance, sci-fi, fantasy, historical, non-fiction

Always be helpful, creative, and supportive. Help writers find their voice and overcome any creative blocks.`;

        if (model === 'gemini') {
            // Use Google Gemini
            response = await callGemini(prompt, museSystemPrompt, type);
        } else {
            // Default to Anthropic Claude
            response = await callClaude(prompt, museSystemPrompt, type);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ response })
        };

    } catch (error) {
        console.error('Muse error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'The Muse is resting. Please try again.' })
        };
    }
};

// Call Anthropic Claude
async function callClaude(prompt, systemPrompt, type) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: formatPrompt(prompt, type)
                }
            ]
        })
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.content[0].text;
}

// Call Google Gemini
async function callGemini(prompt, systemPrompt, type) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: systemPrompt + '\n\n' + formatPrompt(prompt, type) }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.8
            }
        })
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.candidates[0].content.parts[0].text;
}

// Format prompt based on type
function formatPrompt(prompt, type) {
    switch (type) {
        case 'idea':
            return `The writer needs help with an idea: "${prompt}"\n\nProvide 3 creative directions they could take this idea. Be specific and inspiring.`;
        
        case 'character':
            return `The writer is developing a character: "${prompt}"\n\nHelp flesh out this character with personality traits, potential backstory, motivations, and quirks.`;
        
        case 'plot':
            return `The writer needs plot help: "${prompt}"\n\nSuggest 3 "what if" scenarios that could take the story in interesting directions.`;
        
        case 'worldbuilding':
            return `The writer is building a world: "${prompt}"\n\nHelp expand this world with details about setting, rules, history, and atmosphere.`;
        
        case 'unstuck':
            return `The writer is stuck: "${prompt}"\n\nHelp them get unstuck with gentle suggestions, new angles, or questions to consider. Be encouraging!`;
        
        case 'dialogue':
            return `The writer needs help with dialogue: "${prompt}"\n\nSuggest natural, character-appropriate dialogue options.`;
        
        default:
            return prompt;
    }
}