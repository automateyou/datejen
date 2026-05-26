/**
 * FREE email notifier for Date Jen / Date Leah.
 * Emails every finished conversation (transcript + alignment score) to you.
 *
 * SETUP (one time, ~3 minutes, all free):
 * 1. Go to script.google.com (sign in with the Google account you want to send from).
 * 2. New project -> delete the sample code -> paste THIS whole file.
 * 3. Click Deploy -> New deployment -> type: "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy, authorize when prompted (click through the "unsafe" warning -> it's your own script).
 * 4. Copy the Web app URL it gives you (ends in /exec).
 * 5. In Vercel: Settings -> Environment Variables -> add  NOTIFY_WEBHOOK  = that URL. Redeploy.
 * Done. Every completed chat now lands in your inbox.
 */

var SEND_TO = "longevityoffices@gmail.com";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var character = data.character || "Unknown";
    var score = (data.score === null || data.score === undefined) ? "n/a" : data.score;
    var lead = data.lead || {};
    var name = lead.name || "(name not given)";
    var email = lead.email || "(no email captured)";
    var phone = lead.phone || "(no phone captured)";
    var debrief = data.debrief || "";
    var transcript = data.transcript || "";
    var when = data.time || new Date().toISOString();

    var subject = "[" + character + " date] " + name + " — score " + score;

    var body =
      "New conversation with " + character + "\n" +
      "Time: " + when + "\n\n" +
      "MATCH\n" +
      "  Name:  " + name + "\n" +
      "  Email: " + email + "\n" +
      "  Phone: " + phone + "\n\n" +
      "ALIGNMENT SCORE: " + score + "\n\n" +
      "PRIVATE READ\n" + debrief + "\n\n" +
      "---- FULL TRANSCRIPT ----\n" + transcript + "\n";

    MailApp.sendEmail(SEND_TO, subject, body);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
