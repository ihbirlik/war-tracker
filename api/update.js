export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key missing' });

  const lang = req.query.lang === 'en' ? 'en' : 'tr';
  const isEN = lang === 'en';

  const userMsg = isEN
    ? 'Search the web for the latest 2026 Iran-Israel-US war news. Return ONLY valid JSON, no markdown: {"meta":{"day_count":9,"last_updated":"March 8, 2026","war_status":"one sentence"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"source","us_israel_strikes":"3200+","lebanon_casualties":"210+","war_cost_usd":"$4B","displaced_civilians":"100000+"},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"news"},{"time":"08 MAR 09:00","type":"warning","tags":["usa"],"text":"news"},{"time":"08 MAR 08:00","type":"warning","tags":["gulf"],"text":"news"},{"time":"08 MAR 07:00","type":"critical","tags":["iran","israel"],"text":"news"},{"time":"07 MAR 20:00","type":"info","tags":["usa"],"text":"news"},{"time":"07 MAR 18:00","type":"critical","tags":["iran"],"text":"news"}],"factions":{"israel":{"operation":"Epic Fury","status":"ONGOING","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"ACTIVE","strength_pct":80},"iran":{"ballistic_reduction":"-92%","drone_reduction":"-85%","navy_status":"Destroyed","airforce_status":"Destroyed","casualties":"1400+","hormuz":"Threatened","strength_pct":15},"usa":{"targets_hit":"3200+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 weeks","demand":"Surrender","strength_pct":90}},"banner":"DAY 9 - STRIKES ONGOING","map_points":[{"id":"tehran","label":"Tehran","tooltip":"US-Israel strikes","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"Iranian missiles","type":"strike_iran"},{"id":"beirut","label":"Beirut","tooltip":"Hezbollah clashes","type":"strike_us_israel"},{"id":"kuwait","label":"Kuwait","tooltip":"US base attacked","type":"strike_iran"}]}'
    : 'Web\'de 2026 İran-İsrail-ABD savaşı son haberlerini ara. SADECE geçerli JSON döndür, markdown yok: {"meta":{"day_count":9,"last_updated":"8 Mart 2026","war_status":"tek cümle"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"kaynak","us_israel_strikes":"3200+","lebanon_casualties":"210+","war_cost_usd":"$4M","displaced_civilians":"100000+"},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"haber"},{"time":"08 MAR 09:00","type":"warning","tags":["usa"],"text":"haber"},{"time":"08 MAR 08:00","type":"warning","tags":["gulf"],"text":"haber"},{"time":"08 MAR 07:00","type":"critical","tags":["iran","israel"],"text":"haber"},{"time":"07 MAR 20:00","type":"info","tags":["usa"],"text":"haber"},{"time":"07 MAR 18:00","type":"critical","tags":["iran"],"text":"haber"}],"factions":{"israel":{"operation":"Epik Öfke","status":"DEVAM","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"AKTİF","strength_pct":80},"iran":{"ballistic_reduction":"-%92","drone_reduction":"-%85","navy_status":"İmha","airforce_status":"İmha","casualties":"1400+","hormuz":"Tehdit","strength_pct":15},"usa":{"targets_hit":"3200+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 hafta","demand":"Teslim","strength_pct":90}},"banner":"9. GÜN - SALDIRILAR DEVAM","map_points":[{"id":"tehran","label":"Tahran","tooltip":"ABD-İsrail saldırıları","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"İran füzeleri","type":"strike_iran"},{"id":"beirut","label":"Beyrut","tooltip":"Hizbullah çatışmaları","type":"strike_us_israel"},{"id":"kuwait","label":"Kuveyt","tooltip":"ABD üssü saldırısı","type":"strike_iran"}]}';

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let jsonStr = '';
    for (const block of (data.content || [])) {
      if (block.type === 'text') jsonStr = block.text;
    }
    if (!jsonStr) throw new Error('No text: ' + JSON.stringify(data.content?.map(b=>b.type)));

    jsonStr = jsonStr.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const start = jsonStr.indexOf('{'), end = jsonStr.lastIndexOf('}');
    if (start === -1) throw new Error('No JSON: ' + jsonStr.slice(0,300));
    jsonStr = jsonStr.slice(start, end + 1);

    const parsed = JSON.parse(jsonStr);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ success: true, data: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
