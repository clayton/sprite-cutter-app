const state = {
  image: null,
  imageName: "sheet.png",
  boxes: [],
  pendingProject: null,
  selectedIndex: -1,
  dragMode: null,
  dragHandle: null,
  dragStart: null,
  dragOriginalBox: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  previewFrame: 0,
  previewPlaying: true,
  previewLastTime: 0,
  previewAccum: 0,
  previewPauseRemaining: 0,
  previewHoldTick: 0,
  previewSubLoopRemaining: null,
};

const samplePath = "./sample-wizard-sheet.png";

const editorCanvas = document.getElementById("editorCanvas");
const editorCtx = editorCanvas.getContext("2d");
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const sheetCanvas = document.getElementById("sheetCanvas");
const sheetCtx = sheetCanvas.getContext("2d");

const fileInput = document.getElementById("fileInput");
const projectFileInput = document.getElementById("projectFileInput");
const loadSampleBtn = document.getElementById("loadSampleBtn");
const themeCycleBtn = document.getElementById("themeCycleBtn");
const themeCycleIcon = document.getElementById("themeCycleIcon");
const autoDetectBtn = document.getElementById("autoDetectBtn");
const clearBoxesBtn = document.getElementById("clearBoxesBtn");
const sortBoxesBtn = document.getElementById("sortBoxesBtn");
const downloadSheetBtn = document.getElementById("downloadSheetBtn");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const duplicateSelectedBtn = document.getElementById("duplicateSelectedBtn");
const copyToAllBtn = document.getElementById("copyToAllBtn");
const copyHoldToAllBtn = document.getElementById("copyHoldToAllBtn");
const prevFrameBtn = document.getElementById("prevFrameBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const nextFrameBtn = document.getElementById("nextFrameBtn");

const toleranceInput = document.getElementById("toleranceInput");
const toleranceValue = document.getElementById("toleranceValue");
const minAreaInput = document.getElementById("minAreaInput");
const paddingInput = document.getElementById("paddingInput");
const mergeGapInput = document.getElementById("mergeGapInput");
const cellWidthInput = document.getElementById("cellWidthInput");
const cellHeightInput = document.getElementById("cellHeightInput");
const framesPerRowInput = document.getElementById("framesPerRowInput");
const fpsInput = document.getElementById("fpsInput");
const normalizeSidePaddingInput = document.getElementById("normalizeSidePaddingInput");
const normalizeTopPaddingInput = document.getElementById("normalizeTopPaddingInput");
const normalizeBottomPaddingInput = document.getElementById("normalizeBottomPaddingInput");
const previewFpsInput = document.getElementById("previewFpsInput");
const previewFrameHoldInput = document.getElementById("previewFrameHoldInput");
const previewPauseInput = document.getElementById("previewPauseInput");
const previewBgInput = document.getElementById("previewBgInput");
const previewOpacityInput = document.getElementById("previewOpacityInput");
const previewOpacityValue = document.getElementById("previewOpacityValue");
const previewGridStepInput = document.getElementById("previewGridStepInput");
const previewSubLoopEnabledInput = document.getElementById("previewSubLoopEnabledInput");
const previewSubLoopStartInput = document.getElementById("previewSubLoopStartInput");
const previewSubLoopEndInput = document.getElementById("previewSubLoopEndInput");
const previewSubLoopRepeatsInput = document.getElementById("previewSubLoopRepeatsInput");
const previewShowGridInput = document.getElementById("previewShowGridInput");
const previewShowRulersInput = document.getElementById("previewShowRulersInput");
const previewShowFitBoxInput = document.getElementById("previewShowFitBoxInput");
const selectedLabel = document.getElementById("selectedLabel");
const boxStats = document.getElementById("boxStats");
const imageMeta = document.getElementById("imageMeta");
const frameCounter = document.getElementById("frameCounter");
const buildInfo = document.getElementById("buildInfo");
const boxXInput = document.getElementById("boxXInput");
const boxYInput = document.getElementById("boxYInput");
const boxWidthInput = document.getElementById("boxWidthInput");
const boxHeightInput = document.getElementById("boxHeightInput");
const boxHoldInput = document.getElementById("boxHoldInput");

const HANDLE_SIZE = 12;
const HANDLE_HIT_SIZE = 16;
const THEME_STORAGE_KEY = "spriteslice-theme";
const THEME_ORDER = ["system", "light", "dark"];
const DARK_MEDIA_QUERY = window.matchMedia("(prefers-color-scheme: dark)");
const THEME_ICONS = {
  light: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  `,
  dark: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  `,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getStoredThemeMode() {
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return THEME_ORDER.includes(value) ? value : "system";
}

function applyThemeMode(mode) {
  if (mode === "system") {
    document.documentElement.removeAttribute("data-theme");
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    document.documentElement.setAttribute("data-theme", mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
  renderThemeCycle(mode);
  drawEditor();
  drawPreview();
}

function renderThemeCycle(mode) {
  if (!themeCycleBtn || !themeCycleIcon) return;
  const effectiveMode = mode === "system" ? (DARK_MEDIA_QUERY.matches ? "dark" : "light") : mode;
  themeCycleIcon.innerHTML = THEME_ICONS[effectiveMode];
  themeCycleBtn.setAttribute("aria-label", `Theme: ${mode}`);
  themeCycleBtn.setAttribute("title", `Theme: ${mode}`);
}

function cycleThemeMode() {
  const current = getStoredThemeMode();
  const nextIndex = (THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length;
  applyThemeMode(THEME_ORDER[nextIndex]);
}

function getBoxHold(box) {
  return Math.max(1, Number(box?.hold ?? 1));
}

function getThemeSurfaceColors() {
  const styles = window.getComputedStyle(document.documentElement);
  const panel3 = styles.getPropertyValue("--panel-3").trim() || "#e7e7df";
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (!document.documentElement.hasAttribute("data-theme") && DARK_MEDIA_QUERY.matches);
  return {
    panel3,
    checkerA: isDark ? "#1a2432" : "#eef2f6",
    checkerB: isDark ? "#101824" : "#dde5ee",
    placeholder: isDark ? "#8ea2bc" : "#556579",
  };
}

function distanceSq(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function readInputs() {
  return {
    tolerance: Number(toleranceInput.value),
    minArea: Number(minAreaInput.value),
    padding: Number(paddingInput.value),
    mergeGap: Number(mergeGapInput.value),
    cellWidth: Number(cellWidthInput.value),
    cellHeight: Number(cellHeightInput.value),
    framesPerRow: Number(framesPerRowInput.value),
    fps: Number(fpsInput.value),
    normalizeSidePadding: Number(normalizeSidePaddingInput.value),
    normalizeTopPadding: Number(normalizeTopPaddingInput.value),
    normalizeBottomPadding: Number(normalizeBottomPaddingInput.value),
    previewFps: Number(previewFpsInput.value),
    previewFrameHold: Number(previewFrameHoldInput.value),
    previewPause: Number(previewPauseInput.value),
    previewBg: previewBgInput.value.trim(),
    previewOpacity: Number(previewOpacityInput.value),
    previewGridStep: Number(previewGridStepInput.value),
    previewSubLoopEnabled: previewSubLoopEnabledInput.checked,
    previewSubLoopStart: Number(previewSubLoopStartInput.value),
    previewSubLoopEnd: Number(previewSubLoopEndInput.value),
    previewSubLoopRepeats: Number(previewSubLoopRepeatsInput.value),
    previewShowGrid: previewShowGridInput.checked,
    previewShowRulers: previewShowRulersInput.checked,
    previewShowFitBox: previewShowFitBoxInput.checked,
  };
}

function resetPreviewPlaybackState() {
  state.previewFrame = 0;
  state.previewAccum = 0;
  state.previewPauseRemaining = 0;
  state.previewHoldTick = 0;
  state.previewLastTime = 0;
  state.previewSubLoopRemaining = null;
}

function setNumericInput(input, value, fallback = input.value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    input.value = fallback;
    return;
  }
  input.value = Number(value);
}

function setCheckboxInput(input, value) {
  input.checked = Boolean(value);
}

function formatBuildInfo() {
  const info = window.BUILD_INFO || {};
  const version = info.version || "dev";
  const commit = info.commit || "local";
  const builtAt = info.builtAt ? new Date(info.builtAt).toLocaleString() : "unbuilt";
  return `v${version} | ${commit} | ${builtAt}`;
}

function buildGridBoxes(boxes, cellWidth, cellHeight, framesPerRow, imageWidth, imageHeight) {
  const cols = Math.max(1, framesPerRow);
  return boxes.map((box, index) => {
    const x = (index % cols) * cellWidth;
    const y = Math.floor(index / cols) * cellHeight;
    return {
      x: clamp(x, 0, Math.max(0, imageWidth - 1)),
      y: clamp(y, 0, Math.max(0, imageHeight - 1)),
      width: Math.min(cellWidth, Math.max(1, imageWidth - x)),
      height: Math.min(cellHeight, Math.max(1, imageHeight - y)),
      hold: getBoxHold(box),
    };
  });
}

function shouldRestoreAsGrid(project, savedBoxes, exportSettings) {
  if (!state.image || !savedBoxes.length) return false;

  const framesPerRow = Math.max(1, Number(exportSettings.framesPerRow || 1));
  const cellWidth = Math.max(1, Number(exportSettings.cellWidth || 1));
  const cellHeight = Math.max(1, Number(exportSettings.cellHeight || 1));
  const rows = Math.max(1, Math.ceil(savedBoxes.length / framesPerRow));
  const normalizedWidth = framesPerRow * cellWidth;
  const normalizedHeight = rows * cellHeight;
  const matchesNormalizedSheet =
    state.image.width === normalizedWidth && state.image.height === normalizedHeight;

  if (project?.sourceImage?.width && project?.sourceImage?.height) {
    const matchesSourceSheet =
      state.image.width === Number(project.sourceImage.width) &&
      state.image.height === Number(project.sourceImage.height) &&
      (!project.image || state.imageName === project.image);
    return matchesNormalizedSheet && !matchesSourceSheet;
  }

  if (project?.image && state.imageName !== project.image) {
    return matchesNormalizedSheet;
  }

  return false;
}

function normalizeHexColor(value) {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#ffffff";
}

function hexToRgba(hex, alpha) {
  const normalized = normalizeHexColor(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toCanvasBox(box) {
  return {
    x: state.offsetX + box.x * state.scale,
    y: state.offsetY + box.y * state.scale,
    width: box.width * state.scale,
    height: box.height * state.scale,
  };
}

function toImagePoint(event) {
  const rect = editorCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (editorCanvas.width / rect.width);
  const y = (event.clientY - rect.top) * (editorCanvas.height / rect.height);
  return {
    x: (x - state.offsetX) / state.scale,
    y: (y - state.offsetY) / state.scale,
    canvasX: x,
    canvasY: y,
  };
}

function sortBoxesReadingOrder() {
  const rowThreshold = Math.max(12, Number(cellHeightInput.value) * 0.25);
  state.boxes.sort((a, b) => {
    const ay = a.y + a.height / 2;
    const by = b.y + b.height / 2;
    if (Math.abs(ay - by) > rowThreshold) return ay - by;
    return a.x - b.x;
  });
}

function updateInspector() {
  toleranceValue.textContent = toleranceInput.value;
  previewOpacityValue.textContent = `${previewOpacityInput.value}%`;

  if (state.selectedIndex < 0 || !state.boxes[state.selectedIndex]) {
    selectedLabel.textContent = "None";
    boxStats.textContent = "x: -, y: -, w: -, h: -";
    [boxXInput, boxYInput, boxWidthInput, boxHeightInput, boxHoldInput].forEach((input) => {
      input.value = "";
      input.disabled = true;
    });
  } else {
    const box = state.boxes[state.selectedIndex];
    selectedLabel.textContent = `#${state.selectedIndex + 1}`;
    boxStats.textContent = `x: ${Math.round(box.x)}, y: ${Math.round(box.y)}, w: ${Math.round(box.width)}, h: ${Math.round(box.height)}`;
    boxXInput.disabled = false;
    boxYInput.disabled = false;
    boxWidthInput.disabled = false;
    boxHeightInput.disabled = false;
    boxHoldInput.disabled = false;
    boxXInput.value = Math.round(box.x);
    boxYInput.value = Math.round(box.y);
    boxWidthInput.value = Math.round(box.width);
    boxHeightInput.value = Math.round(box.height);
    boxHoldInput.value = getBoxHold(box);
  }

  frameCounter.textContent = state.boxes.length
    ? `${(state.previewFrame % state.boxes.length) + 1} / ${state.boxes.length}`
    : "0 / 0";
  playPauseBtn.textContent = state.previewPlaying ? "Pause" : "Play";
}

function drawEditor() {
  editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
  const theme = getThemeSurfaceColors();

  editorCtx.fillStyle = theme.panel3;
  editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

  if (!state.image) {
    editorCtx.fillStyle = theme.placeholder;
    editorCtx.font = '600 24px "Fira Code", monospace';
    editorCtx.textAlign = "center";
    editorCtx.textBaseline = "middle";
    editorCtx.fillText("Upload a sprite sheet to start", editorCanvas.width / 2, editorCanvas.height / 2);
    return;
  }

  editorCtx.save();
  editorCtx.drawImage(
    state.image,
    state.offsetX,
    state.offsetY,
    state.image.width * state.scale,
    state.image.height * state.scale
  );
  editorCtx.restore();

  state.boxes.forEach((box, index) => {
    const c = toCanvasBox(box);
    const selected = index === state.selectedIndex;
    editorCtx.lineWidth = selected ? 3 : 2;
    editorCtx.strokeStyle = selected ? "#7ef29a" : "rgba(76, 201, 240, 0.95)";
    editorCtx.fillStyle = selected ? "rgba(126, 242, 154, 0.14)" : "rgba(76, 201, 240, 0.12)";
    editorCtx.strokeRect(c.x, c.y, c.width, c.height);
    editorCtx.fillRect(c.x, c.y, c.width, c.height);

    editorCtx.fillStyle = "rgba(8, 12, 20, 0.8)";
    editorCtx.fillRect(c.x + 4, c.y + 4, 36, 24);
    editorCtx.fillStyle = "#eef4ff";
    editorCtx.font = "15px sans-serif";
    editorCtx.textAlign = "center";
    editorCtx.fillText(`#${index + 1}`, c.x + 22, c.y + 21);

    if (selected) {
      const handles = getHandles(c);
      editorCtx.fillStyle = "#7ef29a";
      handles.forEach((h) => {
        editorCtx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      });
    }
  });
}

function getHandles(canvasBox) {
  return [
    { key: "nw", x: canvasBox.x, y: canvasBox.y },
    { key: "n", x: canvasBox.x + canvasBox.width / 2, y: canvasBox.y },
    { key: "ne", x: canvasBox.x + canvasBox.width, y: canvasBox.y },
    { key: "e", x: canvasBox.x + canvasBox.width, y: canvasBox.y + canvasBox.height / 2 },
    { key: "sw", x: canvasBox.x, y: canvasBox.y + canvasBox.height },
    { key: "s", x: canvasBox.x + canvasBox.width / 2, y: canvasBox.y + canvasBox.height },
    { key: "se", x: canvasBox.x + canvasBox.width, y: canvasBox.y + canvasBox.height },
    { key: "w", x: canvasBox.x, y: canvasBox.y + canvasBox.height / 2 },
  ];
}

function drawCheckerboard(ctx, width, height, size) {
  const theme = getThemeSurfaceColors();
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0 ? theme.checkerA : theme.checkerB;
      ctx.fillRect(x, y, size, size);
    }
  }
}

function drawPreviewGuides(ctx, frameRect, placement, options) {
  const { x: frameX, y: frameY, width, height } = frameRect;
  const step = Math.max(8, options.previewGridStep || 32);

  if (options.previewShowGrid) {
    ctx.save();
    ctx.strokeStyle = "rgba(97, 200, 255, 0.18)";
    ctx.lineWidth = 1;
    for (let x = step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(frameX + x + 0.5, frameY);
      ctx.lineTo(frameX + x + 0.5, frameY + height);
      ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(frameX, frameY + y + 0.5);
      ctx.lineTo(frameX + width, frameY + y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (options.previewShowFitBox && placement) {
    ctx.save();
    ctx.strokeStyle = "rgba(125, 228, 177, 0.95)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(
      frameX + placement.dx + 0.5,
      frameY + placement.dy + 0.5,
      Math.max(0, placement.drawWidth - 1),
      Math.max(0, placement.drawHeight - 1)
    );
    ctx.restore();
  }

  if (options.previewShowRulers) {
    ctx.save();
    ctx.strokeStyle = "rgba(239, 245, 255, 0.9)";
    ctx.fillStyle = "rgba(239, 245, 255, 0.95)";
    ctx.lineWidth = 1;
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.beginPath();
    ctx.moveTo(frameX - 0.5, frameY);
    ctx.lineTo(frameX - 0.5, frameY + height);
    ctx.moveTo(frameX, frameY + height + 0.5);
    ctx.lineTo(frameX + width, frameY + height + 0.5);
    ctx.stroke();

    for (let y = 0; y <= height; y += step) {
      const py = frameY + Math.max(0, height - y - 0.5);
      ctx.beginPath();
      ctx.moveTo(frameX - 8, py + 0.5);
      ctx.lineTo(frameX, py + 0.5);
      ctx.stroke();
      if (y <= height) {
        ctx.fillText(String(y), Math.max(2, frameX - 30), Math.max(frameY + 10, Math.min(py, frameY + height - 10)));
      }
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let x = 0; x <= width; x += step) {
      const px = frameX + Math.min(x, width - 1) + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, frameY + height);
      ctx.lineTo(px, frameY + height + 8);
      ctx.stroke();
      if (x <= width) ctx.fillText(String(x), Math.min(frameX + x, frameX + width - 1), frameY + height + 20);
    }

    ctx.restore();
  }
}

function drawPreview() {
  const {
    cellWidth,
    cellHeight,
    framesPerRow,
    previewBg,
    previewOpacity,
  } = readInputs();
  const showRulers = readInputs().previewShowRulers;
  const rulerLeft = showRulers ? 36 : 0;
  const rulerBottom = showRulers ? 28 : 0;
  const rulerTop = 8;
  const frameRect = {
    x: rulerLeft,
    y: rulerTop,
    width: cellWidth,
    height: cellHeight,
  };
  previewCanvas.width = cellWidth + rulerLeft;
  previewCanvas.height = cellHeight + rulerTop + rulerBottom;
  previewCtx.imageSmoothingEnabled = false;
  drawCheckerboard(previewCtx, previewCanvas.width, previewCanvas.height, 16);
  previewCtx.strokeStyle = "rgba(125, 160, 220, 0.28)";
  previewCtx.lineWidth = 1;
  previewCtx.strokeRect(frameRect.x + 0.5, frameRect.y + 0.5, frameRect.width - 1, frameRect.height - 1);
  if (previewOpacity > 0) {
    previewCtx.fillStyle = hexToRgba(previewBg, previewOpacity / 100);
    previewCtx.fillRect(frameRect.x, frameRect.y, frameRect.width, frameRect.height);
  }

  if (state.image && state.boxes.length) {
    const box = state.boxes[state.previewFrame % state.boxes.length];
    const frame = getNormalizedFrame(box, cellWidth, cellHeight);
    previewCtx.drawImage(frame, frameRect.x, frameRect.y);
    drawPreviewGuides(previewCtx, frameRect, getNormalizedPlacement(box, cellWidth, cellHeight), readInputs());
  } else {
    drawPreviewGuides(previewCtx, frameRect, null, readInputs());
  }

  previewCanvas.style.width = "100%";
  updateInspector();
  drawExportPreview(cellWidth, cellHeight, framesPerRow, {
    includeBackground: true,
    background: previewBg,
    opacity: previewOpacity,
    showCheckerboard: true,
  });
}

function getNormalizedFrame(box, cellWidth, cellHeight) {
  const temp = document.createElement("canvas");
  temp.width = cellWidth;
  temp.height = cellHeight;
  const ctx = temp.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, temp.width, temp.height);
  const { dx, dy, drawWidth, drawHeight } = getNormalizedPlacement(box, cellWidth, cellHeight);
  ctx.drawImage(
    state.image,
    box.x,
    box.y,
    box.width,
    box.height,
    dx,
    dy,
    drawWidth,
    drawHeight
  );
  return temp;
}

function getNormalizedPlacement(box, cellWidth, cellHeight) {
  const {
    normalizeSidePadding,
    normalizeTopPadding,
    normalizeBottomPadding,
  } = readInputs();
  const sidePadding = Math.max(0, normalizeSidePadding);
  const topPadding = Math.max(0, normalizeTopPadding);
  const bottomPadding = Math.max(0, normalizeBottomPadding);
  const availableWidth = Math.max(1, cellWidth - sidePadding * 2);
  const availableHeight = Math.max(1, cellHeight - topPadding - bottomPadding);
  const scale = Math.min(
    1,
    availableWidth / cellWidth,
    availableHeight / cellHeight,
    availableWidth / box.width,
    availableHeight / box.height
  );
  const drawWidth = Math.max(1, Math.round(box.width * scale));
  const drawHeight = Math.max(1, Math.round(box.height * scale));
  const dx = Math.round(sidePadding + (availableWidth - drawWidth) / 2);
  const dy = Math.round(cellHeight - bottomPadding - drawHeight);
  return { dx, dy, drawWidth, drawHeight };
}

function drawExportPreview(cellWidth, cellHeight, framesPerRow, options = {}) {
  const includeBackground = options.includeBackground ?? false;
  const background = options.background ?? "#ffffff";
  const opacity = options.opacity ?? 0;
  const showCheckerboard = options.showCheckerboard ?? false;
  const cols = Math.max(1, framesPerRow);
  const rows = Math.max(1, Math.ceil(state.boxes.length / cols));
  sheetCanvas.width = cols * cellWidth;
  sheetCanvas.height = rows * cellHeight;
  sheetCtx.imageSmoothingEnabled = false;
  sheetCtx.clearRect(0, 0, sheetCanvas.width, sheetCanvas.height);
  if (showCheckerboard) {
    drawCheckerboard(sheetCtx, sheetCanvas.width, sheetCanvas.height, 20);
  }
  if (includeBackground && opacity > 0) {
    sheetCtx.fillStyle = hexToRgba(background, opacity / 100);
    sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
  }

  state.boxes.forEach((box, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const placement = getNormalizedPlacement(box, cellWidth, cellHeight);
    const dx = col * cellWidth + placement.dx;
    const dy = row * cellHeight + placement.dy;
    sheetCtx.drawImage(
      state.image,
      box.x,
      box.y,
      box.width,
      box.height,
      dx,
      dy,
      placement.drawWidth,
      placement.drawHeight
    );
  });
}

function loadImageFromUrl(url, name = "sheet.png") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ image: img, name });
    img.onerror = reject;
    img.src = url;
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      loadImageFromUrl(reader.result, file.name).then(resolve).catch(reject);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadProjectFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function applyProjectData(project) {
  const boxes = Array.isArray(project?.boxes)
    ? project.boxes
        .map((box) => ({
          x: Number(box.x),
          y: Number(box.y),
          width: Number(box.width),
          height: Number(box.height),
          hold: Math.max(1, Number(box.hold ?? 1)),
        }))
        .filter((box) => [box.x, box.y, box.width, box.height].every((v) => Number.isFinite(v)))
    : [];

  const exportSettings = project?.export || {};
  const playback = project?.playback || {};
  const preview = project?.preview || {};
  const subLoop = playback.subLoop || {};

  setNumericInput(cellWidthInput, exportSettings.cellWidth, 256);
  setNumericInput(cellHeightInput, exportSettings.cellHeight, 256);
  setNumericInput(framesPerRowInput, exportSettings.framesPerRow, 4);
  setNumericInput(fpsInput, exportSettings.fps, 12);
  setNumericInput(normalizeSidePaddingInput, exportSettings.normalizeSidePadding, 0);
  setNumericInput(normalizeTopPaddingInput, exportSettings.normalizeTopPadding, 0);
  setNumericInput(normalizeBottomPaddingInput, exportSettings.normalizeBottomPadding, 0);

  setNumericInput(previewFpsInput, playback.previewFps ?? exportSettings.fps, 12);
  setNumericInput(previewFrameHoldInput, playback.globalFrameHold, 1);
  setNumericInput(previewPauseInput, playback.loopPauseMs, 300);
  setCheckboxInput(previewSubLoopEnabledInput, subLoop.enabled);
  setNumericInput(previewSubLoopStartInput, subLoop.startFrame, 1);
  setNumericInput(previewSubLoopEndInput, subLoop.endFrame, 2);
  setNumericInput(previewSubLoopRepeatsInput, subLoop.repeats, 2);

  previewBgInput.value = preview.backgroundColor || "#ffffff";
  setNumericInput(previewOpacityInput, preview.backgroundOpacity, 0);
  setNumericInput(previewGridStepInput, preview.gridStep, 32);
  setCheckboxInput(previewShowGridInput, preview.showGrid ?? true);
  setCheckboxInput(previewShowRulersInput, preview.showRulers ?? true);
  setCheckboxInput(previewShowFitBoxInput, preview.showFitBox ?? true);

  state.boxes = shouldRestoreAsGrid(project, boxes, exportSettings)
    ? buildGridBoxes(
        boxes,
        Number(exportSettings.cellWidth || cellWidthInput.value),
        Number(exportSettings.cellHeight || cellHeightInput.value),
        Number(exportSettings.framesPerRow || framesPerRowInput.value),
        state.image.width,
        state.image.height
      )
    : boxes;
  state.selectedIndex = boxes.length ? 0 : -1;
  resetPreviewPlaybackState();
  updateInspector();
  drawEditor();
  drawPreview();
}

function setImage(image, name, options = {}) {
  state.image = image;
  state.imageName = name;
  state.boxes = [];
  state.selectedIndex = -1;
  resetPreviewPlaybackState();

  const pad = 18;
  const scale = Math.min(
    (editorCanvas.width - pad * 2) / image.width,
    (editorCanvas.height - pad * 2) / image.height
  );
  state.scale = scale;
  state.offsetX = (editorCanvas.width - image.width * scale) / 2;
  state.offsetY = (editorCanvas.height - image.height * scale) / 2;
  imageMeta.textContent = `${image.width} × ${image.height}`;
  updateInspector();
  drawEditor();
  drawPreview();
  if (options.autoDetect ?? true) {
    autoDetectFrames();
  }
}

function getImageData() {
  const canvas = document.createElement("canvas");
  canvas.width = state.image.width;
  canvas.height = state.image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(state.image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function autoDetectFrames() {
  if (!state.image) return;
  const { tolerance, minArea, padding, mergeGap } = readInputs();
  const imageData = getImageData();
  const { width, height, data } = imageData;

  const cornerSamples = [
    getPixel(data, width, 0, 0),
    getPixel(data, width, width - 1, 0),
    getPixel(data, width, 0, height - 1),
    getPixel(data, width, width - 1, height - 1),
  ];
  const bg = averageColor(cornerSamples);
  const toleranceSq = tolerance * tolerance * 3;

  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 8) {
        mask[y * width + x] = 0;
        continue;
      }
      const rgb = [data[i], data[i + 1], data[i + 2]];
      const fg = distanceSq(rgb, bg) > toleranceSq;
      mask[y * width + x] = fg ? 1 : 0;
    }
  }

  const visited = new Uint8Array(width * height);
  const boxes = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!mask[idx] || visited[idx]) continue;

      const queueX = [x];
      const queueY = [y];
      visited[idx] = 1;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      let area = 0;

      while (queueX.length) {
        const cx = queueX.pop();
        const cy = queueY.pop();
        area += 1;
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);

        const neighbors = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ];
        neighbors.forEach(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
          const nIdx = ny * width + nx;
          if (!mask[nIdx] || visited[nIdx]) return;
          visited[nIdx] = 1;
          queueX.push(nx);
          queueY.push(ny);
        });
      }

      if (area >= minArea) {
        boxes.push({
          x: clamp(minX - padding, 0, width),
          y: clamp(minY - padding, 0, height),
          width: clamp(maxX - minX + 1 + padding * 2, 1, width),
          height: clamp(maxY - minY + 1 + padding * 2, 1, height),
          hold: 1,
        });
      }
    }
  }

  state.boxes = mergeNearbyBoxes(boxes, mergeGap);
  sortBoxesReadingOrder();
  state.selectedIndex = state.boxes.length ? 0 : -1;
  state.previewFrame = 0;
  drawEditor();
  drawPreview();
}

function mergeNearbyBoxes(boxes, gap) {
  let merged = boxes.slice();
  let changed = true;

  while (changed) {
    changed = false;
    const next = [];
    const used = new Array(merged.length).fill(false);

    for (let i = 0; i < merged.length; i++) {
      if (used[i]) continue;
      let current = { ...merged[i] };
      for (let j = i + 1; j < merged.length; j++) {
        if (used[j]) continue;
        if (boxesShouldMerge(current, merged[j], gap)) {
          used[j] = true;
          current = unionBox(current, merged[j]);
          changed = true;
        }
      }
      next.push(current);
    }

    merged = next;
  }

  return merged;
}

function boxesShouldMerge(a, b, gap) {
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  return !(ax2 + gap < b.x || bx2 + gap < a.x || ay2 + gap < b.y || by2 + gap < a.y);
}

function unionBox(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const x2 = Math.max(a.x + a.width, b.x + b.width);
  const y2 = Math.max(a.y + a.height, b.y + b.height);
  return { x, y, width: x2 - x, height: y2 - y };
}

function getPixel(data, width, x, y) {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
}

function averageColor(samples) {
  const sum = samples.reduce((acc, rgb) => [acc[0] + rgb[0], acc[1] + rgb[1], acc[2] + rgb[2]], [0, 0, 0]);
  return sum.map((v) => v / samples.length);
}

function hitTestBox(canvasX, canvasY) {
  for (let i = state.boxes.length - 1; i >= 0; i--) {
    const box = toCanvasBox(state.boxes[i]);
    if (
      canvasX >= box.x &&
      canvasX <= box.x + box.width &&
      canvasY >= box.y &&
      canvasY <= box.y + box.height
    ) {
      return i;
    }
  }
  return -1;
}

function hitTestHandle(canvasX, canvasY, boxIndex) {
  if (boxIndex < 0) return null;
  const box = toCanvasBox(state.boxes[boxIndex]);
  const handles = getHandles(box);
  return (
    handles.find(
      (handle) =>
        Math.abs(canvasX - handle.x) <= HANDLE_HIT_SIZE &&
        Math.abs(canvasY - handle.y) <= HANDLE_HIT_SIZE
    ) || null
  );
}

function startDrag(event) {
  if (!state.image) return;
  const point = toImagePoint(event);
  const hitIndex = hitTestBox(point.canvasX, point.canvasY);
  const handle = hitTestHandle(point.canvasX, point.canvasY, hitIndex);

  if (hitIndex >= 0) {
    state.selectedIndex = hitIndex;
    state.dragMode = handle ? "resize" : "move";
    state.dragHandle = handle ? handle.key : null;
    state.dragStart = point;
    state.dragOriginalBox = { ...state.boxes[hitIndex] };
    drawEditor();
    drawPreview();
    return;
  }

  state.selectedIndex = state.boxes.length;
  state.dragMode = "create";
  state.dragStart = point;
  state.dragOriginalBox = null;
  state.boxes.push({ x: point.x, y: point.y, width: 1, height: 1, hold: 1 });
  drawEditor();
  drawPreview();
}

function continueDrag(event) {
  if (!state.dragMode) return;
  const point = toImagePoint(event);
  const box = state.boxes[state.selectedIndex];
  if (!box) return;

  if (state.dragMode === "move") {
    const dx = point.x - state.dragStart.x;
    const dy = point.y - state.dragStart.y;
    box.x = clamp(state.dragOriginalBox.x + dx, 0, state.image.width - box.width);
    box.y = clamp(state.dragOriginalBox.y + dy, 0, state.image.height - box.height);
  } else if (state.dragMode === "create") {
    const x1 = Math.min(state.dragStart.x, point.x);
    const y1 = Math.min(state.dragStart.y, point.y);
    const x2 = Math.max(state.dragStart.x, point.x);
    const y2 = Math.max(state.dragStart.y, point.y);
    box.x = clamp(x1, 0, state.image.width);
    box.y = clamp(y1, 0, state.image.height);
    box.width = clamp(x2 - x1, 1, state.image.width - box.x);
    box.height = clamp(y2 - y1, 1, state.image.height - box.y);
  } else if (state.dragMode === "resize") {
    resizeBox(box, point);
  }

  drawEditor();
  drawPreview();
}

function resizeBox(box, point) {
  const orig = state.dragOriginalBox;
  let x1 = orig.x;
  let y1 = orig.y;
  let x2 = orig.x + orig.width;
  let y2 = orig.y + orig.height;

  if (state.dragHandle.includes("n")) y1 = point.y;
  if (state.dragHandle.includes("s")) y2 = point.y;
  if (state.dragHandle.includes("w")) x1 = point.x;
  if (state.dragHandle.includes("e")) x2 = point.x;

  const nx1 = clamp(Math.min(x1, x2 - 1), 0, state.image.width - 1);
  const ny1 = clamp(Math.min(y1, y2 - 1), 0, state.image.height - 1);
  const nx2 = clamp(Math.max(x2, nx1 + 1), nx1 + 1, state.image.width);
  const ny2 = clamp(Math.max(y2, ny1 + 1), ny1 + 1, state.image.height);
  box.x = nx1;
  box.y = ny1;
  box.width = nx2 - nx1;
  box.height = ny2 - ny1;
}

function endDrag() {
  if (state.dragMode === "create") {
    const box = state.boxes[state.selectedIndex];
    if (box && (box.width < 4 || box.height < 4)) {
      state.boxes.splice(state.selectedIndex, 1);
      state.selectedIndex = -1;
    }
  }
  state.dragMode = null;
  state.dragHandle = null;
  state.dragStart = null;
  state.dragOriginalBox = null;
  drawEditor();
  drawPreview();
}

function applyBoxInputs() {
  if (state.selectedIndex < 0 || !state.image) return;
  const box = state.boxes[state.selectedIndex];
  if (!box) return;

  const nextX = clamp(Number(boxXInput.value || 0), 0, state.image.width - 1);
  const nextY = clamp(Number(boxYInput.value || 0), 0, state.image.height - 1);
  const nextWidth = clamp(Number(boxWidthInput.value || 1), 1, state.image.width - nextX);
  const nextHeight = clamp(Number(boxHeightInput.value || 1), 1, state.image.height - nextY);
  const nextHold = Math.max(1, Number(boxHoldInput.value || 1));

  box.x = nextX;
  box.y = nextY;
  box.width = nextWidth;
  box.height = nextHeight;
  box.hold = nextHold;
  drawEditor();
  drawPreview();
}

function downloadSheet() {
  if (!state.image || !state.boxes.length) return;
  const { cellWidth, cellHeight, framesPerRow, previewBg, previewOpacity } = readInputs();
  drawExportPreview(cellWidth, cellHeight, framesPerRow, {
    includeBackground: previewOpacity > 0,
    background: previewBg,
    opacity: previewOpacity,
    showCheckerboard: false,
  });
  triggerDownload(sheetCanvas.toDataURL("image/png"), buildOutputName("-normalized.png"));
}

function downloadJson() {
  const payload = {
    version: 1,
    image: state.imageName,
    sourceImage: state.image
      ? {
          width: state.image.width,
          height: state.image.height,
        }
      : null,
    boxes: state.boxes.map((box, index) => ({ id: index + 1, ...box, hold: getBoxHold(box) })),
    export: {
      cellWidth: Number(cellWidthInput.value),
      cellHeight: Number(cellHeightInput.value),
      framesPerRow: Number(framesPerRowInput.value),
      fps: Number(fpsInput.value),
      normalizeSidePadding: Number(normalizeSidePaddingInput.value),
      normalizeTopPadding: Number(normalizeTopPaddingInput.value),
      normalizeBottomPadding: Number(normalizeBottomPaddingInput.value),
    },
    playback: {
      previewFps: Number(previewFpsInput.value),
      globalFrameHold: Number(previewFrameHoldInput.value),
      loopPauseMs: Number(previewPauseInput.value),
      subLoop: {
        enabled: previewSubLoopEnabledInput.checked,
        startFrame: Number(previewSubLoopStartInput.value),
        endFrame: Number(previewSubLoopEndInput.value),
        repeats: Number(previewSubLoopRepeatsInput.value),
      },
    },
    preview: {
      backgroundColor: previewBgInput.value.trim(),
      backgroundOpacity: Number(previewOpacityInput.value),
      gridStep: Number(previewGridStepInput.value),
      showGrid: previewShowGridInput.checked,
      showRulers: previewShowRulersInput.checked,
      showFitBox: previewShowFitBoxInput.checked,
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  triggerDownload(URL.createObjectURL(blob), buildOutputName(".json"), true);
}

function buildOutputName(suffix) {
  const name = state.imageName.replace(/\.[^.]+$/, "");
  return `${name}${suffix}`;
}

function triggerDownload(url, fileName, revoke = false) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function animatePreview(timestamp) {
  const fps = Number(previewFpsInput.value);
  const globalFrameHold = Math.max(1, Number(previewFrameHoldInput.value));
  const pauseDuration = Math.max(0, Number(previewPauseInput.value));
  const subLoopEnabled = previewSubLoopEnabledInput.checked;
  const subLoopStart = Math.max(0, Number(previewSubLoopStartInput.value) - 1);
  const subLoopEnd = Math.max(subLoopStart, Number(previewSubLoopEndInput.value) - 1);
  const subLoopRepeats = Math.max(0, Number(previewSubLoopRepeatsInput.value));
  const frameDuration = 1000 / Math.max(1, fps);

  if (state.previewPlaying && state.boxes.length > 0) {
    if (!state.previewLastTime) state.previewLastTime = timestamp;
    const elapsed = timestamp - state.previewLastTime;

    if (state.previewPauseRemaining > 0) {
      state.previewPauseRemaining = Math.max(0, state.previewPauseRemaining - elapsed);
      if (state.previewPauseRemaining === 0) {
        state.previewFrame = 0;
        drawPreview();
      }
    } else {
      state.previewAccum += elapsed;
      if (state.previewAccum >= frameDuration) {
        state.previewAccum = 0;
        const currentBox = state.boxes[state.previewFrame];
        const effectiveHold = Math.max(1, getBoxHold(currentBox) * globalFrameHold);
        if (state.previewHoldTick < effectiveHold - 1) {
          state.previewHoldTick += 1;
        } else {
          state.previewHoldTick = 0;
          if (
            subLoopEnabled &&
            state.previewFrame === subLoopEnd &&
            subLoopStart < state.boxes.length &&
            subLoopEnd < state.boxes.length
          ) {
            if (state.previewSubLoopRemaining === null) {
              state.previewSubLoopRemaining = subLoopRepeats;
            }
            if (state.previewSubLoopRemaining > 0) {
              state.previewSubLoopRemaining -= 1;
              state.previewFrame = subLoopStart;
            } else {
              state.previewSubLoopRemaining = null;
              state.previewFrame = Math.min(subLoopEnd + 1, state.boxes.length - 1);
            }
          } else if (state.previewFrame >= state.boxes.length - 1) {
            state.previewPauseRemaining = pauseDuration;
            if (pauseDuration === 0) {
              state.previewFrame = 0;
            }
          } else {
            state.previewFrame += 1;
          }
        }
        drawPreview();
      }
    }
  }
  state.previewLastTime = timestamp;
  requestAnimationFrame(animatePreview);
}

function duplicateSelected() {
  if (state.selectedIndex < 0) return;
  const box = state.boxes[state.selectedIndex];
  const clone = { ...box, hold: getBoxHold(box), x: box.x + 4, y: box.y + 4 };
  state.boxes.splice(state.selectedIndex + 1, 0, clone);
  state.selectedIndex += 1;
  drawEditor();
  drawPreview();
}

function copySizeToAll() {
  if (state.selectedIndex < 0) return;
  const { width, height } = state.boxes[state.selectedIndex];
  state.boxes = state.boxes.map((box) => ({ ...box, width, height }));
  drawEditor();
  drawPreview();
}

function copyHoldToAll() {
  if (state.selectedIndex < 0) return;
  const hold = getBoxHold(state.boxes[state.selectedIndex]);
  state.boxes = state.boxes.map((box) => ({ ...box, hold }));
  drawEditor();
  drawPreview();
}

function deleteSelected() {
  if (state.selectedIndex < 0) return;
  state.boxes.splice(state.selectedIndex, 1);
  state.selectedIndex = clamp(state.selectedIndex, -1, state.boxes.length - 1);
  state.previewFrame = 0;
  drawEditor();
  drawPreview();
}

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const { image, name } = await loadImageFromFile(file);
  const pendingProject = state.pendingProject;
  if (pendingProject) {
    setImage(image, name, { autoDetect: false });
    applyProjectData(pendingProject);
    state.pendingProject = null;
  } else {
    setImage(image, name);
  }
});

projectFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const project = await loadProjectFromFile(file);
  if (state.image) {
    applyProjectData(project);
  } else {
    state.pendingProject = project;
    imageMeta.textContent = "JSON loaded. Upload matching sheet.";
    updateInspector();
    drawEditor();
  }
});

loadSampleBtn.addEventListener("click", async () => {
  const { image, name } = await loadImageFromUrl(samplePath, "sample-wizard-sheet.png");
  setImage(image, name);
});

if (themeCycleBtn) {
  themeCycleBtn.addEventListener("click", cycleThemeMode);
}

DARK_MEDIA_QUERY.addEventListener("change", () => {
  if (getStoredThemeMode() === "system") {
    renderThemeCycle("system");
    drawEditor();
    drawPreview();
  }
});

autoDetectBtn.addEventListener("click", autoDetectFrames);
clearBoxesBtn.addEventListener("click", () => {
  state.boxes = [];
  state.selectedIndex = -1;
  drawEditor();
  drawPreview();
});
sortBoxesBtn.addEventListener("click", () => {
  sortBoxesReadingOrder();
  drawEditor();
  drawPreview();
});
downloadSheetBtn.addEventListener("click", downloadSheet);
downloadJsonBtn.addEventListener("click", downloadJson);
deleteSelectedBtn.addEventListener("click", deleteSelected);
duplicateSelectedBtn.addEventListener("click", duplicateSelected);
copyToAllBtn.addEventListener("click", copySizeToAll);
copyHoldToAllBtn.addEventListener("click", copyHoldToAll);

prevFrameBtn.addEventListener("click", () => {
  if (!state.boxes.length) return;
  state.previewFrame = (state.previewFrame - 1 + state.boxes.length) % state.boxes.length;
  state.previewAccum = 0;
  state.previewPauseRemaining = 0;
  state.previewHoldTick = 0;
  state.previewSubLoopRemaining = null;
  drawPreview();
});
nextFrameBtn.addEventListener("click", () => {
  if (!state.boxes.length) return;
  state.previewFrame = (state.previewFrame + 1) % state.boxes.length;
  state.previewAccum = 0;
  state.previewPauseRemaining = 0;
  state.previewHoldTick = 0;
  state.previewSubLoopRemaining = null;
  drawPreview();
});
playPauseBtn.addEventListener("click", () => {
  state.previewPlaying = !state.previewPlaying;
  state.previewLastTime = 0;
  updateInspector();
});

[toleranceInput, minAreaInput, paddingInput, mergeGapInput, cellWidthInput, cellHeightInput, framesPerRowInput, fpsInput, normalizeSidePaddingInput, normalizeTopPaddingInput, normalizeBottomPaddingInput, previewFpsInput, previewFrameHoldInput, previewPauseInput, previewBgInput, previewOpacityInput, previewGridStepInput, previewSubLoopEnabledInput, previewSubLoopStartInput, previewSubLoopEndInput, previewSubLoopRepeatsInput, previewShowGridInput, previewShowRulersInput, previewShowFitBoxInput].forEach((input) => {
  input.addEventListener("input", () => {
    state.previewAccum = 0;
    state.previewPauseRemaining = 0;
    state.previewHoldTick = 0;
    state.previewLastTime = 0;
    state.previewSubLoopRemaining = null;
    updateInspector();
    drawPreview();
  });
});

[boxXInput, boxYInput, boxWidthInput, boxHeightInput, boxHoldInput].forEach((input) => {
  input.addEventListener("input", applyBoxInputs);
});

editorCanvas.addEventListener("mousedown", startDrag);
window.addEventListener("mousemove", continueDrag);
window.addEventListener("mouseup", endDrag);

window.addEventListener("keydown", (event) => {
  if (state.selectedIndex < 0) return;
  const box = state.boxes[state.selectedIndex];
  const step = event.shiftKey ? 10 : 1;
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelected();
    return;
  }
  if (event.key === "ArrowLeft") box.x = clamp(box.x - step, 0, state.image.width - box.width);
  if (event.key === "ArrowRight") box.x = clamp(box.x + step, 0, state.image.width - box.width);
  if (event.key === "ArrowUp") box.y = clamp(box.y - step, 0, state.image.height - box.height);
  if (event.key === "ArrowDown") box.y = clamp(box.y + step, 0, state.image.height - box.height);
  drawEditor();
  drawPreview();
});

updateInspector();
applyThemeMode(getStoredThemeMode());
if (buildInfo) {
  buildInfo.textContent = formatBuildInfo();
}
drawEditor();
drawPreview();
requestAnimationFrame(animatePreview);
