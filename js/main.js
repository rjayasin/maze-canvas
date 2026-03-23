import { DEFAULT_BRUSH_RADIUS } from './config.js';
import { Grid } from './grid.js';
import { MazeGenerator } from './maze.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

const canvas = document.getElementById('maze-canvas');
const container = document.getElementById('canvas-container');
const brushSlider = document.getElementById('brush-slider');
const brushValue = document.getElementById('brush-value');
const clearBtn = document.getElementById('clear-btn');
const togglePathBtn = document.getElementById('toggle-path-btn');

let brushRadius = DEFAULT_BRUSH_RADIUS;
let showPath = true;

function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._logicalWidth = w;
    canvas._logicalHeight = h;
}

setupCanvas();

const grid = new Grid({ width: canvas._logicalWidth, height: canvas._logicalHeight });
const maze = new MazeGenerator(grid);
const renderer = new Renderer(canvas, grid);

function onCellDrawn(cell) {
    maze.activateBrush(cell.row, cell.col, brushRadius);
}

const input = new InputHandler(canvas, grid, onCellDrawn);

// UI controls
brushSlider.addEventListener('input', () => {
    brushRadius = parseInt(brushSlider.value, 10);
    brushValue.textContent = brushRadius;
});

clearBtn.addEventListener('click', () => {
    grid.reset();
    maze.reset();
    input.reset();
});

togglePathBtn.addEventListener('click', () => {
    showPath = !showPath;
    togglePathBtn.textContent = showPath ? 'Hide Path' : 'Show Path';
});

// Main loop
function loop() {
    maze.expand();
    renderer.render(showPath ? input.solutionPath : [], input.mouseX, input.mouseY, brushRadius);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.addEventListener('resize', () => {
    setupCanvas();
});
