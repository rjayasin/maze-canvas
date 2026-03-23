import { CELL_SIZE } from './config.js';

export class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.walls = { north: true, south: true, east: true, west: true };
        this.state = 'inactive'; // 'inactive' | 'active' | 'solution'
        this.inMaze = false;
    }
}

export class Grid {
    constructor(canvas) {
        this.cols = Math.floor(canvas.width / CELL_SIZE);
        this.rows = Math.floor(canvas.height / CELL_SIZE);
        this.cells = [];
        this._init();
    }

    _init() {
        this.cells = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push(new Cell(r, c));
            }
            this.cells.push(row);
        }
    }

    getCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
        return this.cells[row][col];
    }

    getNeighbors(cell) {
        const neighbors = [];
        const dirs = [
            { dr: -1, dc: 0, wall: 'north', opposite: 'south' },
            { dr: 1, dc: 0, wall: 'south', opposite: 'north' },
            { dr: 0, dc: 1, wall: 'east', opposite: 'west' },
            { dr: 0, dc: -1, wall: 'west', opposite: 'east' },
        ];
        for (const d of dirs) {
            const n = this.getCell(cell.row + d.dr, cell.col + d.dc);
            if (n) neighbors.push({ cell: n, wall: d.wall, opposite: d.opposite });
        }
        return neighbors;
    }

    removeWall(cellA, cellB) {
        const dr = cellB.row - cellA.row;
        const dc = cellB.col - cellA.col;
        if (dr === -1) { cellA.walls.north = false; cellB.walls.south = false; }
        if (dr === 1)  { cellA.walls.south = false; cellB.walls.north = false; }
        if (dc === 1)  { cellA.walls.east = false;  cellB.walls.west = false; }
        if (dc === -1) { cellA.walls.west = false;   cellB.walls.east = false; }
    }

    reset() {
        this._init();
    }

    snapToGrid(x, y) {
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);
        return this.getCell(row, col);
    }
}
