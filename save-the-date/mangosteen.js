(() => {
  const stage = document.querySelector('[data-mangosteens]');
  const field = stage.querySelector('.mangosteen-field');
  const toggle = stage.querySelector('.mangosteen-toggle');
  const confirmation = stage.querySelector('.address-thanks');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sprites = Array.from({ length: 24 }, (_, index) => {
    const image = document.createElement('img');
    const pink = Math.floor((index + 1) * .3) > Math.floor(index * .3);
    image.src = pink ? '/assets/mangosteen-pink.svg' : '/assets/favicon.svg';
    image.alt = '';
    field.append(image);
    return {
      image,
      anchor: (index + Math.random()) / 24,
      band: (index % 3 + .15 + Math.random() * .65) / 3,
      phase: Math.random() * Math.PI * 2,
      speed: 45 + Math.random() * 35,
      delay: index % 4 === 3 ? .75 + Math.random() * 4.25 : 0,
      originX: 0, startY: 0, staticY: 0, finished: false,
    };
  });
  let width = 0;
  let height = 0;
  let size = 0;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let paused = false;
  let complete = false;
  let active = !confirmation || !confirmation.hidden;
  let visible = !('IntersectionObserver' in window);

  const paint = () => {
    for (const sprite of sprites) {
      const age = elapsed - sprite.delay;
      const y = reducedMotion.matches ? sprite.staticY : sprite.startY + Math.max(0, age) * sprite.speed;
      if (!reducedMotion.matches && age >= 0 && y > height) sprite.finished = true;
      sprite.image.hidden = !active || complete || sprite.finished || (!reducedMotion.matches && age < 0);
      const x = sprite.originX + Math.sin(sprite.phase + elapsed * .7) * Math.min(32, width * .06);
      sprite.image.style.transform = `translate3d(${Math.round(Math.max(0, Math.min(width - size, x)))}px, ${Math.round(y)}px, 0)`;
    }
  };

  function reset() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    size = (width <= 600 ? 32 : 48) * 1.3 * 1.5;
    sprites.forEach(sprite => {
      sprite.image.style.width = `${size}px`;
      sprite.image.style.height = `${size}px`;
      sprite.originX = (width - size) * sprite.anchor;
      sprite.staticY = (Math.min(height, window.innerHeight) - size) * sprite.band;
      sprite.startY = sprite.delay ? -size : sprite.staticY;
    });
    paint();
  }

  function animate(time) {
    const dt = previous ? Math.min((time - previous) / 1000, .035) : 0;
    previous = time;
    elapsed += dt * 1.4;
    paint();
    complete = sprites.every(sprite => sprite.finished);
    if (complete) {
      syncMotion();
      return;
    }
    frame = window.requestAnimationFrame(animate);
  }

  function syncMotion() {
    window.cancelAnimationFrame(frame);
    previous = 0;
    if (toggle) {
      toggle.hidden = reducedMotion.matches;
      toggle.disabled = complete;
      toggle.textContent = complete ? 'Animation complete' : paused ? 'Resume animation' : 'Pause animation';
      toggle.setAttribute('aria-pressed', String(paused));
    }
    if (active && !complete && !paused && !reducedMotion.matches && !document.hidden && visible) {
      frame = window.requestAnimationFrame(animate);
    }
  }

  toggle?.addEventListener('click', () => { paused = !paused; syncMotion(); });
  if (confirmation) {
    new MutationObserver(() => {
      const nextActive = !confirmation.hidden;
      if (nextActive === active) return;
      active = nextActive;
      if (active) {
        elapsed = 0;
        complete = false;
        paused = false;
        sprites.forEach(sprite => { sprite.finished = false; });
        reset();
      } else {
        paint();
      }
      syncMotion();
    }).observe(confirmation, { attributes: true, attributeFilter: ['hidden'] });
  }
  reducedMotion.addEventListener('change', () => { reset(); syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  if ('ResizeObserver' in window) {
    new ResizeObserver(reset).observe(stage);
  } else {
    window.addEventListener('resize', reset);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncMotion();
    }, { rootMargin: '0px 0px -20% 0px' }).observe(stage);
  }
  reset();
  syncMotion();
})();
