module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'No API key' });
  const lang = req.query.lang === 'en' ? 'en' : 'tr';

  async function callClaude(system, userMsg, useSearch) {
    const body = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: userMsg }]
    };
    if (useSearch) body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
        ...(useSearch ? { 'anthropic-beta': 'web-search-2025-03-05' } : {})
      },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error.message);
    let text = '';
    for (const block of (data.content || [])) {
      if (block.type === 'text') text = block.text;
    }
    return text;
  }

  function parseJSON(text) {
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const s = text.indexOf('{'), e = text.lastIndexOf('}');
    if (s === -1) throw new Error('No JSON: ' + text.slice(0, 200));
    return JSON.parse(text.slice(s, e + 1));
  }

  try {
    // Türkçe haber ve veri çek
    const trText = await callClaude(
      'Sen bir haber toplayıcısısın. Web ara, SADECE geçerli JSON döndür, markdown yok. Kesinlikle sadece şu key isimleri kullan, başka key ismi kullanma.',
      'Ara: "İran İsrail savaş 2026 kayıp Mart" ve "Brent petrol fiyatı bugün" ve "altın fiyatı bugün" ve "dolar TL kuru bugün". SADECE bu JSON yapısını döndür, key isimlerini değiştirme: {"meta":{"day_count":9,"last_updated":"8 Mart 2026","war_status":"durum"},"stats":{"iran_casualties":"1400+","iran_casualties_source":"Reuters","iran_sources":[{"name":"İran Kızılay","val":"1332+"},{"name":"Reuters","val":"1400+"}],"us_israel_strikes":"3000+","strikes_sources":[{"name":"IDF","val":"3000+"},{"name":"Al Jazeera","val":"3200+"}],"lebanon_casualties":"200+","lebanon_sources":[{"name":"Lübnan Sağlık","val":"200+"}],"war_cost_usd":"$4M+","cost_sources":[{"name":"Pentagon","val":"$3.7M+"}],"displaced_civilians":"100000+","displaced_sources":[{"name":"BM OCHA","val":"95000+"}]},"econ":{"brent":{"val":"$92","chg":"savaş etkisi +18%","dir":"up"},"wti":{"val":"$87","chg":"savaş etkisi +16%","dir":"up"},"usd":{"val":"₺38.2","chg":"bu hafta +2%","dir":"up"},"gold":{"val":"$3150","chg":"güvenli liman +4%","dir":"up"}},"feed":[{"time":"08 MAR 10:00","type":"critical","tags":["iran"],"text":"gerçek Türkçe haber"},{"time":"08 MAR 08:00","type":"warning","tags":["usa","israel"],"text":"gerçek Türkçe haber"},{"time":"08 MAR 06:00","type":"info","tags":["gulf"],"text":"gerçek Türkçe haber"},{"time":"07 MAR 20:00","type":"critical","tags":["iran"],"text":"gerçek Türkçe haber"},{"time":"07 MAR 16:00","type":"warning","tags":["usa"],"text":"gerçek Türkçe haber"},{"time":"07 MAR 12:00","type":"critical","tags":["iran","israel"],"text":"gerçek Türkçe haber"}],"factions":{"israel":{"operation":"Epik Öfke","status":"DEVAM","aircraft":"80+","reserves":"70000","casualties":"12+","hezbollah":"AKTİF","strength_pct":78},"iran":{"ballistic_reduction":"-%92","drone_reduction":"-%85","navy_status":"İmha","airforce_status":"İmha","casualties":"1400+","hormuz":"Tehdit","strength_pct":15},"usa":{"targets_hit":"3000+","ships_destroyed":"43","us_casualties":"6","cost_per_day":"$900M","timeline":"4-6 hafta","demand":"Teslim","strength_pct":90}},"banner":"9. GÜN SAVAŞ DEVAM","map_points":[{"id":"tehran","label":"Tahran","tooltip":"ABD-İsrail saldırıları","type":"strike_us_israel"},{"id":"isfahan","label":"İsfahan","tooltip":"Askeri hedefler","type":"strike_us_israel"},{"id":"tel_aviv","label":"Tel Aviv","tooltip":"İran füzeleri","type":"strike_iran"},{"id":"beirut","label":"Beyrut","tooltip":"Hizbullah çatışmaları","type":"strike_us_israel"},{"id":"kuwait","label":"Kuveyt","tooltip":"ABD üssü","type":"strike_iran"},{"id":"dubai","label":"Dubai","tooltip":"İHA saldırıları","type":"strike_iran"}]}',
      true
    );

    const trData = parseJSON(trText);

    // econ'u normalize et - model bazen farklı key kullanıyor
    if (trData.econ) {
      const e = trData.econ;
      if (!e.gold && e.altin) e.gold = e.altin;
      if (!e.gold && e.gold_usd) e.gold = e.gold_usd;
      if (!e.usd && e.usd_try) e.usd = e.usd_try;
      if (!e.usd && e.dolar) e.usd = e.dolar;
      ['brent','wti','usd','gold'].forEach(k => {
        if (e[k] && typeof e[k] === 'object') {
          if (!e[k].val) e[k].val = e[k].deger || e[k].fiyat || e[k].value || '';
          if (!e[k].chg) e[k].chg = e[k].degisim || e[k].change || e[k].notlar || '';
          if (!e[k].dir) e[k].dir = 'up';
        }
      });
    }

    if (lang === 'tr') {
      res.setHeader('Cache-Control', 's-maxage=300');
      return res.status(200).json({ success: true, data: trData });
    }

    // EN modu: haberleri İngilizceye çevir
    const feedItems = (trData.feed || []);
    const textsToTranslate = feedItems.map(f => f.text).join('\n||||\n');
    const bannerTR = trData.banner || '';
    const statusTR = trData.meta?.war_status || '';

    const enRaw = await callClaude(
      'Professional translator. Translate Turkish to English. Return ONLY JSON, no explanation.',
      `Translate to English. Return ONLY this JSON structure:
{"banner":"translated banner","war_status":"translated status","feed":["translated item 1","translated item 2","translated item 3","translated item 4","translated item 5","translated item 6"]}

Turkish texts:
BANNER: ${bannerTR}
STATUS: ${statusTR}
FEED ITEMS:
${textsToTranslate}`,
      false
    );

    let translations = { banner: bannerTR, war_status: statusTR, feed: feedItems.map(f => f.text) };
    try { translations = parseJSON(enRaw); } catch(e) {}

    const enData = {
      ...trData,
      banner: translations.banner || bannerTR,
      meta: {
        ...trData.meta,
        war_status: translations.war_status || statusTR,
        last_updated: 'March 8, 2026',
      },
      stats: {
        ...trData.stats,
        iran_casualties_source: trData.stats?.iran_casualties_source || 'Reuters',
        iran_sources: (trData.stats?.iran_sources || []).map(s => ({...s, name: s.name?.replace('İran Kızılay','Iranian Red Crescent').replace('Lübnan Sağlık','Lebanon Health Min.').replace('BM OCHA','UN OCHA')})),
        strikes_sources: (trData.stats?.strikes_sources || []),
        lebanon_sources: (trData.stats?.lebanon_sources || []).map(s => ({...s, name: s.name?.replace('Lübnan Sağlık','Lebanon Health Min.')})),
        cost_sources: (trData.stats?.cost_sources || []),
        displaced_sources: (trData.stats?.displaced_sources || []).map(s => ({...s, name: s.name?.replace('BM OCHA','UN OCHA').replace('Tahmin','Estimate')})),
      },
      feed: feedItems.map((item, i) => ({
        ...item,
        text: (translations.feed || [])[i] || item.text,
      })),
      factions: {
        israel: { ...trData.factions?.israel, operation: 'Epic Fury', status: 'ONGOING', hezbollah: 'ACTIVE / IRON DOME' },
        iran:   { ...trData.factions?.iran, navy_status: 'Destroyed', airforce_status: 'Destroyed', hormuz: 'Threatened', ballistic_reduction: '-92%', drone_reduction: '-85%' },
        usa:    { ...trData.factions?.usa, timeline: '4-6 weeks', demand: 'Unconditional surrender' },
      },
      map_points: [
        {id:'tehran',label:'Tehran',tooltip:'US-Israel airstrikes ongoing',type:'strike_us_israel'},
        {id:'isfahan',label:'Isfahan',tooltip:'Military targets hit',type:'strike_us_israel'},
        {id:'tel_aviv',label:'Tel Aviv',tooltip:'Iranian missile attacks',type:'strike_iran'},
        {id:'beirut',label:'Beirut',tooltip:'Hezbollah clashes',type:'strike_us_israel'},
        {id:'kuwait',label:'Kuwait',tooltip:'US base attacked',type:'strike_iran'},
        {id:'dubai',label:'Dubai',tooltip:'Drone attacks',type:'strike_iran'},
      ]
    };

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json({ success: true, data: enData });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
