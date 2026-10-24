const TRACK_ID = 'home_gallery_track';

type Sample = { t: number; x: number };

function gapOf(track: HTMLElement): number {
  const styles = getComputedStyle(track);
  return Number.parseFloat(styles.columnGap || styles.gap || '12') || 12;
}

function cardStep(track: HTMLElement): number {
  const card = track.querySelector<HTMLElement>(':scope > a, :scope > *');
  if (!card) return Math.max(240, Math.round(track.clientWidth * 0.8));
  return Math.round(card.getBoundingClientRect().width + gapOf(track));
}

function clampScroll(track: HTMLElement, left: number): number {
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  return Math.min(max, Math.max(0, left));
}

function nearestSnap(track: HTMLElement, left: number): number {
  const step = cardStep(track);
  if (step <= 0) return left;
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  return Math.min(max, Math.max(0, Math.round(left / step) * step));
}

function animateTo(track: HTMLElement, target: number, duration: number): void {
  const from = track.scrollLeft;
  const dist = target - from;
  if (Math.abs(dist) < 0.5 || duration <= 0) {
    track.scrollLeft = target;
    return;
  }
  const start = performance.now();
  const tick = (now: number): void => {
    if (track.dataset.swipeHeld === '1') return;
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    track.scrollLeft = from + dist * eased;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function fling(track: HTMLElement, velocity: number): void {
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  let v = velocity;
  let last = performance.now();

  const tick = (now: number): void => {
    if (track.dataset.swipeHeld === '1') return;
    const dt = Math.min(32, now - last) / 1000;
    last = now;
    v *= Math.exp(-4.2 * dt);
    const next = clampScroll(track, track.scrollLeft + v * dt);
    track.scrollLeft = next;
    const atEdge = (next <= 0 && v < 0) || (next >= max && v > 0);
    if (Math.abs(v) < 40 || atEdge) {
      animateTo(track, nearestSnap(track, track.scrollLeft + v * 0.08), 280);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function bindSwipe(track: HTMLElement): void {
  if (track.dataset.swipeBound === '1') return;
  track.dataset.swipeBound = '1';
  track.style.cursor = 'grab';
  track.style.touchAction = 'pan-x';
  track.style.userSelect = 'none';

  track.querySelectorAll('img, a').forEach((node) => {
    if (node instanceof HTMLImageElement) {
      node.draggable = false;
      node.style.pointerEvents = 'none';
    }
    if (node instanceof HTMLAnchorElement) node.draggable = false;
  });

  let dragging = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;
  let activeId = 0;
  let samples: Sample[] = [];

  const sample = (x: number): void => {
    const t = performance.now();
    samples.push({ t, x });
    if (samples.length > 6) samples.shift();
  };

  const velocity = (): number => {
    if (samples.length < 2) return 0;
    const last = samples[samples.length - 1];
    let first = samples[0];
    for (let i = samples.length - 2; i >= 0; i -= 1) {
      if (last.t - samples[i].t > 80) {
        first = samples[i];
        break;
      }
      first = samples[i];
    }
    const dt = (last.t - first.t) / 1000;
    if (dt <= 0) return 0;
    return (first.x - last.x) / dt;
  };

  const onMove = (event: PointerEvent): void => {
    if (!dragging || event.pointerId !== activeId) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > 3) moved = true;
    sample(event.clientX);
    track.scrollLeft = startLeft - dx;
    event.preventDefault();
  };

  const onUp = (event: PointerEvent): void => {
    if (event.pointerId !== activeId) return;
    dragging = false;
    track.dataset.swipeHeld = '0';
    track.style.cursor = 'grab';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    const v = velocity();
    if (Math.abs(v) > 180) fling(track, v);
    else animateTo(track, nearestSnap(track, track.scrollLeft), 320);
  };

  track.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      moved = false;
      activeId = event.pointerId;
      startX = event.clientX;
      startLeft = track.scrollLeft;
      samples = [{ t: performance.now(), x: event.clientX }];
      track.dataset.swipeHeld = '1';
      track.style.cursor = 'grabbing';
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    { capture: true }
  );

  track.addEventListener(
    'click',
    (event) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    },
    true
  );

  track.addEventListener('dragstart', (event) => event.preventDefault(), true);

  track.addEventListener(
    'wheel',
    (event) => {
      if (track.scrollWidth <= track.clientWidth) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      event.preventDefault();
      track.dataset.swipeHeld = '1';
      track.scrollLeft += delta;
      window.clearTimeout(Number(track.dataset.wheelSnap || 0));
      const id = window.setTimeout(() => {
        track.dataset.swipeHeld = '0';
        animateTo(track, nearestSnap(track, track.scrollLeft), 260);
      }, 80);
      track.dataset.wheelSnap = String(id);
    },
    { capture: true, passive: false }
  );
}

function bindButtons(): void {
  const track = document.getElementById(TRACK_ID);
  if (!(track instanceof HTMLElement)) return;
  const prev = document.getElementById('home_gallery_prev');
  const next = document.getElementById('home_gallery_next');
  if (prev && prev.dataset.swipeBound !== '1') {
    prev.dataset.swipeBound = '1';
    prev.addEventListener('click', (event) => {
      event.preventDefault();
      track.dataset.swipeHeld = '0';
      animateTo(track, nearestSnap(track, track.scrollLeft - cardStep(track)), 360);
    });
  }
  if (next && next.dataset.swipeBound !== '1') {
    next.dataset.swipeBound = '1';
    next.addEventListener('click', (event) => {
      event.preventDefault();
      track.dataset.swipeHeld = '0';
      animateTo(track, nearestSnap(track, track.scrollLeft + cardStep(track)), 360);
    });
  }
}

export function initGallerySwipe(): void {
  if (typeof document === 'undefined') return;
  const scan = (): void => {
    const track = document.getElementById(TRACK_ID);
    if (track instanceof HTMLElement) bindSwipe(track);
    bindButtons();
  };
  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
}
