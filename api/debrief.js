// api/debrief.js — end-of-date private read + alignment score + email notification.
// Free email delivery via a Google Apps Script web app (set NOTIFY_WEBHOOK in Vercel env).
const MODEL = "gemini-flash-latest";

const JEN_RUBRIC = `Jen (32, Redwood City) values, score +1 each shown / -1 each violated:
ALIGNED: kind & emotionally mature; can compromise (doesn't always need to win); curious & engaged; into AI/robots/the future/startups; into building/coding (real code or vibe-coding), would go to a hackathon; open to dating someone with a chronic health condition (severe insomnia + gut issues); has pets that are hypoallergenic or is fine with that; calm temperament (rarely yells); dating few/no other people seriously; monogamous-leaning; healthy weekly time expectations; grounded view on money.
MISALIGNED: needs to always get their way; dismissive of her health condition; pushy for explicit content; frequently yells/volatile; juggling many active dates; self-centered; low-effort or evasive.`;

const LEAH_RUBRIC = `Leah (44, SF, EM physician turned health-tech founder, Greek Orthodox Christian, divorced, wants marriage + kids soon) values, score +1 each shown / -1 each violated:
ALIGNED: excellent + emotionally intelligent authentic communicator; has an awareness/mindfulness practice; values strong relationships; family-oriented & excited for marriage and (more) kids; ambitious; self-aware; chivalrous; considerate; hardworking; genuinely loves what he does; financially established & stable, happy to provide; Christian or spiritually inclined toward love/service; monogamous; culturally similar (open); moderate politically (no hard fundamentalism); minimal substance use; 6 foot or over; roughly age 35-55 (up to 62 if well aged); prioritizes health/longevity; takes initiative & leads with intention while collaborative; intentional about dating & exclusivity.
MISALIGNED: virtue signaling; actions not matching words; selfishness; avoidant; inconsistency; no long-term relationship experience; rigid viewpoints; no regular drive for intimacy; too promiscuous; pornography addiction; intimacy challenges; not wanting kids/marriage; financially unstable with no drive.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { transcript, persona, lead } = req.body || {};
    if (typeof transcript !== "string") return res.status(400).json({ error: "transcript required" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });

    const name = persona === "leah" ? "Leah" : "Jen";
    const rubric = persona === "leah" ? LEAH_RUBRIC : JEN_RUBRIC;

    const prompt = "You are scoring a 10-minute dating chat for " + name + ".\n\n" + rubric +
      "\n\nRead the transcript. Tally the match's responses: +1 for each ALIGNED trait they genuinely show, -1 for each MISALIGNED trait. Then write a SHORT private debrief FOR " + name.toUpperCase() +
      " (second person \"you\"): a warm honest chemistry read, the specific things they said that earned + or - points, green flags, red flags, and a clear bottom line (keep talking: yes / maybe / probably not). Under 180 words, a few emojis. If the chat was too short to judge, say so.\n\n" +
      "IMPORTANT: On the VERY FIRST line, output exactly: SCORE: <number>  (the net total, e.g. 'SCORE: +4' or 'SCORE: -2'). Then a blank line, then the debrief.\n\nTRANSCRIPT:\n" + transcript;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.5 }
      })
    });
    if (!r.ok) { const t = await r.text(); return res.status(502).json({ error: "Upstream error", detail: t.slice(0,500) }); }
    const data = await r.json();
    const cand = (data.candidates && data.candidates[0]) || null;
    const text = cand && cand.content && cand.content.parts
      ? cand.content.parts.map(p => p.text || "").join("").trim()
      : "";

    // Pull the score off the first line.
    let score = null;
    const m = text.match(/SCORE:\s*([+-]?\d+)/i);
    if (m) score = parseInt(m[1], 10);

    // Fire-and-forget email notification (free, via your Apps Script web app).
    const hook = process.env.NOTIFY_WEBHOOK;
    if (hook) {
      try {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character: name,
            score: score,
            lead: lead || {},
            debrief: text,
            transcript: transcript,
            time: new Date().toISOString()
          })
        });
      } catch (e) { /* don't let email failure break the user's experience */ }
    }

    return res.status(200).json({ text, score });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}
