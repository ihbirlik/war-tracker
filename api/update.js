export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });
  const lang = req.query.lang === 'en' ? 'en' : 'tr';

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
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'You are a news aggregator bot. Search the web and summarize real current news into JSON format. Always return valid JSON only, no explanations.',
        messages: [{
          role: 'user',
          content: lang === 'en'
            ? 'Search for: "Iran Israel war 2026" OR "Middle East conflict March 2026" OR "Iran US strikes 2026". Summarize the latest news into this JSON (fill with real data found, or best estimates if limited): {"meta":{"day_count":9,"last_updated":"March 8, 2026","war_status":"brief status"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","us_israel_strikes":"3000+","lebanon_casualties":"200+","war_cost_usd":"$4B","displaced_civilians":"100000+"},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"latest news"},{"time":"08 MAR 08:00","type":"warning","tags":["usa","israel"],"text":"latest news"},{"time":"08 MAR 06:00","type":"warning","tags":["gulf"],"text":"latest news"},{"time":"07 MAR 22:00","type":"critical","tags":["iran","israel"],"text":"latest news"},{"time":"07 MAR 18:00","type":"info","tags":["usa"],"text":"latest news"},{"time":"07 MAR 14:00","type":"critical","tags":["iran"],"text":"latest news"}],"factions":{"israel":{"operation":"Epic Fury","status":"ONGOING","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"ACTIVE","strength_pct":78},"iran":{"ballistic_reduction":"-92%","drone_reduction":"-85%","navy_status":"Destroyed","airforce_status":"Destroyed","casualties":"1400+","hormuz":"Threatened","strength_pct":15},"usa":{"targets_hit":"3000+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 weeks","demand":"Surrender","strength_pct":90}},"banner":"DAY 9 - MIDDLE EAST WAR ONGOING","map_points":[{"id":"tehran","label":"Tehran","tooltip":"US-Israel airstrikes","type":"strike_us_israel"},{"id":"isfahan","label":"Isfahan","tooltip":"Military targets hit","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"Iranian missile attacks","type":"strike_iran"},{"id":"beirut","label":"Beirut","tooltip":"Hezbollah clashes","type":"strike_us_israel"},{"id":"kuwait","label":"Kuwait","tooltip":"US base attacked","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"Drone attacks","type":"strike_iran"}]}'
            : 'Şunu ara: "Iran Israel savaş 2026" OR "Orta Doğu çatışma Mart 2026" OR "İran ABD saldırı 2026". Bulduğun son haberleri bu JSON formatında özetle (gerçek veri kullan): {"meta":{"day_count":9,"last_updated":"8 Mart 2026","war_status":"kısa durum"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","us_israel_strikes":"3000+","lebanon_casualties":"200+","war_cost_usd":"$4M","displaced_civilians":"100000+"},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"son haber"},{"time":"08 MAR 08:00","type":"warning","tags":["usa","israel"],"text":"son haber"},{"time":"08 MAR 06:00","type":"warning","tags":["gulf"],"text":"son haber"},{"time":"07 MAR 22:00","type":"critical","tags":["iran","israel"],"text":"son haber"},{"time":"07 MAR 18:00","type":"info","tags":["usa"],"text":"son haber"},{"time":"07 MAR 14:00","type":"critical","tags":["iran"],"text":"son haber"}],"factions":{"israel":{"operation":"Epik Öfke","status":"DEVAM","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"AKTİF","strength_pct":78},"iran":{"ballistic_reduction":"-%92","drone_reduction":"-%85","navy_status":"İmha","airforce_status":"İmha","casualties":"1400+","hormuz":"Tehdit","strength_pct":15},"usa":{"targets_hit":"3000+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 hafta","demand":"Teslim","strength_pct":90}},"banner":"9. GÜN - ORTA DOĞU SAVAŞI DEVAM","map_points":[{"id":"tehran","label":"Tahran","tooltip":"ABD-İsrail saldırıları","type":"strike_us_israel"},{"id":"isfahan","label":"İsfahan","tooltip":"Askeri hedefler","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"İran füzeleri","type":"strike_iran"},{"id":"beirut","label":"Beyrut","tooltip":"Hizbullah çatışmaları","type":"strike_us_israel"},{"id":"kuwait","label":"Kuveyt","tooltip":"ABD üssü saldırısı","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"İHA saldırıları","type":"strike_iran"}]}'
        }]
      })
    });

    const data = await r.json();
    if (data.error) throw new Error(data.error.message);

    let jsonStr = '';
    for (const block of (data.content || [])) {
      if (block.type === 'text') jsonStr = block.text;
    }
    if (!jsonStr) throw new Error('No text: ' + JSON.stringify(data.content?.map(b => b.type)));

    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = jsonStr.indexOf('{'), end = jsonStr.lastIndexOf('}');
    if (start === -1) throw new Error('No JSON: ' + jsonStr.slice(0, 300));

    const parsed = JSON.parse(jsonStr.slice(start, end + 1));
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ success: true, data: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
