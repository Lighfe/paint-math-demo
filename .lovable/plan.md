# Gaussian paint canvas

## Build
- Replace the placeholder home page with one responsive, high-DPI canvas and a compact toolbar.
- Add Size and Spread controls using the existing labelled slider and button components.
- Implement pointer-captured mouse, pen, and touch drawing, outside-release handling, context-menu prevention, and opaque-white clearing.
- Add a small brush utility with Box–Muller Gaussian sampling and independent x/y offsets.

## Drawing behavior
- Draw an immediate cluster on press, then interpolate dense dabs along each movement segment.
- Read live control values from refs and cap work per movement for consistent performance.
- Reinitialize the canvas correctly on load and resize using the current device pixel ratio.

## Verification
- Check desktop and phone dimensions, overflow, keyboard controls, pixel opacity, DPR sizing, drawing, clearing, and console errors with Playwright.
- Preserve the existing Playwright dependency and update page metadata for the paint tool.
