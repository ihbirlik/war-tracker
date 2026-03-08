module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });
  const lang = req.query.lang === 'en' ? 'en' : 'tr';

  function parseJSON(text) {
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const s = text.indexOf('{'), e = text.lastIndexOf('}');
    if (s === -1) throw new Error('No JSON: ' + text.slice(0, 200));
    return JSON.parse(text.slice(s, e + 1));
  }

  function normalizeEcon(e) {
    if (!e) return {};
    if (!e.gold) e.gold = e.altin || e.gold_usd;
    if (!e.usd)  e.usd  = e.usd_try || e.dolar;
    ['brent','wti','usd','gold'].forEach(k => {
      if (e[k]) {
        e[k].val = e[k].val || e[k].deger || '';
        e[k].chg = e[k].chg || e[k].degisim || '';
        e[k].dir = e[k].dir || 'up';
      }
    });
    return e;
  }

  const isTR = lang === 'tr';

  const userPrompt = isTR
    ? `Web'de ara: İran İsrail savaş kayıp Mart 2026, Brent petrol fiyat, dolar TL kur, altın fiyat. Sonuçları bu JSON formatında döndür (tüm metinler Türkçe, sadece JSON, markdown yok):
{"meta":{"day_count":9,"last_updated":"8 Mart 2026","war_status":"DEVAM"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","iran_sources":[{"name":"kaynak","val":"sayı"}],"us_israel_strikes":"3000+","strikes_sources":[{"name":"kaynak","val":"sayı"}],"lebanon_casualties":"200+","lebanon_sources":[{"name":"kaynak","val":"sayı"}],"war_cost_usd":"$4B+","cost_sources":[{"name":"kaynak","val":"değer"}],"displaced_civilians":"100000+","displaced_sources":[{"name":"kaynak","val":"sayı"}]},"econ":{"brent":{"val":"$90","chg":"+18%","dir":"up"},"wti":{"val":"$87","chg":"+16%","dir":"up"},"usd":{"val":"₺38","chg":"+2%","dir":"up"},"gold":{"val":"$3140","chg":"+4%","dir":"up"}},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"haber"},{"time":"08 MAR 08:00","type":"warning","tags":["usa"],"text":"haber"},{"time":"07 MAR 20:00","type":"critical","tags":["iran"],"text":"haber"},{"time":"07 MAR 16:00","type":"warning","tags":["israel"],"text":"haber"}],"factions":{"israel":{"operation":"Epik Öfke","status":"DEVAM","strength_pct":78},"iran":{"casualties":"1400+","strength_pct":15},"usa":{"targets_hit":"3000+","strength_pct":90}},"banner":"9. GÜN SAVAŞ DEVAM","map_points":[{"id":"tehran","label":"Tahran","tooltip":"saldırı","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"füze","type":"strike_iran"},{"id":"beirut","label":"Beyrut","tooltip":"çatışma","type":"strike_us_israel"}]}`
    : `Search web: Iran Israel war casualties March 2026, Brent oil price today, USD TRY rate, gold price. Return results in this JSON format (all text English, JSON only, no markdown):
{"meta":{"day_count":9,"last_updated":"March 8 2026","war_status":"ONGOING"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","iran_sources":[{"name":"source","val":"num"}],"us_israel_strikes":"3000+","strikes_sources":[{"name":"source","val":"num"}],"lebanon_casualties":"200+","lebanon_sources":[{"name":"source","val":"num"}],"war_cost_usd":"$4B+","cost_sources":[{"name":"source","val":"val"}],"displaced_civilians":"100000+","displaced_sources":[{"name":"source","val":"num"}]},"econ":{"brent":{"val":"$90","chg":"+18%","dir":"up"},"wti":{"val":"$87","chg":"+16%","dir":"up"},"usd":{"val":"38","chg":"+2%","dir":"up"},"gold":{"val":"$3140","chg":"+4%","dir":"up"}},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"news"},{"time":"08 MAR 08:00","type":"warning","tags":["usa"],"text":"news"},{"time":"07 MAR 20:00","type":"critical","tags":["iran"],"text":"news"},{"time":"07 MAR 16:00","type":"warning","tags":["israel"],"text":"news"}],"factions":{"israel":{"operation":"Epic Fury","status":"ONGOING","strength_pct":78},"iran":{"casualties":"1400+","strength_pct":15},"usa":{"targets_hit":"3000+","strength_pct":90}},"banner":"DAY 9 WAR ONGOING","map_points":[{"id":"tehran","label":"Tehran","tooltip":"strikes","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"missiles","type":"strike_iran"},{"id":"beirut","label":"Beirut","tooltip":"clashes","type":"strike_us_israel"}]}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: 'Return ONLY valid JSON. No markdown. No explanation. NEVER use empty strings, N/A, or unknown for numeric fields - always give best estimate.',
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const apiData = await r.json();
    if (apiData.error) throw new Error(apiData.error.message);

    let text = '';
    for (const block of (apiData.content || [])) {
      if (block.type === 'text') text = block.text;
    }
    if (!text) throw new Error('No text response');

    const parsed = parseJSON(text);
    parsed.econ = normalizeEcon(parsed.econ);

    res.setHeader('Cache-Control', 's-maxage=1800');
    return res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
