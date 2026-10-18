# Karan Kumar - Interactive Engineering Portfolio

A responsive portfolio built with HTML, CSS, and vanilla JavaScript. No build
step, framework, package installation, or backend is required. Open index.html
locally or serve these files with GitHub Pages.

## Features

- Light/dark theme switch; the preference stays in this browser's local storage.
- Interactive VALID/READY handshake illustration with clock stepping and reset.
- Project-category filters and an active-section sticky navigation bar.
- Evidence-image viewer with previous/next controls, arrow keys, Escape, and
  focus restoration to the triggering image.
- Mobile navigation, scroll progress, subtle section reveals, and back-to-top.
- Reduced-motion support and no-JavaScript access to project content and links.

The handshake illustration uses an always-valid deterministic source. Each
clock step advances one rising edge; READY low holds the beat, READY high
accepts exactly one beat and advances the data. Reset resets this illustration.
It does not execute the SystemVerilog design or establish any hardware proof.

## Source files

| File | Purpose |
| --- | --- |
| index.html | Portfolio content and semantic interaction controls |
| style.css | Responsive layout, light/dark palettes, and motion preferences |
| handshake-model.js | Small deterministic handshake state model |
| script.js | Theme, navigation, demo, filters, viewer, and scroll interactions |
| assets/ | Unmodified evidence images from the project repositories |

The FIFO waveform, AES DMA throughput chart, and Virtuoso full-adder schematic
link to their source documentation. The page preserves the tested formal scope
and distinguishes schematic simulation from physical layout validation.

## Contact

- GitHub: https://github.com/Krnroyy
- LinkedIn: https://www.linkedin.com/in/krnroyy/

## Validation for this revision

- Handshake-model tests: stalls hold data; changing READY alone does not
  transfer; each ready rising edge accepts exactly one beat.
- Headless Chromium: theme persistence, demo/reset, category filtering,
  lightbox arrow/Escape controls and focus return, and mobile menu.
- Desktop and 390px/320px mobile layouts checked for horizontal overflow.
- Reduced-motion and JavaScript-disabled content/navigation fallback checked.
- No JavaScript page errors during these checks.

Hardware tests were not rerun for this webpage revision. The publication script
uses the owner's existing authenticated GitHub CLI and preserves unrelated files.
