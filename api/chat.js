const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'GROQ_API_KEY not set' }); return; }

  const body = req.body;
  const groqMessages = [];

  if (body.system) {
    groqMessages.push({ role: 'system', content: body.system });
  }

  const messages = body.messages || [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    let content = '';
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (Array.isArray(msg.content)) {
      for (let j = 0; j < msg.content.length; j++) {
        if (msg.content[j].type === 'text') content += msg.content[j].text;
      }
    }
    groqMessages.push({ role: msg.role, content: content });
  }

  const payload = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: groqMessages,
    max_tokens: body.max_tokens || 600,
    temperature: 0.7
  });

  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const request = https.request(options, function(response) {
    let data = '';
    response.on('data', function(chunk) { data += chunk; });
    response.on('end', function() {
      try {
        const parsed = JSON.parse(data);
        if (response.statusCode !== 200) {
          res.status(response.statusCode).json({ error: 'Groq error', details: parsed });
          return;
        }
        const text = parsed.choices && parsed.choices[0] && parsed.choices[0].message
          ? parsed.choices[0].message.content : '';
        res.status(200).json({ content: [{ type: 'text', text: text }] });
      } catch (e) {
        res.status(500).json({ error: 'Parse error', details: e.message });
      }
    });
  });

  request.on('error', function(e) {
    res.status(500).json({ error: 'Request error', details: e.message });
  });

  request.write(payload);
  request.end();
};
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
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
      return res.status(groqRes.status).json({ error: 'Groq API error', details: data });
    }

    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';

    return res.status(200).json({
      content: [{ type: 'text', text: text }],
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

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
