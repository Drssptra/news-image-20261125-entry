// news-image-20261125 — "THE WEDNESDAY GLOBE" front page, Wednesday 25 Nov 2026.
// A fresh, from-scratch drawing of the day's six biggest stories as a newspaper
// front page. Node 22, standard library only, no network, fully deterministic:
// the same bytes are written on every run to $MAKEFUN_OUTPUT_DIR/entry.png.

const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const zlib = require("node:zlib");

// ------------------------------------------------------------ PNG writer
// CRC-32 (IEEE) table, built once from the polynomial 0xEDB88320.
const CRC = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c >>> 0;
}

function crcOf(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.from(type, "ascii");
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  head.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crcOf(Buffer.concat([head, data])), 8 + data.length);
  return out;
}

// Encode an RGB buffer (row-major, 3 bytes per pixel) as a PNG.
function toPng(width, height, rgb) {
  const stride = 1 + width * 3;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // no filter on any scanline
    rgb.copy(raw, y * stride + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit samples
  ihdr[9] = 2; // truecolour RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ 5x7 bitmap font
// One glyph = 7 rows; each row is a 5-bit mask, bit 4 = leftmost column.
// Example: "A" rows 01110 10001 10001 11111 10001 10001 10001.
const GLYPHS = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  "'": [0b00100, 0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000],
  "(": [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ")": [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  ",": [0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b00100, 0b01000],
  "-": [0b00000, 0b00000, 0b00000, 0b01110, 0b00000, 0b00000, 0b00000],
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  "/": [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
  ":": [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b01100, 0b00000],
  "?": [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
};

// ------------------------------------------------------------ canvas
const W = 1024;
const H = 1024;

// Newsprint palette.
const PAPER = [248, 244, 232];
const INK = [26, 26, 26];
const NAVY = [30, 58, 95];
const CRIMSON = [168, 35, 26];
const FOREST = [32, 112, 58];
const OCHRE = [176, 132, 24];
const STONE = [120, 116, 108];
const PALE_BLUE = [214, 232, 240];
const FLAME = [255, 190, 60];
const WOOD = [139, 94, 52];

class Page {
  constructor() {
    this.buf = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = PAPER[0];
      this.buf[i * 3 + 1] = PAPER[1];
      this.buf[i * 3 + 2] = PAPER[2];
    }
  }
  px(x, y, c) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  fill(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) this.px(i, j, c);
    }
  }
  border(x, y, w, h, c, t) {
    this.fill(x, y, w, t, c);
    this.fill(x, y + h - t, w, t, c);
    this.fill(x, y, t, h, c);
    this.fill(x + w - t, y, t, h, c);
  }
  ruleX(x, y, w, c, t) {
    this.fill(x, y, w, t || 1, c);
  }
  ruleY(x, y, h, c, t) {
    this.fill(x, y, t || 1, h, c);
  }
  // Bresenham segment, drawn with square brush of side t.
  segment(x0, y0, x1, y1, c, t) {
    const th = t || 1;
    const half = Math.floor(th / 2);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (let guard = 0; guard < 5000; guard++) {
      this.fill(x - half, y - half, th, th, c);
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
  disc(cx, cy, r, c, solid) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (solid ? d <= r * r : d <= r * r && d >= (r - 1) * (r - 1)) this.px(x, y, c);
      }
    }
  }
  // -- text -------------------------------------------------------------
  measure(s, scale) {
    return s.length * 6 * scale - scale;
  }
  glyph(ch, x, y, scale, c) {
    const rows = GLYPHS[ch] || GLYPHS["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (rows[r] & (1 << (4 - col))) {
          this.fill(x + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
  }
  text(s, x, y, scale, c) {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      this.glyph(ch, cx, y, scale, c);
      cx += 6 * scale;
    }
    return cx;
  }
  centred(s, cx, y, scale, c) {
    this.text(s, cx - Math.floor(this.measure(s, scale) / 2), y, scale, c);
  }
  // Greedy word wrap: returns lines that fit within maxW at the given scale.
  wrapLines(s, maxW, scale) {
    const lines = [];
    let cur = "";
    for (const word of s.split(" ")) {
      const trial = cur ? cur + " " + word : word;
      if (this.measure(trial, scale) <= maxW || cur === "") {
        cur = trial;
      } else {
        lines.push(cur);
        cur = word;
      }
    }
    if (cur !== "") lines.push(cur);
    return lines;
  }
  // Draw a wrapped paragraph; returns the y just below the last line.
  // Lines that would run past `bottom` (when given) are dropped, so body
  // text can never spill out of its panel or over the scene below it.
  flowText(s, x, y, maxW, scale, c, gap, bottom) {
    const lines = this.wrapLines(s, maxW, scale);
    const lineH = 7 * scale + (gap === undefined ? 4 : gap);
    let yy = y;
    for (const line of lines) {
      if (bottom !== undefined && yy + 7 * scale > bottom) break;
      this.text(line, x, yy, scale, c);
      yy += lineH;
    }
    return yy;
  }
}

// ------------------------------------------------------------ scene art
// Each scene is a small flat illustration drawn inside a box (x, y, w, h).

// Story 1: a rocket lifting off its pad under a starry sky.
function sceneRocket(pg, x, y, w, h) {
  const padY = y + h - 8;
  pg.fill(x, padY, w, 4, INK);
  pg.fill(x + 18, padY - 14, 10, 14, INK);
  pg.fill(x + w - 28, padY - 14, 10, 14, INK);
  const stars = [
    [x + 10, y + 8],
    [x + 34, y + 18],
    [x + w - 16, y + 10],
    [x + w - 40, y + 26],
    [x + 52, y + 4],
  ];
  for (const s of stars) pg.fill(s[0], s[1], 3, 3, OCHRE);
  const bx = x + Math.floor(w / 2) - 15;
  const by = y + 10;
  pg.fill(bx, by + 14, 30, 52, PAPER);
  pg.border(bx, by + 14, 30, 52, INK, 2);
  pg.segment(bx + 15, by, bx + 1, by + 16, CRIMSON, 3);
  pg.segment(bx + 15, by, bx + 29, by + 16, CRIMSON, 3);
  pg.fill(bx + 11, by, 8, 12, CRIMSON);
  pg.fill(bx + 2, by + 24, 26, 10, CRIMSON);
  pg.fill(bx - 9, by + 46, 9, 20, NAVY);
  pg.fill(bx + 30, by + 46, 9, 20, NAVY);
  pg.segment(bx + 15, by + 66, bx + 6, padY - 2, FLAME, 4);
  pg.segment(bx + 15, by + 66, bx + 24, padY - 2, FLAME, 4);
  pg.segment(bx + 15, by + 66, bx + 15, padY, CRIMSON, 3);
  pg.disc(bx - 3, padY - 6, 7, STONE, true);
  pg.disc(bx + 33, padY - 4, 8, STONE, true);
}

// Story 2: a phone with a red petal logo, a gavel, and the verdict stamp.
function scenePhone(pg, x, y, w, h) {
  const px = x + 16;
  const py = y + 6;
  pg.fill(px, py, 76, h - 16, INK);
  pg.fill(px + 4, py + 4, 68, h - 24, PAPER);
  const cx = px + 34;
  const cy = py + 36;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pg.disc(Math.round(cx + 13 * Math.cos(a)), Math.round(cy + 13 * Math.sin(a)), 6, CRIMSON, true);
  }
  pg.disc(cx, cy, 6, CRIMSON, true);
  pg.text("HUAWEI", px + 4, py + 70, 2, INK);
  const gx = x + 112;
  pg.segment(gx, py + 16, gx + 68, py + 46, WOOD, 6);
  pg.fill(gx + 58, py + 8, 28, 14, WOOD);
  pg.fill(gx + 22, py + 62, 92, 8, INK);
  pg.border(x + 98, y + h - 32, 132, 26, CRIMSON, 2);
  pg.text("10 OF 12", x + 108, y + h - 26, 2, CRIMSON);
}

// Story 3: a cargo ship in the Gulf, a drone above it, strike flash.
function sceneShip(pg, x, y, w, h) {
  const seaY = y + h - 28;
  pg.fill(x, seaY, w, 28, PALE_BLUE);
  for (let i = 0; i < 4; i++) {
    pg.segment(x + i * 62, seaY + 14, x + 22 + i * 62, seaY + 14, NAVY, 2);
  }
  const hx = x + 42;
  const hy = seaY - 26;
  pg.fill(hx, hy, 184, 26, CRIMSON);
  pg.fill(hx, hy, 184, 6, INK);
  pg.fill(hx + 14, hy - 22, 36, 22, NAVY);
  pg.fill(hx + 54, hy - 22, 36, 22, OCHRE);
  pg.fill(hx + 94, hy - 22, 36, 22, FOREST);
  pg.fill(hx + 134, hy - 14, 36, 14, NAVY);
  pg.fill(hx + 168, hy - 36, 16, 36, PAPER);
  pg.border(hx + 168, hy - 36, 16, 36, INK, 2);
  const dx = x + w - 72;
  const dy = y + 10;
  pg.fill(dx, dy, 28, 6, INK);
  pg.segment(dx - 10, dy - 4, dx + 38, dy - 4, INK, 2);
  pg.segment(dx - 10, dy + 12, dx + 38, dy + 12, INK, 2);
  pg.segment(dx + 14, dy + 6, dx + 14, dy + 24, OCHRE, 3);
  pg.disc(dx + 14, dy + 30, 6, FLAME, true);
  pg.disc(dx + 14, dy + 30, 10, CRIMSON, false);
}

// Story 4: Riyadh's tallest tower (arched top) with a strike burst.
function sceneTower(pg, x, y, w, h) {
  const baseY = y + h - 8;
  pg.fill(x, baseY, w, 8, INK);
  pg.fill(x + 10, baseY - 34, 32, 34, STONE);
  pg.fill(x + w - 46, baseY - 46, 38, 46, STONE);
  const tx = x + Math.floor(w / 2) - 23;
  pg.fill(tx, y + 8, 46, h - 16, NAVY);
  pg.border(tx, y + 8, 46, h - 16, PAPER, 2);
  pg.fill(tx + 13, y + 12, 20, 18, PALE_BLUE);
  pg.disc(tx + 23, y + 30, 10, PALE_BLUE, true);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      pg.fill(tx + 9 + c * 21, y + 48 + r * 14, 10, 6, FLAME);
    }
  }
  const bx = tx + 23;
  const by = y + 4;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    pg.segment(bx, by, Math.round(bx + 24 * Math.cos(a)), Math.round(by + 24 * Math.sin(a)), FLAME, 3);
  }
  pg.disc(bx, by, 7, CRIMSON, true);
  pg.disc(tx - 15, y + 14, 8, STONE, true);
  pg.disc(tx + 61, y + 20, 9, STONE, true);
}

// Story 5: Gaza City skyline with smoke columns and a strike flash.
function sceneCity(pg, x, y, w, h) {
  const baseY = y + h - 8;
  pg.fill(x, baseY, w, 8, INK);
  const heights = [54, 72, 46, 80, 60, 68, 42];
  let bx = x + 8;
  for (let i = 0; i < heights.length; i++) {
    pg.fill(bx, baseY - heights[i], 30, heights[i], i % 2 ? STONE : NAVY);
    for (let r = 0; r < 3; r++) pg.fill(bx + 6, baseY - 14 - r * 14, 8, 6, FLAME);
    bx += 38;
  }
  pg.disc(x + 62, y + 8, 10, STONE, true);
  pg.disc(x + 76, y, 12, STONE, true);
  pg.disc(x + 212, y + 12, 9, STONE, true);
  pg.disc(x + 226, y + 4, 11, STONE, true);
  pg.segment(x + 152, y + 18, x + 140, y + 36, FLAME, 3);
  pg.segment(x + 152, y + 18, x + 164, y + 36, FLAME, 3);
  pg.segment(x + 152, y + 18, x + 152, y + 40, CRIMSON, 3);
}

// Story 6: scoreboard, batsman, bat and ball.
function sceneCricket(pg, x, y, w, h) {
  pg.fill(x, y + 10, 196, 54, NAVY);
  pg.text("ENG 185-2", x + 12, y + 20, 3, PAPER);
  pg.text("WIN BY 8 WKTS", x + 12, y + 44, 2, OCHRE);
  const fx = x + 224;
  pg.disc(fx + 42, y + 28, 14, INK, true);
  pg.segment(fx + 42, y + 42, fx + 36, y + 82, INK, 4);
  pg.segment(fx + 36, y + 82, fx + 18, y + h - 8, INK, 4);
  pg.segment(fx + 36, y + 82, fx + 58, y + h - 8, INK, 4);
  pg.segment(fx + 40, y + 52, fx + 66, y + 38, INK, 4);
  pg.segment(fx + 66, y + 38, fx + 94, y + 12, OCHRE, 6);
  pg.disc(fx + 106, y + 10, 7, CRIMSON, true);
  pg.segment(fx + 94, y + 12, fx + 106, y + 10, INK, 2);
  pg.fill(x, y + h - 4, w, 4, FOREST);
}

// ------------------------------------------------------------ page layout
const MARGIN = 24;
const INNER = W - 2 * MARGIN;

// A numbered story panel: red number badge, wrapped headline, body text,
// and a scene illustration filling the space that is left.
function panel(pg, x, y, w, h, num, headline, body, scene) {
  pg.border(x, y, w, h, INK, 2);
  pg.fill(x + 2, y + 2, 30, 30, CRIMSON);
  const label = String(num);
  pg.text(label, x + 17 - Math.floor(pg.measure(label, 2) / 2), y + 10, 2, PAPER);
  const tx = x + 44;
  const tw = w - 56;
  let yy = y + 12;
  for (const line of pg.wrapLines(headline, tw, 2)) {
    pg.text(line, tx, yy, 2, INK);
    yy += 18;
  }
  yy += 4;
  yy = pg.flowText(body, tx, yy, tw, 2, INK, 4, y + h - 12);
  if (scene) {
    const sy = yy + 4;
    const sh = y + h - sy - 10;
    if (sh > 20) scene(pg, x + 12, sy, w - 24, sh);
  }
}

function buildPage() {
  const pg = new Page();

  // Masthead.
  pg.centred("THE WEDNESDAY GLOBE", W / 2, 26, 6, NAVY);
  pg.ruleX(MARGIN, 84, INNER, INK, 3);
  pg.ruleX(MARGIN, 90, INNER, INK, 1);
  pg.centred("WEDNESDAY 25 NOVEMBER 2026", W / 2, 104, 2, INK);
  pg.text("SIX STORIES THAT SHAPED THE DAY", MARGIN, 128, 2, CRIMSON);
  pg.text("PRICE: ONE READ", W - MARGIN - pg.measure("PRICE: ONE READ", 2), 128, 2, STONE);

  // Story 1 (lead, full width): Shenzhou-24.
  const leadY = 152;
  const leadH = 178;
  pg.border(MARGIN, leadY, INNER, leadH, INK, 2);
  pg.fill(MARGIN + 2, leadY + 2, 30, 30, CRIMSON);
  pg.text("1", MARGIN + 13, leadY + 10, 2, PAPER);
  const lx = MARGIN + 44;
  let ly = leadY + 12;
  for (const line of pg.wrapLines("SHENZHOU-24 BLASTS OFF", 600, 3)) {
    pg.text(line, lx, ly, 3, INK);
    ly += 25;
  }
  ly += 6;
  pg.flowText(
    "China launches three astronauts to Tiangong. Zeeshan Ali is the first Pakistani in orbit and the first foreign astronaut aboard the station.",
    lx,
    ly,
    600,
    2,
    INK,
    4
  );
  sceneRocket(pg, MARGIN + 668, leadY + 46, 292, leadH - 84);
  pg.text("JIUQUAN - TIANGONG", MARGIN + 668, leadY + leadH - 22, 2, NAVY);

  // Stories 2-5 in a 2x2 grid.
  const gw = Math.floor((INNER - 16) / 2);
  const gh = 232;
  panel(
    pg, MARGIN, 342, gw, gh, 2,
    "HUAWEI GUILTY IN US TRIAL",
    "Brooklyn jury convicts on 10 of 12 counts: trade-secret theft conspiracy and bank fraud. Acquitted of racketeering.",
    scenePhone
  );
  panel(
    pg, MARGIN + gw + 16, 342, gw, gh, 3,
    "ZELENSKIY CONFIRMS GULF STRIKE",
    "Ukraine hit a Russian cargo ship in the Gulf of Finland, Kyiv says. Ally Norway urges caution on such operations.",
    sceneShip
  );
  panel(
    pg, MARGIN, 586, gw, gh, 4,
    "HOUTHIS HIT RIYADH TOWER",
    "Strike on Riyadh's tallest tower wounds 11, Saudi civil defence says, as the Yemen war spills into the Saudi capital.",
    sceneTower
  );
  panel(
    pg, MARGIN + gw + 16, 586, gw, gh, 5,
    "GAZA STRIKE KILLS HAMAS SECURITY CHIEF",
    "Israeli airstrike in Gaza City kills Naeem Abu Nahel, head of Hamas internal security. Seven Palestinians killed that day.",
    sceneCity
  );

  // Story 6 (full width): England level the T20 series.
  const s6y = 830;
  const s6h = 170;
  pg.border(MARGIN, s6y, INNER, s6h, INK, 2);
  pg.fill(MARGIN + 2, s6y + 2, 30, 30, CRIMSON);
  pg.text("6", MARGIN + 13, s6y + 10, 2, PAPER);
  const sx = MARGIN + 44;
  let sy = s6y + 12;
  for (const line of pg.wrapLines("ENGLAND LEVEL T20 SERIES", 560, 3)) {
    pg.text(line, sx, sy, 3, INK);
    sy += 25;
  }
  sy += 6;
  pg.flowText(
    "England beat Australia by eight wickets in the second T20I, chasing 185 to level the five-match series.",
    sx,
    sy,
    560,
    2,
    INK,
    4
  );
  sceneCricket(pg, MARGIN + 640, s6y + 16, 320, s6h - 28);
  pg.text("SECOND T20I", MARGIN + 44, s6y + s6h - 22, 2, NAVY);

  return pg;
}

function main() {
  const pg = buildPage();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const png = toPng(W, H, pg.buf);
  writeFileSync(join(outDir, "entry.png"), png);
  process.stdout.write("wrote entry.png " + png.length + " bytes, " + W + "x" + H + "\n");
}

main();
