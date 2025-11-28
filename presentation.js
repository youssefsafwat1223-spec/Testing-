/* presentation.js
   Controls:
   - Slide navigation (arrows, page dots, keyboard)
   - Active slide class toggling and staged entrance animations
   - Generate bubbles and set stagger indices for animations
   - Simple parallax fish speed tuning per slide (subtle)
*/

(() => {
  const slidesEl = document.getElementById('slides');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const prevBtn = document.getElementById('nav-prev');
  const nextBtn = document.getElementById('nav-next');
  const dotsContainer = document.getElementById('page-dots');
  const fishLayer = document.getElementById('fish-layer');
  const bubblesRoot = document.getElementById('global-bubbles');

  let current = 0;

  // Build page dots
  for (let i = 0; i < total; i++) {
    const btn = document.createElement('button');
    btn.className = i === 0 ? 'active' : '';
    btn.setAttribute('aria-label', `Go to slide ${i+1}`);
    btn.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(btn);
  }

  // Setup stagger indices for team cards and other grid items
  document.querySelectorAll('.team-grid article').forEach((el, idx) => {
    el.style.setProperty('--i', idx);
  });
  document.querySelectorAll('.feature').forEach((el, idx) => {
    el.style.setProperty('--i', idx);
  });
  // generic placeholders
  document.querySelectorAll('.placeholder').forEach((el, idx) => el.style.setProperty('--i', idx));

  // Generate randomized bubbles for global background
  function spawnBubbles(count = 24) {
    for (let i = 0; i < count; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const left = Math.random() * 100;
      const size = 6 + Math.random()*28;
      const dur = 6 + Math.random()*14;
      b.style.left = `${left}%`;
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      b.style.borderRadius = '50%';
      b.style.setProperty('--dur', `${dur}s`);
      b.style.opacity = 0.7 + Math.random()*0.3;
      b.style.transform = `translateY(0)`;
      bubblesRoot.appendChild(b);
    }
  }

  spawnBubbles(26);

  // Slide navigation helpers
  function updateControls() {
    const dots = Array.from(dotsContainer.children);
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    // Move slides container using transform
    slidesEl.style.transform = `translateX(-${current * 100}vw)`;
    // Update active classes and trigger entrance animations
    slides.forEach((s, i) => {
      if (i === current) {
        s.classList.add('active');
        // small parallax: speed up fish slightly when slide active
        fishLayer.style.animation = 'none';
      } else {
        s.classList.remove('active');
      }
    });
    // Focus management for accessibility
    slides[current].setAttribute('tabindex', '0');
    slides[current].focus({preventScroll:true});
  }

  function goTo(index) {
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;
    current = index;
    updateControls();
    // overlay bubble/ripple secondary animation per transition
    createTransitionOverlay();
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'Home') { goTo(0); }
    if (e.key === 'End') { goTo(total - 1); }
  });

  // Initialize first slide active
  updateControls();

  // Create a secondary overlay animation per slide transition (bubbles + shimmer)
  function createTransitionOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'trans-overlay';
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'none';
    overlay.style.inset = '0';
    overlay.style.zIndex = 9;
    overlay.style.background = 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.04), transparent 12%), radial-gradient(circle at 75% 80%, rgba(255,255,255,0.02), transparent 10%)';
    overlay.style.mixBlendMode = 'overlay';
    overlay.style.opacity = 0;
    overlay.style.transition = 'opacity 0.5s ease';
    document.querySelector('.presentation').appendChild(overlay);
    requestAnimationFrame(() => overlay.style.opacity = 1);
    setTimeout(() => overlay.style.opacity = 0, 420);
    setTimeout(() => overlay.remove(), 1000);

    // also produce a quick bubble burst
    const burst = document.createElement('div');
    burst.style.position = 'absolute';
    burst.style.width = '100%';
    burst.style.height = '100%';
    burst.style.top = 0;
    burst.style.left = 0;
    burst.style.zIndex = 11;
    burst.style.pointerEvents = 'none';
    document.querySelector('.presentation').appendChild(burst);
    for (let i=0;i<8;i++){
      const b = document.createElement('div');
      b.className = 'bubble';
      const left = 20 + Math.random() * 60;
      const size = 6 + Math.random()*22;
      b.style.left = `${left}%`;
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      b.style.setProperty('--dur', `${1.2 + Math.random()*1.6}s`);
      b.style.opacity = 1;
      burst.appendChild(b);
      setTimeout(()=> b.remove(), 1400);
    }
    setTimeout(()=> burst.remove(), 1600);
  }

  // Small accessibility: swipe support for touch
  let touchStartX = null;
  let touchStartY = null;
  slidesEl.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, {passive:true});
  slidesEl.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goTo(current + 1); else goTo(current - 1);
    }
    touchStartX = null;
    touchStartY = null;
  });

  // periodically re-seed bubbles to give lively background
  setInterval(() => {
    // remove oldest small batch to keep DOM small
    const existing = bubblesRoot.querySelectorAll('.bubble');
    if (existing.length > 60) {
      for (let i=0;i<12;i++) existing[i].remove();
    }
    // spawn a few
    spawnBubbles(6);
  }, 6000);


  // small enhancement: on-slide activation run specific slide animations (staged)
  function runSlideAnimations(slideIndex) {
    const s = slides[slideIndex];
    if (!s) return;
    // ensure items inside get animated via CSS (we use .active toggling)
    // additional per-slide behaviors:
    if (slideIndex === 0) {
      // Slide 1: slightly speed up fish for drama
      document.querySelectorAll('.fish').forEach((f, i) => {
        f.style.animationPlayState = 'running';
        f.style.filter = 'drop-shadow(0 10px 30px rgba(0,0,0,0.35))';
      });
    } else {
      document.querySelectorAll('.fish').forEach((f, i) => {
        f.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))';
      });
    }
    // slide 2 (team) — add small staggered delays to cards (already set via --i)
    // slide 5 — optionally animate graph lines (placeholder: subtle pulse)
    if (slideIndex === 4) {
      s.style.setProperty('animation', 'none');
    }
  }

  // observe active slide changes and run per-slide animation logic
  const observer = new MutationObserver(() => {
    runSlideAnimations(current);
  });
  observer.observe(document.getElementById('slides'), { attributes: true });

  // ensure run once after load
  window.addEventListener('load', () => runSlideAnimations(current));

  // Expose goTo globally for debugging (optional)
  window.AquaSense = { goTo };

})();
