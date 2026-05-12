// ─── Skales Custom Skill ─────────────────────────────────────────
// Quoty — AI-generated inspirational quotes
// Uses the user's configured AI provider to generate unique quotes
'use strict';

const https = require('https');
const http  = require('http');

/**
 * Make an HTTP(S) request — works with Node.js built-ins only.
 */
function fetchJSON(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const reqOpts = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   options.method || 'POST',
      headers:  options.headers || {},
    };
    const req = lib.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { reject(new Error(`Invalid JSON from API: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// Provider endpoint map
const ENDPOINTS = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  openai:     'https://api.openai.com/v1/chat/completions',
  groq:       'https://api.groq.com/openai/v1/chat/completions',
  mistral:    'https://api.mistral.ai/v1/chat/completions',
  deepseek:   'https://api.deepseek.com/v1/chat/completions',
  xai:        'https://api.x.ai/v1/chat/completions',
  together:   'https://api.together.xyz/v1/chat/completions',
  google:     'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  qiniu:      'https://api.qnaigc.com/v1/chat/completions',
};

// Themes for variety
const THEMES = [
  'life and purpose',
  'creativity and art',
  'perseverance and courage',
  'technology and the future',
  'wisdom and learning',
  'love and connection',
  'nature and the universe',
  'success and ambition',
  'inner peace and mindfulness',
  'humor and irony',
  'change and transformation',
  'solitude and reflection',
];

module.exports = {
  name:        "Quoty",
  id:          "quoty",
  description: "AI-generated inspirational quotes — fresh and unique every time",
  category:    "creative",
  icon:        "\uD83D\uDCAC",
  version:     "2.0.0",
  author:      "Skales",
  hasUI:       true,
  menuName:    "Quoty",
  menuRoute:   "/custom/quoty",

  /**
   * Uses the user's configured AI provider to generate a unique quote.
   * Falls back to a curated set if no provider is available.
   */
  async execute(input, context) {
    try {
      const settings  = context.settings || {};
      const providers = settings.providers || {};

      // Pick a random theme for variety
      const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
      const prompt = `Generate one unique, profound, and memorable inspirational quote about "${theme}". `
        + `The quote should feel like it was said by a great thinker but be COMPLETELY ORIGINAL — not a real quote. `
        + `Also provide a fictional but believable author name. `
        + `Reply in EXACTLY this JSON format, nothing else:\n`
        + `{"quote": "your quote here", "author": "Author Name", "theme": "${theme}"}`;

      // Try each configured provider until one works
      const providerOrder = ['openrouter', 'openai', 'groq', 'google', 'mistral', 'deepseek', 'xai', 'together', 'qiniu'];
      let lastProviderError = '';

      for (const provId of providerOrder) {
        const prov = providers[provId];
        if (!prov?.apiKey) continue;

        const endpoint = ENDPOINTS[provId];
        if (!endpoint) continue;

        const model = prov.model
          || (provId === 'openrouter' ? 'openai/gpt-4o-mini' : undefined)
          || (provId === 'openai'     ? 'gpt-4o-mini'        : undefined)
          || (provId === 'groq'       ? 'llama-3.1-8b-instant' : undefined)
          || (provId === 'google'     ? 'gemini-2.0-flash'    : undefined)
          || (provId === 'mistral'    ? 'mistral-small-latest' : undefined)
          || (provId === 'deepseek'   ? 'deepseek-chat'       : undefined)
          || (provId === 'qiniu'      ? 'deepseek-v3'         : undefined)
          || 'default';

        const headers = {
          'content-type':  'application/json',
          'authorization': `Bearer ${prov.apiKey}`,
        };
        if (provId === 'openrouter') {
          headers['http-referer'] = 'https://skales.app';
          headers['x-title']     = 'Skales Quoty';
        }

        try {
          const res = await fetchJSON(endpoint, { method: 'POST', headers }, {
            model,
            max_tokens:  256,
            temperature: 0.9,
            messages: [
              { role: 'system', content: 'You are a creative quote generator. Reply ONLY in valid JSON.' },
              { role: 'user',   content: prompt },
            ],
          });

          if (res.status !== 200) {
            lastProviderError = `${provId}: API returned ${res.status}`;
            continue;
          }

          const text = (res.data?.choices?.[0]?.message?.content ?? '').trim();

          // Parse JSON from response
          let parsed;
          try {
            // Try direct parse
            parsed = JSON.parse(text);
          } catch {
            // Try extracting JSON from markdown fence
            const match = text.match(/\{[\s\S]*\}/);
            if (match) parsed = JSON.parse(match[0]);
          }

          if (parsed?.quote) {
            const q = parsed;
            return {
              success: true,
              result: {
                type: 'html',
                html: `
                  <div style="max-width:600px;margin:40px auto;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                    <div style="font-size:4rem;margin-bottom:20px;opacity:0.3;">\u201C</div>
                    <blockquote style="font-size:1.35rem;line-height:1.7;color:#e0e0e0;font-style:italic;margin:0 0 24px;padding:0 20px;">
                      ${q.quote.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </blockquote>
                    <p style="font-size:0.95rem;color:#888;margin-bottom:8px;">
                      \u2014 ${(q.author || 'Unknown').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </p>
                    <p style="font-size:0.75rem;color:#555;margin-top:16px;text-transform:uppercase;letter-spacing:2px;">
                      ${theme}
                    </p>
                    <p style="font-size:0.65rem;color:#444;margin-top:24px;">
                      \u2728 AI-generated via ${provId} \u00B7 Refresh for a new quote
                    </p>
                  </div>`,
              },
            };
          }
          lastProviderError = `${provId}: Could not parse quote from response`;
        } catch (e) {
          lastProviderError = `${provId}: ${e.message}`;
          continue;
        }
      }

      // ── Fallback: no working provider ──
      // Use a built-in set but clearly mark them as static
      const fallbackQuotes = [
        { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { quote: "Stay hungry, stay foolish.", author: "Stewart Brand" },
        { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
      ];
      const fb = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];

      return {
        success: true,
        result: {
          type: 'html',
          html: `
            <div style="max-width:600px;margin:40px auto;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <div style="font-size:4rem;margin-bottom:20px;opacity:0.3;">\u201C</div>
              <blockquote style="font-size:1.35rem;line-height:1.7;color:#e0e0e0;font-style:italic;margin:0 0 24px;padding:0 20px;">
                ${fb.quote}
              </blockquote>
              <p style="font-size:0.95rem;color:#888;margin-bottom:8px;">
                \u2014 ${fb.author}
              </p>
              <div style="margin-top:24px;padding:12px;border-radius:8px;background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);">
                <p style="font-size:0.8rem;color:#facc15;margin:0;">
                  \u26A0\uFE0F Static quote \u2014 configure an AI provider in Settings to get AI-generated quotes
                </p>
                ${lastProviderError ? `<p style="font-size:0.7rem;color:#888;margin:6px 0 0;">${lastProviderError.replace(/</g, '&lt;')}</p>` : ''}
              </div>
            </div>`,
        },
      };
    } catch (err) {
      return { success: false, error: err.message ?? String(err) };
    }
  },
};
