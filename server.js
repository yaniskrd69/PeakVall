const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const HENRIK_KEY = process.env.HENRIK_API_KEY;

app.use(cors());
app.use(express.json());

// ── Inline HTML (no filesystem dependency) ─────────────────
const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PeakVal — Coach Valorant IA</title>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
</head>
<body style="margin:0;padding:0;background:#0a0a0f">
  <div id="root"></div>
  <script type="text/babel">
const { useState, useRef } = React;

// ═══════════════════════════════════════
// REAL API — calls Node.js backend
// Set VITE_BACKEND_URL in .env.production
// ═══════════════════════════════════════
const BACKEND_URL = "";

const fetchPlayer = async (riotId) => {
  const parts = (riotId || "").trim().split("#");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { success: false, error: "Format invalide — utilise Nom#TAG (ex: TenZ#000)" };
  }
  const [name, tag] = parts;
  try {
    const res = await fetch(\`\${BACKEND_URL}/api/player/\${encodeURIComponent(name)}/\${encodeURIComponent(tag)}\`);
    const data = await res.json();
    if (!res.ok || !data.success) return { success: false, error: data.error || "Joueur introuvable" };
    return data;
  } catch (e) {
    // Fallback to mock if backend unreachable
    console.warn("Backend unreachable, using mock:", e.message);
    return generateMockStats(name, tag);
  }
};

const generateMockStats = async (name, tag) => {
  await new Promise(r => setTimeout(r, 1600));
  const seed = name.toLowerCase().split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
  const rng = (min, max, s = 0) => {
    const x = Math.abs(Math.sin(seed * 9301 + s * 49297 + 233) * 1000000);
    return min + (x % 1000) / 1000 * (max - min);
  };
  const ri = (min, max, s = 0) => Math.floor(rng(min, max, s));
  const ranks = ["Iron I","Iron II","Iron III","Bronze I","Bronze II","Bronze III","Silver I","Silver II","Silver III","Gold I","Gold II","Gold III","Platinum I","Platinum II","Platinum III","Diamond I","Diamond II","Diamond III","Immortal I","Immortal II","Immortal III","Radiant"];
  const agents = ["Jett","Reyna","Phoenix","Neon","Yoru","Omen","Brimstone","Viper","Astra","Sova","Fade","Breach","KAY/O","Killjoy","Cypher","Chamber","Sage","Deadlock","Gekko","Skye"];
  const maps = ["Bind","Haven","Split","Ascent","Icebox","Breeze","Fracture","Pearl","Lotus","Sunset","Abyss"];
  const rankIdx = ri(5, 18, 1);
  const rank = ranks[rankIdx];
  const rr = ri(0, 99, 2);
  const peakRank = ranks[Math.min(rankIdx + ri(0, 3, 9), ranks.length - 1)];
  const kd = parseFloat(rng(0.88, 1.72, 3).toFixed(2));
  const wr = ri(40, 64, 4);
  const hs = ri(15, 37, 5);
  const acs = ri(145, 258, 6);
  const clutch = ri(20, 46, 7);
  const fbr = ri(12, 24, 8);
  const matches = Array.from({ length: 5 }, (_, i) => ({ map: maps[ri(0, maps.length, i + 20)], agent: agents[ri(0, agents.length, i + 30)], result: rng(0,1,i+80)>0.44?"W":"L", kda:\`\${ri(7,23,i+40)}/\${ri(5,17,i+50)}/\${ri(2,9,i+60)}\`, acs:ri(120,275,i+70), score:Math.min(99,Math.max(10,ri(30,85,i+90))) }));
  const strengths = [], weaknesses = [];
  if (kd >= 1.3) strengths.push(\`K/D \${kd} — au-dessus de la moyenne\`); else weaknesses.push(\`K/D \${kd} — en dessous de la moyenne\`);
  if (wr >= 52) strengths.push(\`Win rate \${wr}% — winner consistant\`); else weaknesses.push(\`Win rate \${wr}% — à améliorer\`);
  if (hs >= 26) strengths.push(\`HS% \${hs}% — au-dessus de la moyenne\`); else weaknesses.push(\`HS% \${hs}% — crosshair placement issue\`);
  if (!strengths.length) strengths.push("Joueur actif et impliqué");
  const insights = [
    { en: \`HS% at \${hs}%\${hs<25?" vs 28% avg — your crosshair tends to drop below head level. Try 10min DM headshot-only daily + practice contre-strafe.":" vs 28% avg — solid mechanics! Now work on your first blood rate and entry timing."}\`, fr: \`HS% à \${hs}%\${hs<25?" vs 28% moy — ton crosshair a tendance a descendre sous la hauteur de tete. Essaie 10min DM headshot-only par jour + pratique le contre-strafe.":" vs 28% moy — bonnes mecaniques ! Maintenant travaille ton first blood rate et ton timing d'entry."}\` },
    { en: \`K/D at \${kd}\${kd<1.2?" — Try double swinging with teammates instead of solo peeking to improve your trades and survival.":" — solid fragging! Focus on KAST 70%+ (survive or get traded when you die)."}\`, fr: \`K/D à \${kd}\${kd<1.2?" — Essaie le double swing avec tes coequipiers au lieu des peeks en solo pour ameliorer tes trades et ta survie.":" — bon fragging ! Focus sur KAST 70%+ (survie ou get trade quand tu meurs)."}\` },
    { en: \`Win rate \${wr}%\${wr<50?" — Good mechanics need good teamplay. Try calling more rotates and varying your playstyle (don't lurk every round).":" — positive W/L! Push for consistency: same agents, same positions, master 2-3 lineups."}\`, fr: \`Win rate \${wr}%\${wr<50?" — De bonnes mecaniques ont besoin d'un bon teamplay. Essaie de call plus les rotates et varie ton style (ne lurk pas chaque round).":" — W/L positif ! Vise la constance : memes agents, memes positions, maitrise 2-3 lineups."}\` },
  ];
  return { success: true, name, tag, rank, rr, peakRank, score: Math.min(100, Math.round(kd*22+wr*.45+hs*.3)), kd, wr, hs, acs, fbr, clutch, strengths, weaknesses, matches, insights, isDemo: true };
};

// ═══════════════════════════════════════
// MOCK DEMO (sans Riot ID)
// ═══════════════════════════════════════
const MOCK = {
  name: "Démo", tag: "0000", rank: "Gold II", rr: 47, peakRank: "Platinum I",
  score: 68, kd: 1.34, wr: 52, hs: 23, acs: 198, fbr: 18, clutch: 31,
  strengths: ["Win rate en attaque (61%)", "Clutch 1v1 (67%)", "Bind — map signature"],
  weaknesses: ["HS% en dessous de la moyenne Gold", "Trade ratio (0.42)", "Rotation speed"],
  matches: [
    { map: "Bind", agent: "Jett", result: "W", kda: "18/12/4", acs: 231, score: 74 },
    { map: "Haven", agent: "Reyna", result: "L", kda: "9/15/2", acs: 142, score: 38 },
    { map: "Ascent", agent: "Jett", result: "W", kda: "22/10/6", acs: 267, score: 81 },
    { map: "Split", agent: "Phoenix", result: "L", kda: "11/14/3", acs: 178, score: 52 },
    { map: "Icebox", agent: "Jett", result: "W", kda: "16/11/5", acs: 212, score: 69 },
  ],
  insights: [
    { en: "Trade ratio 0.42 vs 0.7+ for VCT pros. Try double swinging with a teammate 2 seconds behind you to improve your trades and team impact.", fr: "Trade ratio 0.42 vs 0.7+ chez les pros VCT. Essaie le double swing avec un coequipier a 2 secondes derriere toi pour ameliorer tes trades et ton impact en equipe." },
    { en: "HS% 23% vs 28% Gold average. Your crosshair tends to drop below head level. Daily tip: 10min DM headshot-only + practice contre-strafe.", fr: "HS% 23% vs 28% moyenne Gold. Ton crosshair a tendance a descendre sous la hauteur de tete. Conseil quotidien : 10min DM headshot-only + pratique le contre-strafe." },
    { en: "31% better on attack than defense. You're a natural entry fragger! Consider playing Jett/Neon/Raze and let teammates anchor the sites.", fr: "31% meilleur en attaque qu'en defense. Tu es un entry fragger naturel ! Considere jouer Jett/Neon/Raze et laisse tes coequipiers anchor les sites." },
  ],
};

// ═══════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════
const T = {
  fr: { nav_home:"Accueil", nav_dash:"Dashboard", nav_coach:"Coach ACE", nav_pricing:"Tarifs", nav_signup:"Commencer", hero_title:"Rencontre ACE —", hero_title2:"Ton Coach Valorant IA Personnel", hero_sub:"Entre ton Riot ID. ACE analyse tout. Tu montes.", hero_cta:"Obtenir mon analyse gratuite", hero_input:"Joueur#TAG (ex: TenZ#000)", hero_badge:"Utilisé par 12 847 joueurs", hero_hint:"Exemple : TenZ#000 · Jooky#EU1 · TonPseudo#TAG", vs_title:"Pourquoi PeakVal bat un vrai coach", how_title:"Comment ça marche", testi_title:"Joueurs qui ont grimpé avec ACE", quiz_q1:"Avant de t'analyser — sur quoi tu veux progresser ?", quiz_q2:"Comment tu veux jouer en ranked ?", quiz_btn:"Analyser mon jeu →", best:"Tu es meilleur que tu crois 🔥", mirror_title:"Tu joues comme...", mirror_lock:"Passe en Pro pour révéler ton jumeau pro", pred_title:"Rank Predictor", pred_lock:"Débloque les 3 conditions", ace1:"J'ai analysé 847 données sur ton compte en 4 secondes.", ace2:"Un coach humain à 80€/h ne peut pas voir tout ça.", ace3:"Moi je vois TOUT. Tout le temps. Moins cher qu'un café par semaine.", ace_cta:"Débloquer mon plan — 9.99€/mois", ace_sub:"Moins cher qu'1h avec un vrai coach", strengths:"Points Forts", weaknesses:"À Améliorer", recent:"Matchs Récents", map:"Map", result:"Résultat", agent:"Agent", insights:"Insights d'ACE", chat_title:"Chat avec ACE", chat_ph:"Pose n'importe quelle question à ACE...", chat_send:"Envoyer", chat_thinking:"ACE analyse...", chips:["Pourquoi je hardstuck ?","Analyse mes 5 derniers matchs","Comment je carry ce rank ?","Plan 30 jours pour rankup","J'suis en tilt, aide-moi","Quel agent pour moi ?"], price_title:"Choisir ton plan", price_sub:"Moins cher qu'une heure avec un vrai coach", monthly:"Mensuel", annual:"Annuel", save:"2 mois offerts", popular:"PLUS POPULAIRE", cta_free:"Commencer", cta_pro:"Commencer Pro", cta_team:"Créer mon équipe", cancel:"Annulation à tout moment. Sans engagement. Paiement sécurisé via Stripe." },
  en: { nav_home:"Home", nav_dash:"Dashboard", nav_coach:"Coach ACE", nav_pricing:"Pricing", nav_signup:"Get Started", hero_title:"Meet ACE —", hero_title2:"Your Personal AI Valorant Coach", hero_sub:"Enter your Riot ID. ACE analyzes everything. You climb.", hero_cta:"Get My Free Analysis", hero_input:"Player#TAG (e.g. TenZ#000)", hero_badge:"Trusted by 12,847 players", hero_hint:"Example: TenZ#000 · Shroud#NA1 · YourName#TAG", vs_title:"Why PeakVal beats a human coach", how_title:"How it works", testi_title:"Players who climbed with ACE", quiz_q1:"Before I analyze you — what do you want to improve?", quiz_q2:"How do you want to play ranked?", quiz_btn:"Analyze my game →", best:"You're better than you think 🔥", mirror_title:"You play like...", mirror_lock:"Upgrade to reveal your pro twin", pred_title:"Rank Predictor", pred_lock:"Unlock the 3 conditions", ace1:"I analyzed 847 data points on your account in 4 seconds.", ace2:"A human coach at 80€/h can't see all this.", ace3:"I see EVERYTHING. All the time. Less than a coffee per week.", ace_cta:"Unlock my full plan — 9.99€/mo", ace_sub:"Less than 1h with a human coach", strengths:"Strengths", weaknesses:"To Improve", recent:"Recent Matches", map:"Map", result:"Result", agent:"Agent", insights:"ACE Insights", chat_title:"Chat with ACE", chat_ph:"Ask ACE anything...", chat_send:"Send", chat_thinking:"ACE is analyzing...", chips:["Why am I hardstuck?","Analyze my last 5 matches","How do I carry this rank?","30-day rankup plan","I'm tilted, help","Best agent for me?"], price_title:"Choose your plan", price_sub:"Less than 1 hour with a human coach", monthly:"Monthly", annual:"Annual", save:"2 months free", popular:"MOST POPULAR", cta_free:"Get Started", cta_pro:"Start Pro Now", cta_team:"Create My Team", cancel:"Cancel anytime. No commitment. Secure payment via Stripe." },
};

// ═══════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════
const Card = ({ children, style = {} }) => (
  <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 16, padding: 24, ...style }}>{children}</div>
);

const RankBadge = ({ rank = "Gold II" }) => {
  const colors = { Iron: "#8b7355", Bronze: "#cd7f32", Silver: "#c0c0c0", Gold: "#ffd700", Platinum: "#40e0d0", Diamond: "#b9f2ff", Immortal: "#ff4655", Radiant: "#fffde7" };
  const tier = (rank || "Gold").split(" ")[0];
  const c = colors[tier] || "#ff4655";
  return <div style={{ width: 42, height: 42, borderRadius: "50%", background: \`radial-gradient(circle,\${c}33,\${c}11)\`, border: \`2px solid \${c}\`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c, fontFamily: "Rajdhani, sans-serif" }}>{tier.slice(0, 2).toUpperCase()}</div>;
};

const StatPill = ({ label, value, color = "#ff4655", trend }) => (
  <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: "14px 18px", flex: 1, minWidth: 120 }}>
    <div style={{ color: "#8b8b9a", fontSize: 10, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
    <div style={{ color, fontSize: 26, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", lineHeight: 1 }}>{value}</div>
    {trend !== undefined && <div style={{ color: trend >= 0 ? "#4ade80" : "#f87171", fontSize: 11, marginTop: 3 }}>{trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%</div>}
  </div>
);

// ═══════════════════════════════════════
// LANDING
// ═══════════════════════════════════════
const Landing = ({ lang, t, onNav, onStats }) => {
  const [rid, setRid] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const go = async () => {
    if (!rid.trim()) { setErr(lang === "fr" ? "Entre ton Riot ID" : "Enter your Riot ID"); return; }
    if (!rid.includes("#")) { setErr("Format: Nom#TAG (ex: TenZ#000)"); return; }
    setErr(""); setLoading(true);
    const data = await fetchPlayer(rid.trim());
    setLoading(false);
    if (!data.success) { setErr(data.error); return; }
    onStats(data);
    onNav("dashboard");
  };

  const vsRows = lang === "fr"
    ? [["Prix", "50–150€/h", "9.99€/mois"], ["Disponibilité", "Sur RDV", "24h/24 illimité"], ["Stats analysées", "Quelques matchs", "100% historique"], ["Mémoire", "Oublie tout", "Infinie"], ["Comparaison VCT", "Subjectif", "Données réelles"]]
    : [["Price", "50–150€/h", "9.99€/month"], ["Availability", "By appt.", "24/7 unlimited"], ["Stats analyzed", "Few matches", "100% history"], ["Memory", "Forgets", "Infinite"], ["VCT comparison", "Subjective", "Real data"]];

  const testi = [
    { name: "NxrtH", rank: lang === "fr" ? "Fer III → Or II" : "Iron III → Gold II", text: lang === "fr" ? "ACE a identifié mes problèmes en secondes. Un coach humain aurait pris 3 sessions." : "ACE identified my issues in seconds. A human coach would have taken 3 sessions." },
    { name: "Squally_FR", rank: lang === "fr" ? "Or I → Platine III" : "Gold I → Plat III", text: lang === "fr" ? "La feature Mirror Pro est dingue. Je joue comme Chronicle à 71% !" : "The Mirror Pro feature is insane. I play like Chronicle at 71%!" },
    { name: "Drxft", rank: lang === "fr" ? "Argent II → Diamant I" : "Silver II → Diamond I", text: lang === "fr" ? "Moins cher qu'un café par semaine et ACE est dispo à 3h du mat." : "Less than a coffee per week and ACE available at 3am on tilt." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "Inter, sans-serif" }}>
      {/* HERO */}
      <div style={{ position: "relative", padding: "100px 40px 80px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%,#ff465515 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,70,85,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,70,85,.03) 1px,transparent 1px)", backgroundSize: "50px 50px", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ff465511", border: "1px solid #ff465533", borderRadius: 20, padding: "6px 16px", marginBottom: 32, fontSize: 12, color: "#ff8891" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4655", boxShadow: "0 0 8px #ff4655" }} />{t.hero_badge}
        </div>
        <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "clamp(38px,6vw,70px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>
          <span style={{ color: "#ff4655" }}>{t.hero_title}</span><br /><span style={{ color: "#fff" }}>{t.hero_title2}</span>
        </h1>
        <p style={{ color: "#8b8b9a", fontSize: 19, maxWidth: 580, margin: "0 auto 44px", lineHeight: 1.6 }}>{t.hero_sub}</p>
        <div style={{ display: "flex", gap: 12, maxWidth: 540, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
          <input value={rid} onChange={e => { setRid(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && go()}
            placeholder={t.hero_input}
            style={{ flex: 1, minWidth: 230, padding: "14px 18px", background: "#111118", border: \`1px solid \${err ? "#ff4655" : "#1e1e2e"}\`, borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
          <button onClick={go} disabled={loading}
            style={{ padding: "14px 24px", background: loading ? "#2a2a3a" : "#ff4655", border: "none", borderRadius: 8, color: loading ? "#888" : "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer", fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, boxShadow: loading ? "none" : "0 0 24px #ff465540", whiteSpace: "nowrap", minWidth: 210, transition: "all .2s" }}>
            {loading ? (lang === "fr" ? "⚡ ACE analyse..." : "⚡ ACE analyzing...") : \`\${t.hero_cta} →\`}
          </button>
        </div>
        {err && <div style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{err}</div>}
        <div style={{ color: "#555", fontSize: 12, marginTop: 12 }}>{t.hero_hint}</div>
        <button onClick={() => { onStats(null); onNav("dashboard"); }}
          style={{ marginTop: 14, background: "transparent", border: "1px solid #2a2a3a", borderRadius: 6, padding: "7px 18px", color: "#666", fontSize: 12, cursor: "pointer" }}>
          {lang === "fr" ? "Voir la démo →" : "View demo →"}
        </button>
      </div>

      {/* VS TABLE */}
      <div style={{ padding: "60px 40px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 34, color: "#fff" }}>{t.vs_title}</h2>
        <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", background: "#0a0a0f", borderBottom: "1px solid #1e1e2e" }}>
            <div style={{ padding: "13px 18px" }} />
            <div style={{ padding: "13px 18px", color: "#8b8b9a", fontSize: 13, fontWeight: 600, textAlign: "center" }}>{lang === "fr" ? "Coach Humain" : "Human Coach"}</div>
            <div style={{ padding: "13px 18px", color: "#ff4655", fontSize: 13, fontWeight: 700, textAlign: "center", borderBottom: "2px solid #ff4655" }}>PeakVal ACE</div>
          </div>
          {vsRows.map(([l, h, a], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", borderTop: "1px solid #1e1e2e" }}>
              <div style={{ padding: "12px 18px", color: "#fff", fontSize: 14 }}>{l}</div>
              <div style={{ padding: "12px 18px", color: "#555", fontSize: 13, textAlign: "center", textDecoration: "line-through" }}>{h}</div>
              <div style={{ padding: "12px 18px", color: "#4ade80", fontSize: 13, fontWeight: 600, textAlign: "center" }}>✓ {a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: "60px 40px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 40, color: "#fff" }}>{t.how_title}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 18 }}>
          {[
            { n: "01", icon: "🎮", title: lang === "fr" ? "Entre ton Riot ID" : "Enter your Riot ID", sub: lang === "fr" ? "Connexion instantanée à tes stats" : "Instant connection to your stats" },
            { n: "02", icon: "🤖", title: lang === "fr" ? "ACE analyse tout" : "ACE analyzes everything", sub: lang === "fr" ? "847 données en 4 secondes" : "847 data points in 4 seconds" },
            { n: "03", icon: "🏆", title: lang === "fr" ? "Monte en rang" : "Climb the ranks", sub: lang === "fr" ? "Plan personnalisé rien que pour toi" : "Personalized plan just for you" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 16, padding: 28, textAlign: "center", position: "relative" }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ position: "absolute", top: 14, right: 16, color: "#ff465533", fontFamily: "Rajdhani, sans-serif", fontSize: 42, fontWeight: 700 }}>{s.n}</div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{s.title}</div>
              <div style={{ color: "#8b8b9a", fontSize: 13 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div style={{ padding: "60px 40px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 32, color: "#fff" }}>{t.testi_title}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          {testi.map((tm, i) => (
            <div key={i} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 14, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ff465522", border: "2px solid #ff465544", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#ff4655" }}>{tm.name[0]}</div>
                <div><div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{tm.name}</div><div style={{ color: "#ff4655", fontSize: 11, fontFamily: "Rajdhani, sans-serif" }}>{tm.rank}</div></div>
              </div>
              <div style={{ color: "#8b8b9a", fontSize: 13, lineHeight: 1.6, fontStyle: "italic" }}>"{tm.text}"</div>
              <div style={{ color: "#ffd700", fontSize: 13, marginTop: 10 }}>★★★★★</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA FINAL */}
      <div style={{ padding: "80px 40px", textAlign: "center", background: "linear-gradient(180deg,transparent,#ff465508)" }}>
        <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 42, fontWeight: 700, color: "#fff", marginBottom: 14 }}>{lang === "fr" ? "Prêt à monter en rang ?" : "Ready to climb?"}</h2>
        <p style={{ color: "#8b8b9a", fontSize: 17, marginBottom: 28 }}>{lang === "fr" ? "Moins cher qu'un café par semaine." : "Less than a coffee per week."}</p>
        <button onClick={() => onNav("pricing")} style={{ padding: "14px 36px", background: "#ff4655", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, boxShadow: "0 0 28px #ff465550" }}>
          {lang === "fr" ? "Voir les tarifs →" : "View pricing →"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
const Dashboard = ({ lang, t, playerStats }) => {
  const [proOn, setProOn] = useState(false);
  const s = playerStats || MOCK;

  const aceMsg = lang === "fr"
    ? \\`\${s.name}, j'ai détecté que tu perds 47% de tes gunfights à cause d\'un problème de timing sur ton contre-strafe. Un coach humain mettrait 3 sessions à identifier ça. Moi, 4 secondes.\`
    : \\`\${s.name}, I detected you're losing 47% of your gunfights due to counter-strafe timing. A human coach would take 3 sessions to spot this. I took 4 seconds.\`;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "Inter, sans-serif", padding: "26px 22px" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RankBadge rank={s.rank} />
          <div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 21, fontWeight: 700 }}>{s.name}#{s.tag}</div>
            <div style={{ color: "#ffd700", fontSize: 13, fontFamily: "Rajdhani, sans-serif" }}>{s.rank} — {s.rr} RR | Peak: {s.peakRank}</div>
          </div>
        </div>
        {s.isDemo && <div style={{ background: "#ff465511", border: "1px solid #ff465533", borderRadius: 8, padding: "5px 12px", color: "#ff8891", fontSize: 12 }}>⚡ {lang === "fr" ? "Stats générées — déploie le backend pour données réelles" : "Generated stats — deploy backend for real data"}</div>}
      </div>

          {/* BEST STATS */}
          <div style={{ background: "linear-gradient(135deg,#111118,#1a0a0d)", border: "1px solid #ff465533", borderRadius: 14, padding: 20, marginBottom: 18 }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 17, fontWeight: 700, color: "#ff4655", marginBottom: 12 }}>🔥 {t.best}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                lang === "fr" ? \`K/D \${s.kd} dépasse la moyenne 🎯\` : \`K/D \${s.kd} beats rank average 🎯\`,
                lang === "fr" ? \`Win rate \${s.wr}% — tu gagnes plus que tu crois 💪\` : \`Win rate \${s.wr}% — better than you think 💪\`,
                lang === "fr" ? \`Clutch \${s.clutch}% — top performer 🏆\` : \`Clutch \${s.clutch}% — top performer 🏆\`,
              ].map((x, i) => (
                <div key={i} style={{ background: "#ff465511", border: "1px solid #ff465533", borderRadius: 8, padding: "6px 12px", color: "#ff8891", fontSize: 13 }}>{x}</div>
              ))}
            </div>
          </div>

          {/* STAT PILLS */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            <StatPill label="K/D" value={s.kd} color="#ff4655" trend={8} />
            <StatPill label="Win Rate" value={\`\${s.wr}%\`} color="#ffd700" trend={-3} />
            <StatPill label="HS%" value={\`\${s.hs}%\`} color="#60a5fa" trend={2} />
            <StatPill label="ACS" value={s.acs} color="#a78bfa" trend={5} />
            <StatPill label="First Blood" value={\`\${s.fbr}%\`} color="#f87171" />
            <StatPill label="Clutch" value={\`\${s.clutch}%\`} color="#4ade80" trend={4} />
          </div>

          {/* MIRROR PRO + RANK PREDICTOR */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(275px,1fr))", gap: 18, marginBottom: 18 }}>
            <Card>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🌟 {t.mirror_title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#ff465533,#1a1a2e)", border: "2px solid #ff465544", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, filter: proOn ? "none" : "blur(3px)" }}>🎮</div>
                <div>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: proOn ? "#ff4655" : "transparent", textShadow: proOn ? "none" : "0 0 12px #ff4655aa", background: proOn ? "none" : "linear-gradient(90deg,#ff4655,#ff8891)", WebkitBackgroundClip: proOn ? "none" : "text", WebkitTextFillColor: proOn ? "#ff4655" : "transparent" }}>{proOn ? "Chronicle" : "???????"}</div>
                  <div style={{ color: "#8b8b9a", fontSize: 13 }}><span style={{ color: "#ff4655", fontWeight: 700, fontSize: 17 }}>74%</span> {lang === "fr" ? "similarité" : "similarity"}</div>
                </div>
              </div>
              {!proOn
                ? <div style={{ background: "#0a0a0f", border: "1px solid #ff465533", borderRadius: 8, padding: "11px 14px", textAlign: "center" }}>
                    <div style={{ color: "#8b8b9a", fontSize: 13, marginBottom: 9 }}>🔒 {t.mirror_lock}</div>
                    <button onClick={() => setProOn(true)} style={{ background: "#ff4655", border: "none", borderRadius: 6, padding: "7px 18px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Rajdhani, sans-serif" }}>Upgrade to Pro</button>
                  </div>
                : <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ background: "#0a0a0f", borderRadius: 8, padding: "9px 12px", flex: 1, textAlign: "center" }}><div style={{ color: "#8b8b9a", fontSize: 10, marginBottom: 3 }}>ICONIC STAT</div><div style={{ color: "#ff4655", fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>HS 38%</div></div>
                    <div style={{ background: "#0a0a0f", borderRadius: 8, padding: "9px 12px", flex: 1, textAlign: "center" }}><div style={{ color: "#8b8b9a", fontSize: 10, marginBottom: 3 }}>AGENT</div><div style={{ color: "#ff4655", fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>Viper</div></div>
                  </div>
              }
            </Card>
            <Card>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🎯 {t.pred_title}</div>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 50, fontWeight: 700, color: "#ff4655", lineHeight: 1 }}>78%</div>
                <div style={{ color: "#8b8b9a", fontSize: 13, marginTop: 5 }}>{lang === "fr" ? "de chances d'atteindre" : "chance to reach"} <span style={{ color: "#ffd700", fontWeight: 700 }}>Platinum I</span></div>
              </div>
              <div style={{ background: "#0a0a0f", borderRadius: 6, height: 7, marginBottom: 12, overflow: "hidden" }}><div style={{ width: "78%", height: "100%", background: "linear-gradient(90deg,#ff4655,#ff8891)", borderRadius: 6 }} /></div>
              <div style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 8, padding: "11px 14px" }}>
                <div style={{ color: "#8b8b9a", fontSize: 12, filter: "blur(4px)", userSelect: "none", lineHeight: 1.7 }}>1. Improve trade ratio above 0.6<br />2. Increase HS% to 28%+<br />3. Reduce first death rate</div>
                <div style={{ color: "#ff4655", fontSize: 12, marginTop: 7, textAlign: "center" }}>🔒 {t.pred_lock}</div>
              </div>
            </Card>
          </div>

          {/* ACE CONVERSION */}
          <div style={{ background: "linear-gradient(135deg,#1a0508,#111118)", border: "1px solid #ff4655", borderRadius: 14, padding: 24, marginBottom: 18, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#ff4655,#ff8891,#ff4655)" }} />
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ff465522", border: "2px solid #ff4655", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#ff4655", fontSize: 12, flexShrink: 0 }}>ACE</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
                  <span style={{ color: "#ff8891" }}>{t.ace1}</span><br />{t.ace2}<br />
                  <span style={{ color: "#ff4655", fontWeight: 700 }}>{t.ace3}</span><br /><br />
                  <span style={{ color: "#e2e8f0" }}>{aceMsg}</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button style={{ padding: "10px 20px", background: "#ff4655", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Rajdhani, sans-serif", boxShadow: "0 0 18px #ff465540" }}>{t.ace_cta}</button>
                  <div style={{ color: "#8b8b9a", fontSize: 12 }}>{t.ace_sub}</div>
                </div>
              </div>
            </div>
          </div>

          {/* STRENGTHS / WEAKNESSES */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <Card><div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, fontWeight: 700, color: "#4ade80", marginBottom: 12 }}>✦ {t.strengths}</div>{s.strengths.map((x, i) => <div key={i} style={{ display: "flex", gap: 7, marginBottom: 9, color: "#e2e8f0", fontSize: 13 }}><span style={{ color: "#4ade80" }}>✓</span>{x}</div>)}</Card>
            <Card><div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 12 }}>⚠ {t.weaknesses}</div>{s.weaknesses.map((x, i) => <div key={i} style={{ display: "flex", gap: 7, marginBottom: 9, color: "#e2e8f0", fontSize: 13 }}><span style={{ color: "#f87171" }}>→</span>{x}</div>)}</Card>
          </div>

          {/* ACE INSIGHTS */}
          <Card style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🤖 {t.insights}</div>
            {s.insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", gap: 9, marginBottom: 12, padding: 13, background: "#0a0a0f", borderRadius: 10, border: "1px solid #1e1e2e" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#ff465522", border: "1px solid #ff465544", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff4655", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>ACE</div>
                <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.6 }}>{lang === "fr" ? ins.fr : ins.en}</div>
              </div>
            ))}
          </Card>

          {/* RECENT MATCHES */}
          <Card>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 {t.recent}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ borderBottom: "1px solid #1e1e2e" }}>{[t.map, t.agent, t.result, "K/D/A", "ACS", "Score"].map(h => <th key={h} style={{ padding: "8px 10px", color: "#8b8b9a", fontWeight: 500, textAlign: "left", fontFamily: "Rajdhani, sans-serif" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {s.matches.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0d0d18" }}>
                      <td style={{ padding: "9px 10px", color: "#fff" }}>{m.map}</td>
                      <td style={{ padding: "9px 10px", color: "#8b8b9a" }}>{m.agent}</td>
                      <td style={{ padding: "9px 10px" }}><span style={{ background: m.result === "W" ? "#4ade8022" : "#f8717122", color: m.result === "W" ? "#4ade80" : "#f87171", padding: "2px 9px", borderRadius: 4, fontFamily: "Rajdhani, sans-serif", fontWeight: 700 }}>{m.result}</span></td>
                      <td style={{ padding: "9px 10px", color: "#fff", fontFamily: "Rajdhani, sans-serif" }}>{m.kda}</td>
                      <td style={{ padding: "9px 10px", color: "#a78bfa", fontFamily: "Rajdhani, sans-serif" }}>{m.acs}</td>
                      <td style={{ padding: "9px 10px" }}><span style={{ color: m.score >= 70 ? "#4ade80" : m.score >= 50 ? "#ffd700" : "#f87171", fontFamily: "Rajdhani, sans-serif", fontWeight: 700 }}>{m.score}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
    </div>
  );
};

// ═══════════════════════════════════════
// CHAT
// ═══════════════════════════════════════
const Chat = ({ lang, t, playerStats }) => {
  const s = playerStats || MOCK;
  const initMsg = () => {
    if (!playerStats) {
      return [{
        role: "assistant",
        content: lang === "fr"
          ? "Salut ! Je suis ACE, ton coach Valorant IA. Entre ton Riot ID sur l'accueil pour que j'analyse tes vraies stats et je te montre exactement comment progresser."
          : "Hey! I'm ACE, your AI Valorant coach. Enter your Riot ID on the home page so I can analyze your real stats and show you exactly how to improve."
      }];
    }

    const strengths = s.strengths?.slice(0, 2).join(", ") || (lang === "fr" ? "bon engagement" : "good engagement");
    const weakKey = s.weaknesses?.[0] || (lang === "fr" ? "points à améliorer" : "areas to improve");

    return [{
      role: "assistant",
      content: lang === "fr"
        ? \`Salut \${s.name} ! J'ai analysé tes stats : tu es \${s.rank} avec un K/D de \${s.kd} et \${s.wr}% de winrate.

Points forts : \${strengths}. C'est solide.

Point faible principal : \${weakKey}. C'est exactement ce qui te bloque pour monter.

La bonne nouvelle ? Ton profil montre un potentiel énorme d'évolution rapide. Tu as les bases, il manque juste quelques ajustements clés. Je vais te donner un plan concret pour débloquer ton vrai niveau.

Sur quoi tu veux qu'on travaille en priorité ?\`
        : \`Hey \${s.name}! I analyzed your stats: you're \${s.rank} with \${s.kd} K/D and \${s.wr}% winrate.

Strengths: \${strengths}. Solid foundation.

Main weakness: \${weakKey}. This is exactly what's holding you back.

Good news? Your profile shows huge potential for rapid improvement. You have the fundamentals, just need a few key adjustments. I'll give you a concrete plan to unlock your true level.

What do you want to work on first?\`
    }];
  };

  const [msgs, setMsgs] = useState(initMsg);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const sys = \`Tu es ACE, un coach Valorant d'elite niveau VCT. Tu es competent, humble et sympa, comme un vrai coach pro bienveillant.

PROFIL JOUEUR:
- Joueur: \${s.name}#\${s.tag}
- Rank actuel: \${s.rank} (\${s.rr} RR) | Peak: \${s.peakRank}
- Stats cles: K/D \${s.kd} | Win Rate \${s.wr}% | HS% \${s.hs}% | ACS \${s.acs} | Clutch \${s.clutch}%
- Points forts: \${s.strengths?.join(", ")}
- Points faibles: \${s.weaknesses?.join(", ")}
- Derniers matchs: \${s.matches?.map(m => \`\${m.result} \${m.map} \${m.agent} \${m.kda}\`).join(", ")}

TON STYLE:
- Tu es HUMBLE et ENCOURAGEANT mais precis et competent
- Tu es SYMPA et patient, tu motives le joueur
- ADAPTE LA LONGUEUR selon la question :
  * Question simple (ex: "Quel agent ?", "C'est quoi X ?") = 1-2 phrases MAX, direct
  * Question complexe (ex: "Comment ameliorer ?", "Pourquoi je...") = reponse detaillee avec conseils
- Pour questions simples : ZERO vocabulaire technique inutile, sois ultra concis
- Pour questions techniques : utilise le vocabulaire Valorant pro naturellement
- Compare avec benchmarks VCT seulement si pertinent pour la question
- Donne des objectifs concrets seulement si la question le demande
- Tu restes positif meme quand tu corriges des erreurs

VOCABULAIRE A UTILISER (naturellement):
MECANIQUES: contre-strafe, dink, peek, jiggle peek, aggro, cubby, strafing, pop flash, wallbang
STRATEGIE: trade, double swing, stack, rotate, retake, lurk, fake, rush, anchor, flank, entry fragger
ECONOMIE: full buy, force buy, eco, save, bonus round
OBJECTIFS: plant, defuse, ninja defuse, fake defuse, post-plant
ROLES: entry, IGL, support, sentinel, controller, initiator
UTIL: smoke, fum, flash, molly, lineups
ARMES: OP, Vandal, Phantom, Sheriff, Odin
STATS: K/D, HS%, ACS, KAST, first blood, clutch, ace
MENTAL: tilt, info

EXEMPLES DE TON:

QUESTION
