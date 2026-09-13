// BharatAI secure server-side AI proxy for Vercel.
// The browser never receives AI_API. Set AI_API in the hosting environment.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.AI_API;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'AI_API is not configured on the server.' } });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: { message: 'Invalid JSON request.' } });
  }

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages is required.' } });
  }

  const payload = {
    model: typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'deepseek/deepseek-chat',
    messages: body.messages,
    stream: true,
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.8,
    max_tokens: typeof body.max_tokens === 'number' ? Math.min(body.max_tokens, 4096) : 2048
  };

  try {
    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'https://bharatai.app',
        'X-Title': 'BharatAI'
      },
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      return res.end(text || JSON.stringify({ error: { message: `Upstream API returned HTTP ${upstream.status}` } }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (!upstream.body) {
      return res.end();
    }

    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }

    return res.end();
  } catch (error) {
    console.error('AI proxy error:', error);
    if (!res.headersSent) {
      return res.status(502).json({ error: { message: 'Could not reach the AI provider.' } });
    }
    return res.end();
  }
}
