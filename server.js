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
    { en: \`HS% at \${hs}%\${hs<25?" — below average. Fix crosshair placement first.":" — above average. Focus on first-duel consistency."}\`, fr: \`HS% à \${hs}%\${hs<25?" — en dessous de la moyenne. Corrige le placement de visée en priorité.":" — au-dessus de la moyenne. Concentre-toi sur la constance en duel."}\` },
    { en: \`K/D at \${kd}\${kd<1.2?" — dying too much. Stop peeking alone.":" is solid. Convert individual performance into team wins."}\`, fr: \`KD à \${kd}\${kd<1.2?" — tu meurs trop. Arrête de peek seul.":" est solide. Convertis ta perf individuelle en victoires."}\` },
    { en: \`Win rate \${wr}%\${wr<50?" — communication > fragging.":" is positive. Focus on consistency."}\`, fr: \`Win rate \${wr}%\${wr<50?" — communication > frags.":" est positif. Concentre-toi sur la constance."}\` },
  ];
  return { success: true, name, tag, rank, rr, peakRank, score: Math.min(100, Math.round(kd*22+wr*.45+hs*.3)), kd, wr, hs, acs, fbr, clutch, strengths, weaknesses, matches, insights, isDemo: true }
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
    { en: "Trade ratio 0.42 — VCT pros keep above 0.7. Stop peeking alone.", fr: "Trade ratio 0.42 — les pros VCT maintiennent 0.7+. Arrête de peek seul." },
    { en: "HS% 23% below Gold average (28%). Crosshair dipping below head level.", fr: "HS% 23% en dessous de la moyenne Gold (28%). Ta visée descend sous la hauteur de tête." },
    { en: "31% better on attack than defense. Play more aggressive entry roles.", fr: "31% meilleur en attaque qu'en défense. Joue des rôles d'entry plus agressifs." },
  ],
};

// ═══════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════
const T = {
  fr: { nav_home:"Accueil", nav_dash:"Dashboard", nav_coach:"Coach ACE", nav_pricing:"Tarifs", nav_signup:"Commencer", hero_title:"Rencontre ACE —", hero_title2:"Ton Coach Valorant IA Personnel", hero_sub:"Entre ton Riot ID. ACE analyse tout. Tu montes.", hero_cta:"Obtenir mon analyse gratuite", hero_input:"Joueur#TAG (ex: TenZ#000)", hero_badge:"Utilisé par 12 847 joueurs", hero_hint:"Exemple : TenZ#000 · Jooky#EU1 · TonPseudo#TAG", vs_title:"Pourquoi PeakVal bat un vrai coach", how_title:"Comment ça marche", testi_title:"Joueurs qui ont grimpé avec ACE", quiz_q1:"Avant de t'analyser — sur quoi tu veux progresser ?", quiz_q2:"Comment tu veux jouer en ranked ?", quiz_btn:"Analyser mon jeu →", best:"Tu es meilleur que tu crois 🔥", mirror_title:"Tu joues comme...", mirror_lock:"Passe en Pro pour révéler ton jumeau pro", pred_title:"Rank Predictor", pred_lock:"Débloque les 3 conditions", ace1:"J'ai analysé 847 données sur ton compte en 4 secondes.", ace2:"Un coach humain à 80€/h ne peut pas voir tout ça.", ace3:"Moi je vois TOUT. Tout le temps. Moins cher qu'un café par semaine.", ace_cta:"Débloquer mon plan — 9.99€/mois", ace_sub:"Moins cher qu'1h avec un vrai coach", strengths:"Points Forts", weaknesses:"À Améliorer", recent:"Matchs Récents", map:"Map", result:"Résultat", agent:"Agent", insights:"Insights d'ACE", chat_title:"Chat avec ACE", chat_ph:"Pose n'importe quelle question à ACE...", chat_send:"Envoyer", chat_thinking:"ACE analyse...", chips:["Pourquoi je stagne ?","Analyse mes 5 derniers matchs","Qu'est-ce qu'un pro VCT ferait ?","Donne-moi mon plan 30 jours","Coaching mental — en tilt"], price_title:"Choisir ton plan", price_sub:"Moins cher qu'une heure avec un vrai coach", monthly:"Mensuel", annual:"Annuel", save:"2 mois offerts", popular:"PLUS POPULAIRE", cta_free:"Commencer", cta_pro:"Commencer Pro", cta_team:"Créer mon équipe", cancel:"Annulation à tout moment. Sans engagement. Paiement sécurisé via Stripe." },
  en: { nav_home:"Home", nav_dash:"Dashboard", nav_coach:"Coach ACE", nav_pricing:"Pricing", nav_signup:"Get Started", hero_title:"Meet ACE —", hero_title2:"Your Personal AI Valorant Coach", hero_sub:"Enter your Riot ID. ACE analyzes everything. You climb.", hero_cta:"Get My Free Analysis", hero_input:"Player#TAG (e.g. TenZ#000)", hero_badge:"Trusted by 12,847 players", hero_hint:"Example: TenZ#000 · Shroud#NA1 · YourName#TAG", vs_title:"Why PeakVal beats a human coach", how_title:"How it works", testi_title:"Players who climbed with ACE", quiz_q1:"Before I analyze you — what do you want to improve?", quiz_q2:"How do you want to play ranked?", quiz_btn:"Analyze my game →", best:"You're better than you think 🔥", mirror_title:"You play like...", mirror_lock:"Upgrade to reveal your pro twin", pred_title:"Rank Predictor", pred_lock:"Unlock the 3 conditions", ace1:"I analyzed 847 data points on your account in 4 seconds.", ace2:"A human coach at 80€/h can't see all this.", ace3:"I see EVERYTHING. All the time. Less than a coffee per week.", ace_cta:"Unlock my full plan — 9.99€/mo", ace_sub:"Less than 1h with a human coach", strengths:"Strengths", weaknesses:"To Improve", recent:"Recent Matches", map:"Map", result:"Result", agent:"Agent", insights:"ACE Insights", chat_title:"Chat with ACE", chat_ph:"Ask ACE anything...", chat_send:"Send", chat_thinking:"ACE is analyzing...", chips:["Why am I hardstuck?","Analyze my last 5 matches","What would a VCT pro do?","Give me my 30-day plan","Mental coaching — on tilt"], price_title:"Choose your plan", price_sub:"Less than 1 hour with a human coach", monthly:"Monthly", annual:"Annual", save:"2 months free", popular:"MOST POPULAR", cta_free:"Get Started", cta_pro:"Start Pro Now", cta_team:"Create My Team", cancel:"Cancel anytime. No commitment. Secure payment via Stripe." },
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
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState(null);
  const [proOn, setProOn] = useState(false);
  const s = playerStats || MOCK;

  const focuses = [
    { k: "aim", icon: "🎯", fr: "Aim", en: "Aim", frs: "Mécaniques, flick shots, visée", ens: "Mechanics, flick shots, crosshair" },
    { k: "gs", icon: "🧠", fr: "Game Sense", en: "Game Sense", frs: "Décisions, timings, rotations", ens: "Decisions, timings, rotations" },
    { k: "tp", icon: "🤝", fr: "Team Play", en: "Team Play", frs: "Calls, synergie, communication", ens: "Calls, synergy, communication" },
    { k: "all", icon: "📊", fr: "Tout", en: "Everything", frs: "Analyse globale complète", ens: "Full global analysis" },
  ];
  const styles = [
    { k: "carry", icon: "⚔️", fr: "Mode Carry", en: "Carry Mode", frs: "J'arrache tout, je carry", ens: "I outfrag everyone, I carry" },
    { k: "igl", icon: "🧘", fr: "IGL Calme", en: "Calm IGL", frs: "Je donne des calls, je joue pour gagner", ens: "I give calls, play to win" },
    { k: "bal", icon: "⚖️", fr: "Équilibre", en: "Balance", frs: "Bon méca ET bon leader", ens: "Mechanically strong AND team leader" },
  ];

  const aceMsg = focus === "aim"
    ? (lang === "fr" ? \`Tu as le potentiel pour carry — mais ton HS% à \${s.hs}% au lieu de 35%+ te bloque. C'est ton crosshair placement.\` : \`You have carry potential — but HS% at \${s.hs}% instead of 35%+ is holding you back. Crosshair placement.\`)
    : focus === "gs"
    ? (lang === "fr" ? "Tes mécaniques ne sont pas le problème. Tes décisions te coûtent des rounds — tu rotates trop tard." : "Your mechanics aren't the issue. Decision-making is costing you rounds — you rotate too late.")
    : focus === "tp"
    ? (lang === "fr" ? "Ton équipe gagne plus quand tu joues sentinel. Tu es plus précieux que tu ne le crois." : "Your team wins more when you play sentinel. You're more valuable than you think.")
    : (lang === "fr" ? \`J'ai trouvé le problème principal : ton trade ratio. Les pros VCT maintiennent 0.7+. Toi tu es bien en dessous.\` : \`Found the main issue: your trade ratio. VCT pros keep 0.7+. You're well below that.\`);

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

      {/* QUIZ */}
      {step < 3 && (
        <div style={{ background: "#111118", border: "1px solid #ff465533", borderRadius: 16, padding: 26, marginBottom: 22, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#ff4655,#ff8891)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ff465522", border: "2px solid #ff4655", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#ff4655", fontSize: 12 }}>ACE</div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>
              {step === 0 ? t.quiz_q1 : step === 1 ? t.quiz_q2 : (lang === "fr" ? "ACE analyse ton profil..." : "ACE analyzing your profile...")}
            </div>
          </div>
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 10 }}>
              {focuses.map(o => (
                <button key={o.k} onClick={() => { setFocus(o.k); setStep(1); }}
                  style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 12, padding: "16px 12px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#ff4655"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}>
                  <div style={{ fontSize: 22, marginBottom: 7 }}>{o.icon}</div>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 3 }}>{lang === "fr" ? o.fr : o.en}</div>
                  <div style={{ color: "#8b8b9a", fontSize: 11 }}>{lang === "fr" ? o.frs : o.ens}</div>
                </button>
              ))}
            </div>
          )}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 10 }}>
              {styles.map(o => (
                <button key={o.k} onClick={() => setStep(2)}
                  style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 12, padding: "16px 12px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#ff4655"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}>
                  <div style={{ fontSize: 22, marginBottom: 7 }}>{o.icon}</div>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 3 }}>{lang === "fr" ? o.fr : o.en}</div>
                  <div style={{ color: "#8b8b9a", fontSize: 11 }}>{lang === "fr" ? o.frs : o.ens}</div>
                </button>
              ))}
            </div>
          )}
          {step === 2 && (
            <div style={{ textAlign: "center", padding: "14px 0" }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, color: "#fff", marginBottom: 18 }}>{lang === "fr" ? "ACE analyse ton profil complet..." : "ACE analyzing your full profile..."}</div>
              <button onClick={() => setStep(3)} style={{ padding: "12px 28px", background: "#ff4655", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Rajdhani, sans-serif" }}>{t.quiz_btn}</button>
            </div>
          )}
        </div>
      )}

      {step >= 3 && (
        <>
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
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// CHAT
// ═══════════════════════════════════════
const Chat = ({ lang, t, playerStats }) => {
  const s = playerStats || MOCK;
  const [msgs, setMsgs] = useState([{ role: "assistant", content: lang === "fr" ? \`Salut ! Je suis ACE, ton coach Valorant IA. J'ai analysé ton profil — \${s.rank}, KD \${s.kd}, HS% \${s.hs}%. Par où tu veux commencer ?\` : \`Hey! I'm ACE, your AI Valorant coach. Analyzed your profile — \${s.rank}, K/D \${s.kd}, HS% \${s.hs}%. Where do you want to start?\` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const sys = \`You are ACE, an elite Valorant coach at VCT head-coach level.
Player: \${s.name}#\${s.tag} | Rank: \${s.rank} (\${s.rr} RR) | Peak: \${s.peakRank}
K/D: \${s.kd} | Win Rate: \${s.wr}% | HS%: \${s.hs}% | ACS: \${s.acs} | Clutch: \${s.clutch}%
Strengths: \${s.strengths?.join(", ")} | Weaknesses: \${s.weaknesses?.join(", ")}
Recent: \${s.matches?.map(m => \`\${m.result} \${m.map} \${m.agent} \${m.kda}\`).join(", ")}
Rules: speak like a real human VCT coach, use gaming slang (peek/jiggle/eco/feed/clutch/trade/lurk), reference actual stats, compare to VCT pro averages, end with concrete micro-objective, max 120 words, be direct and actionable.
Respond in \${lang === "fr" ? "French" : "English"}.\`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const um = { role: "user", content: input };
    setMsgs(p => [...p, um]); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys, messages: [...msgs, um].map(m => ({ role: m.role, content: m.content })) })
      });
      const d = await res.json();
      setMsgs(p => [...p, { role: "assistant", content: d.content?.[0]?.text || (lang === "fr" ? "Erreur de connexion." : "Connection error.") }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: lang === "fr" ? "Erreur réseau." : "Network error." }]);
    }
    setLoading(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", background: "#0a0a0f", fontFamily: "Inter, sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: 228, background: "#111118", borderRight: "1px solid #1e1e2e", padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ff465522", border: "2px solid #ff4655", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#ff4655", fontSize: 12 }}>ACE</div>
          <div><div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#fff", fontSize: 14 }}>ACE</div><div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} /><span style={{ color: "#4ade80", fontSize: 11 }}>{lang === "fr" ? "En ligne" : "Online"}</span></div></div>
        </div>
        <div style={{ background: "#0a0a0f", borderRadius: 10, padding: 13 }}>
          <div style={{ color: "#8b8b9a", fontSize: 10, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, marginBottom: 9 }}>STATS</div>
          {[["Rank", s.rank], ["K/D", s.kd], ["HS%", \`\${s.hs}%\`], ["WR", \`\${s.wr}%\`], ["ACS", s.acs]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: "#8b8b9a", fontSize: 12 }}>{k}</span><span style={{ color: "#ff4655", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 12 }}>{v}</span></div>
          ))}
        </div>
        <div style={{ background: "#0a0a0f", borderRadius: 10, padding: 13 }}>
          <div style={{ color: "#8b8b9a", fontSize: 10, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, marginBottom: 9 }}>SKILLS</div>
          {[["Aim", 55], ["Game Sense", 62], ["Economy", 48], ["Clutch", 67], ["Positioning", 44]].map(([sk, v]) => (
            <div key={sk} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ color: "#8b8b9a", fontSize: 11 }}>{sk}</span><span style={{ color: "#fff", fontSize: 11, fontFamily: "Rajdhani, sans-serif" }}>{v}</span></div>
              <div style={{ background: "#1e1e2e", borderRadius: 4, height: 4 }}><div style={{ width: \`\${v}%\`, height: "100%", background: v >= 60 ? "#4ade80" : v >= 50 ? "#ffd700" : "#ff4655", borderRadius: 4 }} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "13px 20px", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700 }}>{t.chat_title}</div>
          <div style={{ background: "#ff465511", border: "1px solid #ff465533", borderRadius: 6, padding: "3px 10px", color: "#ff8891", fontSize: 11 }}>{lang === "fr" ? "Coaching actif" : "Active coaching"}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 9, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ff465522", border: "1px solid #ff4655", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff4655", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>ACE</div>}
              <div style={{ maxWidth: "72%", background: m.role === "user" ? "#ff465522" : "#111118", border: \`1px solid \${m.role === "user" ? "#ff465544" : "#1e1e2e"}\`, borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", padding: "10px 14px", color: "#fff", fontSize: 13, lineHeight: 1.6 }}>
                {m.content}
                {m.role === "assistant" && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button style={{ background: "#ff465511", border: "1px solid #ff465533", borderRadius: 5, padding: "2px 8px", color: "#ff8891", fontSize: 11, cursor: "pointer" }}>👍</button>
                    <button style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 5, padding: "2px 8px", color: "#8b8b9a", fontSize: 11, cursor: "pointer" }}>{lang === "fr" ? "Exemple" : "Example"}</button>
                    <button style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 5, padding: "2px 8px", color: "#8b8b9a", fontSize: 11, cursor: "pointer" }}>{lang === "fr" ? "Plan d'action" : "Action plan"}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ff465522", border: "1px solid #ff4655", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff4655", fontSize: 8, fontWeight: 700 }}>ACE</div>
              <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: "10px 14px", color: "#8b8b9a", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                {t.chat_thinking} <span style={{ display: "flex", gap: 3 }}>{[0, 1, 2].map(j => <span key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: "#ff4655", display: "inline-block", animation: \`pulse 1.4s \${j * .2}s infinite\` }} />)}</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "0 20px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {t.chips.map((c, i) => <button key={i} onClick={() => setInput(c)} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 18, padding: "5px 12px", color: "#8b8b9a", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>{c}</button>)}
        </div>
        <div style={{ padding: "8px 20px 20px", display: "flex", gap: 9 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={t.chat_ph}
            style={{ flex: 1, padding: "12px 16px", background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif" }} />
          <button onClick={send} disabled={loading} style={{ padding: "12px 20px", background: loading ? "#1e1e2e" : "#ff4655", border: "none", borderRadius: 10, color: loading ? "#8b8b9a" : "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer", fontFamily: "Rajdhani, sans-serif", boxShadow: loading ? "none" : "0 0 14px #ff465540" }}>{t.chat_send} →</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// PRICING
// ═══════════════════════════════════════
const Pricing = ({ lang, t }) => {
  const [annual, setAnnual] = useState(false);
  const plans = [
    { name: lang === "fr" ? "Gratuit" : "Free", price: "0€", sub: lang === "fr" ? "Toujours gratuit" : "Forever free", color: "#8b8b9a", cta: t.cta_free, badge: null, features: lang === "fr" ? ["Analyse Riot ID", "Mini Quiz ACE", "Meilleures stats", "Mirror Pro (flouté)", "Rank Predictor (%)", "3 messages ACE"] : ["Riot ID analysis", "ACE Mini Quiz", "Best stats showcase", "Mirror Pro teaser", "Rank Predictor %", "3 free ACE messages"] },
    { name: "Pro", price: annual ? "79.99€" : "9.99€", sub: annual ? (lang === "fr" ? "/an" : "/year") : (lang === "fr" ? "/mois" : "/month"), color: "#ff4655", cta: t.cta_pro, badge: t.popular, features: lang === "fr" ? ["Chat ACE illimité", "Mirror Pro complet", "Rank Predictor complet", "Plan 30 jours", "Routine quotidienne", "Coaching mental", "Analyse post-match", "Classement complet", "Badges + niveaux", "Support prioritaire"] : ["Unlimited ACE chat", "Full Mirror Pro", "Full Rank Predictor", "30-day personalized plan", "Daily routine", "Mental coaching", "Post-match analysis", "Full leaderboard", "Badges + levels", "Priority support"] },
    { name: lang === "fr" ? "Équipe" : "Team", price: annual ? "239.99€" : "29.99€", sub: annual ? (lang === "fr" ? "/an" : "/year") : (lang === "fr" ? "/mois" : "/month"), color: "#a78bfa", cta: t.cta_team, badge: null, features: lang === "fr" ? ["Tout Pro inclus", "Roster 5 joueurs", "Dashboard coach", "Tableau tactique", "Calendrier d'équipe", "Analyse équipe ACE", "Rôles + badge IGL", "Notation joueurs", "< 3€ par joueur"] : ["All Pro included", "5-player roster", "Coach dashboard", "Tactical board", "Team calendar", "ACE team analysis", "Roles + IGL badge", "Player ratings", "< 3€ per player"] },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "Inter, sans-serif", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 42 }}>
        <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 44, fontWeight: 700, marginBottom: 10 }}>{t.price_title}</h1>
        <p style={{ color: "#8b8b9a", fontSize: 16, marginBottom: 26 }}>{t.price_sub}</p>
        <div style={{ display: "inline-flex", background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: 4, gap: 3 }}>
          {[false, true].map(a => (
            <button key={String(a)} onClick={() => setAnnual(a)} style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: annual === a ? "#ff4655" : "transparent", color: annual === a ? "#fff" : "#8b8b9a", fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: "Rajdhani, sans-serif", display: "flex", alignItems: "center", gap: 7 }}>
              {a ? t.annual : t.monthly}
              {a && <span style={{ background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044", borderRadius: 5, padding: "2px 6px", fontSize: 11 }}>{t.save}</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(265px,1fr))", gap: 20, maxWidth: 940, margin: "0 auto 40px" }}>
        {plans.map((p, i) => (
          <div key={i} style={{ background: "#111118", border: \`1px solid \${p.badge ? p.color : "#1e1e2e"}\`, borderRadius: 20, padding: 28, position: "relative", boxShadow: p.badge ? \`0 0 36px \${p.color}20\` : "none" }}>
            {p.badge && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: p.color, color: "#fff", padding: "4px 14px", borderRadius: 18, fontSize: 11, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, whiteSpace: "nowrap" }}>{p.badge}</div>}
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: p.color, marginBottom: 6 }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}><span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 44, fontWeight: 700, color: "#fff" }}>{p.price}</span><span style={{ color: "#8b8b9a", fontSize: 14 }}>{p.sub}</span></div>
            <button style={{ width: "100%", padding: "12px", background: p.badge ? p.color : "transparent", border: \`1px solid \${p.color}\`, borderRadius: 10, color: p.badge ? "#fff" : p.color, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Rajdhani, sans-serif", marginBottom: 20, boxShadow: p.badge ? \`0 0 18px \${p.color}40\` : "none" }}>{p.cta}</button>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{p.features.map((f, j) => <div key={j} style={{ display: "flex", gap: 8, fontSize: 13, color: "#e2e8f0" }}><span style={{ color: p.color, flexShrink: 0 }}>✓</span>{f}</div>)}</div>
          </div>
        ))}
      </div>
      <p style={{ textAlign: "center", color: "#8b8b9a", fontSize: 13 }}>{t.cancel}</p>
    </div>
  );
};

// ═══════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════
const Navbar = ({ lang, setLang, t, page, onNav }) => (
  <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#0a0a0fee", backdropFilter: "blur(12px)", borderBottom: "1px solid #1e1e2e", padding: "0 26px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div onClick={() => onNav("home")} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 23, fontWeight: 700, color: "#ff4655", cursor: "pointer", letterSpacing: 2 }}>PEAK<span style={{ color: "#fff" }}>VAL</span></div>
    <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
      {[["home", t.nav_home], ["dashboard", t.nav_dash], ["chat", t.nav_coach], ["pricing", t.nav_pricing]].map(([k, label]) => (
        <button key={k} onClick={() => onNav(k)} style={{ background: page === k ? "#ff465511" : "transparent", border: page === k ? "1px solid #ff465533" : "1px solid transparent", borderRadius: 7, padding: "6px 12px", color: page === k ? "#ff4655" : "#8b8b9a", fontSize: 13, cursor: "pointer" }}>{label}</button>
      ))}
      <button onClick={() => setLang(lang === "en" ? "fr" : "en")} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 7, padding: "6px 12px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, marginLeft: 5 }}>{lang === "en" ? "🇫🇷 FR" : "🇬🇧 EN"}</button>
      <button onClick={() => onNav("pricing")} style={{ background: "#ff4655", border: "none", borderRadius: 7, padding: "7px 14px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Rajdhani, sans-serif", marginLeft: 5, boxShadow: "0 0 14px #ff465540" }}>{t.nav_signup}</button>
    </div>
  </nav>
);

// ═══════════════════════════════════════
// APP
// ═══════════════════════════════════════
function App() {
  const [lang, setLang] = useState("fr");
  const [page, setPage] = useState("home");
  const [playerStats, setPlayerStats] = useState(null);
  const t = T[lang];
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f" }}>
      <style>{\`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#0a0a0f;}::-webkit-scrollbar-thumb{background:#ff465544;border-radius:3px;}input::placeholder{color:#4a4a5a;}button{transition:opacity .15s,background .15s;}@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8);}50%{opacity:1;transform:scale(1.2);}}\`}</style>
      <Navbar lang={lang} setLang={setLang} t={t} page={page} onNav={setPage} />
      {page === "home" && <Landing lang={lang} t={t} onNav={setPage} onStats={setPlayerStats} />}
      {page === "dashboard" && <Dashboard lang={lang} t={t} playerStats={playerStats} />}
      {page === "chat" && <Chat lang={lang} t={t} playerStats={playerStats} />}
      {page === "pricing" && <Pricing lang={lang} t={t} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
  </script>
</body>
</html>`;

app.get("/health", (req, res) => res.json({ status: "ok", version: "1.0.0" }));

app.get("/api/player/:name/:tag", async (req, res) => {
  const { name, tag } = req.params;
  try {
    const accRes = await axios.get(
      `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { headers: { Authorization: HENRIK_KEY }, timeout: 8000 }
    );
    if (accRes.data.status !== 200) {
      return res.status(404).json({ success: false, error: "Joueur introuvable" });
    }
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
    let k = 0, d = 0, hs = 0, sh = 0, acsT = 0, w = 0;
    const recent = [];

    for (const m of matches) {
      const p = m.players?.all_players?.find(pl => pl.puuid === acc.puuid || pl.name?.toLowerCase() === name.toLowerCase());
      if (!p) continue;
      const st = p.stats || {};
      k += st.kills || 0; d += st.deaths || 1;
      hs += st.headshots || 0;
      sh += (st.headshots || 0) + (st.bodyshots || 0) + (st.legshots || 0);
      const rds = m.metadata?.rounds_played || 20;
      const acs = p.damage_made ? Math.round(p.damage_made / rds) : 0;
      acsT += acs;
      const won = m.teams?.[p.team?.toLowerCase()]?.has_won || false;
      if (won) w++;
      recent.push({ map: m.metadata?.map || "Unknown", agent: p.character || "?", result: won ? "W" : "L", kda: `${st.kills}/${st.deaths}/${st.assists}`, acs, score: Math.min(99, Math.max(10, Math.round(((st.kills||0)*2-(st.deaths||1)+(st.assists||0)*.5)/rds*80+45))) });
    }

    const n = Math.max(recent.length, 1);
    const kd = parseFloat((k / Math.max(d, 1)).toFixed(2));
    const hsPct = sh > 0 ? Math.round(hs / sh * 100) : 20;
    const wr = Math.round(w / n * 100);
    const acs = Math.round(acsT / n);
    const strengths = [], weaknesses = [];
    if (kd >= 1.3) strengths.push(`K/D ${kd} — au-dessus de la moyenne`); else weaknesses.push(`K/D ${kd} — en dessous de la moyenne`);
    if (wr >= 52) strengths.push(`Win rate ${wr}% — winner consistant`); else weaknesses.push(`Win rate ${wr}% — à améliorer`);
    if (hsPct >= 26) strengths.push(`HS% ${hsPct}% — au-dessus de la moyenne`); else weaknesses.push(`HS% ${hsPct}% — crosshair placement issue`);
    if (!strengths.length) strengths.push("Joueur actif et impliqué");
    const insights = [
      { en: `HS% at ${hsPct}%${hsPct<25?" — below avg. Fix crosshair placement.":" — above avg. Focus on first-duel consistency."}`, fr: `HS% à ${hsPct}%${hsPct<25?" — en dessous de la moyenne. Corrige le crosshair placement.":" — au-dessus de la moyenne. Concentre-toi sur la constance en duel."}` },
      { en: `K/D at ${kd}${kd<1.2?" — dying too much. Stop peeking alone.":" is solid. Convert perf into team wins."}`, fr: `KD à ${kd}${kd<1.2?" — tu meurs trop. Arrête de peek seul.":" est solide. Convertis ta perf en victoires."}` },
      { en: `Win rate ${wr}%${wr<50?" — communication > fragging.":" is positive. Focus on consistency."}`, fr: `Win rate ${wr}%${wr<50?" — communication > frags.":" est positif. Concentre-toi sur la constance."}` },
    ];
    return res.json({ success: true, name: acc.name, tag: acc.tag, region, rank, rr, peakRank, score: Math.min(100, Math.round(kd*22+wr*.45+hsPct*.3)), kd, wr, hs: hsPct, acs, fbr: 16, clutch: 32, strengths, weaknesses, matches: recent.slice(0, 5), insights });
  } catch (err) {
    console.error("Henrik error:", err.response?.status, err.message);
    if (err.response?.status === 404) return res.status(404).json({ success: false, error: "Joueur introuvable — vérifie le Riot ID" });
    if (err.response?.status === 429) return res.status(429).json({ success: false, error: "Rate limit — réessaie dans quelques secondes" });
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});


// ── Anthropic Chat Proxy ───────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, system } = req.body;
  const cleanMessages = (messages || [])
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role, content: String(m.content || "") }));
  if (!cleanMessages.length || cleanMessages[cleanMessages.length-1].role !== "user") {
    return res.status(400).json({ error: "Invalid messages" });
  }
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system || "You are ACE, a Valorant coach." },
          ...cleanMessages
        ]
      },
      { headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        }, timeout: 30000
      }
    );
    // Convert OpenAI format to Anthropic-like format for frontend compatibility
    const text = response.data.choices?.[0]?.message?.content || "Erreur de réponse";
    res.json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Groq error:", err.response?.status, err.response?.data || err.message);
    res.status(500).json({ error: "Erreur IA" });
  }
});

// ── All routes → inline HTML ───────────────────────────────
app.get("*", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(HTML);
});

app.listen(PORT, () => console.log(`PeakVal running on port ${PORT}`));
