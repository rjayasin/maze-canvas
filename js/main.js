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
const undoBtn = document.getElementById('undo-btn');
const fillBtn = document.getElementById('fill-btn');
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

function rebuildMaze() {
    const pathCoords = input.solutionPath.map(c => ({ row: c.row, col: c.col }));
    grid.reset();
    maze.reset();
    input.solutionPath = [];

    for (const { row, col } of pathCoords) {
        const cell = grid.getCell(row, col);

        // If Prim's already connected this cell, disconnect from its
        // parent to prevent cycles (same logic as _drawCell)
        if (cell.inMaze && cell.state !== 'solution' && cell.parent) {
            grid.addWall(cell, cell.parent);
            cell.parent = null;
        }

        cell.state = 'solution';
        cell.inMaze = true;
        cell.parent = null;
        input.solutionPath.push(cell);

        if (input.solutionPath.length >= 2) {
            const prev = input.solutionPath[input.solutionPath.length - 2];
            grid.removeWall(prev, cell);
        }

        maze.activateBrush(row, col, brushRadius);
        maze.expandAll();
    }
}

function doUndo() {
    if (input.undo()) rebuildMaze();
}

undoBtn.addEventListener('click', doUndo);

function togglePath() {
    showPath = !showPath;
    togglePathBtn.textContent = showPath ? 'Hide Path' : 'Show Path';
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        doUndo();
    }
    if (e.key === 'h' || e.key === 'H') {
        togglePath();
    }
});

fillBtn.addEventListener('click', () => {
    grid.reset();
    maze.reset();
    input.reset();
    const centerRow = Math.floor(grid.rows / 2);
    const centerCol = Math.floor(grid.cols / 2);
    maze.fillAll(centerRow, centerCol);
});

togglePathBtn.addEventListener('click', togglePath);

// Main loop
function loop() {
    maze.expand();
    const isTouchDevice = 'ontouchstart' in window;
    const showBrush = !isTouchDevice || input.drawing;
    const mx = showBrush ? input.mouseX : null;
    const my = showBrush ? input.mouseY : null;
    const visiblePath = (showPath || input.drawing) ? input.solutionPath : [];
    renderer.render(visiblePath, input.solutionPath, mx, my, brushRadius);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.addEventListener('resize', () => {
    setupCanvas();
});
