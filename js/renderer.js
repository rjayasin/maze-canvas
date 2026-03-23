import {
    CELL_SIZE, WALL_COLOR, WALL_WIDTH, ACTIVE_CELL_COLOR,
    SOLUTION_PATH_COLOR, SOLUTION_PATH_WIDTH, INACTIVE_COLOR,
    BRUSH_PREVIEW_COLOR, BRUSH_PREVIEW_STROKE,
} from './config.js';

export class Renderer {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
    }

    render(solutionPath, mouseX, mouseY, brushRadius) {
        const ctx = this.ctx;
        const grid = this.grid;
        const cs = CELL_SIZE;
        const w = this.canvas._logicalWidth || this.canvas.width;
        const h = this.canvas._logicalHeight || this.canvas.height;

        // Background
        ctx.fillStyle = INACTIVE_COLOR;
        ctx.fillRect(0, 0, w, h);

        // Active cells
        ctx.fillStyle = ACTIVE_CELL_COLOR;
        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const cell = grid.cells[r][c];
                if (cell.state !== 'inactive') {
                    ctx.fillRect(c * cs, r * cs, cs, cs);
                }
            }
        }

        // Walls — draw each wall of each active cell unconditionally
        // To avoid double-drawing, only draw north and west walls per cell,
        // plus south wall if at bottom edge of active region, east wall if at right edge.
        ctx.strokeStyle = WALL_COLOR;
        ctx.lineWidth = WALL_WIDTH;
        ctx.lineCap = 'square';

        ctx.beginPath();
        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const cell = grid.cells[r][c];
                if (cell.state === 'inactive') continue;
                const x = c * cs;
                const y = r * cs;

                // North wall
                if (cell.walls.north) {
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + cs, y);
                }
                // West wall
                if (cell.walls.west) {
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + cs);
                }
                // South wall — draw if no active neighbor south or at grid edge
                if (cell.walls.south) {
                    const south = grid.getCell(r + 1, c);
                    if (!south || south.state === 'inactive' || south.walls.north) {
                        // Only draw from this side if south neighbor won't draw it as its north
                        if (!south || south.state === 'inactive') {
                            ctx.moveTo(x, y + cs);
                            ctx.lineTo(x + cs, y + cs);
                        }
                    }
                }
                // East wall — draw if no active neighbor east or at grid edge
                if (cell.walls.east) {
                    const east = grid.getCell(r, c + 1);
                    if (!east || east.state === 'inactive') {
                        ctx.moveTo(x + cs, y);
                        ctx.lineTo(x + cs, y + cs);
                    }
                }
            }
        }
        ctx.stroke();

        // Solution path
        if (solutionPath.length > 0) {
            ctx.strokeStyle = SOLUTION_PATH_COLOR;
            ctx.lineWidth = SOLUTION_PATH_WIDTH;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            const first = solutionPath[0];
            ctx.moveTo(first.col * cs + cs / 2, first.row * cs + cs / 2);
            for (let i = 1; i < solutionPath.length; i++) {
                const cell = solutionPath[i];
                ctx.lineTo(cell.col * cs + cs / 2, cell.row * cs + cs / 2);
            }
            ctx.stroke();

            // Start marker (green)
            const pad = 3;
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(first.col * cs + pad, first.row * cs + pad, cs - pad * 2, cs - pad * 2);

            // End marker (red)
            const last = solutionPath[solutionPath.length - 1];
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(last.col * cs + pad, last.row * cs + pad, cs - pad * 2, cs - pad * 2);
        }

        // Brush preview
        if (mouseX !== null && mouseY !== null) {
            ctx.fillStyle = BRUSH_PREVIEW_COLOR;
            ctx.strokeStyle = BRUSH_PREVIEW_STROKE;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, brushRadius * cs, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
}
