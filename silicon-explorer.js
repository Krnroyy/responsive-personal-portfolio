(() => {
  "use strict";
  const root = document.querySelector("#silicon-explorer");
  if (!root || root.dataset.ready === "true") return;
  root.dataset.ready = "true";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const $ = (selector) => root.querySelector(selector);
  const stageButtons = [...root.querySelectorAll("[data-sx-stage]")];
  const bits = { a: 0, b: 0, cin: 0 };
  const circuit = { inverterY: 1, p: 0, g: 0, t: 0, sum: 0, carry: 0 };
  // Keep the actual modeled register separate from the user's pending write value.
  const peripheral = { reload: 5 };
  const signalTravelMs = 600;
  const gateDelayMs = 220;
  const stageDelayMs = reducedMotion.matches ? 0 : signalTravelMs + gateDelayMs;
  const stages = {
    inverter: {
      kicker: "CMOS LOGIC · LEARNING MODEL",
      title: "CMOS inverter",
      description: "Toggle input A and trace its logic value through the inverter. This simplified diagram teaches the NOT function; it is not a transistor-level simulation.",
      info: "A low input turns the PMOS on and NMOS off; a high input does the opposite. The visible settling delay is exaggerated for clarity, not transistor timing.",
      tipDefault: "The input travels to the inverter, then the output settles after an illustrative gate delay.",
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
      tipDefault: "Watch A/B reach XOR1 and AND1, then P and Cin reach the output gates. Delays are illustrative, not device timing.",
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
      info: "AW and W are independent write channels; a register write commits after both have been captured. The B response completes that write. CONTROL.START is a separate command that loads RELOAD into the timer core.",
      tipDefault: "One possible timing: AW and W handshake independently; the write commits after both are captured.",
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
  let timelineId = 0;
  let isSettling = false;

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
    }, reducedMotion.matches ? 0 : signalTravelMs);
  }

  function clearTimeline() {
    traceTimers.forEach(window.clearTimeout);
    traceTimers = [];
    timelineId += 1;
    window.clearTimeout(svgPulseTimer);
    activePulsedWires.forEach((wire) => wire.classList.remove("is-flowing"));
    activePulsedWires = [];
    root.querySelectorAll(".is-settling").forEach((part) => part.classList.remove("is-settling"));
    return timelineId;
  }

  function schedule(run, delay, callback) {
    traceTimers.push(window.setTimeout(() => {
      if (run === timelineId) callback();
    }, delay));
  }

  function settleCircuit() {
    circuit.inverterY = 1 - bits.a;
    circuit.p = bits.a ^ bits.b;
    circuit.g = bits.a & bits.b;
    circuit.t = circuit.p & bits.cin;
    circuit.sum = circuit.p ^ bits.cin;
    circuit.carry = circuit.g | circuit.t;
  }

  function markSettling(svg, names) {
    names.forEach((name) => svg.querySelector(`[data-sx-svg-node="${name}"]`)?.classList.add("is-settling"));
  }

  function startInverterPropagation(run) {
    isSettling = true;
    const svg = root.querySelector('[data-sx-svg="inverter"]');
    markSettling(svg, ["gate"]);
    render();
    pulseSvg(["a"]);
    schedule(run, stageDelayMs, () => {
      circuit.inverterY = 1 - bits.a;
      isSettling = false;
      svg.querySelector('[data-sx-svg-node="gate"]').classList.remove("is-settling");
      render();
      pulseSvg(["y"]);
    });
  }

  function startAdderPropagation(bit, run) {
    isSettling = true;
    const svg = root.querySelector('[data-sx-svg="adder"]');
    const inputWires = bit === "cin" ? ["cin-sum", "cin-t"] : [`${bit}-p`, `${bit}-g`];
    const inputGates = bit === "cin" ? ["xor2", "and2"] : ["xor1", "and1"];
    markSettling(svg, inputGates);
    render();
    pulseSvg(inputWires);

    if (bit === "cin") {
      schedule(run, stageDelayMs, () => {
        circuit.t = circuit.p & bits.cin;
        circuit.sum = circuit.p ^ bits.cin;
        svg.querySelector('[data-sx-svg-node="xor2"]').classList.remove("is-settling");
        svg.querySelector('[data-sx-svg-node="and2"]').classList.remove("is-settling");
        markSettling(svg, ["or"]);
        render();
        pulseSvg(["sum-out", "t-c"]);
        schedule(run, stageDelayMs, () => {
          circuit.carry = circuit.g | circuit.t;
          isSettling = false;
          svg.querySelector('[data-sx-svg-node="or"]').classList.remove("is-settling");
          render();
          pulseSvg(["carry-out"]);
        });
      });
      return;
    }

    schedule(run, stageDelayMs, () => {
      circuit.p = bits.a ^ bits.b;
      circuit.g = bits.a & bits.b;
      svg.querySelector('[data-sx-svg-node="xor1"]').classList.remove("is-settling");
      svg.querySelector('[data-sx-svg-node="and1"]').classList.remove("is-settling");
      markSettling(svg, ["xor2", "and2", "or"]);
      render();
      pulseSvg(["p-sum", "p-t", "g-c"]);
      schedule(run, stageDelayMs, () => {
        circuit.t = circuit.p & bits.cin;
        circuit.sum = circuit.p ^ bits.cin;
        svg.querySelector('[data-sx-svg-node="xor2"]').classList.remove("is-settling");
        svg.querySelector('[data-sx-svg-node="and2"]').classList.remove("is-settling");
        render();
        pulseSvg(["sum-out", "t-c"]);
        schedule(run, stageDelayMs, () => {
          circuit.carry = circuit.g | circuit.t;
          isSettling = false;
          svg.querySelector('[data-sx-svg-node="or"]').classList.remove("is-settling");
          render();
          pulseSvg(["carry-out"]);
        });
      });
    });
  }

  function startAxiTrace() {
    const run = clearTimeline();
    const svg = root.querySelector('[data-sx-svg="axi"]');
    const value = Math.max(1, Math.min(12, Number($("[data-sx-reload]").value) || 1));
    const nodes = Object.fromEntries(["driver", "slave", "reload", "core", "monitor", "scoreboard"]
      .map((name) => [name, svg.querySelector(`[data-sx-svg-node="${name}"]`)]));
    // Deliberately slowed browser phases; these are not literal AXI clock periods.
    const phaseMs = reducedMotion.matches ? 0 : 720;
    const steps = [
      { after: 0, active: ["driver"], wires: [], message: `Driver presents AWADDR=0x04 and WDATA=${value} with WSTRB=1111 on separate channels.` },
      { after: phaseMs, active: ["slave"], wires: ["aw"], slave: "AW captured", message: "Illustrative phase 1: AWVALID and AWREADY meet; the address is captured. This animation shows AW arriving first; real AXI allows either order." },
      { after: phaseMs * 2, active: ["slave"], wires: ["w"], slave: "AW + W", message: "Illustrative phase 2: WVALID and WREADY meet; data and byte strobes are captured. Both write channels are now available." },
      { after: phaseMs * 3, active: ["reload"], wires: ["reload"], slave: "Committed", reload: value, message: `After both handshakes, the register block commits ${value} to RELOAD. The timer core has not started.` },
      { after: phaseMs * 4, active: ["driver", "slave"], wires: ["bresp"], slave: "B response", message: "BVALID returns; BREADY completes the write-response handshake." },
      { after: phaseMs * 5, active: ["monitor"], wires: ["monitor"], message: "The monitor publishes the completed bus transaction to its analysis port." },
      { after: phaseMs * 6, active: ["scoreboard"], wires: ["score"], message: "The scoreboard receives the observed write and checks its expected model. To run the timer, a separate CONTROL.START write loads RELOAD into the core." }
    ];

    svg.querySelectorAll("[data-sx-svg-node]").forEach((node) => {
      node.classList.remove("is-active");
      node.dataset.level = "0";
    });
    svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => { wire.dataset.level = "0"; });
    setDiagramNode(svg, "slave", "Waiting", 0, "slave");
    setDiagramNode(svg, "driver", `write ${value}`, 0, "driver");
    setDiagramNode(svg, "reload", peripheral.reload, peripheral.reload ? 1 : 0);

    steps.forEach((step) => schedule(run, step.after, () => {
      svg.querySelectorAll("[data-sx-svg-node]").forEach((node) => {
        node.classList.remove("is-active");
        node.dataset.level = "0";
      });
      step.active.forEach((name) => {
        nodes[name].classList.add("is-active");
        nodes[name].dataset.level = "1";
      });
      svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => {
        wire.dataset.level = String(step.wires.includes(wire.dataset.sxSvgWire) ? 1 : 0);
      });
      if (step.slave) setDiagramNode(svg, "slave", step.slave, 1, "slave");
      if (step.reload !== undefined) {
        peripheral.reload = step.reload;
        setDiagramNode(svg, "reload", peripheral.reload, 1);
        $(`[data-sx-output-value]`).textContent = `stored=${peripheral.reload}`;
      }
      $("[data-sx-status]").textContent = step.message;
      if (step.wires.length) pulseSvg(step.wires);
    }));
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
      const y = circuit.inverterY;
      setDiagramNode(svg, "a", `A = ${bits.a}`, bits.a);
      setDiagramNode(svg, "y", `Y = ${y}`, y);
      svg.querySelector('[data-sx-svg-node="gate"]').dataset.level = String(y);
      svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => {
        wire.dataset.level = String(wire.dataset.sxSvgWire === "a" ? bits.a : y);
      });
    } else if (stage === "adder") {
      const svg = root.querySelector('[data-sx-svg="adder"]');
      const { p, g, t, sum, carry } = circuit;
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
      svg.querySelectorAll("[data-sx-svg-node]").forEach((node) => {
        node.classList.remove("is-active");
        node.dataset.level = "0";
      });
      setDiagramNode(svg, "reload", peripheral.reload, peripheral.reload ? 1 : 0);
      setDiagramNode(svg, "driver", `write ${Number($("[data-sx-reload]").value) || 1}`, 0, "driver");
      setDiagramNode(svg, "slave", "Waiting", 0, "slave");
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
      const output = circuit.inverterY;
      $("[data-sx-source-value]").textContent = String(bits.a);
      $("[data-sx-output-value]").textContent = String(output);
      $("[data-sx-status]").textContent = isSettling
        ? `A changed to ${bits.a}; the PMOS/NMOS pair is switching before Y settles.`
        : bits.a
          ? "A=1: PMOS is off and NMOS is on, pulling Y low."
          : "A=0: PMOS is on and NMOS is off, pulling Y high.";
      $("[data-sx-node=source]").classList.add("is-active");
      $("[data-sx-node=output]").classList.toggle("is-active", output === 1);
    } else if (stage === "adder") {
      const { sum, carry } = circuit;
      $("[data-sx-source-value]").textContent = `${bits.a} ${bits.b} ${bits.cin}`;
      $("[data-sx-output-value]").textContent = `S=${sum} C=${carry}`;
      $("[data-sx-status]").textContent = isSettling
        ? "The changed input is propagating through the XOR/AND stages; the OR carry stage settles last."
        : `A=${bits.a}, B=${bits.b}, Cin=${bits.cin} produces Sum=${sum} and Carry=${carry}.`;
      $("[data-sx-node=logic]").classList.add("is-active");
      $("[data-sx-node=output]").classList.toggle("is-active", carry === 1 || sum === 1);
    } else {
      const value = Number($("[data-sx-reload]").value) || 1;
      $("[data-sx-source-value]").textContent = "WRITE";
      $("[data-sx-logic-value]").textContent = "AW + W + B";
      $("[data-sx-output-value]").textContent = `stored=${peripheral.reload}`;
      $("[data-sx-status]").textContent = `RELOAD currently stores ${peripheral.reload}. Choose ${value} and trace its write; CONTROL.START is separate.`;
      $("[data-sx-node=source]").classList.add("is-active");
    }

    root.querySelectorAll("[data-sx-bit-value]").forEach((output) => {
      output.textContent = String(bits[output.dataset.sxBitValue]);
    });
  }

  stageButtons.forEach((button) => button.addEventListener("click", () => {
    clearTimeline();
    isSettling = false;
    stage = button.dataset.sxStage;
    settleCircuit();
    render();
  }));

  root.querySelectorAll("[data-sx-bit]").forEach((button) => button.addEventListener("click", () => {
    const run = clearTimeline();
    const bit = button.dataset.sxBit;
    bits[bit] = 1 - bits[bit];
    if (stage === "adder") startAdderPropagation(bit, run);
    else if (stage === "inverter") startInverterPropagation(run);
  }));

  $("[data-sx-reload]").addEventListener("input", (event) => {
    clearTimeline();
    const value = Math.max(1, Math.min(12, Number(event.target.value) || 1));
    $("[data-sx-output-value]").textContent = `write ${value}`;
    const svg = root.querySelector('[data-sx-svg="axi"]');
    svg.querySelectorAll("[data-sx-svg-node]").forEach((node) => {
      node.classList.remove("is-active");
      node.dataset.level = "0";
    });
    svg.querySelectorAll("[data-sx-svg-wire]").forEach((wire) => { wire.dataset.level = "0"; });
    setDiagramNode(svg, "slave", "Waiting", 0, "slave");
    setDiagramNode(svg, "driver", `write ${value}`, 0, "driver");
    setDiagramNode(svg, "reload", peripheral.reload, peripheral.reload ? 1 : 0);
    if (stage === "axi") {
      $("[data-sx-output-value]").textContent = `stored=${peripheral.reload}`;
      $("[data-sx-status]").textContent = `Write value set to ${value}; RELOAD still stores ${peripheral.reload}. Trace to commit it.`;
    }
  });

  $("[data-sx-trace]").addEventListener("click", startAxiTrace);

  render();
})();
