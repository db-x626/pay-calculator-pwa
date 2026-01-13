// ---------- Defaults ----------
const DEFAULT_PRICES = {
  regular: 13.0,
  double: 19.5,
  potty: 6.5,
  petsit: 45.0
};

const STORAGE_KEY_RATES = "paycalc_rates_v1";

// ---------- State ----------
const state = {
  prices: loadRates(),
  counts: { regular: 0, double: 0, potty: 0, petsit: 0 },
  miscTotal: 0,
  history: [] // actions: { kind:"service", type } or { kind:"misc", amount }
};

// ---------- Helpers ----------
function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function loadRates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RATES);
    if (!raw) return { ...DEFAULT_PRICES };
    const parsed = JSON.parse(raw);

    // sanitize + fallback
    return {
      regular: validNum(parsed.regular) ? Number(parsed.regular) : DEFAULT_PRICES.regular,
      double: validNum(parsed.double) ? Number(parsed.double) : DEFAULT_PRICES.double,
      potty: validNum(parsed.potty) ? Number(parsed.potty) : DEFAULT_PRICES.potty,
      petsit: validNum(parsed.petsit) ? Number(parsed.petsit) : DEFAULT_PRICES.petsit
    };
  } catch {
    return { ...DEFAULT_PRICES };
  }
}

function saveRates(prices) {
  localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(prices));
}

function validNum(x) {
  return typeof x === "number" ? Number.isFinite(x) : x !== null && x !== "" && Number.isFinite(Number(x));
}

function subtotals() {
  return {
    regular: state.counts.regular * state.prices.regular,
    double: state.counts.double * state.prices.double,
    potty: state.counts.potty * state.prices.potty,
    petsit: state.counts.petsit * state.prices.petsit
  };
}

function total() {
  const s = subtotals();
  return s.regular + s.double + s.potty + s.petsit + state.miscTotal;
}

// ---------- Render ----------
function render() {
  // Update button labels to reflect current rates
  document.getElementById("btn-regular").textContent = `Regular Walk (+${money(state.prices.regular)})`;
  document.getElementById("btn-double").textContent = `Double Walk (+${money(state.prices.double)})`;
  document.getElementById("btn-potty").textContent = `Potty Break (+${money(state.prices.potty)})`;
  document.getElementById("btn-petsit").textContent = `Pet Sit (+${money(state.prices.petsit)})`;

  // Update rates inputs
  const rReg = document.getElementById("rate-regular");
  const rDou = document.getElementById("rate-double");
  const rPot = document.getElementById("rate-potty");
  const rSit = document.getElementById("rate-petsit");
  if (rReg) rReg.value = state.prices.regular;
  if (rDou) rDou.value = state.prices.double;
  if (rPot) rPot.value = state.prices.potty;
  if (rSit) rSit.value = state.prices.petsit;

  // Summary text
  const s = subtotals();
  const summaryLines = [
    `Regular Walks (${state.counts.regular}) - subtotal: ${money(s.regular)}`,
    `Double Walks  (${state.counts.double}) - subtotal: ${money(s.double)}`,
    `Potty Breaks  (${state.counts.potty}) - subtotal: ${money(s.potty)}`,
    `Pet Sits      (${state.counts.petsit}) - subtotal: ${money(s.petsit)}`,
    `Misc          - subtotal: ${money(state.miscTotal)}`
  ];

  document.getElementById("summaryText").textContent = summaryLines.join("\n");
  document.getElementById("totalText").textContent = money(total());

  // disable undo if nothing to undo
  document.getElementById("btn-undo").disabled = state.history.length === 0;
}

// ---------- Actions ----------
function addService(type) {
  state.counts[type] += 1;
  state.history.push({ kind: "service", type });
  render();
}

function addMisc(amount) {
  state.miscTotal += amount;
  state.history.push({ kind: "misc", amount });
  render();
}

function undo() {
  const last = state.history.pop();
  if (!last) return;

  if (last.kind === "service") {
    state.counts[last.type] = Math.max(0, state.counts[last.type] - 1);
  } else if (last.kind === "misc") {
    state.miscTotal = Math.max(0, state.miscTotal - last.amount);
  }

  render();
}

function resetAll() {
  state.counts = { regular: 0, double: 0, potty: 0, petsit: 0 };
  state.miscTotal = 0;
  state.history = [];
  render();
}

// ---------- Rates UI ----------
function readRatesFromInputs() {
  const reg = Number(document.getElementById("rate-regular").value);
  const dou = Number(document.getElementById("rate-double").value);
  const pot = Number(document.getElementById("rate-potty").value);
  const sit = Number(document.getElementById("rate-petsit").value);

  // basic validation: rates must be finite and >= 0
  const next = {
    regular: Number.isFinite(reg) && reg >= 0 ? reg : state.prices.regular,
    double: Number.isFinite(dou) && dou >= 0 ? dou : state.prices.double,
    potty: Number.isFinite(pot) && pot >= 0 ? pot : state.prices.potty,
    petsit: Number.isFinite(sit) && sit >= 0 ? sit : state.prices.petsit
  };

  return next;
}

function saveRatesFromUI() {
  const next = readRatesFromInputs();
  state.prices = next;
  saveRates(next);
  render();
}

function resetRatesToDefaults() {
  state.prices = { ...DEFAULT_PRICES };
  saveRates(state.prices);
  render();
}

// ---------- Wire up buttons ----------
document.getElementById("btn-regular").addEventListener("click", () => addService("regular"));
document.getElementById("btn-double").addEventListener("click", () => addService("double"));
document.getElementById("btn-potty").addEventListener("click", () => addService("potty"));
document.getElementById("btn-petsit").addEventListener("click", () => addService("petsit"));

document.getElementById("btn-undo").addEventListener("click", undo);
document.getElementById("btn-reset").addEventListener("click", resetAll);

// Misc
document.getElementById("btn-misc-add").addEventListener("click", () => {
  const input = document.getElementById("miscAmount");
  const value = Number(input.value);

  if (!Number.isFinite(value) || value === 0) {
    // do nothing on invalid/zero
    input.focus();
    return;
  }

  addMisc(value);
  input.value = "";
  input.focus();
});

// Rates
document.getElementById("btn-rates-save").addEventListener("click", saveRatesFromUI);
document.getElementById("btn-rates-reset").addEventListener("click", resetRatesToDefaults);

// Initial render
render();

// Service worker for offline support (keep as-is)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}
