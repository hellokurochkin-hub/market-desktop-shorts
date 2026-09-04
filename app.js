(() => {
  const TOTAL = 4;
  const SLIDE_MS = 520;
  const START_INDEX = 0;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const view = document.getElementById("view");
  const track = document.getElementById("track");
  const skeletons = document.getElementById("skeletons");

  function withClones(root) {
    const originals = [...root.children];
    root.insertBefore(originals[TOTAL - 1].cloneNode(true), originals[0]);
    root.appendChild(originals[0].cloneNode(true));
    return [...root.children];
  }

  const slides = withClones(track);
  let pos = START_INDEX + 1;
  let busy = false;
  let dragY = 0;
  let dragging = false;
  let startY = 0;
  let blinkTimer = 0;

  function viewScale() {
    return view.getBoundingClientRect().height / 776 || 1;
  }

  function setTrack(offset = 0, animate = false) {
    track.classList.toggle("is-animating", animate && !REDUCED);
    track.style.transform = `translate3d(0, calc(${-pos * 100}% + ${offset}px), 0)`;
  }

  function blinkSkeleton() {
    window.clearTimeout(blinkTimer);
    if (REDUCED) return;
    skeletons.classList.remove("is-switching");
    void skeletons.offsetWidth;
    skeletons.classList.add("is-switching");
    blinkTimer = window.setTimeout(() => {
      skeletons.classList.remove("is-switching");
    }, SLIDE_MS);
  }

  function layoutSlides() {
    slides.forEach((slide, i) => {
      slide.style.transform = `translate3d(0, ${i * 100}%, 0)`;
    });
  }

  function snapIfClone() {
    if (pos === 0) {
      pos = TOTAL;
      setTrack(0, false);
    } else if (pos === TOTAL + 1) {
      pos = 1;
      setTrack(0, false);
    }
  }

  function finishMove() {
    snapIfClone();
    busy = false;
  }

  function go(dir) {
    if (busy) return;
    busy = true;
    pos += dir;
    setTrack(0, true);
    blinkSkeleton();
    window.setTimeout(finishMove, REDUCED ? 0 : SLIDE_MS);
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("button")) return;
    dragging = true;
    busy = true;
    view.classList.add("is-dragging");
    startY = event.clientY;
    dragY = 0;
    view.setPointerCapture?.(event.pointerId);
    track.classList.remove("is-animating");
  }

  function onPointerMove(event) {
    if (!dragging) return;
    dragY = (event.clientY - startY) / viewScale();
    setTrack(dragY, false);
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    view.classList.remove("is-dragging");
    if (dragY <= -70) {
      busy = false;
      go(1);
    } else if (dragY >= 70) {
      busy = false;
      go(-1);
    } else {
      setTrack(0, true);
      window.setTimeout(finishMove, REDUCED ? 0 : SLIDE_MS);
    }
    dragY = 0;
  }

  document.getElementById("next").addEventListener("click", () => go(1));
  document.getElementById("prev").addEventListener("click", () => go(-1));

  view.addEventListener("pointerdown", onPointerDown);
  view.addEventListener("pointermove", onPointerMove);
  view.addEventListener("pointerup", onPointerUp);
  view.addEventListener("pointercancel", onPointerUp);

  view.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (busy || dragging) return;
      if (Math.abs(event.deltaY) < 8) return;
      go(event.deltaY > 0 ? 1 : -1);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
      go(1);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  });

  layoutSlides();
  setTrack(0, false);
})();
