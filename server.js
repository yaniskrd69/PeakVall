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

// Debug endpoint to see raw API data
app.get('/api/debug/:region/:name/:tag', async (req, res) => {
  try {
    const { region, name, tag } = req.params;

    const mmrUrl = `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    const mmrRes = await axios.get(mmrUrl, {
      headers: HENRIK_KEY ? { "Authorization": HENRIK_KEY } : {}
    });

    const matchesUrl = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?mode=competitive&size=5`;
    const matchesRes = await axios.get(matchesUrl, {
      headers: HENRIK_KEY ? { "Authorization": HENRIK_KEY } : {}
    });

    res.json({
      mmr: mmrRes.data,
      matches: matchesRes.data,
      matchCount: matchesRes.data?.data?.length || 0
    });
  } catch (error) {
    console.error('Debug error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

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
    console.log(`MMR data for ${name}#${tag}:`, JSON.stringify(mmrData, null, 2));

    const matchesUrl = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?mode=competitive&size=20`;
    const matchesRes = await axios.get(matchesUrl, {
      headers: HENRIK_KEY ? { "Authorization": HENRIK_KEY } : {}
    });

    const matchesData = matchesRes.data?.data || [];
    console.log(`Found ${matchesData.length} competitive matches for ${name}#${tag}`);

    if (matchesData.length > 0) {
      console.log(`First match mode: ${matchesData[0]?.metadata?.mode}, map: ${matchesData[0]?.metadata?.map}`);
    }

    const stats = calculateStats(account, mmrData, matchesData);

    return res.json({ success: true, ...stats });
  } catch (error) {
    console.error("API Error:", error.message);
    console.error("Stack:", error.stack);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    return res.status(500).json({
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message || "API request failed"
    });
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
  let validMatchCount = 0;

  matches.forEach((match, idx) => {
    const playerData = match.players?.all_players?.find(
      p => p.name === account.name && p.tag === account.tag
    );

    if (playerData) {
      validMatchCount++;
      const kills = playerData.stats?.kills || 0;
      const deaths = playerData.stats?.deaths || 0;
      const hs = playerData.stats?.headshots || 0;
      const bs = playerData.stats?.bodyshots || 0;
      const ls = playerData.stats?.legshots || 0;

      console.log(`Match ${idx + 1}: K:${kills} D:${deaths} HS:${hs} BS:${bs} LS:${ls} Mode:${match.metadata?.mode}`);

      totalKills += kills;
      totalDeaths += deaths;
      totalHS += hs;
      totalShots += bs + hs + ls;
      totalACS += playerData.stats?.score || 0;

      const playerTeam = playerData.team;
      const redWon = match.teams?.red?.has_won;
      const blueWon = match.teams?.blue?.has_won;

      if ((playerTeam === "Red" && redWon) || (playerTeam === "Blue" && blueWon)) {
        wins++;
      }

      if (recentMatches.length < 5) {
        const didWin = (playerTeam === "Red" && redWon) || (playerTeam === "Blue" && blueWon);
        recentMatches.push({
          map: match.metadata?.map || "Unknown",
          agent: playerData.character || "Unknown",
          result: didWin ? "W" : "L",
          kda: `${playerData.stats?.kills || 0}/${playerData.stats?.deaths || 0}/${playerData.stats?.assists || 0}`,
          acs: playerData.stats?.score || 0,
          score: Math.min(99, Math.max(10, Math.round((playerData.stats?.score || 0) / 3)))
        });
      }
    }
  });

  console.log(`Stats calculation: ${validMatchCount} matches, K:${totalKills} D:${totalDeaths} HS:${totalHS}/${totalShots}`);

  stats.kd = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : 0;
  stats.wr = validMatchCount > 0 ? Math.round((wins / validMatchCount) * 100) : 0;
  stats.hs = totalShots > 0 ? Math.round((totalHS / totalShots) * 100) : 0;
  stats.acs = validMatchCount > 0 ? Math.round(totalACS / validMatchCount) : 0;
  stats.fbr = 0;
  stats.clutch = 0;
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
