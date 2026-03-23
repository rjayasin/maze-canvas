export class InputHandler {
    constructor(canvas, grid, onCellDrawn) {
        this.canvas = canvas;
        this.grid = grid;
        this.onCellDrawn = onCellDrawn;
        this.drawing = false;
        this.lastCell = null;
        this.prevDrawCell = null; // tracks previous cell in drawing sequence for wall removal
        this.mouseX = 0;
        this.mouseY = 0;
        this.solutionPath = [];

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        canvas.addEventListener('mousedown', this._onMouseDown);
        canvas.addEventListener('mousemove', this._onMouseMove);
        canvas.addEventListener('mouseup', this._onMouseUp);
        canvas.addEventListener('mouseleave', this._onMouseUp);
    }

    _getLogicalCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    _onMouseDown(e) {
        this.drawing = true;
        const { x, y } = this._getLogicalCoords(e);
        this.mouseX = x;
        this.mouseY = y;
        const cell = this.grid.snapToGrid(x, y);
        if (!cell) return;
        this.lastCell = cell;
        this.prevDrawCell = null;
        this._drawCell(cell);
    }

    _onMouseMove(e) {
        const { x, y } = this._getLogicalCoords(e);
        this.mouseX = x;
        this.mouseY = y;

        if (!this.drawing) return;
        const cell = this.grid.snapToGrid(x, y);
        if (!cell || cell === this.lastCell) return;

        const path = this._interpolate(this.lastCell, cell);
        for (const c of path) {
            this._drawCell(c);
        }
        this.lastCell = cell;
    }

    _onMouseUp() {
        this.drawing = false;
        this.lastCell = null;
        this.prevDrawCell = null;
    }

    _drawCell(cell) {
        // If cell was already connected by Prim's, disconnect it from its
        // Prim's parent to prevent cycles (which create shortcut paths).
        if (cell.inMaze && cell.state !== 'solution' && cell.parent) {
            this.grid.addWall(cell, cell.parent);
            cell.parent = null;
        }

        // Remove wall between this cell and the previous in the drawing sequence
        if (this.prevDrawCell) {
            const dr = Math.abs(cell.row - this.prevDrawCell.row);
            const dc = Math.abs(cell.col - this.prevDrawCell.col);
            if (dr + dc === 1) {
                this.grid.removeWall(this.prevDrawCell, cell);
            }
        }

        if (cell.state !== 'solution') {
            cell.state = 'solution';
            cell.inMaze = true;
            this.solutionPath.push(cell);
        }
        cell.parent = null;

        this.prevDrawCell = cell;
        this.onCellDrawn(cell);
    }

    _interpolate(from, to) {
        const cells = [];
        let r = from.row;
        let c = from.col;
        while (r !== to.row || c !== to.col) {
            const dr = to.row - r;
            const dc = to.col - c;
            if (Math.abs(dr) >= Math.abs(dc)) {
                r += Math.sign(dr);
            } else {
                c += Math.sign(dc);
            }
            const cell = this.grid.getCell(r, c);
            if (cell) {
                cells.push(cell);
            }
        }
        return cells;
    }

    undo() {
        if (this.solutionPath.length === 0 || this.drawing) return false;
        this.solutionPath.pop();
        return true;
    }

    reset() {
        this.drawing = false;
        this.lastCell = null;
        this.prevDrawCell = null;
        this.solutionPath = [];
    }
}
