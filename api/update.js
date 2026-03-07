export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API anahtarı tanımlanmamış' });

  const lang = req.query.lang === 'en' ? 'en' : 'tr';
  const isEN = lang === 'en';

  const systemPrompt = isEN
    ? `You are a war data analyst. Search the web for the latest 2026 Iran-Israel-US war data and return ONLY valid JSON, no markdown, no explanation. Schema:
{
  "meta": { "day_count": <number>, "last_updated": "<date string>", "war_status": "<one sentence current status in English>" },
  "stats": { "iran_casualties": "<number+>", "iran_casualties_source": "<source>", "us_israel_strikes": "<number+>", "lebanon_casualties": "<number+>", "war_cost_usd": "<e.g. $3.7B>", "displaced_civilians": "<e.g. 95,000+>" },
  "feed": [ { "time": "<time>", "type": "critical|warning|info|intercept", "tags": ["iran"|"israel"|"usa"|"gulf"|"intercept"], "text": "<English news text, 1-2 sentences>" } ],
  "factions": {
    "israel": { "operation": "<name>", "status": "<status>", "aircraft": "<count>", "reserves": "<count>", "casualties": "<count>", "hezbollah": "<status>", "strength_pct": <0-100> },
    "iran":   { "ballistic_reduction": "<pct>", "drone_reduction": "<pct>", "navy_status": "<status>", "airforce_status": "<status>", "casualties": "<count>", "hormuz": "<status>", "strength_pct": <0-100> },
    "usa":    { "targets_hit": "<count+>", "ships_destroyed": "<count>", "us_casualties": "<count>", "cost_per_day": "<dollars>", "timeline": "<estimate>", "demand": "<demand>", "strength_pct": <0-100> }
  },
  "banner": "<warning banner text in English>",
  "map_points": [ { "id": "<city_id>", "label": "<city name>", "tooltip": "<English description>", "type": "strike_us_israel|strike_iran|intercept" } ]
}
Feed: minimum 6 items. Map points: active conflict cities only.`
    : `Sen bir savas veri analisti asistanisin. 2026 Iran-Israel-ABD savasi hakkinda web aramasi yap ve YALNIZCA gecerli JSON dondur, markdown veya aciklama YAZMA. Sema:
{
  "meta": { "day_count": <sayi>, "last_updated": "<tarih>", "war_status": "<Turkce bir cumle mevcut durum>" },
  "stats": { "iran_casualties": "<sayi+>", "iran_casualties_source": "<kaynak>", "us_israel_strikes": "<sayi+>", "lebanon_casualties": "<sayi+>", "war_cost_usd": "<ornek: $3.7B>", "displaced_civilians": "<ornek: 95,000+>" },
  "feed": [ { "time": "<saat>", "type": "critical|warning|info|intercept", "tags": ["iran"|"israel"|"usa"|"gulf"|"intercept"], "text": "<Turkce haber metni>" } ],
  "factions": {
    "israel": { "operation": "<adi>", "status": "<durum>", "aircraft": "<sayi>", "reserves": "<sayi>", "casualties": "<sayi>", "hezbollah": "<durum>", "strength_pct": <0-100> },
    "iran":   { "ballistic_reduction": "<yuzde>", "drone_reduction": "<yuzde>", "navy_status": "<durum>", "airforce_status": "<durum>", "casualties": "<sayi>", "hormuz": "<durum>", "strength_pct": <0-100> },
    "usa":    { "targets_hit": "<sayi+>", "ships_destroyed": "<sayi>", "us_casualties": "<sayi>", "cost_per_day": "<dolar>", "timeline": "<tahmin>", "demand": "<talep>", "strength_pct": <0-100> }
  },
  "banner": "<Turkce uyari banner metni>",
  "map_points": [ { "id": "<sehir_id>", "label": "<sehir adi>", "tooltip": "<Turkce aciklama>", "type": "strike_us_israel|strike_iran|intercept" } ]
}
Feed icin minimum 6 haber. Map_points: sadece aktif catisma noktalari.`;

  const userMsg = isEN
    ? '2026 Iran war latest: total casualties in Iran, US-Israel strike count, Lebanon casualties, which cities are being hit, factions status. Search latest news and return full JSON.'
    : '2026 Iran savasi son dakika: Iran toplam kayip, ABD-Israel saldiri sayisi, Lubnan kayiplari, hangi sehirler vuruldu, taraflarin durumu. Guncel haberleri ara, tam JSON ver.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    const data = await response.json();
    const textBlocks = data.content && data.content.filter(b => b.type === 'text');
    const textBlock = textBlocks && textBlocks[textBlocks.length - 1];
    if (!textBlock) throw new Error('No text response');

    let jsonStr = textBlock.text.trim().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const start = jsonStr.indexOf('{'), end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) jsonStr = jsonStr.slice(start, end + 1);

    const parsed = JSON.parse(jsonStr);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ success: true, data: parsed, fetchedAt: new Date().toISOString() });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
