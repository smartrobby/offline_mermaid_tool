const samples = {
  flowchart: `flowchart LR
    Start([Start]) --> Input[/User Input/]
    Input --> Decision{Valid?}
    Decision -- Yes --> Save[Save Data]
    Decision -- No --> Retry[Show Error]
    Retry --> Input
    Save --> End([Done])`,
  sequence: `sequenceDiagram
    participant U as User
    participant A as App
    participant DB as DB
    U->>A: Submit form
    A->>DB: Insert row
    DB-->>A: OK
    A-->>U: Success`,
  class: `classDiagram
    class User {
      +id: int
      +name: string
      +login()
    }
    class AuthService {
      +validate(user)
    }
    User --> AuthService : uses`,
  state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Running: start
    Running --> Error: fail
    Error --> Idle: reset
    Running --> [*]: stop`,
  er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : referenced_by`
};

const state = {
  nodes: [],
  edges: [],
  connectMode: false,
  activeSource: null,
  nextNodeId: 1
};

const codeInput = document.getElementById("codeInput");
const preview = document.getElementById("preview");
const diagramType = document.getElementById("diagramType");
const sampleButtons = document.getElementById("sampleButtons");
const builderCanvas = document.getElementById("builderCanvas");
const edgeLayer = document.getElementById("edgeLayer");
const addNodeBtn = document.getElementById("addNodeBtn");
const connectModeBtn = document.getElementById("connectModeBtn");

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "default"
});

function createSampleButtons() {
  for (const type of Object.keys(samples)) {
    const btn = document.createElement("button");
    btn.textContent = type;
    btn.addEventListener("click", () => {
      diagramType.value = type;
      codeInput.value = samples[type];
      renderMermaid();
      if (type === "flowchart") {
        importFlowchartToBuilder();
      }
    });
    sampleButtons.appendChild(btn);
  }
}

function randomPos(max) {
  return 40 + Math.floor(Math.random() * max);
}

function addNode(label = "Node") {
  const id = `N${state.nextNodeId++}`;
  const node = { id, label, x: randomPos(500), y: randomPos(220) };
  state.nodes.push(node);
  drawBuilder();
  syncFlowchartCodeFromBuilder();
}

function drawBuilder() {
  builderCanvas.querySelectorAll(".node").forEach((n) => n.remove());
  edgeLayer.innerHTML = `
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L10,4 L0,8 z" fill="#58607a"></path>
      </marker>
    </defs>
  `;

  state.edges.forEach((edge) => {
    const from = state.nodes.find((n) => n.id === edge.from);
    const to = state.nodes.find((n) => n.id === edge.to);
    if (!from || !to) {
      return;
    }
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", from.x + 65);
    line.setAttribute("y1", from.y + 35);
    line.setAttribute("x2", to.x + 65);
    line.setAttribute("y2", to.y + 35);
    line.setAttribute("stroke", "#58607a");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#arrow)");
    edgeLayer.appendChild(line);

    if (edge.label) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = edge.label;
      text.setAttribute("x", (from.x + to.x) / 2 + 70);
      text.setAttribute("y", (from.y + to.y) / 2 + 28);
      text.setAttribute("fill", "#202431");
      text.setAttribute("font-size", "12");
      edgeLayer.appendChild(text);
    }
  });

  state.nodes.forEach((node) => {
    const el = document.createElement("div");
    el.className = "node";
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.dataset.id = node.id;
    if (state.activeSource === node.id) {
      el.classList.add("connect-target");
    }

    const idSpan = document.createElement("div");
    idSpan.className = "id";
    idSpan.textContent = node.id;

    const labelDiv = document.createElement("div");
    labelDiv.className = "label";
    labelDiv.textContent = node.label;

    labelDiv.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const newLabel = prompt("Node label", node.label);
      if (newLabel && newLabel.trim()) {
        node.label = newLabel.trim();
        drawBuilder();
        syncFlowchartCodeFromBuilder();
      }
    });

    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm(`Delete ${node.id}?`)) {
        state.nodes = state.nodes.filter((n) => n.id !== node.id);
        state.edges = state.edges.filter((ed) => ed.from !== node.id && ed.to !== node.id);
        drawBuilder();
        syncFlowchartCodeFromBuilder();
      }
    });

    makeDraggable(el, node);
    el.addEventListener("click", () => handleConnectClick(node.id));

    el.append(idSpan, labelDiv);
    builderCanvas.appendChild(el);
  });
}

function handleConnectClick(nodeId) {
  if (!state.connectMode) {
    return;
  }
  if (!state.activeSource) {
    state.activeSource = nodeId;
    drawBuilder();
    return;
  }
  if (state.activeSource === nodeId) {
    state.activeSource = null;
    drawBuilder();
    return;
  }

  const label = prompt("Edge label (optional)", "")?.trim() ?? "";
  state.edges.push({ from: state.activeSource, to: nodeId, label });
  state.activeSource = null;
  drawBuilder();
  syncFlowchartCodeFromBuilder();
}

function makeDraggable(el, node) {
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  el.addEventListener("mousedown", (e) => {
    if (state.connectMode) {
      return;
    }
    dragging = true;
    offsetX = e.clientX - node.x;
    offsetY = e.clientY - node.y;
    el.style.zIndex = "10";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) {
      return;
    }
    const rect = builderCanvas.getBoundingClientRect();
    node.x = Math.min(Math.max(0, e.clientX - rect.left - offsetX), rect.width - 130);
    node.y = Math.min(Math.max(0, e.clientY - rect.top - offsetY), rect.height - 72);
    drawBuilder();
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    el.style.zIndex = "";
    syncFlowchartCodeFromBuilder();
  });
}

function sanitizeLabel(str) {
  return str.replace(/"/g, "'");
}

function syncFlowchartCodeFromBuilder() {
  if (diagramType.value !== "flowchart") {
    return;
  }
  const lines = ["flowchart LR"];
  state.nodes.forEach((n) => lines.push(`  ${n.id}[\"${sanitizeLabel(n.label)}\"]`));
  state.edges.forEach((e) => {
    const via = e.label ? `|${sanitizeLabel(e.label)}|` : "";
    lines.push(`  ${e.from} -->${via} ${e.to}`);
  });
  codeInput.value = lines.join("\n");
  renderMermaid();
}

function importFlowchartToBuilder() {
  const text = codeInput.value;
  if (!text.trim().startsWith("flowchart")) {
    return;
  }

  const idLabel = /^(\w+)\["?(.+?)"?\]$/;
  const edgePattern = /^(\w+)\s*-->\s*(?:\|(.+?)\|\s*)?(\w+)$/;
  state.nodes = [];
  state.edges = [];

  text
    .split("\n")
    .map((line) => line.trim())
    .forEach((line) => {
      const nodeMatch = line.match(idLabel);
      if (nodeMatch) {
        const [, id, label] = nodeMatch;
        state.nodes.push({ id, label, x: randomPos(520), y: randomPos(240) });
        const num = Number(id.replace(/\D/g, ""));
        if (!Number.isNaN(num)) {
          state.nextNodeId = Math.max(state.nextNodeId, num + 1);
        }
        return;
      }

      const edgeMatch = line.match(edgePattern);
      if (edgeMatch) {
        const [, from, label = "", to] = edgeMatch;
        state.edges.push({ from, to, label });
      }
    });

  if (state.nodes.length === 0) {
    addNode("Start");
    addNode("Step");
  } else {
    drawBuilder();
  }
}

async function renderMermaid() {
  const source = codeInput.value.trim();
  if (!source) {
    preview.innerHTML = "";
    return;
  }

  try {
    const id = `mermaid-${Date.now()}`;
    const { svg } = await mermaid.render(id, source);
    preview.innerHTML = svg;
  } catch (err) {
    preview.innerHTML = `<div class="error">${String(err.message || err)}</div>`;
  }
}

function downloadSvg() {
  const svg = preview.querySelector("svg");
  if (!svg) {
    alert("Render a diagram first.");
    return;
  }
  const data = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "diagram.svg";
  a.click();
  URL.revokeObjectURL(url);
}

function resetBuilder() {
  state.nodes = [];
  state.edges = [];
  state.nextNodeId = 1;
  state.activeSource = null;
  addNode("Start");
  addNode("Task");
}

document.getElementById("renderBtn").addEventListener("click", renderMermaid);
document.getElementById("downloadSvgBtn").addEventListener("click", downloadSvg);
document.getElementById("resetBtn").addEventListener("click", resetBuilder);

diagramType.addEventListener("change", () => {
  codeInput.value = samples[diagramType.value];
  renderMermaid();
  if (diagramType.value === "flowchart") {
    importFlowchartToBuilder();
  }
});

addNodeBtn.addEventListener("click", () => addNode(`Step ${state.nextNodeId}`));
connectModeBtn.addEventListener("click", () => {
  state.connectMode = !state.connectMode;
  connectModeBtn.dataset.mode = state.connectMode ? "on" : "off";
  connectModeBtn.textContent = `Connect: ${state.connectMode ? "On" : "Off"}`;
  state.activeSource = null;
  drawBuilder();
});

codeInput.addEventListener("input", () => {
  if (diagramType.value === "flowchart") {
    importFlowchartToBuilder();
  }
  renderMermaid();
});

createSampleButtons();
codeInput.value = samples.flowchart;
importFlowchartToBuilder();
renderMermaid();
