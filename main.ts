// news-image-20261125 — a newspaper front page summing up Wednesday 25 November 2026.
// Draws a 1024x1024 PNG with a hand-rolled bitmap font and a hand-rolled PNG
// encoder (raw RGB scanlines, zlib deflate, CRC32). Node stdlib only, no network,
// deterministic: every run writes the same bytes to $MAKEFUN_OUTPUT_DIR/entry.png.

const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const zlib = require("node:zlib");

// ---------------------------------------------------------------- CRC32
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(width, height, rgb) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: none
    rgb.copy(raw, y * (1 + width * 3) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows of 5 bits, written as strings of 0/1.
const FONT = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
};

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const PAPER = [248, 244, 232];
const INK = [26, 26, 26];
const NAVY = [30, 58, 95];
const RED = [168, 35, 26];
const GREEN = [32, 112, 58];
const GOLD = [176, 132, 24];
const GREY = [120, 116, 108];
const SKY = [214, 232, 240];

class Canvas {
  constructor() {
    this.pixels = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) {
      this.pixels[i * 3] = PAPER[0];
      this.pixels[i * 3 + 1] = PAPER[1];
      this.pixels[i * 3 + 2] = PAPER[2];
    }
  }
  set(x, y, c) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.pixels[i] = c[0];
    this.pixels[i + 1] = c[1];
    this.pixels[i + 2] = c[2];
  }
  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  frame(x, y, w, h, c, t) {
    this.rect(x, y, w, t, c);
    this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c);
    this.rect(x + w - t, y, t, h, c);
  }
  hline(x, y, w, c, t) {
    this.rect(x, y, w, t || 1, c);
  }
  vline(x, y, h, c, t) {
    this.rect(x, y, t || 1, h, c);
  }
  line(x0, y0, x1, y1, c, t) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    const th = t || 1;
    for (let guard = 0; guard < 4000; guard++) {
      this.rect(x - Math.floor(th / 2), y - Math.floor(th / 2), th, th, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  circle(cx, cy, r, c, fill) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (fill ? d <= r * r : d <= r * r && d >= (r - 1) * (r - 1)) this.set(x, y, c);
      }
    }
  }
  textWidth(s, scale) {
    return s.length * 6 * scale - scale;
  }
  drawText(s, x, y, scale, c) {
    const up = s.toUpperCase();
    let cx = x;
    for (const ch of up) {
      const g = FONT[ch] || FONT["?"];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (g[row][col] === "1") this.rect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
      cx += 6 * scale;
    }
    return cx;
  }
  drawTextCentered(s, cx, y, scale, c) {
    const w = this.textWidth(s, scale);
    this.drawText(s, cx - Math.floor(w / 2), y, scale, c);
  }
  wrap(s, maxW, scale) {
    const words = s.split(" ");
    const lines = [];
    let cur = "";
    for (const word of words) {
      const trial = cur ? cur + " " + word : word;
      if (this.textWidth(trial, scale) <= maxW || !cur) cur = trial;
      else {
        lines.push(cur);
        cur = word;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  paragraph(s, x, y, maxW, scale, c, leading) {
    const lines = this.wrap(s, maxW, scale);
    let yy = y;
    for (const line of lines) {
      this.drawText(line, x, yy, scale, c);
      yy += 7 * scale + (leading || 4);
    }
    return yy;
  }
}

// ---------------------------------------------------------------- scenes
function drawRocket(cv, x, y, w, h) {
  // launch pad
  cv.rect(x, y + h - 10, w, 4, INK);
  cv.rect(x + 20, y + h - 22, 8, 12, INK);
  cv.rect(x + w - 28, y + h - 22, 8, 12, INK);
  // stars
  const stars = [[x + 8, y + 6], [x + 30, y + 14], [x + w - 14, y + 8], [x + w - 34, y + 20], [x + 46, y + 2]];
  for (const s of stars) cv.rect(s[0], s[1], 3, 3, GOLD);
  // rocket body
  const bx = x + Math.floor(w / 2) - 14;
  const by = y + 8;
  cv.rect(bx, by + 12, 28, 52, PAPER);
  cv.frame(bx, by + 12, 28, 52, INK, 2);
  cv.rect(bx + 10, by, 8, 12, RED); // nose tip
  cv.line(bx + 14, by, bx + 2, by + 14, RED, 3);
  cv.line(bx + 14, by, bx + 26, by + 14, RED, 3);
  cv.rect(bx + 2, by + 22, 24, 10, RED); // band
  cv.rect(bx - 8, by + 44, 8, 20, NAVY); // fins
  cv.rect(bx + 28, by + 44, 8, 20, NAVY);
  // flame
  cv.line(bx + 14, by + 64, bx + 6, y + h - 12, [255, 190, 60], 4);
  cv.line(bx + 14, by + 64, bx + 22, y + h - 12, [255, 190, 60], 4);
  cv.line(bx + 14, by + 64, bx + 14, y + h - 10, RED, 3);
  // smoke
  cv.circle(bx - 2, y + h - 16, 7, GREY, true);
  cv.circle(bx + 30, y + h - 14, 8, GREY, true);
}

function drawPhone(cv, x, y, w, h) {
  // smartphone
  const px = x + 14;
  const py = y + 4;
  cv.rect(px, py, 66, h - 14, INK);
  cv.rect(px + 4, py + 4, 58, h - 22, PAPER);
  // red petal logo: ring of small circles
  const cx = px + 33;
  const cy = py + 34;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    cv.circle(Math.round(cx + 12 * Math.cos(a)), Math.round(cy + 12 * Math.sin(a)), 6, RED, true);
  }
  cv.circle(cx, cy, 6, RED, true);
  cv.drawText("HUAWEI", px + 4, py + 66, 2, INK);
  // gavel
  const gx = x + 110;
  cv.line(gx, py + 14, gx + 66, py + 44, [139, 94, 52], 6);
  cv.rect(gx + 56, py + 6, 26, 14, [139, 94, 52]);
  cv.rect(gx + 20, py + 58, 90, 8, INK); // bench
  // verdict stamp
  cv.frame(x + 96, y + h - 30, 128, 24, RED, 2);
  cv.drawText("10 OF 12", x + 106, y + h - 24, 2, RED);
}

function drawShip(cv, x, y, w, h) {
  // sky + sea
  cv.rect(x, y + h - 26, w, 26, SKY);
  for (let i = 0; i < 4; i++) cv.line(x + i * 60, y + h - 14, x + 20 + i * 60, y + h - 14, NAVY, 2);
  // cargo ship hull
  const hx = x + 40;
  const hy = y + h - 52;
  cv.rect(hx, hy, 180, 26, RED);
  cv.rect(hx, hy, 180, 6, INK);
  // containers
  cv.rect(hx + 14, hy - 22, 34, 22, NAVY);
  cv.rect(hx + 52, hy - 22, 34, 22, GOLD);
  cv.rect(hx + 90, hy - 22, 34, 22, GREEN);
  cv.rect(hx + 128, hy - 14, 34, 14, NAVY);
  // bridge
  cv.rect(hx + 164, hy - 34, 16, 34, PAPER);
  cv.frame(hx + 164, hy - 34, 16, 34, INK, 2);
  // drone above, with strike flash
  const dx = x + w - 70;
  const dy = y + 8;
  cv.rect(dx, dy, 26, 6, INK);
  cv.line(dx - 10, dy - 4, dx + 36, dy - 4, INK, 2);
  cv.line(dx - 10, dy + 10, dx + 36, dy + 10, INK, 2);
  cv.line(dx + 13, dy + 6, dx + 13, dy + 22, GOLD, 3);
  cv.circle(dx + 13, dy + 28, 6, [255, 190, 60], true);
  cv.circle(dx + 13, dy + 28, 10, RED, false);
}

function drawTower(cv, x, y, w, h) {
  // Riyadh skyline base
  cv.rect(x, y + h - 8, w, 8, INK);
  cv.rect(x + 8, y + h - 40, 30, 32, GREY);
  cv.rect(x + w - 44, y + h - 52, 36, 44, GREY);
  // tallest tower (Kingdom Centre style): tall shaft with arched opening
  const tx = x + Math.floor(w / 2) - 22;
  cv.rect(tx, y + 6, 44, h - 14, NAVY);
  cv.frame(tx, y + 6, 44, h - 14, PAPER, 2);
  // arch opening near the top
  cv.rect(tx + 12, y + 10, 20, 18, SKY);
  cv.circle(tx + 22, y + 28, 10, SKY, true);
  // lit windows
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      cv.rect(tx + 8 + c * 20, y + 44 + r * 14, 10, 6, [255, 190, 60]);
    }
  }
  // strike burst at the top
  const bx = tx + 22;
  const by = y + 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    cv.line(bx, by, Math.round(bx + 22 * Math.cos(a)), Math.round(by + 22 * Math.sin(a)), [255, 190, 60], 3);
  }
  cv.circle(bx, by, 7, RED, true);
  // smoke
  cv.circle(tx - 14, y + 12, 8, GREY, true);
  cv.circle(tx + 58, y + 18, 9, GREY, true);
}

function drawCity(cv, x, y, w, h) {
  // Gaza City skyline
  cv.rect(x, y + h - 8, w, 8, INK);
  const hs = [52, 70, 44, 78, 58, 66, 40];
  let bx = x + 6;
  for (let i = 0; i < hs.length; i++) {
    cv.rect(bx, y + h - 8 - hs[i], 30, hs[i], i % 2 ? GREY : NAVY);
    for (let r = 0; r < 3; r++) cv.rect(bx + 6, y + h - 20 - r * 14, 8, 6, [255, 190, 60]);
    bx += 38;
  }
  // smoke columns rising from two buildings
  cv.circle(x + 60, y + 6, 10, GREY, true);
  cv.circle(x + 74, y - 2, 12, GREY, true);
  cv.circle(x + 210, y + 10, 9, GREY, true);
  cv.circle(x + 224, y + 2, 11, GREY, true);
  // strike flash over the skyline
  cv.line(x + 150, y + 16, x + 138, y + 34, [255, 190, 60], 3);
  cv.line(x + 150, y + 16, x + 162, y + 34, [255, 190, 60], 3);
  cv.line(x + 150, y + 16, x + 150, y + 38, RED, 3);
}

function drawCricket(cv, x, y, w, h) {
  // scoreboard
  cv.rect(x, y + 8, 190, 52, NAVY);
  cv.drawText("ENG 185-2", x + 12, y + 18, 3, PAPER);
  cv.drawText("WIN BY 8 WKTS", x + 12, y + 42, 2, GOLD);
  // batsman
  const fx = x + 220;
  cv.circle(fx + 40, y + 26, 14, INK, true); // head
  cv.line(fx + 40, y + 40, fx + 34, y + 80, INK, 4); // torso
  cv.line(fx + 34, y + 80, fx + 16, y + h - 6, INK, 4); // back leg
  cv.line(fx + 34, y + 80, fx + 56, y + h - 6, INK, 4); // front leg
  cv.line(fx + 38, y + 50, fx + 64, y + 36, INK, 4); // arms to bat
  cv.line(fx + 64, y + 36, fx + 92, y + 10, GOLD, 6); // bat
  cv.circle(fx + 104, y + 8, 7, RED, true); // ball
  cv.line(fx + 92, y + 10, fx + 104, y + 8, INK, 2);
  cv.rect(x, y + h - 4, w, 4, GREEN); // pitch
}

// ---------------------------------------------------------------- page
function storyPanel(cv, x, y, w, h, num, headline, body, scene) {
  cv.frame(x, y, w, h, INK, 2);
  cv.rect(x + 2, y + 2, 30, 30, RED);
  cv.drawText(String(num), x + 11, y + 9, 2, PAPER);
  const tx = x + 44;
  const tw = w - 56;
  let yy = y + 12;
  const headLines = cv.wrap(headline, tw, 2);
  for (const line of headLines) {
    cv.drawText(line, tx, yy, 2, INK);
    yy += 18;
  }
  yy += 4;
  yy = cv.paragraph(body, tx, yy, tw, 2, INK, 4);
  if (scene) scene(cv, x + 12, yy + 4, w - 24, y + h - (yy + 4) - 10);
}

function main() {
  const cv = new Canvas();
  const M = 24; // margin
  const inner = W - 2 * M;

  // masthead
  cv.drawTextCentered("THE WEDNESDAY GLOBE", W / 2, 26, 6, NAVY);
  cv.hline(M, 84, inner, INK, 3);
  cv.hline(M, 90, inner, INK, 1);
  cv.drawTextCentered("WEDNESDAY 25 NOVEMBER 2026", W / 2, 104, 2, INK);
  cv.drawText("SIX STORIES THAT SHAPED THE DAY", M, 128, 2, RED);
  cv.drawText("PRICE: ONE READ", W - M - cv.textWidth("PRICE: ONE READ", 2), 128, 2, GREY);

  // lead story, full width
  const leadY = 152;
  const leadH = 178;
  cv.frame(M, leadY, inner, leadH, INK, 2);
  cv.rect(M + 2, leadY + 2, 30, 30, RED);
  cv.drawText("1", M + 13, leadY + 9, 2, PAPER);
  const lx = M + 44;
  const lw = 600;
  let ly = leadY + 12;
  for (const line of cv.wrap("SHENZHOU-24 BLASTS OFF", lw, 3)) {
    cv.drawText(line, lx, ly, 3, INK);
    ly += 25;
  }
  ly += 6;
  ly = cv.paragraph(
    "China launches three astronauts to Tiangong. Zeeshan Ali is the first Pakistani in orbit and the first foreign astronaut aboard the station.",
    lx,
    ly,
    lw,
    2,
    INK,
    4
  );
  drawRocket(cv, M + 668, leadY + 46, 292, leadH - 84);
  cv.drawText("JIUQUAN - TIANGONG", M + 668, leadY + leadH - 22, 2, NAVY);

  // grid: stories 2 and 3, then 4 and 5
  const gw = Math.floor((inner - 16) / 2);
  const gy1 = 342;
  const gy2 = 586;
  const gh = 232;
  storyPanel(
    cv, M, gy1, gw, gh, 2,
    "HUAWEI GUILTY IN US TRIAL",
    "Brooklyn jury convicts on 10 of 12 counts: trade-secret theft conspiracy and bank fraud. Acquitted of racketeering.",
    drawPhone
  );
  storyPanel(
    cv, M + gw + 16, gy1, gw, gh, 3,
    "ZELENSKIY CONFIRMS GULF STRIKE",
    "Ukraine hit a Russian cargo ship in the Gulf of Finland, Kyiv says. Ally Norway urges caution on such operations.",
    drawShip
  );
  storyPanel(
    cv, M, gy2, gw, gh, 4,
    "HOUTHIS HIT RIYADH TOWER",
    "Strike on Riyadh's tallest tower wounds 11, Saudi civil defence says, as the Yemen war spills into the Saudi capital.",
    drawTower
  );
  storyPanel(
    cv, M + gw + 16, gy2, gw, gh, 5,
    "GAZA STRIKE KILLS HAMAS SECURITY CHIEF",
    "Israeli airstrike in Gaza City kills Naeem Abu Nahel, head of Hamas internal security. Seven Palestinians killed that day.",
    drawCity
  );

  // story 6, full width
  const s6y = 830;
  const s6h = 170;
  cv.frame(M, s6y, inner, s6h, INK, 2);
  cv.rect(M + 2, s6y + 2, 30, 30, RED);
  cv.drawText("6", M + 13, s6y + 9, 2, PAPER);
  const sx = M + 44;
  let sy = s6y + 12;
  for (const line of cv.wrap("ENGLAND LEVEL T20 SERIES", 560, 3)) {
    cv.drawText(line, sx, sy, 3, INK);
    sy += 25;
  }
  sy += 6;
  cv.paragraph(
    "England beat Australia by eight wickets in the second T20I, chasing 185 to level the five-match series.",
    sx,
    sy,
    560,
    2,
    INK,
    4
  );
  drawCricket(cv, M + 640, s6y + 16, 320, s6h - 28);
  cv.drawText("SECOND T20I", M + 44, s6y + s6h - 22, 2, NAVY);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const png = encodePNG(W, H, cv.pixels);
  writeFileSync(join(outDir, "entry.png"), png);
  process.stdout.write("wrote entry.png " + png.length + " bytes, " + W + "x" + H + "\n");
}

main();
