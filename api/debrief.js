// api/debrief.js — end-of-date private read for the real Jen, powered by Gemini (free tier).
const MODEL = "gemini-flash-latest"; // always points at current free-tier Flash

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { transcript } = req.body || {};
    if (typeof transcript !== "string") return res.status(400).json({ error: "transcript required" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });

    const prompt = "Here's a 10-minute Hinge chat between Jen and a match. Jen has a chronic health condition (severe insomnia + gut issues with cascading symptoms), builds AI apps with Claude Code, loves robots/AI/the future and startups, is into longevity & biohacking, is politically moderate and agnostic, and values a partner who can compromise (not someone who always needs to win). She's looking for something real.\n\nWrite a SHORT private debrief FOR JEN (second person \"you\") to help the REAL Jen decide whether to keep talking to this person. Be honest, warm, specific. Cover what came up among: pets (and hypoallergenic?), how often they yell/their temperament, hackathon/coding & vibe-coding interest + what they'd build, how many people they're dating right now, their \"this feels like it / i'm done looking\" combination of traits, robots & home automation, self-driving cars, how they handle not getting their way / compromise, poly vs mono, introvert/extrovert, weekly time together, money & dating, openness to chronic health issues.\nEnd with: red flags, green flags, and a clear bottom line — keep talking to him? (yes / maybe / probably not). Under 170 words, warm tone, a few emojis. If too short to judge, say so honestly.\n\nTRANSCRIPT:\n" + transcript;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
      })
    });
    if (!r.ok) { const t = await r.text(); return res.status(502).json({ error: "Upstream error", detail: t.slice(0,500) }); }
    const data = await r.json();
    const cand = (data.candidates && data.candidates[0]) || null;
    const text = cand && cand.content && cand.content.parts
      ? cand.content.parts.map(p => p.text || "").join("").trim()
      : "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}
