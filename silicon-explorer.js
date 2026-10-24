(() => {
  "use strict";
  const root = document.querySelector("#silicon-explorer");
  if (!root || root.dataset.ready === "true") return;
  root.dataset.ready = "true";

  // Pointer proximity pulls living-looking threads from the pointer into the CTA.
  const cta = document.querySelector("[data-puppet-wrap]");
  const venomLayer = document.querySelector("[data-venom-layer]");
  const venomCore = document.querySelector("[data-venom-core]");
  const venomThreads = [...document.querySelectorAll("[data-venom-thread]")];
  const creature = document.querySelector("[data-sx-creature]");
  const desktopPointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 761px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (cta && venomLayer && venomCore && desktopPointer.matches && !reducedMotion.matches) {
    const maxReach = 260;
    const clamp = (value, low, high) => Math.max(low, Math.min(value, high));
    const clearOoze = () => {
      venomLayer.classList.remove("is-active");
      cta.classList.remove("is-drawn");
      cta.style.setProperty("--pull-x", "0px");
      cta.style.setProperty("--pull-y", "0px");
      cta.style.setProperty("--pull-scale", "1");
    };
    const drawOoze = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return clearOoze();
      const rect = cta.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;
      const nearX = clamp(x, rect.left, rect.right);
      const nearY = clamp(y, rect.top, rect.bottom);
      const distance = Math.hypot(x - nearX, y - nearY);
      if (distance >= maxReach) return clearOoze();

      const proximity = 1 - distance / maxReach;
      const intensity = proximity * proximity * (3 - 2 * proximity);
      venomLayer.classList.add("is-active");
      venomCore.setAttribute("cx", x);
      venomCore.setAttribute("cy", y);
      venomCore.setAttribute("r", String(2 + intensity * 7));

      const anchors = [
        { x: rect.left + rect.width * .08, y: rect.top + rect.height * .5 },
        { x: rect.left + rect.width * .22, y: rect.top + 2 },
        { x: rect.left + rect.width * .39, y: rect.top + 2 },
        { x: rect.left + rect.width * .57, y: rect.bottom - 2 },
        { x: rect.left + rect.width * .72, y: rect.top + 2 },
        { x: rect.left + rect.width * .88, y: rect.bottom - 2 },
        { x: rect.right - 2, y: rect.top + rect.height * .37 },
        { x: rect.right - 2, y: rect.top + rect.height * .68 }
      ];
      const fixedWidths = [1.5, 1.1, .85, .85, .85, .85, .7, .7];
      venomThreads.forEach((path, index) => {
        const target = anchors[index % anchors.length];
        const dx = target.x - x;
        const dy = target.y - y;
        const length = Math.max(1, Math.hypot(dx, dy));
        const bend = (index % 2 ? 1 : -1) * (8 + 22 * (1 - intensity));
        const px = -dy / length * bend;
        const py = dx / length * bend;
        path.setAttribute("d", `M ${x} ${y} C ${x + dx * .26 + px} ${y + dy * .2 + py}, ${x + dx * .72 - px * .55} ${y + dy * .66 - py * .55}, ${target.x} ${target.y}`);
        const threshold = index === 0 ? 0 : .12 + (index - 1) * .095;
        const strandIntensity = index === 0 ? intensity : clamp((intensity - threshold) / (1 - threshold), 0, 1);
        path.style.setProperty("--thread-width", `${fixedWidths[index]}px`);
        path.style.setProperty("--thread-opacity", String(index === 0 ? .12 + strandIntensity * .68 : strandIntensity * .82));
      });

      const pullX = x - rect.left - rect.width / 2;
      const pullY = y - rect.top - rect.height / 2;
      const pullLength = Math.max(1, Math.hypot(pullX, pullY));
      const pull = Math.min(6, intensity * 6);
      cta.style.setProperty("--pull-x", `${pullX / pullLength * pull}px`);
      cta.style.setProperty("--pull-y", `${pullY / pullLength * pull}px`);
      cta.style.setProperty("--pull-scale", String(1 + intensity * .018));
      cta.classList.add("is-drawn");
    };
    window.addEventListener("pointermove", drawOoze, { passive: true });
    window.addEventListener("blur", clearOoze);
    document.addEventListener("mouseleave", clearOoze);
    reducedMotion.addEventListener?.("change", (event) => {
      if (event.matches) clearOoze();
    });
  }

  // The small silicon chip is only a visual cursor; it never captures clicks.
  // The gold sweep works with mouse, keyboard, and touch in either theme.
  if (!reducedMotion.matches) {
    const sweepTimers = new WeakMap();
    root.addEventListener("click", (event) => {
      const target = event.target.closest("button, a, input, [role='button']");
      if (!target || !root.contains(target)) return;
      const oldTimer = sweepTimers.get(target);
      if (oldTimer) window.clearTimeout(oldTimer);
      target.classList.remove("sx-magic-hit");
      void target.offsetWidth;
      target.classList.add("sx-magic-hit");
      sweepTimers.set(target, window.setTimeout(() => {
        target.classList.remove("sx-magic-hit");
        sweepTimers.delete(target);
      }, 1950));
    });
  }

  if (creature && desktopPointer.matches && !reducedMotion.matches) {
    const hideCreature = () => {
      root.classList.remove("sx-creature-active");
      creature.classList.remove("is-visible", "is-clicking");
    };
    root.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      root.classList.add("sx-creature-active");
      creature.classList.add("is-visible");
    });
    root.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      root.classList.add("sx-creature-active");
      creature.classList.add("is-visible");
      creature.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-14px, -14px)`;
    });
    root.addEventListener("pointerleave", hideCreature);
    root.addEventListener("pointerdown", () => creature.classList.add("is-clicking"));
    window.addEventListener("pointerup", () => creature.classList.remove("is-clicking"));
    root.addEventListener("keydown", (event) => {
      if (event.key === "Tab") hideCreature();
    });
    reducedMotion.addEventListener?.("change", (event) => {
      if (event.matches) hideCreature();
    });
  }

  const $ = (selector) => root.querySelector(selector);
  const stageButtons = [...root.querySelectorAll("[data-sx-stage]")];
  const bits = { a: 0, b: 0, cin: 0 };
  const stages = {
    inverter: {
      kicker: "CMOS LOGIC · LEARNING MODEL",
      title: "CMOS inverter",
      description: "Toggle input A and trace its logic value through the inverter. This simplified diagram teaches the NOT function; it is not a transistor-level simulation.",
      info: "A CMOS inverter pairs PMOS and NMOS transistors. This is a learning illustration, not a transistor-level circuit simulation.",
      tipDefault: "Hover or focus a pin, gate, or output to learn what it does.",
      project: "CMOS full-adder project ↗",
      url: "https://github.com/Krnroyy/cadence-cmos-full-adder",
      sourceLabel: "INPUT A",
      logicLabel: "CMOS PAIR",
      logicValue: "INVERT",
      outputLabel: "OUTPUT Y"
    },
    adder: {
      kicker: "CMOS LOGIC · LEARNING MODEL",
      title: "1-bit full adder",
      description: "Change A, B, or Cin and follow the signals through the five gates that form a one-bit full adder.",
      info: "A and B feed XOR1 and AND1. P = A XOR B combines with Cin in XOR2 for Sum and AND2 for a carry term; OR combines that term with G = A AND B for Carry.",
      tipDefault: "Follow A and B into XOR1/AND1, then follow P and Cin to Sum and Carry.",
      project: "CMOS full-adder project ↗",
      url: "https://github.com/Krnroyy/cadence-cmos-full-adder",
      sourceLabel: "INPUTS",
      logicLabel: "FULL ADDER",
      logicValue: "2 XOR · 2 AND · 1 OR",
      outputLabel: "OUTPUTS"
    },
    axi: {
      kicker: "RTL · AXI4-LITE · UVM",
      title: "Register write to timer",
      description: "Trace a CPU write through the AXI4-Lite interface into the timer's RELOAD register.",
      info: "The AXI4-Lite timer project uses a SystemVerilog RTL design and UVM testbench. Its monitor observes accepted transactions and its scoreboard checks expected behaviour.",
      project: "AXI4-Lite timer RTL and UVM ↗",
      url: "https://github.com/Krnroyy/axi-lite-timer",
      sourceLabel: "CPU",
      logicLabel: "AXI4-LITE",
      logicValue: "AW + W + B",
      outputLabel: "TIMER REGISTER"
    }
  };

  let stage = "inverter";
  let traceTimers = [];
  let svgPulseTimer;
  let activePulsedWires = [];

  function pulseSvg(wireNames) {
    const svg = root.querySelector(`[data-sx-svg="${stage}"]`);
    if (!svg || svg.hasAttribute("hidden")) return;
    window.clearTimeout(svgPulseTimer);
    activePulsedWires.forEach((wire) => wire.classList.remove("is-flowing"));
    const selector = Array.isArray(wireNames)
      ? wireNames.map((name) => `[data-sx-svg-wire="${name}"]`).join(",")
      : "[data-sx-svg-wire]";
    const wires = selector ? [...svg.querySelectorAll(selector)] : [];
    void svg.offsetWidth;
    wires.forEach((wire) => wire.classList.add("is-flowing"));
    activePulsedWires = wires;
    svgPulseTimer = window.setTimeout(() => {
      wires.forEach((wire) => wire.classList.remove("is-flowing"));
      activePulsedWires = [];
    }, 1250);
  }

  function pulseAdder(bit) {
    traceTimers.forEach(window.clearTimeout);
    traceTimers = [];
    const phases = bit === "cin"
      ? [["cin-sum", "cin-t"], ["t-c"], ["sum-out", "carry-out"]]
      : [[`${bit}-p`, `${bit}-g`], ["p-sum", "p-t", "g-c"], ["t-c"], ["sum-out", "carry-out"]];
    phases.forEach((wires, index) => {
      traceTimers.push(window.setTimeout(() => pulseSvg(wires), index * 400));
    });
  }

  function setDiagramNode(svg, name, value, level = value, readoutName = name) {
    const node = svg.querySelector(`[data-sx-svg-node="${name}"]`);
    if (!node) return;
    node.dataset.level = String(level);
    const readout = node.querySelector(`[data-sx-svg-value="${readoutName}"]`);
    if (readout) readout.textContent = String(value);
  }

  function renderDiagrams() {
    const schematic = root.querySelector("[data-sx-schematic]");
    const route = root.querySelector("[data-sx-route]");
    schematic.hidden = false;
    route.hidden = true;
    root.querySelectorAll("[data-sx-svg]").forEach((svg) => {
      svg.toggleAttribute("hidden", svg.dataset.sxSvg !== stage);
      svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => wire.setAttribute("pathLength", "1"));
    });

    if (stage === "inverter") {
      const svg = root.querySelector('[data-sx-svg="inverter"]');
      const y = 1 - bits.a;
      setDiagramNode(svg, "a", `A = ${bits.a}`, bits.a);
      setDiagramNode(svg, "y", `Y = ${y}`, y);
      svg.querySelector('[data-sx-svg-node="gate"]').dataset.level = String(y);
      svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => {
        wire.dataset.level = String(wire.dataset.sxSvgWire === "a" ? bits.a : y);
      });
    } else if (stage === "adder") {
      const svg = root.querySelector('[data-sx-svg="adder"]');
      const p = bits.a ^ bits.b;
      const g = bits.a & bits.b;
      const t = bits.cin & p;
      const sum = p ^ bits.cin;
      const carry = g | t;
      setDiagramNode(svg, "a", bits.a);
      setDiagramNode(svg, "b", bits.b);
      setDiagramNode(svg, "cin", bits.cin);
      setDiagramNode(svg, "xor1", `P=${p}`, p, "p");
      setDiagramNode(svg, "and1", `G=${g}`, g, "g");
      setDiagramNode(svg, "and2", `T=${t}`, t, "t");
      setDiagramNode(svg, "xor2", "", sum);
      setDiagramNode(svg, "or", "", carry);
      setDiagramNode(svg, "sum", sum);
      setDiagramNode(svg, "carry", carry);
      const levels = { "a-p": bits.a, "a-g": bits.a, "b-p": bits.b, "b-g": bits.b, "p-sum": p, "p-t": p, "cin-sum": bits.cin, "cin-t": bits.cin, "g-c": g, "t-c": t, "sum-out": sum, "carry-out": carry };
      svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => {
        wire.dataset.level = String(levels[wire.dataset.sxSvgWire]);
      });
    } else {
      const svg = root.querySelector('[data-sx-svg="axi"]');
      const value = Math.max(1, Math.min(12, Number($("[data-sx-reload]").value) || 1));
      setDiagramNode(svg, "reload", value);
      svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => { wire.dataset.level = "0"; });
    }

    const tip = root.querySelector("[data-sx-diagram-tip]");
    if (tip) tip.textContent = stages[stage].tipDefault || "Choose the AXI timer stage to trace a register write.";
  }

  function explainDiagramPart(event) {
    const part = event.target.closest?.("[data-sx-explain]");
    if (!part || !root.contains(part)) return;
    const schematic = part.closest("[data-sx-schematic]");
    if (!schematic || schematic.hidden) return;
    root.querySelector("[data-sx-diagram-tip]").textContent = part.dataset.sxExplain;
  }

  function resetDiagramTip(event) {
    const part = event.target.closest?.("[data-sx-explain]");
    if (!part || (event.relatedTarget && part.contains(event.relatedTarget))) return;
    if (event.relatedTarget?.closest?.("[data-sx-explain]")) return;
    root.querySelector("[data-sx-diagram-tip]").textContent = stages[stage].tipDefault || "Choose the AXI timer stage to trace a register write.";
  }

  root.addEventListener("pointerover", explainDiagramPart);
  root.addEventListener("pointerout", resetDiagramTip);
  root.addEventListener("focusin", explainDiagramPart);
  root.addEventListener("focusout", resetDiagramTip);

  function render() {
    const config = stages[stage];
    root.dataset.stage = stage;
    stageButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.sxStage === stage));
    });
    root.querySelectorAll("[data-sx-controls]").forEach((group) => {
      group.hidden = group.dataset.sxControls !== stage;
    });

    $("[data-sx-kicker]").textContent = config.kicker;
    $("[data-sx-title]").textContent = config.title;
    $("[data-sx-description]").textContent = config.description;
    $("[data-sx-info]").textContent = config.info;
    $("[data-sx-project-link]").textContent = config.project;
    $("[data-sx-project-link]").href = config.url;
    $("[data-sx-source-label]").textContent = config.sourceLabel;
    $("[data-sx-logic-label]").textContent = config.logicLabel;
    $("[data-sx-logic-value]").textContent = config.logicValue;
    $("[data-sx-output-label]").textContent = config.outputLabel;
    renderDiagrams();

    root.querySelectorAll("[data-sx-node]").forEach((node) => node.classList.remove("is-active"));

    if (stage === "inverter") {
      const output = 1 - bits.a;
      $("[data-sx-source-value]").textContent = String(bits.a);
      $("[data-sx-output-value]").textContent = String(output);
      $("[data-sx-status]").textContent = `Input A is ${bits.a ? "high" : "low"}, so the output is ${output ? "high" : "low"}.`;
      $("[data-sx-node=source]").classList.add("is-active");
      $("[data-sx-node=output]").classList.toggle("is-active", output === 1);
    } else if (stage === "adder") {
      const sum = bits.a ^ bits.b ^ bits.cin;
      const carry = (bits.a & bits.b) | (bits.cin & (bits.a ^ bits.b));
      $("[data-sx-source-value]").textContent = `${bits.a} ${bits.b} ${bits.cin}`;
      $("[data-sx-output-value]").textContent = `S=${sum} C=${carry}`;
      $("[data-sx-status]").textContent = `A=${bits.a}, B=${bits.b}, Cin=${bits.cin} produces Sum=${sum} and Carry=${carry}.`;
      $("[data-sx-node=logic]").classList.add("is-active");
      $("[data-sx-node=output]").classList.toggle("is-active", carry === 1 || sum === 1);
    } else {
      const value = Number($("[data-sx-reload]").value) || 1;
      $("[data-sx-source-value]").textContent = "WRITE";
      $("[data-sx-logic-value]").textContent = "AW + W + B";
      $("[data-sx-output-value]").textContent = `RELOAD=${value}`;
      $("[data-sx-status]").textContent = "Choose a value and trace its write from the UVM driver through AXI4-Lite to RELOAD.";
      $("[data-sx-node=source]").classList.add("is-active");
    }

    root.querySelectorAll("[data-sx-bit-value]").forEach((output) => {
      output.textContent = String(bits[output.dataset.sxBitValue]);
    });
  }

  stageButtons.forEach((button) => button.addEventListener("click", () => {
    traceTimers.forEach(window.clearTimeout);
    traceTimers = [];
    window.clearTimeout(svgPulseTimer);
    activePulsedWires.forEach((wire) => wire.classList.remove("is-flowing"));
    activePulsedWires = [];
    stage = button.dataset.sxStage;
    render();
  }));

  root.querySelectorAll("[data-sx-bit]").forEach((button) => button.addEventListener("click", () => {
    const bit = button.dataset.sxBit;
    bits[bit] = 1 - bits[bit];
    render();
    if (stage === "adder") pulseAdder(bit);
    else pulseSvg();
  }));

  $("[data-sx-reload]").addEventListener("input", (event) => {
    const value = Math.max(1, Math.min(12, Number(event.target.value) || 1));
    $("[data-sx-output-value]").textContent = `RELOAD=${value}`;
    setDiagramNode(root.querySelector('[data-sx-svg="axi"]'), "reload", value);
  });

  $("[data-sx-trace]").addEventListener("click", () => {
    traceTimers.forEach(window.clearTimeout);
    traceTimers = [];
    const value = Math.max(1, Math.min(12, Number($("[data-sx-reload]").value) || 1));
    const svg = root.querySelector('[data-sx-svg="axi"]');
    const nodes = ["driver", "slave", "reload", "core", "monitor", "scoreboard"]
      .map((name) => svg.querySelector(`[data-sx-svg-node="${name}"]`));
    const wireSteps = [[], ["aw", "w"], ["reload", "timer"], ["bresp", "monitor", "score"]];
    const messages = [
      `UVM driver: prepare AWADDR=0x04 and WDATA=${value} with WSTRB=1111.`,
      "AXI4-Lite slave: address and data channels accepted; write commits to RELOAD.",
      `Timer core: programmed reload value ${value} is available when CONTROL starts the timer.`,
      "B response returns; monitor publishes the write and scoreboard checks the expected register value."
    ];
    svg.querySelectorAll("[data-sx-svg-node]").forEach((node) => node.classList.remove("is-active"));
    svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => { wire.dataset.level = "0"; wire.classList.remove("is-flowing"); });
    messages.forEach((message, index) => {
      traceTimers.push(window.setTimeout(() => {
        nodes.forEach((node) => node.classList.remove("is-active"));
        const active = index === 3 ? nodes.slice(4) : [nodes[index]];
        active.forEach((node) => node.classList.add("is-active"));
        svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => {
          wire.dataset.level = String(wireSteps[index].includes(wire.dataset.sxSvgWire) ? 1 : 0);
        });
        $("[data-sx-status]").textContent = message;
        pulseSvg(wireSteps[index]);
      }, index * 900));
    });
  });

  render();
})();
