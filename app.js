// Prices (same as your Java constants)
const PRICES = {
  regular: 13.0,
  double: 19.5,
  potty: 6.5,
  petsit: 45.0
};

// State (counts + history for undo)
const state = {
  counts: { regular: 0, double: 0, potty: 0, petsit: 0 },
  history: [] // stack of actions like { type: "regular" }
};

function money(n) {
  return `$${n.toFixed(2)}`;
}

function subtotals() {
  return {
    regular: state.counts.regular * PRICES.regular,
    double: state.counts.double * PRICES.double,
    potty: state.counts.potty * PRICES.potty,
    petsit: state.counts.petsit * PRICES.petsit
  };
}

function total() {
  const s = subtotals();
  return s.regular + s.double + s.potty + s.petsit;
}

function render() {
  const s = subtotals();

  const summaryLines = [
    `Regular Walks (${state.counts.regular}) - subtotal: ${money(s.regular)}`,
    `Double Walks  (${state.counts.double}) - subtotal: ${money(s.double)}`,
    `Potty Breaks  (${state.counts.potty}) - subtotal: ${money(s.potty)}`,
    `Pet Sits      (${state.counts.petsit}) - subtotal: ${money(s.petsit)}`
  ];

  document.getElementById("summaryText").textContent = summaryLines.join("\n");
  document.getElementById("totalText").textContent = money(total());

  // disable undo if nothing to undo
  document.getElementById("btn-undo").disabled = state.history.length === 0;
}

function add(type) {
  state.counts[type] += 1;
  state.history.push({ type });
  render();
}

function undo() {
  const last = state.history.pop();
  if (!last) return;

  state.counts[last.type] = Math.max(0, state.counts[last.type] - 1);
  render();
}

function resetAll() {
  state.counts = { regular: 0, double: 0, potty: 0, petsit: 0 };
  state.history = [];
  render();
}

// Wire up buttons
document.getElementById("btn-regular").addEventListener("click", () => add("regular"));
document.getElementById("btn-double").addEventListener("click", () => add("double"));
document.getElementById("btn-potty").addEventListener("click", () => add("potty"));
document.getElementById("btn-petsit").addEventListener("click", () => add("petsit"));

document.getElementById("btn-undo").addEventListener("click", undo);
document.getElementById("btn-reset").addEventListener("click", resetAll);

// Initial render
render();

// Register service worker for offline support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}

