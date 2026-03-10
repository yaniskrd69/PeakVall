const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const HENRIK_KEY = process.env.HENRIK_API_KEY;

app.use(cors());
app.use(express.json());

// Serve static frontend (no build step needed)
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/player/:name/:tag", async (req, res) => {
  const { name, tag } = req.params;
  try {
    const accRes = await axios.get(
      `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { headers: { Authorization: HENRIK_KEY }, timeout: 8000 }
    );
    if (accRes.data.status !== 200)
      return res.status(404).json({ success: false, error: "Joueur introuvable" });

    const acc = accRes.data.data;
    const region = (acc.region || "eu").toLowerCase();

    const [mmrRes, matchRes] = await Promise.all([
      axios.get(`https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, { headers: { Authorization: HENRIK_KEY }, timeout: 8000 }),
      axios.get(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=10`, { headers: { Authorization: HENRIK_KEY }, timeout: 10000 }),
    ]);

    const mmrD = mmrRes.data?.data?.current_data;
    const rank = mmrD?.currenttierpatched || "Unranked";
    const rr = mmrD?.ranking_in_tier || 0;
    const peakRank = mmrRes.data?.data?.highest_rank?.patched_tier || rank;
    const matches = matchRes.data?.data || [];
    let k=0,d=0,a=0,hs=0,sh=0,acsT=0,w=0;
    const recent = [];

    for (const m of matches) {
      const p = m.players?.all_players?.find(pl => pl.puuid===acc.puuid || pl.name?.toLowerCase()===name.toLowerCase());
      if (!p) continue;
      const st = p.stats||{};
      k+=st.kills||0; d+=st.deaths||1; a+=st.assists||0;
      hs+=st.headshots||0; sh+=(st.headshots||0)+(st.bodyshots||0)+(st.legshots||0);
      const rds=m.metadata?.rounds_played||20;
      const acs=p.damage_made?Math.round(p.damage_made/rds):0;
      acsT+=acs;
      const won=m.teams?.[p.team?.toLowerCase()]?.has_won||false;
      if(won)w++;
      recent.push({ map:m.metadata?.map||"?", agent:p.character||"?", result:won?"W":"L", kda:`${st.kills}/${st.deaths}/${st.assists}`, acs, score:Math.min(99,Math.max(10,Math.round(((st.kills||0)*2-(st.deaths||1)+(st.assists||0)*.5)/rds*80+45))) });
    }

    const n=Math.max(recent.length,1);
    const kd=parseFloat((k/Math.max(d,1)).toFixed(2));
    const hsPct=sh>0?Math.round(hs/sh*100):20;
    const wr=Math.round(w/n*100);
    const acs=Math.round(acsT/n);
    const strengths=[],weaknesses=[];
    if(kd>=1.3)strengths.push(`K/D ${kd} — au-dessus de la moyenne`);else weaknesses.push(`K/D ${kd} — en dessous de la moyenne`);
    if(wr>=52)strengths.push(`Win rate ${wr}% — winner consistant`);else weaknesses.push(`Win rate ${wr}% — à améliorer`);
    if(hsPct>=26)strengths.push(`HS% ${hsPct}% — au-dessus de la moyenne`);else weaknesses.push(`HS% ${hsPct}% — crosshair placement issue`);
    if(!strengths.length)strengths.push("Joueur actif et impliqué");
    const insights=[
      {en:`HS% at ${hsPct}%${hsPct<25?" — below avg. Fix crosshair placement.":" — above avg. Focus on duel consistency."}`,fr:`HS% à ${hsPct}%${hsPct<25?" — en dessous de la moyenne. Corrige le crosshair.":" — au-dessus de la moyenne. Constance en duel."}`},
      {en:`K/D ${kd}${kd<1.2?" — stop peeking alone.":" is solid. Convert perf into wins."}`,fr:`KD ${kd}${kd<1.2?" — arrête de peek seul.":" est solide. Convertis en victoires."}`},
      {en:`WR ${wr}%${wr<50?" — communication > fragging.":" — focus on consistency."}`,fr:`WR ${wr}%${wr<50?" — communication > frags.":" — concentre-toi sur la constance."}`},
    ];

    res.json({ success:true, name:acc.name, tag:acc.tag, region, rank, rr, peakRank, score:Math.min(100,Math.round(kd*22+wr*.45+hsPct*.3)), kd, wr, hs:hsPct, acs, fbr:16, clutch:32, strengths, weaknesses, matches:recent.slice(0,5), insights });

  } catch(err) {
    if(err.response?.status===404) return res.status(404).json({success:false,error:"Joueur introuvable"});
    if(err.response?.status===429) return res.status(429).json({success:false,error:"Rate limit — réessaie dans quelques secondes"});
    res.status(500).json({success:false,error:"Erreur serveur"});
  }
});

// All other routes → SPA
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

app.listen(PORT, () => console.log(`✅ PeakVal on port ${PORT}`));
