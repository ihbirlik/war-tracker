module.exports = async function handler(req, res) {
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
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: lang === 'en'
          ? 'You are a news aggregator. Search for latest Iran-Israel-US war 2026 news. Return ONLY valid JSON. Numbers must be like "1400+" with + sign. Never write "unknown" or text descriptions for numbers. All text in English.'
          : 'Haber toplayıcısısın. 2026 İran-İsrail-ABD savaşı son haberlerini ara. SADECE geçerli JSON döndür. Sayılar "1400+" formatında olmalı. Asla "belirsiz" veya metin açıklaması yazma. Tüm metinler Türkçe.',
        messages: [{
          role: 'user',
          content: lang === 'en'
            ? `Search "Iran Israel war 2026 casualties" and return JSON with multiple sources per stat. Format:
{"meta":{"day_count":9,"last_updated":"March 8 2026","war_status":"one sentence status"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","iran_sources":[{"name":"Iranian Red Crescent","val":"1332+"},{"name":"Reuters","val":"1400+"}],"us_israel_strikes":"3000+","strikes_sources":[{"name":"IDF","val":"3000+"},{"name":"Al Jazeera","val":"3200+"}],"lebanon_casualties":"200+","lebanon_sources":[{"name":"Lebanon Health Min.","val":"200+"},{"name":"Al Jazeera","val":"215+"}],"war_cost_usd":"$4B+","cost_sources":[{"name":"Pentagon","val":"$3.7B+"},{"name":"CSIS","val":"$4B+"}],"displaced_civilians":"100000+","displaced_sources":[{"name":"UN OCHA","val":"95000+"},{"name":"Estimate","val":"100000+"}]},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"news"},{"time":"08 MAR 08:00","type":"warning","tags":["usa","israel"],"text":"news"},{"time":"08 MAR 06:00","type":"warning","tags":["gulf"],"text":"news"},{"time":"07 MAR 20:00","type":"critical","tags":["iran","israel"],"text":"news"},{"time":"07 MAR 16:00","type":"info","tags":["usa"],"text":"news"},{"time":"07 MAR 12:00","type":"critical","tags":["iran"],"text":"news"}],"factions":{"israel":{"operation":"Epic Fury","status":"ONGOING","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"ACTIVE","strength_pct":78},"iran":{"ballistic_reduction":"-92%","drone_reduction":"-85%","navy_status":"Destroyed","airforce_status":"Destroyed","casualties":"1400+","hormuz":"Threatened","strength_pct":15},"usa":{"targets_hit":"3000+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 weeks","demand":"Surrender","strength_pct":90}},"banner":"DAY 9 - WAR ONGOING","map_points":[{"id":"tehran","label":"Tehran","tooltip":"US-Israel strikes","type":"strike_us_israel"},{"id":"isfahan","label":"Isfahan","tooltip":"Military targets","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"Iranian missiles","type":"strike_iran"},{"id":"beirut","label":"Beirut","tooltip":"Hezbollah clashes","type":"strike_us_israel"},{"id":"kuwait","label":"Kuwait","tooltip":"US base attacked","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"Drone attacks","type":"strike_iran"}]}`
            : `Search the web for "Iran Israel war 2026 latest news casualties" and summarize findings into JSON. Use real data from search results. All text fields must be in Turkish. Return only valid JSON matching this structure (replace placeholder values with real data): {"meta":{"day_count":9,"last_updated":"8 Mart 2026","war_status":"GERÇEK DURUM YAZ"},"stats":{"iran_casualties":"GERÇEK SAYI+","iran_casualties_source":"GERÇEK KAYNAK","iran_sources":[{"name":"kaynak1","val":"sayi+"},{"name":"kaynak2","val":"sayi+"}],"us_israel_strikes":"GERÇEK SAYI+","strikes_sources":[{"name":"kaynak1","val":"sayi+"},{"name":"kaynak2","val":"sayi+"}],"lebanon_casualties":"GERÇEK SAYI+","lebanon_sources":[{"name":"kaynak1","val":"sayi+"}],"war_cost_usd":"GERÇEK MALIYET","cost_sources":[{"name":"kaynak1","val":"deger"}],"displaced_civilians":"GERÇEK SAYI+","displaced_sources":[{"name":"kaynak1","val":"sayi+"}]},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"GERÇEK HABER TÜRKÇE"},{"time":"08 MAR 08:00","type":"warning","tags":["usa","israel"],"text":"GERÇEK HABER TÜRKÇE"},{"time":"08 MAR 06:00","type":"warning","tags":["gulf"],"text":"GERÇEK HABER TÜRKÇE"},{"time":"07 MAR 20:00","type":"critical","tags":["iran","israel"],"text":"GERÇEK HABER TÜRKÇE"},{"time":"07 MAR 16:00","type":"info","tags":["usa"],"text":"GERÇEK HABER TÜRKÇE"},{"time":"07 MAR 12:00","type":"critical","tags":["iran"],"text":"GERÇEK HABER TÜRKÇE"}],"factions":{"israel":{"operation":"Epik Öfke","status":"DEVAM","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"AKTİF","strength_pct":78},"iran":{"ballistic_reduction":"-%92","drone_reduction":"-%85","navy_status":"İmha","airforce_status":"İmha","casualties":"GERÇEK SAYI+","hormuz":"Tehdit","strength_pct":15},"usa":{"targets_hit":"GERÇEK SAYI+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 hafta","demand":"Teslim","strength_pct":90}},"banner":"GERÇEK BANNER TÜRKÇE","map_points":[{"id":"tehran","label":"Tahran","tooltip":"ABD-İsrail saldırıları","type":"strike_us_israel"},{"id":"isfahan","label":"İsfahan","tooltip":"Askeri hedefler","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"İran füzeleri","type":"strike_iran"},{"id":"beirut","label":"Beyrut","tooltip":"Hizbullah çatışmaları","type":"strike_us_israel"},{"id":"kuwait","label":"Kuveyt","tooltip":"ABD üssü","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"İHA saldırıları","type":"strike_iran"}]}`
{"meta":{"day_count":9,"last_updated":"8 Mart 2026","war_status":"tek cümle durum"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","iran_sources":[{"name":"İran Kızılay","val":"1332+"},{"name":"Reuters","val":"1400+"}],"us_israel_strikes":"3000+","strikes_sources":[{"name":"IDF","val":"3000+"},{"name":"Al Jazeera","val":"3200+"}],"lebanon_casualties":"200+","lebanon_sources":[{"name":"Lübnan Sağlık Bak.","val":"200+"},{"name":"Al Jazeera","val":"215+"}],"war_cost_usd":"$4M+","cost_sources":[{"name":"Pentagon","val":"$3.7M+"},{"name":"CSIS","val":"$4M+"}],"displaced_civilians":"100000+","displaced_sources":[{"name":"BM OCHA","val":"95000+"},{"name":"Tahmin","val":"100000+"}]},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"haber"},{"time":"08 MAR 08:00","type":"warning","tags":["usa","israel"],"text":"haber"},{"time":"08 MAR 06:00","type":"warning","tags":["gulf"],"text":"haber"},{"time":"07 MAR 20:00","type":"critical","tags":["iran","israel"],"text":"haber"},{"time":"07 MAR 16:00","type":"info","tags":["usa"],"text":"haber"},{"time":"07 MAR 12:00","type":"critical","tags":["iran"],"text":"haber"}],"factions":{"israel":{"operation":"Epik Öfke","status":"DEVAM","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"AKTİF","strength_pct":78},"iran":{"ballistic_reduction":"-%92","drone_reduction":"-%85","navy_status":"İmha","airforce_status":"İmha","casualties":"1400+","hormuz":"Tehdit","strength_pct":15},"usa":{"targets_hit":"3000+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 hafta","demand":"Teslim","strength_pct":90}},"banner":"9. GÜN - SAVAŞ DEVAM","map_points":[{"id":"tehran","label":"Tahran","tooltip":"ABD-İsrail saldırıları","type":"strike_us_israel"},{"id":"isfahan","label":"İsfahan","tooltip":"Askeri hedefler","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"İran füzeleri","type":"strike_iran"},{"id":"beirut","label":"Beyrut","tooltip":"Hizbullah çatışmaları","type":"strike_us_israel"},{"id":"kuwait","label":"Kuveyt","tooltip":"ABD üssü","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"İHA saldırıları","type":"strike_iran"}]}`
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
