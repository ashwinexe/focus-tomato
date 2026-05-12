const STORAGE_KEY = "focus-tomato-state";
const RING_LENGTH = 603.19;

const defaults = {
  lengths: {
    focus: 25,
    short: 5,
    long: 15,
  },
  mode: "focus",
  cycles: 0,
  intent: "",
};

const modeLabels = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

const state = {
  ...defaults,
  ...loadState(),
  isRunning: false,
  remainingSeconds: 0,
  totalSeconds: 0,
  intervalId: null,
};

const modeButtons = document.querySelectorAll(".mode-button");
const modeLabel = document.querySelector("#mode-label");
const timeLeft = document.querySelector("#time-left");
const ringProgress = document.querySelector("#ring-progress");
const startPauseButton = document.querySelector("#start-pause");
const resetButton = document.querySelector("#reset");
const skipButton = document.querySelector("#skip");
const cycleCount = document.querySelector("#cycle-count");
const intentForm = document.querySelector("#intent-form");
const intentInput = document.querySelector("#intent-input");
const intentPreview = document.querySelector("#intent-preview");
const lengthInputs = {
  focus: document.querySelector("#focus-length"),
  short: document.querySelector("#short-length"),
  long: document.querySelector("#long-length"),
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") {
      return {};
    }

    return {
      lengths: { ...defaults.lengths, ...saved.lengths },
      mode: saved.mode || defaults.mode,
      cycles: Number(saved.cycles) || 0,
      intent: saved.intent || "",
    };
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      lengths: state.lengths,
      mode: state.mode,
      cycles: state.cycles,
      intent: state.intent,
    }),
  );
}

function secondsForMode(mode) {
  return Math.max(1, Number(state.lengths[mode]) || defaults.lengths[mode]) * 60;
}

function setMode(mode, preserveProgress = false) {
  state.mode = mode;
  state.totalSeconds = secondsForMode(mode);

  if (!preserveProgress) {
    state.remainingSeconds = state.totalSeconds;
  }

  document.body.classList.toggle("short-mode", mode === "short");
  document.body.classList.toggle("long-mode", mode === "long");

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  modeLabel.textContent = modeLabels[mode];
  saveState();
  render();
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function render() {
  timeLeft.textContent = formatTime(state.remainingSeconds);
  cycleCount.textContent = state.cycles;
  startPauseButton.textContent = state.isRunning ? "Pause" : "Start";
  intentInput.value = state.intent;
  intentPreview.textContent = state.intent || "No focus set";

  Object.entries(lengthInputs).forEach(([mode, input]) => {
    input.value = state.lengths[mode];
  });

  const elapsed = state.totalSeconds - state.remainingSeconds;
  const progress = state.totalSeconds > 0 ? elapsed / state.totalSeconds : 0;
  ringProgress.style.strokeDashoffset = String(RING_LENGTH * progress);
}

function tick() {
  state.remainingSeconds -= 1;

  if (state.remainingSeconds <= 0) {
    completeMode();
    return;
  }

  render();
}

function startTimer() {
  if (state.isRunning) {
    return;
  }

  state.isRunning = true;
  state.intervalId = window.setInterval(tick, 1000);
  render();
}

function pauseTimer() {
  window.clearInterval(state.intervalId);
  state.intervalId = null;
  state.isRunning = false;
  render();
}

function resetTimer() {
  pauseTimer();
  state.remainingSeconds = secondsForMode(state.mode);
  state.totalSeconds = state.remainingSeconds;
  render();
}

function nextMode() {
  if (state.mode === "focus") {
    return state.cycles > 0 && state.cycles % 4 === 0 ? "long" : "short";
  }

  return "focus";
}

function completeMode() {
  if (state.mode === "focus") {
    state.cycles += 1;
  }

  pauseTimer();
  setMode(nextMode());
}

startPauseButton.addEventListener("click", () => {
  if (state.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetButton.addEventListener("click", resetTimer);

skipButton.addEventListener("click", completeMode);

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    pauseTimer();
    setMode(button.dataset.mode);
  });
});

intentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.intent = intentInput.value.trim();
  saveState();
  render();
});

Object.entries(lengthInputs).forEach(([mode, input]) => {
  input.addEventListener("change", () => {
    const value = Math.min(90, Math.max(1, Number(input.value) || defaults.lengths[mode]));
    state.lengths[mode] = value;

    if (state.mode === mode) {
      pauseTimer();
      state.totalSeconds = secondsForMode(mode);
      state.remainingSeconds = state.totalSeconds;
    }

    saveState();
    render();
  });
});

setMode(state.mode);
