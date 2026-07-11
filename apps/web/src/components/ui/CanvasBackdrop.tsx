/**
 * CanvasBackdrop — the global, fixed, full-viewport background layer that
 * underpins the "blended canvas" aesthetic. Three large blurred radial
 * blobs (deep teal, subtle purple, midnight blue) drift slowly on
 * independent 24-36s cycles, giving the page a feeling of organic,
 * ever-shifting light. Sits at z-index -10 so all content overlays it.
 *
 * Pair with `body { background-color: transparent; }` (set in index.css)
 * — without that, the body's solid obsidian paint would cover the blobs.
 *
 * Per-section `<AmbientGlow>` is layered on top of this for localized,
 * higher-intensity highlights (CTA sections, testimonials marquee, etc.).
 */
export function CanvasBackdrop(): JSX.Element {
  return (
    <div aria-hidden className="canvas-backdrop">
      <div className="canvas-blob canvas-blob-teal animate-canvas-drift-1" />
      <div className="canvas-blob canvas-blob-purple animate-canvas-drift-2" />
      <div className="canvas-blob canvas-blob-midnight animate-canvas-drift-3" />
    </div>
  );
}
