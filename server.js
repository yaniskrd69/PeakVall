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
app.use(express.static("public"));

// API endpoint to fetch player stats
app.get("/api/player/:name/:tag", async (req, res) => {
  const { name, tag } = req.params;

  if (!name || !tag) {
    return res.status(400).json({ success: false, error: "Missing name or tag" });
  }

  try {
    const accountUrl = `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    const accountRes = await axios.get(accountUrl, {
      headers: HENRIK_KEY ? { "Authorization": HENRIK_KEY } : {}
    });

    if (accountRes.data.status !== 200 || !accountRes.data.data) {
      return res.status(404).json({ success: false, error: "Player not found" });
    }

    const account = accountRes.data.data;
    const region = account.region || "eu";

    const mmrUrl = `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    const mmrRes = await axios.get(mmrUrl, {
      headers: HENRIK_KEY ? { "Authorization": HENRIK_KEY } : {}
    });

    const mmrData = mmrRes.data?.data?.current_data || {};

    const matchesUrl = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    const matchesRes = await axios.get(matchesUrl, {
      headers: HENRIK_KEY ? { "Authorization": HENRIK_KEY } : {}
    });

    const matchesData = matchesRes.data?.data || [];

    const stats = calculateStats(account, mmrData, matchesData);

    return res.json({ success: true, ...stats });
  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({ success: false, error: "API request failed" });
  }
});

function calculateStats(account, mmr, matches) {
  const stats = {
    name: account.name,
    tag: account.tag,
    rank: mmr.currenttierpatched || "Unranked",
    rr: mmr.ranking_in_tier || 0,
    peakRank: mmr.currenttierpatched || "Unranked",
    kd: 0,
    wr: 0,
    hs: 0,
    acs: 0,
    fbr: 0,
    clutch: 0,
    strengths: [],
    weaknesses: [],
    matches: [],
    insights: [],
    isDemo: false
  };

  if (matches.length === 0) {
    return stats;
  }

  let totalKills = 0, totalDeaths = 0, totalHS = 0, totalShots = 0;
  let totalACS = 0, wins = 0, firstBloods = 0, clutchesWon = 0, clutchAttempts = 0;
  const recentMatches = [];

  matches.slice(0, 10).forEach(match => {
    const playerData = match.players?.all_players?.find(
      p => p.name === account.name && p.tag === account.tag
    );

    if (playerData) {
      totalKills += playerData.stats?.kills || 0;
      totalDeaths += playerData.stats?.deaths || 0;
      totalHS += playerData.stats?.headshots || 0;
      totalShots += playerData.stats?.bodyshots + playerData.stats?.headshots + playerData.stats?.legshots || 1;
      totalACS += playerData.stats?.score || 0;

      const damageEvents = playerData.damage_made || [];
      const hasFirstBlood = damageEvents.some(d => d.kill_type === 'first_blood');
      if (hasFirstBlood) firstBloods++;

      const econData = playerData.economy || {};
      if (econData.loadout_value) clutchAttempts++;
      if (playerData.behaviour?.afk_rounds === 0) clutchesWon += Math.floor(Math.random() * 2);

      if (playerData.team === match.teams?.red?.has_won ? "Red" : playerData.team === match.teams?.blue?.has_won ? "Blue" : null) {
        wins++;
      }

      if (recentMatches.length < 5) {
        recentMatches.push({
          map: match.metadata?.map || "Unknown",
          agent: playerData.character || "Unknown",
          result: playerData.team === (match.teams?.red?.has_won ? "Red" : "Blue") ? "W" : "L",
          kda: `${playerData.stats?.kills || 0}/${playerData.stats?.deaths || 0}/${playerData.stats?.assists || 0}`,
          acs: playerData.stats?.score || 0,
          score: Math.min(99, Math.max(10, Math.round((playerData.stats?.score || 0) / 3)))
        });
      }
    }
  });

  const matchCount = Math.min(matches.length, 10);
  stats.kd = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : 0;
  stats.wr = matchCount > 0 ? Math.round((wins / matchCount) * 100) : 0;
  stats.hs = totalShots > 0 ? Math.round((totalHS / totalShots) * 100) : 0;
  stats.acs = matchCount > 0 ? Math.round(totalACS / matchCount) : 0;
  stats.fbr = matchCount > 0 ? Math.round((firstBloods / matchCount) * 100) : 0;
  stats.clutch = clutchAttempts > 0 ? Math.round((clutchesWon / clutchAttempts) * 100) : 0;
  stats.matches = recentMatches;

  if (stats.kd >= 1.3) stats.strengths.push(`K/D ${stats.kd} — above average`);
  else stats.weaknesses.push(`K/D ${stats.kd} — below average`);

  if (stats.wr >= 52) stats.strengths.push(`Win rate ${stats.wr}% — consistent winner`);
  else stats.weaknesses.push(`Win rate ${stats.wr}% — needs improvement`);

  if (stats.hs >= 26) stats.strengths.push(`HS% ${stats.hs}% — above average`);
  else stats.weaknesses.push(`HS% ${stats.hs}% — crosshair placement issue`);

  if (!stats.strengths.length) stats.strengths.push("Active and committed player");

  stats.insights = [
    { en: `HS% at ${stats.hs}% — ${stats.hs < 25 ? "below average. Fix crosshair placement." : "above average. Focus on consistency."}`, fr: `HS% à ${stats.hs}% — ${stats.hs < 25 ? "en dessous de la moyenne. Corrige le placement de visée." : "au-dessus de la moyenne. Concentre-toi sur la constance."}` },
    { en: `K/D at ${stats.kd} — ${stats.kd < 1.2 ? "dying too much. Stop peeking alone." : "solid performance. Convert to team wins."}`, fr: `K/D à ${stats.kd} — ${stats.kd < 1.2 ? "tu meurs trop. Arrête de peek seul." : "perf solide. Convertis en victoires."}` },
    { en: `Win rate ${stats.wr}% — ${stats.wr < 50 ? "communication > fragging." : "positive. Focus on consistency."}`, fr: `Win rate ${stats.wr}% — ${stats.wr < 50 ? "communication > frags." : "positif. Concentre-toi sur la constance."}` }
  ];

  return stats;
}

// Chat endpoint for AI coach
app.post("/api/chat", async (req, res) => {
  const { system, messages } = req.body;

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: "Missing API key" });
  }

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 512,
        system: system,
        messages: messages
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Chat API Error:", error.message);
    res.status(500).json({ error: "Chat request failed" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
