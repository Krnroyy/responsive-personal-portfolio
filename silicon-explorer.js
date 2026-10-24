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
    const maxReach = 230;
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
        { x: rect.left + rect.width * .12, y: rect.top + rect.height * .48 },
        { x: rect.left + rect.width * .39, y: rect.top + 3 },
        { x: rect.right - 4, y: rect.top + rect.height * .55 },
        { x: rect.left + rect.width * .7, y: rect.bottom - 3 }
      ];
      venomThreads.forEach((path, index) => {
        const target = anchors[index % anchors.length];
        const dx = target.x - x;
        const dy = target.y - y;
        const length = Math.max(1, Math.hypot(dx, dy));
        const bend = (index % 2 ? 1 : -1) * (8 + 22 * (1 - intensity));
        const px = -dy / length * bend;
        const py = dx / length * bend;
        path.setAttribute("d", `M ${x} ${y} C ${x + dx * .26 + px} ${y + dy * .2 + py}, ${x + dx * .72 - px * .55} ${y + dy * .66 - py * .55}, ${target.x} ${target.y}`);
        const baseWidth = [2, 1.5, .8, .55][index];
        path.style.setProperty("--thread-width", `${baseWidth + intensity * (index === 0 ? 4 : 2)}px`);
        path.style.setProperty("--thread-opacity", String(.08 + intensity * (index === 0 ? .86 : .7)));
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

  // The tiny chip-and-wand sprite is only a visual cursor. Pointer events pass
  // through it, and the clicked control gets a short gold energy sweep.
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
      creature.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-28px, -3px)`;
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
      }, 800));
    });
  }

  const $ = (selector) => root.querySelector(selector);
  const stageButtons = [...root.querySelectorAll("[data-sx-stage]")];
  const bits = { a: 0, b: 0, cin: 0 };
  const stages = {
    inverter: {
      kicker: "TRANSISTOR-LEVEL IDEA",
      title: "CMOS inverter",
      description: "Toggle the input. A simplified PMOS/NMOS model shows why the output changes in the opposite direction.",
      info: "A CMOS inverter pairs PMOS and NMOS transistors. This is a learning illustration, not a transistor-level circuit simulation.",
      project: "CMOS full-adder project ↗",
      url: "https://github.com/Krnroyy/cadence-cmos-full-adder",
      sourceLabel: "INPUT A",
      logicLabel: "CMOS PAIR",
      logicValue: "INVERT",
      outputLabel: "OUTPUT Y"
    },
    adder: {
      kicker: "CMOS LOGIC · SPECTRE SIMULATION",
      title: "1-bit full adder",
      description: "Change A, B, or Cin. The Sum and Carry outputs update from the full-adder equations.",
      info: "Sum = A XOR B XOR Cin. Carry = (A AND B) OR (Cin AND (A XOR B)). The project documents all eight input combinations.",
      project: "CMOS full-adder project ↗",
      url: "https://github.com/Krnroyy/cadence-cmos-full-adder",
      sourceLabel: "INPUTS",
      logicLabel: "FULL ADDER",
      logicValue: "SUM / CARRY",
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

  function pulseRoute() {
    const route = $("[data-sx-route]");
    route.classList.remove("is-pulsing");
    void route.offsetWidth;
    route.classList.add("is-pulsing");
  }

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
      $("[data-sx-status]").textContent = "Choose a value and trace its write from the CPU to the timer register.";
      $("[data-sx-node=source]").classList.add("is-active");
    }

    root.querySelectorAll("[data-sx-bit-value]").forEach((output) => {
      output.textContent = String(bits[output.dataset.sxBitValue]);
    });
  }

  stageButtons.forEach((button) => button.addEventListener("click", () => {
    traceTimers.forEach(window.clearTimeout);
    traceTimers = [];
    stage = button.dataset.sxStage;
    render();
    pulseRoute();
  }));

  root.querySelectorAll("[data-sx-bit]").forEach((button) => button.addEventListener("click", () => {
    const bit = button.dataset.sxBit;
    bits[bit] = 1 - bits[bit];
    render();
    pulseRoute();
  }));

  $("[data-sx-reload]").addEventListener("input", (event) => {
    const value = Math.max(1, Math.min(12, Number(event.target.value) || 1));
    $("[data-sx-output-value]").textContent = `RELOAD=${value}`;
  });

  $("[data-sx-trace]").addEventListener("click", () => {
    traceTimers.forEach(window.clearTimeout);
    traceTimers = [];
    const value = Math.max(1, Math.min(12, Number($("[data-sx-reload]").value) || 1));
    const nodes = [...root.querySelectorAll("[data-sx-node]")];
    const messages = [
      `Driver: CPU prepares RELOAD = ${value}.`,
      "AXI4-Lite: address and write data are accepted.",
      `Monitor: timer register write observed; RELOAD = ${value}.`,
      "Scoreboard: expected register value recorded — PASS."
    ];
    nodes.forEach((node) => node.classList.remove("is-active"));
    messages.forEach((message, index) => {
      traceTimers.push(window.setTimeout(() => {
        nodes.forEach((node) => node.classList.remove("is-active"));
        nodes[Math.min(index, nodes.length - 1)].classList.add("is-active");
        $("[data-sx-status]").textContent = message;
        pulseRoute();
      }, index * 500));
    });
  });

  render();
})();
