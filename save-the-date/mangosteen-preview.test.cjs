const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = readFileSync(join(__dirname, 'mangosteen-preview.html'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)[1];

function preview(width = 1440, reduced = false) {
  const images = [];
  const frames = new Map();
  const stage = { clientWidth: width, clientHeight: 1218 };
  const toggle = { addEventListener(event, callback) { this[event] = callback; }, setAttribute() {} };
  const motion = { matches: reduced, addEventListener(event, callback) { this[event] = callback; } };
  const document = {
    hidden: false,
    createElement() { return { style: {} }; },
    addEventListener(event, callback) { this[event] = callback; },
    querySelector(selector) {
      return {
        '#animation-stage': stage,
        '.mangosteen-field': { append(image) { images.push(image); } },
        '.preview-toggle': toggle,
        '#preview-status': {},
        form: { addEventListener() {} },
      }[selector];
    },
  };
  let resize;
  let nextId = 0;
  let time = 0;
  class ResizeObserver {
    constructor(callback) { resize = callback; }
    observe() {}
  }
  vm.runInNewContext(source, {
    document,
    ResizeObserver,
    window: {
      ResizeObserver,
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

for (const width of [1440, 390]) {
  test(`three single rows fall once and disappear at ${width}px`, () => {
    const page = preview(width);
    assert.equal(page.images.filter(image => image.src === '/assets/mangosteen-pink.svg').length, 7);
    const seen = new Set();
    page.advance(60, () => {
      const visible = page.visible();
      if (!visible.length) return;
      assert.equal(visible.length, 8);
      const row = Math.floor(page.images.indexOf(visible[0]) / 8);
      assert.ok(visible.every(image => Math.floor(page.images.indexOf(image) / 8) === row));
      assert.equal(new Set(visible.map(image => image.style.transform.split(',')[1])).size, 1);
      seen.add(row);
    });
    assert.deepEqual([...seen], [0, 1, 2]);
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

test('pause freezes the current row and resume continues it', () => {
  const page = preview();
  page.advance(4);
  page.toggle.click();
  const before = page.visible().map(image => image.style.transform);
  page.advance(30);
  assert.deepEqual(page.visible().map(image => image.style.transform), before);
  page.toggle.click();
  page.advance(1);
  assert.notDeepEqual(page.visible().map(image => image.style.transform), before);
  assert.ok(page.visible().every(image => page.images.indexOf(image) < 8));
});

test('resizing preserves the row and reduced motion stays static', () => {
  const page = preview();
  page.advance(20);
  assert.ok(page.visible().every(image => page.images.indexOf(image) >= 8));
  page.stage.clientWidth = 390;
  page.stage.clientHeight = 844;
  page.resize();
  assert.ok(page.visible().every(image => {
    const index = page.images.indexOf(image);
    return index >= 8 && index < 16;
  }));
  page.advance(60);
  assert.equal(page.visible().length, 0);

  const staticPage = preview(390, true);
  assert.equal(staticPage.visible().length, 8);
  assert.equal(staticPage.toggle.hidden, true);
  const before = staticPage.visible().map(image => image.style.transform);
  staticPage.advance(60);
  assert.deepEqual(staticPage.visible().map(image => image.style.transform), before);
  assert.equal(staticPage.frames.size, 0);
});
