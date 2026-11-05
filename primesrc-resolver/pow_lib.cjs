// pow_lib.cjs — reimplementation of the n1mwq.org/Filemoon PoW solver
// (extracted verbatim from pow-DEJGtdh2.js, exports: Er as solvePow)
// Er(nonce, difficulty, timeout): find counter c where hash("nonce:c")
// has >= `difficulty` leading zero bits; return String(c).
const rotl = (t, e) => (t << e | t >>> 32 - e) >>> 0;
const imul = (t, e) => Math.imul(t, e) >>> 0;
const mix4 = (t) => { // ye()
  t[0] = t[0] + t[1] >>> 0; t[3] = rotl(t[3] ^ t[0], 16);
  t[2] = t[2] + t[3] >>> 0; t[1] = rotl(t[1] ^ t[2], 12);
  t[0] = t[0] + t[1] >>> 0; t[3] = rotl(t[3] ^ t[0], 8);
  t[2] = t[2] + t[3] >>> 0; t[1] = rotl(t[1] ^ t[2], 7);
};
const BE = 512, LT = BE - 1, DR = 2, LR = 2654435761, HR = 2246822519;
function strBytes(t) { // yr()
  const e = new Uint8Array(t.length);
  for (let r = 0; r < t.length; r++) e[r] = t.charCodeAt(r) & 255;
  return e;
}
function powHash(t) { // gr()
  const e = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762]);
  for (let i = 0; i < t.length; i++) { e[0] = e[0] + t[i] >>> 0; e[0] = rotl(e[0], 7); mix4(e); }
  for (let i = 0; i < 8; i++) mix4(e);
  const r = new Uint32Array(BE);
  for (let i = 0; i < BE; i++) { mix4(e); r[i] = (e[0] ^ e[2]) >>> 0; }
  for (let i = 0; i < DR; i++) for (let s = 0; s < BE; s++) {
    const a = r[s] & LT;
    let c = r[s] + r[a] >>> 0;
    c = rotl(c, 13);
    c = (c ^ imul(r[(s + 1) & LT], LR)) >>> 0;
    r[s] = c; e[0] = (e[0] ^ c) >>> 0; mix4(e);
  }
  const n = new Uint32Array(8), o = BE / 8;
  for (let i = 0; i < 8; i++) {
    mix4(e);
    let s = e[0];
    const a = i * o;
    for (let c = 0; c < o; c++) { const d = r[a + c]; s = s + d >>> 0; s = rotl(s, 5); s = (s ^ imul(d, HR)) >>> 0; }
    n[i] = (s ^ e[2]) >>> 0;
  }
  return n;
}
function leadingZeroBits(t) { // wr()
  let e = 0;
  for (let r = 0; r < t.length; r++) {
    const n = t[r];
    if (n === 0) { e += 32; continue; }
    return e + Math.clz32(n);
  }
  return e;
}
async function solvePow(nonce, difficulty, timeoutMs = 20000) {
  if (difficulty <= 0) return "0";
  const prefix = nonce + ":";
  const start = Date.now();
  let counter = 0;
  for (;;) {
    for (let i = 0; i < 1024; i++) {
      const d = powHash(strBytes(prefix + counter));
      if (leadingZeroBits(d) >= difficulty) return String(counter);
      counter++;
    }
    if (Date.now() - start > timeoutMs) return null;
    await new Promise(r => setTimeout(r, 0));
  }
}
module.exports = { solvePow, powHash, leadingZeroBits, strBytes };
