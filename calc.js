const display = document.getElementById("display");
const history = document.getElementById("history");
const buttons = document.querySelector(".buttons");

const state = {
  current: "0",
  previous: null,
  operator: null,
  justCalculated: false,
};

const formatter = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 12,
});

function formatValue(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  const asString = String(value);
  if (asString.includes("e")) {
    return asString;
  }

  const [intPart, decimalPart] = asString.split(".");
  const formattedInt = formatter.format(Number(intPart));
  return decimalPart ? `${formattedInt}.${decimalPart}` : formattedInt;
}

function updateDisplay() {
  const num = Number(state.current);
  display.textContent = state.current === "Error" ? "Error" : formatValue(num);

  if (state.previous !== null && state.operator) {
    const symbol = getOperatorSymbol(state.operator);
    history.textContent = `${formatValue(Number(state.previous))} ${symbol}`;
  } else {
    history.textContent = "";
  }
}

function getOperatorSymbol(op) {
  const map = {
    "+": "＋",
    "-": "−",
    "*": "×",
    "/": "÷",
  };
  return map[op] || op;
}

function calculate(previous, current, operator) {
  const a = Number(previous);
  const b = Number(current);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return "Error";
  }

  switch (operator) {
    case "+":
      return String(a + b);
    case "-":
      return String(a - b);
    case "*":
      return String(a * b);
    case "/":
      if (b === 0) {
        return "Error";
      }
      return String(a / b);
    default:
      return current;
  }
}

function inputNumber(value) {
  if (state.current === "Error") {
    state.current = value;
    state.justCalculated = false;
    return;
  }

  if (state.justCalculated) {
    state.current = value;
    state.justCalculated = false;
    return;
  }

  state.current = state.current === "0" ? value : state.current + value;
}

function inputDecimal() {
  if (state.justCalculated) {
    state.current = "0.";
    state.justCalculated = false;
    return;
  }

  if (!state.current.includes(".")) {
    state.current += ".";
  }
}

function setOperator(nextOperator) {
  if (state.current === "Error") {
    return;
  }

  if (state.operator && state.previous !== null && !state.justCalculated) {
    state.current = calculate(state.previous, state.current, state.operator);
    if (state.current === "Error") {
      state.previous = null;
      state.operator = null;
      return;
    }
    state.previous = state.current;
  } else {
    state.previous = state.current;
  }

  state.operator = nextOperator;
  state.current = "0";
  state.justCalculated = false;
}

function doEquals() {
  if (!state.operator || state.previous === null || state.current === "Error") {
    return;
  }

  history.textContent = `${formatValue(Number(state.previous))} ${getOperatorSymbol(state.operator)} ${formatValue(Number(state.current))} =`;
  state.current = calculate(state.previous, state.current, state.operator);
  state.previous = null;
  state.operator = null;
  state.justCalculated = true;
}

function clearAll() {
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.justCalculated = false;
}

function backspace() {
  if (state.justCalculated || state.current === "Error") {
    clearAll();
    return;
  }

  if (state.current.length <= 1) {
    state.current = "0";
    return;
  }

  state.current = state.current.slice(0, -1);
}

function percentage() {
  if (state.current === "Error") {
    return;
  }

  state.current = String(Number(state.current) / 100);
}

buttons.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  const value = target.dataset.value;

  switch (action) {
    case "number":
      inputNumber(value);
      break;
    case "decimal":
      inputDecimal();
      break;
    case "operator":
      setOperator(value);
      break;
    case "equals":
      doEquals();
      break;
    case "clear":
      clearAll();
      break;
    case "backspace":
      backspace();
      break;
    case "percent":
      percentage();
      break;
    default:
      break;
  }

  updateDisplay();
});

window.addEventListener("keydown", (event) => {
  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    inputNumber(key);
  } else if (key === ".") {
    inputDecimal();
  } else if (["+", "-", "*", "/"].includes(key)) {
    setOperator(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    doEquals();
  } else if (key === "Backspace") {
    backspace();
  } else if (key === "Escape") {
    clearAll();
  } else if (key === "%") {
    percentage();
  } else {
    return;
  }

  updateDisplay();
});

updateDisplay();
