const test = require('node:test');
const assert = require('node:assert/strict');
const { detect, createTracker } = require('../extension/bars.js');

const ZERO = { top: 0, bottom: 0, left: 0, right: 0 };
function frame({ width = 320, height = 180, top = 0, bottom = 0, left = 0, right = 0,
  colors = {}, flat = null, noise = 0 } = {}) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const side = y < top ? 'top' : y >= height - bottom ? 'bottom' : x < left ? 'left' : x >= width - right ? 'right' : null;
    const color = side ? colors[side] || [0, 0, 0] : flat || [60 + (x * 17 + y * 3) % 180, 45 + (x * 3 + y * 11) % 180, 65 + (x * 7 + y * 5) % 170];
    const p = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) data[p + c] = color[c] + (side && noise ? (x * 7 + y * 13 + c) % (noise * 2 + 1) - noise : 0);
    data[p + 3] = 255;
  }
  return { data, width, height };
}
function pixel(image, x, y, rgb) {
  image.data.set([...rgb, 255], (y * image.width + x) * 4);
}

test('detects paired encoded black letterboxes and pillarboxes independently', () => {
  assert.deepEqual(detect(frame({ top: 18, bottom: 18 })), { ...ZERO, top: 0.1, bottom: 0.1 });
  assert.deepEqual(detect(frame({ left: 40, right: 40 })), { ...ZERO, left: 0.125, right: 0.125 });
  assert.deepEqual(detect(frame({ top: 18, bottom: 18, left: 40, right: 40 })), { top: 0.1, bottom: 0.1, left: 0.125, right: 0.125 });
});

test('colored bars require opt-in; opposing bars may have different colors', () => {
  const input = frame({ left: 40, right: 40, colors: { left: [40, 95, 170], right: [180, 90, 50] } });
  assert.deepEqual(detect(input), ZERO);
  assert.deepEqual(detect(input, { colored: true }), { ...ZERO, left: 0.125, right: 0.125 });
  const allSides = frame({ top: 18, bottom: 18, left: 40, right: 40, colors: {
    top: [180, 30, 90], bottom: [40, 180, 100], left: [40, 95, 170], right: [180, 90, 50]
  } });
  assert.deepEqual(detect(allSides, { colored: true }), { top: 0.1, bottom: 0.1, left: 0.125, right: 0.125 });
  assert.deepEqual(detect(allSides, { colored: true, vertical: false }), { ...ZERO, top: 0.1, bottom: 0.1 });
  assert.deepEqual(detect(allSides, { colored: true, horizontal: false }), { ...ZERO, left: 0.125, right: 0.125 });
});

test('respects independent horizontal and vertical switches', () => {
  assert.deepEqual(detect(frame({ top: 18, bottom: 18 }), { horizontal: false }), ZERO);
  assert.deepEqual(detect(frame({ left: 40, right: 40 }), { vertical: false }), ZERO);
  assert.deepEqual(detect(frame(), { vertical: false, horizontal: false }), ZERO);
});

test('does not crop pure black, pure color, nearly flat noise, or a flat title card', () => {
  assert.equal(detect(frame({ flat: [0, 0, 0] })), null);
  assert.equal(detect(frame({ flat: [180, 50, 100] }), { colored: true }), null);
  assert.equal(detect(frame({ top: 18, bottom: 18, flat: [255, 255, 255] })), null);
  const dark = frame({ flat: [8, 8, 8] });
  for (let i = 0; i < dark.data.length; i += 4) dark.data[i] += (i % 7);
  assert.equal(detect(dark), null);
});

test('normal textured edges confidently report no bars; gradients are not cropped', () => {
  assert.deepEqual(detect(frame()), ZERO);
  const gradient = frame();
  for (let y = 0; y < gradient.height; y++) for (let x = 0; x < gradient.width; x++) {
    const value = Math.round(255 * Math.min(x, gradient.width - 1 - x) / (gradient.width / 2));
    pixel(gradient, x, y, [value, value, value]);
  }
  assert.equal(detect(gradient), null);
  assert.equal(detect(gradient, { colored: true }), null);
});

test('allows small compression noise and isolated sparks, rejects subtitle content in bars', () => {
  const noisy = frame({ top: 18, bottom: 18, noise: 4, colors: { top: [8, 8, 8], bottom: [8, 8, 8] } });
  for (let y = 0; y < 18; y++) pixel(noisy, 120, y, [80, 80, 80]);
  assert.deepEqual(detect(noisy), { ...ZERO, top: 0.1, bottom: 0.1 });
  const subtitles = frame({ top: 18, bottom: 18 });
  for (let y = 166; y < 174; y++) for (let x = 90; x < 230; x++) {
    if (x % 8 < 4) pixel(subtitles, x, y, [240, 240, 240]);
  }
  assert.equal(detect(subtitles), null);
});

test('rejects one-sided scenery, overlarge bars, one-pixel borders, and low-contrast uncertain edges', () => {
  assert.equal(detect(frame({ left: 40 })), null);
  assert.equal(detect(frame({ left: 90, right: 90 })), null);
  assert.deepEqual(detect(frame({ left: 1, right: 1 })), ZERO);
  const near = frame({ left: 40, right: 40 });
  for (let y = 0; y < 180; y++) for (let d = 0; d < 3; d++) {
    pixel(near, 40 + d, y, [20, 20, 20]);
    pixel(near, 279 - d, y, [20, 20, 20]);
  }
  assert.equal(detect(near), null);
  assert.deepEqual(detect(frame({ left: 80, right: 80 })), { ...ZERO, left: 0.25, right: 0.25 });
  assert.deepEqual(detect(frame({ left: 2, right: 2 })), { ...ZERO, left: 2 / 320, right: 2 / 320 });
});

test('invalid frame input is inconclusive rather than throwing', () => {
  for (const input of [null, {}, { width: 320, height: 180, data: [] }, frame({ width: 8 })]) assert.equal(detect(input), null);
});

test('tracker requires three consecutive confident frames and ignores transient scene changes', () => {
  const tracker = createTracker({ stableFrames: 1 });
  const crop = { ...ZERO, left: 0.125, right: 0.125 };
  assert.deepEqual(tracker.update(crop), ZERO);
  assert.deepEqual(tracker.update(crop), ZERO);
  assert.deepEqual(tracker.update(crop), crop);
  assert.deepEqual(tracker.update(null), crop);
  assert.deepEqual(tracker.update(ZERO), crop);
  assert.deepEqual(tracker.update(ZERO), crop);
  assert.deepEqual(tracker.update(null), crop);
  assert.deepEqual(tracker.update(ZERO), crop);
  assert.deepEqual(tracker.update(ZERO), crop);
  assert.deepEqual(tracker.update(ZERO), ZERO);
});

test('tracker accepts small jitter conservatively, resets on source changes, and rejects invalid margins', () => {
  const tracker = createTracker();
  tracker.update({ ...ZERO, top: 0.10, bottom: 0.10 });
  tracker.update({ ...ZERO, top: 0.105, bottom: 0.10 });
  assert.deepEqual(tracker.update({ ...ZERO, top: 0.10, bottom: 0.10 }), { ...ZERO, top: 0.10, bottom: 0.10 });
  assert.deepEqual(tracker.update({ ...ZERO, top: 0.106, bottom: 0.10 }), { ...ZERO, top: 0.10, bottom: 0.10 });
  assert.deepEqual(tracker.reset(), ZERO);
  assert.deepEqual(tracker.update({ ...ZERO, top: 0.7 }), ZERO);
  assert.deepEqual(tracker.update({ ...ZERO, left: NaN }), ZERO);
  const leaked = tracker.current;
  leaked.top = 0.2;
  assert.deepEqual(tracker.current, ZERO);
});
