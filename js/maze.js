import { MAZE_ITERATIONS_PER_FRAME } from './config.js';

export class MazeGenerator {
    constructor(grid) {
        this.grid = grid;
        this.frontier = [];
    }

    activateBrush(centerRow, centerCol, radius) {
        const newlyActivated = [];
        const r2 = radius * radius;

        for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
                if (dr * dr + dc * dc > r2) continue;
                const cell = this.grid.getCell(centerRow + dr, centerCol + dc);
                if (!cell || cell.state !== 'inactive') continue;

                cell.state = 'active';
                newlyActivated.push(cell);
            }
        }

        this._seedFrontier(newlyActivated);
    }

    _seedFrontier(newCells) {
        for (const cell of newCells) {
            const neighbors = this.grid.getNeighbors(cell);
            for (const { cell: neighbor } of neighbors) {
                if (neighbor.inMaze && neighbor.state !== 'inactive') {
                    this.frontier.push({ from: neighbor, to: cell });
                } else if (neighbor.state !== 'inactive' && !neighbor.inMaze) {
                    // Both are active but neither is in maze yet — still add if one side is in maze
                    // This case is handled: if neighbor.inMaze we add above
                }
            }
            // Also: if this cell is adjacent to another newly activated cell that isn't inMaze,
            // we don't add it yet. It will be added when one side becomes inMaze via expansion.
        }
    }

    expand() {
        let iterations = MAZE_ITERATIONS_PER_FRAME;
        while (iterations > 0 && this.frontier.length > 0) {
            // Pick random edge
            const idx = Math.floor(Math.random() * this.frontier.length);
            const edge = this.frontier[idx];

            // Swap-remove for O(1)
            this.frontier[idx] = this.frontier[this.frontier.length - 1];
            this.frontier.pop();

            const { from, to } = edge;

            // Skip if target is already in maze (avoid loops)
            if (to.inMaze) continue;
            // Skip if target became inactive (shouldn't happen but safety)
            if (to.state === 'inactive') continue;

            // Connect
            this.grid.removeWall(from, to);
            to.inMaze = true;
            to.parent = from;

            // Add new frontier edges from the newly connected cell
            const neighbors = this.grid.getNeighbors(to);
            for (const { cell: neighbor } of neighbors) {
                if (neighbor.state !== 'inactive' && !neighbor.inMaze) {
                    this.frontier.push({ from: to, to: neighbor });
                }
            }

            iterations--;
        }
    }

    reset() {
        this.frontier = [];
    }
}
