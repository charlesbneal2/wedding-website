const photo = document.querySelector('.entrance-image');
const photoCopy = document.querySelector('.entrance-photo-copy');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const address = document.querySelector('#address');
const addressForm = address.querySelector('form');
const formText = addressForm.querySelectorAll('h2, .entrance-form-intro, .field label, .btn, .submission-status');
const galleryPhotos = document.querySelectorAll('.entrance-gallery-photo');
let exitTimer;
let formTextObserver;

function resetFormText() {
  formTextObserver?.disconnect();
  for (const element of formText) {
    element.classList.remove('form-text-reveal', 'is-visible');
  }
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  formTextObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        formTextObserver.unobserve(entry.target);
      }
    }
  }, { threshold: .15, rootMargin: '0px 0px -24px 0px' });
  for (const element of formText) {
    element.classList.add('form-text-reveal');
    formTextObserver.observe(element);
  }
}

function updatePhotoCopyPosition() {
  photoCopy.style.top = `${-window.scrollY}px`;
}

function updateGalleryStickyPositions() {
  for (const section of galleryPhotos) {
    section.style.setProperty('--gallery-sticky-top',
      `${Math.min(0, window.innerHeight - section.offsetHeight)}px`);
  }
}

function playEntrance() {
  const directAddress = location.hash === '#address';
  document.documentElement.classList.toggle('is-address-entry', directAddress);
  window.clearTimeout(exitTimer);
  document.body.classList.remove('is-ready', 'is-expanded');
  document.body.dataset.entered = 'false';
  document.body.dataset.exited = 'false';
  if (!directAddress) window.scrollTo({ top: 0, behavior: 'instant' });
  updatePhotoCopyPosition();
  resetFormText();
  void document.body.offsetWidth;
  document.body.classList.add('is-ready');
  if (directAddress || reducedMotion.matches) {
    completeEntrance(true);
    if (directAddress) address.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}

function completeEntrance(skipAnimation = false) {
  document.body.dataset.entered = 'true';
  if (skipAnimation || reducedMotion.matches) {
    document.body.dataset.exited = 'true';
  } else {
    exitTimer = window.setTimeout(() => document.body.classList.add('is-expanded'), 300);
  }
}

photoCopy.addEventListener('animationend', event => {
  if (event.animationName === 'reveal-copy') completeEntrance();
});
document.querySelector('.curtain-right').addEventListener('animationend', event => {
  if (event.animationName === 'curtain-right') document.body.dataset.exited = 'true';
});
window.addEventListener('scroll', updatePhotoCopyPosition, { passive: true });
window.addEventListener('resize', updateGalleryStickyPositions);
if ('ResizeObserver' in window) {
  const gallerySizeObserver = new ResizeObserver(updateGalleryStickyPositions);
  for (const section of galleryPhotos) gallerySizeObserver.observe(section);
}
updateGalleryStickyPositions();

for (const image of document.querySelectorAll('.entrance-gallery-image')) {
  const error = image.parentElement.querySelector('.entrance-gallery-error');
  const showError = () => { error.hidden = false; };
  image.addEventListener('error', showError);
  if (image.complete && image.currentSrc && !image.naturalWidth) showError();
}

async function startEntrance() {
  await document.fonts.ready;
  try {
    await photo.decode();
  } catch {
    document.querySelector('.entrance-photo-error').hidden = false;
  }
  addressForm.addEventListener('focusin', event => {
    const label = event.target.closest('.field')?.querySelector('label');
    if (label) {
      label.classList.add('is-visible');
      formTextObserver?.unobserve(label);
    }
  });
  reducedMotion.addEventListener('change', playEntrance);
  playEntrance();
}

startEntrance();
