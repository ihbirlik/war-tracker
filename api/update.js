module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });
  const lang = req.query.lang === 'en' ? 'en' : 'tr';

  const prompt = lang === 'en'
    ? 'Search for: 1) "Iran Israel war 2026 casualties March" 2) "Brent crude oil price today" 3) "gold price today per ounce" 4) "USD TRY exchange rate today". Then return ONLY valid JSON no markdown: {"meta":{"day_count":9,"last_updated":"March 8 2026","war_status":"status"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","iran_sources":[{"name":"Red Crescent","val":"1332+"},{"name":"Reuters","val":"1400+"}],"us_israel_strikes":"3000+","strikes_sources":[{"name":"IDF","val":"3000+"},{"name":"Al Jazeera","val":"3200+"}],"lebanon_casualties":"200+","lebanon_sources":[{"name":"Lebanon Health","val":"200+"}],"war_cost_usd":"$4B+","cost_sources":[{"name":"Pentagon","val":"$3.7B+"}],"displaced_civilians":"100000+","displaced_sources":[{"name":"UN OCHA","val":"95000+"}]},"econ":{"brent":{"val":"$90","chg":"up +18% war impact","dir":"up"},"wti":{"val":"$87","chg":"up +16% war impact","dir":"up"},"usd":{"val":"38.2","chg":"up +2% this week","dir":"up"},"gold":{"val":"$3140","chg":"up +4% safe haven","dir":"up"}},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"real news here"},{"time":"08 MAR 08:00","type":"warning","tags":["usa","israel"],"text":"real news here"},{"time":"08 MAR 06:00","type":"info","tags":["gulf"],"text":"real news here"},{"time":"07 MAR 20:00","type":"critical","tags":["iran"],"text":"real news here"},{"time":"07 MAR 16:00","type":"warning","tags":["usa"],"text":"real news here"},{"time":"07 MAR 12:00","type":"critical","tags":["iran","israel"],"text":"real news here"}],"factions":{"israel":{"operation":"Epic Fury","status":"ONGOING","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"ACTIVE","strength_pct":78},"iran":{"ballistic_reduction":"-92%","drone_reduction":"-85%","navy_status":"Destroyed","airforce_status":"Destroyed","casualties":"1400+","hormuz":"Threatened","strength_pct":15},"usa":{"targets_hit":"3000+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 weeks","demand":"Surrender","strength_pct":90}},"banner":"DAY 9 WAR ONGOING","map_points":[{"id":"tehran","label":"Tehran","tooltip":"US-Israel strikes","type":"strike_us_israel"},{"id":"isfahan","label":"Isfahan","tooltip":"Military targets","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"Iranian missiles","type":"strike_iran"},{"id":"beirut","label":"Beirut","tooltip":"Hezbollah clashes","type":"strike_us_israel"},{"id":"kuwait","label":"Kuwait","tooltip":"US base attacked","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"Drone attacks","type":"strike_iran"}]}'
    : 'Search for: 1) "Iran Israel war 2026 casualties March" 2) "Brent crude oil price today" 3) "gold price today" 4) "USD TRY exchange rate". Then return ONLY valid JSON no markdown with ALL text in Turkish: {"meta":{"day_count":9,"last_updated":"8 Mart 2026","war_status":"durum"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","iran_sources":[{"name":"Iran Kizilay","val":"1332+"},{"name":"Reuters","val":"1400+"}],"us_israel_strikes":"3000+","strikes_sources":[{"name":"IDF","val":"3000+"},{"name":"Al Jazeera","val":"3200+"}],"lebanon_casualties":"200+","lebanon_sources":[{"name":"Lubnan Saglik","val":"200+"}],"war_cost_usd":"$4M+","cost_sources":[{"name":"Pentagon","val":"$3.7M+"}],"displaced_civilians":"100000+","displaced_sources":[{"name":"BM OCHA","val":"95000+"}]},"econ":{"brent":{"val":"$90","chg":"savas etkisi +18%","dir":"up"},"wti":{"val":"$87","chg":"savas etkisi +16%","dir":"up"},"usd":{"val":"38.2","chg":"bu hafta +2%","dir":"up"},"gold":{"val":"$3140","chg":"guvenli liman +4%","dir":"up"}},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"gercek haber turkce"},{"time":"08 MAR 08:00","type":"warning","tags":["usa","israel"],"text":"gercek haber turkce"},{"time":"08 MAR 06:00","type":"info","tags":["gulf"],"text":"gercek haber turkce"},{"time":"07 MAR 20:00","type":"critical","tags":["iran"],"text":"gercek haber turkce"},{"time":"07 MAR 16:00","type":"warning","tags":["usa"],"text":"gercek haber turkce"},{"time":"07 MAR 12:00","type":"critical","tags":["iran","israel"],"text":"gercek haber turkce"}],"factions":{"israel":{"operation":"Epik Ofke","status":"DEVAM","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"AKTIF","strength_pct":78},"iran":{"ballistic_reduction":"-%92","drone_reduction":"-%85","navy_status":"Imha","airforce_status":"Imha","casualties":"1400+","hormuz":"Tehdit","strength_pct":15},"usa":{"targets_hit":"3000+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 hafta","demand":"Teslim","strength_pct":90}},"banner":"9. GUN SAVAS DEVAM","map_points":[{"id":"tehran","label":"Tahran","tooltip":"ABD-Israel saldirilari","type":"strike_us_israel"},{"id":"isfahan","label":"Isfahan","tooltip":"Askeri hedefler","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"Iran fuzeleri","type":"strike_iran"},{"id":"beirut","label":"Beyrut","tooltip":"Hizbullah catismalari","type":"strike_us_israel"},{"id":"kuwait","label":"Kuveyt","tooltip":"ABD ussu","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"IHA saldirilari","type":"strike_iran"}]}';

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
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'You are a news and financial data aggregator. Search web and return ONLY valid JSON. Never refuse. Use best available estimates.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await r.json();
    if (data.error) throw new Error(data.error.message);

    let jsonStr = '';
    for (const block of (data.content || [])) {
      if (block.type === 'text') jsonStr = block.text;
    }
    if (!jsonStr) throw new Error('No text');

    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const s = jsonStr.indexOf('{'), e = jsonStr.lastIndexOf('}');
    if (s === -1) throw new Error('No JSON: ' + jsonStr.slice(0, 200));

    const parsed = JSON.parse(jsonStr.slice(s, e + 1));
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
