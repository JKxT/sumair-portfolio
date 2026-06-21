export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set' });
  }

  try {
    const { messages, system, max_tokens } = req.body;

    // Build messages array for Groq (OpenAI-compatible format)
    const groqMessages = [];

    if (system) {
      groqMessages.push({ role: 'system', content: system });
    }

    for (const msg of messages) {
      // Handle vision: extract text only (Groq free tier is text-only)
      let content = '';
      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        content = msg.content
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('\n');
      }
      groqMessages.push({ role: msg.role, content });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: max_tokens || 600,
        temperature: 0.7,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error('Groq error:', JSON.stringify(data));
      return res.status(groqRes.status).json({ error: 'Groq API error', details: data });
    }

    const text = data.choices?.[0]?.message?.content || '';

    // Return Anthropic-compatible format so frontend needs no changes
    return res.status(200).json({
      content: [{ type: 'text', text }],
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
    const body = {
      contents,
      generationConfig: { maxOutputTokens: max_tokens || 600, temperature: 0.7 },
    };

    if (systemInstruction) body.systemInstruction = systemInstruction;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({ error: 'Gemini API error', details: data });
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
