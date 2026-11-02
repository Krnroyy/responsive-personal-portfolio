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

The selected-work section also presents the pipelined 8-bit ALU RTL-to-GDS project, including its OpenROAD/ORFS implementation flow, SKY130HD platform, verification results, and release links. It distinguishes generated educational GDSII and estimated PPA from fabrication and signoff claims.

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


## Browser AES-GCM lab

The Live lab section uses the native Web Crypto API to encrypt selected PNG, JPEG or WebP file bytes locally. It has a built-in sample, authenticated decryption with an exact byte comparison, and a tamper test that flips one ciphertext bit and expects GCM authentication to reject it. No image upload, analytics, key export, or persistent image/key storage is used.

Each encryption generates a fresh, non-extractable 128-bit AES key and a random 96-bit IV; the authentication tag is 128 bits. Reset clears page references and revokes image object URLs. This is a learning demo, separate from the FPGA implementation and throughput measurements. It encrypts image file bytes rather than the FPGA raw-pixel flow.

Requires JavaScript, Web Crypto, and a secure context (the HTTPS GitHub Pages deployment or localhost). Files are limited to 3 MiB and 25 million decoded pixels.

References: [Web Crypto AES-GCM parameters](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams), [SubtleCrypto.encrypt](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt).

## ALU presentation consistency

The ALU flow card uses the same pointer-driven depth interaction as the other evidence cards. The toolkit lists OpenROAD, ORFS and SKY130HD. The ALU notes state the shared ADD/SUB area/timing tradeoff and distinguish one-cycle from two-cycle candidate latency; all retain one-request-per-cycle throughput. The downloadable resume is maintained separately.

## Pipelined ALU browser lab

Choose **Pipelined ALU** in the interactive bench or use the link on its project card. It models the baseline `rtl/alu8_pipeline.sv` at source commit `c140a3a429d74734fc7379b5488d85d32537f82d`. It supports all eight opcodes, two unsigned byte inputs, signed interpretation, Z/C/V flags, VALID bubbles, register hold behaviour, reset flushing, and a four-request stream. The first rising edge captures a request; the next registers its result. It has no READY/backpressure interface. Shifts use B[2:0]; SUB carry means no borrow. Reserved returns zero with Z=1, C=0, V=0. Reset clears every flag, including Z, regardless of reset result bits.

The pure JavaScript state model lives in `alu-model.js`; `alu-demo.js` handles controls and `alu-demo.css` uses the shared theme tokens. The demo does not execute HDL, prove properties, measure hardware timing, or model the alternate three-stage variant.

Run the browser-model arithmetic and pipeline regression with `node tests/alu-model.test.cjs`. It checks all 524,288 opcode/byte combinations against an independent arithmetic oracle, plus 10,000 state transitions. This is not a rerun of the RTL tests.

## RV32I subset processor showcase

The selected-work section includes the five-stage 32-bit RV32I subset processor, with a pointer-depth evidence card containing the repository's ZCU104 board and LED photos. It links the verification plan, board results and portable CI. Six project cards are shown; the processor joins FIFO, ALU and timer under Verification. The evidence-image viewer includes both new photos.

The card distinguishes three-seed UVM simulation from portable CI, 40-step bounded formal checks from an unbounded proof, and a fixed-ROM LED demonstration from full ISA compliance or measured FPGA performance. Reported 125 MHz is the wrapper clock target; routed timing figures are tool estimates with external I/O timing limitations. The downloaded resume is maintained separately.

## RV32I pipeline teaching lab

The RV32I pipeline filter and project-card shortcut open a JavaScript teaching model of five-stage instruction flow. Four built-in examples show the board ROM program, forwarding, a load-use stall and taken-branch flushing. It models ADDI, ADD, aligned LW/SW, BEQ and JAL only, not all 37 instructions or machine-code decoding. The board ROM example uses the eight instructions from `rtl/rv32i_demo_system.sv` at processor commit `72e700486d968786e4071e4973a4b7db8b5311b8`.

Core reset clears registers, pipeline state and the LED-done proxy while retaining data RAM. Reloading/changing the example clears RAM too. Stores update RAM in MEM before retirement at WB. Counters are browser-model events, not workload CPI or measured hardware performance. The finite listings drain at their end; the board example pauses on its first retired final-loop JAL while the physical core continues looping. No HDL, UVM, privileged ISA, faults, byte/halfword accesses, variable-latency memory or live board connection is executed here.

Run the model regression with `node tests/processor-model.test.cjs`.
