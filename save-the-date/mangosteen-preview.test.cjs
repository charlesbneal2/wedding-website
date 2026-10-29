const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = readFileSync(join(__dirname, 'mangosteen.js'), 'utf8');

function preview(width = 1440, reduced = false, observed = false, controls = true) {
  const images = [];
  const frames = new Map();
  const stage = {
    clientWidth: width, clientHeight: 1218,
    querySelector(selector) {
      return selector === '.mangosteen-field' ? { append(image) { images.push(image); } } : controls ? toggle : null;
    },
  };
  const toggle = { addEventListener(event, callback) { this[event] = callback; }, setAttribute() {} };
  const motion = { matches: reduced, addEventListener(event, callback) { this[event] = callback; } };
  const document = {
    hidden: false,
    createElement() { return { style: {} }; },
    addEventListener(event, callback) { this[event] = callback; },
    querySelector(selector) {
      return {
        '[data-mangosteens]': stage,
      }[selector];
    },
  };
  let resize;
  let intersection;
  let nextId = 0;
  let time = 0;
  class ResizeObserver {
    constructor(callback) { resize = callback; }
    observe() {}
  }
  class IntersectionObserver {
    constructor(callback) { intersection = callback; }
    observe() {}
  }
  const math = Object.create(Math);
  math.random = () => .5;
  vm.runInNewContext(source, {
    document,
    Math: math,
    ResizeObserver,
    IntersectionObserver,
    window: {
      ResizeObserver,
      ...(observed ? { IntersectionObserver } : {}),
      innerHeight: width > 600 ? 1000 : 844,
      matchMedia() { return motion; },
      requestAnimationFrame(callback) {
        frames.set(++nextId, callback);
        return nextId;
      },
      cancelAnimationFrame(id) { frames.delete(id); },
    },
  });
  return {
    images, frames, stage, toggle, motion, document,
    visible: () => images.filter(image => !image.hidden),
    resize: () => resize(),
    enter: visible => intersection([{ isIntersecting: visible }]),
    advance(seconds, inspect = () => {}) {
      for (let step = 0; step < seconds * 50; step++) {
        time += 20;
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach(callback => callback(time));
        inspect();
      }
    },
  };
}

const yPosition = image => Number(image.style.transform.split(',')[1].trim().replace('px', ''));

for (const width of [1440, 390]) {
  test(`scattered fruit falls once and disappears at ${width}px`, () => {
    const page = preview(width);
    assert.equal(page.images.filter(image => image.src === '/assets/mangosteen-pink.svg').length, 7);
    assert.equal(page.visible().length, 18);
    const viewportHeight = width > 600 ? 1000 : 844;
    const bands = new Set(page.visible().map(image => Math.floor(yPosition(image) / viewportHeight * 3)));
    assert.deepEqual([...bands].sort(), [0, 1, 2]);
    const seen = new Set();
    page.advance(40, () => page.visible().forEach(image => seen.add(image)));
    assert.equal(seen.size, 24);
    assert.equal(page.visible().length, 0);
    assert.equal(page.frames.size, 0);
    assert.equal(page.toggle.disabled, true);
    page.document.hidden = true;
    page.document.visibilitychange();
    page.document.hidden = false;
    page.document.visibilitychange();
    page.resize();
    page.advance(5);
    assert.equal(page.visible().length, 0);
    assert.equal(page.frames.size, 0);
  });
}

test('pause freezes the scattering and resume continues it', () => {
  const page = preview();
  page.advance(4);
  page.toggle.click();
  const before = page.visible().map(image => image.style.transform);
  page.advance(30);
  assert.deepEqual(page.visible().map(image => image.style.transform), before);
  page.toggle.click();
  page.advance(1);
  assert.notDeepEqual(page.visible().map(image => image.style.transform), before);
});

test('resizing never revives finished fruit and reduced motion stays static', () => {
  const page = preview();
  page.advance(4);
  page.stage.clientWidth = 390;
  page.stage.clientHeight = 844;
  page.resize();
  const finished = page.images.filter(image => image.hidden);
  assert.ok(finished.length > 0);
  page.stage.clientHeight = 2000;
  page.resize();
  assert.ok(finished.every(image => image.hidden));
  page.advance(60);
  assert.equal(page.visible().length, 0);

  const staticPage = preview(390, true);
  assert.equal(staticPage.visible().length, 24);
  assert.equal(staticPage.toggle.hidden, true);
  const before = staticPage.visible().map(image => image.style.transform);
  staticPage.advance(60);
  assert.deepEqual(staticPage.visible().map(image => image.style.transform), before);
  assert.equal(staticPage.frames.size, 0);
});

test('the 1.4x timeline speeds up falling and staggered starts by 40%', () => {
  const page = preview();
  const first = page.images[0];
  const before = yPosition(first);
  assert.equal(page.images[3].hidden, true);
  page.advance(1.02);
  assert.ok(Math.abs(yPosition(first) - before - 62.5 * 1.4) <= 1);
  page.advance(.98);
  assert.equal(page.images[3].hidden, true);
  page.advance(.2);
  assert.equal(page.images[3].hidden, false);
});

test('main-page fruit waits for the address section and pauses offscreen without restarting', () => {
  const page = preview(390, false, true, false);
  const first = page.images[0];
  const before = first.style.transform;
  page.advance(10);
  assert.equal(first.style.transform, before);
  assert.equal(page.frames.size, 0);
  page.enter(true);
  page.advance(1);
  assert.notEqual(first.style.transform, before);
  page.enter(false);
  const paused = first.style.transform;
  page.advance(10);
  assert.equal(first.style.transform, paused);
  page.enter(true);
  page.advance(60);
  assert.equal(page.visible().length, 0);
  page.enter(false);
  page.enter(true);
  page.advance(5);
  assert.equal(page.visible().length, 0);
  assert.equal(page.frames.size, 0);
});
