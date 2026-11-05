// Diagnostic: replicate resolver's attemptOnce step-by-step on CDP 9226.
const pw = require("playwright-core");
const fs = require("fs");

(async () => {
  let browser = null;
  for (let i = 0; i < 10; i++) {
    try { browser = await pw.chromium.connectOverCDP("http://127.0.0.1:9226"); break; } catch { await new Promise(r => setTimeout(r, 2000)); }
  }
  if (!browser) { console.error("resolver browser not up on 9226"); process.exit(1); }
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  const llog = [];
  page.on("response", (r) => {
    let u; try { u = new URL(r.url()); } catch { return; }
    if (/api\/v1\/l\?/.test(r.url())) {
      llog.push({ status: r.status(), at: Date.now() });
    }
  });

  await page.setViewportSize({ width: 1000, height: 650 }).catch(() => {});
  await page.goto("https://primesrc.me/embed/movie?tmdb=27205", { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => console.log("goto err:", e.message));
  await page.waitForTimeout(7000);

  const pre = await page.evaluate(() => ({
    items: document.querySelectorAll(".server-menu-item").length,
    buttons: document.querySelectorAll(".server-menu-button").length,
    iframes: [...document.querySelectorAll("iframe")].map(i => (i.src || "(empty)").slice(0, 80)),
    text: document.body.innerText.replace(/\s+/g, " ").slice(0, 200),
  }));
  console.log("== before click ==", JSON.stringify(pre, null, 1));

  const clicked = await page.evaluate((k) => {
    const items = [...document.querySelectorAll(".server-menu-item")];
    const target = items[k] || items[0];
    if (target) { target.click(); return { ok: true, html: target.outerHTML.slice(0, 120) }; }
    return { ok: false };
  }, 0).catch(e => ({ err: e.message }));
  console.log("== click ==", JSON.stringify(clicked));

  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(5000);
    if (llog.length) console.log("l statuses:", JSON.stringify(llog));
    const post = await page.evaluate(() => ({
      items: document.querySelectorAll(".server-menu-item").length,
      turn: [...document.querySelectorAll("[name=cf-turnstile-response]")].length,
      servo: document.querySelector(".server-menu")?.className || "gone",
      iframes: [...document.querySelectorAll("iframe")].map(i => (i.src || "(empty)").slice(0, 60)),
    })).catch(() => "page gone");
    console.log(i, JSON.stringify(post));
    if (llog.some(l => l.status === 200)) { console.log("GOT L200"); break; }
  }

  await page.screenshot({ path: "diag.png" }).catch(() => {});
  fs.writeFileSync("diag.json", JSON.stringify({ llog }, null, 2));
  await page.close();
  await browser.close();
})().catch(e => { console.error("FATAL", e && e.message); process.exit(1); });
