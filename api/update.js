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

  const systemPrompt = isTR
    ? 'Haber toplayıcısısın. Web ara. SADECE JSON döndür, markdown yok.'
    : 'News aggregator. Search web. Return ONLY JSON, no markdown.';

  const userPrompt = isTR
    ? `Şunları ara: "İran İsrail savaş Mart 2026 kayıp" ve "Brent petrol fiyat bugün" ve "dolar TL kur bugün" ve "altın fiyat bugün". Gerçek verileri kullan. SADECE JSON döndür:
{"meta":{"day_count":9,"last_updated":"8 Mart 2026","war_status":"tek cümle"},"stats":{"iran_casualties":"?","iran_casualties_source":"?","iran_sources":[{"name":"?","val":"?"},{"name":"?","val":"?"}],"us_israel_strikes":"?","strikes_sources":[{"name":"?","val":"?"}],"lebanon_casualties":"?","lebanon_sources":[{"name":"?","val":"?"}],"war_cost_usd":"?","cost_sources":[{"name":"?","val":"?"}],"displaced_civilians":"?","displaced_sources":[{"name":"?","val":"?"}]},"econ":{"brent":{"val":"$?","chg":"?","dir":"up"},"wti":{"val":"$?","chg":"?","dir":"up"},"usd":{"val":"₺?","chg":"?","dir":"up"},"gold":{"val":"$?","chg":"?","dir":"up"}},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"haber"},{"time":"08 MAR 08:00","type":"warning","tags":["usa"],"text":"haber"},{"time":"08 MAR 06:00","type":"info","tags":["gulf"],"text":"haber"},{"time":"07 MAR 20:00","type":"critical","tags":["iran"],"text":"haber"},{"time":"07 MAR 16:00","type":"warning","tags":["israel"],"text":"haber"},{"time":"07 MAR 12:00","type":"critical","tags":["iran"],"text":"haber"}],"factions":{"israel":{"operation":"Epik Öfke","status":"DEVAM","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"AKTİF","strength_pct":78},"iran":{"ballistic_reduction":"-%92","drone_reduction":"-%85","navy_status":"İmha","airforce_status":"İmha","casualties":"?","hormuz":"Tehdit","strength_pct":15},"usa":{"targets_hit":"?","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 hafta","demand":"Teslim","strength_pct":90}},"banner":"9. GÜN SAVAŞ DEVAM","map_points":[{"id":"tehran","label":"Tahran","tooltip":"ABD-İsrail saldırıları","type":"strike_us_israel"},{"id":"isfahan","label":"İsfahan","tooltip":"Askeri hedefler","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"İran füzeleri","type":"strike_iran"},{"id":"beirut","label":"Beyrut","tooltip":"Hizbullah","type":"strike_us_israel"},{"id":"kuwait","label":"Kuveyt","tooltip":"ABD üssü","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"İHA saldırısı","type":"strike_iran"}]}`
    : `Search: "Iran Israel war March 2026 casualties" and "Brent oil price today" and "USD TRY rate today" and "gold price today". Use real data. Return ONLY JSON:
{"meta":{"day_count":9,"last_updated":"March 8 2026","war_status":"one sentence"},"stats":{"iran_casualties":"?","iran_casualties_source":"?","iran_sources":[{"name":"?","val":"?"},{"name":"?","val":"?"}],"us_israel_strikes":"?","strikes_sources":[{"name":"?","val":"?"}],"lebanon_casualties":"?","lebanon_sources":[{"name":"?","val":"?"}],"war_cost_usd":"?","cost_sources":[{"name":"?","val":"?"}],"displaced_civilians":"?","displaced_sources":[{"name":"?","val":"?"}]},"econ":{"brent":{"val":"$?","chg":"?","dir":"up"},"wti":{"val":"$?","chg":"?","dir":"up"},"usd":{"val":"?","chg":"?","dir":"up"},"gold":{"val":"$?","chg":"?","dir":"up"}},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"news"},{"time":"08 MAR 08:00","type":"warning","tags":["usa"],"text":"news"},{"time":"08 MAR 06:00","type":"info","tags":["gulf"],"text":"news"},{"time":"07 MAR 20:00","type":"critical","tags":["iran"],"text":"news"},{"time":"07 MAR 16:00","type":"warning","tags":["israel"],"text":"news"},{"time":"07 MAR 12:00","type":"critical","tags":["iran"],"text":"news"}],"factions":{"israel":{"operation":"Epic Fury","status":"ONGOING","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"ACTIVE","strength_pct":78},"iran":{"ballistic_reduction":"-92%","drone_reduction":"-85%","navy_status":"Destroyed","airforce_status":"Destroyed","casualties":"?","hormuz":"Threatened","strength_pct":15},"usa":{"targets_hit":"?","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 weeks","demand":"Surrender","strength_pct":90}},"banner":"DAY 9 WAR ONGOING","map_points":[{"id":"tehran","label":"Tehran","tooltip":"US-Israel strikes","type":"strike_us_israel"},{"id":"isfahan","label":"Isfahan","tooltip":"Military targets","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"Iranian missiles","type":"strike_iran"},{"id":"beirut","label":"Beirut","tooltip":"Hezbollah","type":"strike_us_israel"},{"id":"kuwait","label":"Kuwait","tooltip":"US base","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"Drone attack","type":"strike_iran"}]}`;

  try {
    const body = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: userPrompt }]
    };

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify(body)
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

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
