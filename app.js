(() => {
  const TOTAL = 2;
  const SLIDE_MS = 520;
  const START_INDEX = 0;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const view = document.getElementById("view");
  const track = document.getElementById("track");
  const pageB = document.getElementById("page-b");

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
  let moveTimer = 0;

  function viewScale() {
    return view.getBoundingClientRect().height / 784 || 1;
  }

  function productIndex() {
    if (pos === 0) return TOTAL - 1;
    if (pos === TOTAL + 1) return 0;
    return pos - 1;
  }

  function showProduct(index) {
    pageB.classList.toggle("is-on", index === 1);
  }

  function setTrack(offset = 0, animate = false) {
    track.classList.toggle("is-animating", animate && !REDUCED);
    track.style.transform = `translate3d(0, calc(${-pos * 100}% + ${offset}px), 0)`;
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
    showProduct(productIndex());
    busy = false;
  }

  function go(dir) {
    if (busy) return false;
    busy = true;
    pos += dir;
    setTrack(0, true);
    showProduct(productIndex());
    window.clearTimeout(moveTimer);
    moveTimer = window.setTimeout(finishMove, REDUCED ? 0 : SLIDE_MS);
    return true;
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (busy) return;
    dragging = true;
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
      go(1);
    } else if (dragY >= 70) {
      go(-1);
    } else {
      setTrack(0, true);
    }
    dragY = 0;
  }

  document.getElementById("next").addEventListener("click", (event) => {
    event.preventDefault();
    go(1);
  });
  document.getElementById("prev").addEventListener("click", (event) => {
    event.preventDefault();
    go(-1);
  });

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
  showProduct(START_INDEX);
})();
