import type { CellData } from './Type.js'
import { Data } from './Data.js';

export interface RenderSetting {
    ctx: CanvasRenderingContext2D;

    input: HTMLInputElement | null;

    data: Data;

    canvasWidth: number;
    canvasHeight: number;

    rowCount: number;
    colCount: number;

    headerWidth: number;
    headerHeight: number;

    scrollX: number;
    scrollY: number;

    isDragging: boolean;
    selectedFirst: { row: number; col: number } | null;
    selectedLast: { row: number; col: number } | null;

    getRowHeight(row: number): number;
    getColWidth(col: number): number;

    getRowY(row: number): number;
    getColX(col: number): number;

    selectedCell?: {
        row: number;
        col: number;
    } | null;
}

export class Render {
    public render(setting: RenderSetting): void {

        const {
            ctx,
            input,
            data,
            canvasWidth,
            canvasHeight,
            rowCount,
            colCount,
            headerWidth,
            headerHeight,
            scrollX,
            scrollY,
            isDragging,
            selectedFirst,
            selectedLast
        } = setting;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();

        let startCol = 0, accX = 0;
        while (accX + setting.getColWidth(startCol) < scrollX && startCol < colCount - 1) {
            accX += setting.getColWidth(startCol);
            startCol++;
        }
        let endCol = startCol, x2 = accX;
        while (x2 < scrollX + canvasWidth && endCol < colCount - 1) {
            x2 += setting.getColWidth(endCol);
            endCol++;
        }

        let startRow = 0, accY = 0;
        while (accY + setting.getRowHeight(startRow) < scrollY && startRow < rowCount - 1) {
            accY += setting.getRowHeight(startRow);
            startRow++;
        }
        let endRow = startRow, y2 = accY;
        while (y2 < scrollY + canvasHeight && endRow < rowCount - 1) {
            y2 += setting.getRowHeight(endRow);
            endRow++;
        }


        for (let r = startRow; r <= endRow; r++) {
            const y = setting.getRowY(r) + headerHeight - scrollY;
            const h = setting.getRowHeight(r);

            for (let c = startCol; c <= endCol; c++) {

                const x = setting.getColX(c) + headerWidth - scrollX;
                const w = setting.getColWidth(c);

                const cellData = data.getData(r, c);
                if (cellData && cellData.style) {
                    ctx.strokeStyle = cellData.style.background;
                    ctx.fillStyle = cellData.style.background
                    ctx.fillRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, w, h)
                }
                ctx.strokeStyle = "#aeaeae";
                ctx.lineWidth = 1;
                ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, w, h);

                if (cellData && cellData.value) {
                    ctx.fillStyle = '#000000';
                    ctx.fillText(cellData.value, x + 5, y + (h / 2), w - 10);
                }
            }


            ctx.fillStyle = '#ddf6ce'
            ctx.fillRect(0, Math.floor(y) + 0.5, headerWidth, h)
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.fillStyle = '#000000'
            ctx.strokeRect(0, Math.floor(y) + 0.5, headerWidth, h);
            ctx.fillText((r + 1).toString(), 20, y + (setting.headerHeight / 2));
        }

        for (let c = startCol; c <= endCol; c++) {
            const x = setting.getColX(c) + headerWidth - scrollX;
            const w = setting.getColWidth(c);

            ctx.fillStyle = '#ddf6ce'
            ctx.fillRect(Math.floor(x) + 0.5, 0, w, headerHeight)
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.fillStyle = '#000000'
            ctx.strokeRect(Math.floor(x) + 0.5, 0, w, headerHeight);
            let ch: string;
            if (c < 26) {
                ch = String.fromCharCode(c + 65);
            } else {
                let remainder = c % 26;
                ch = String.fromCharCode((c / 26) + 64) + String.fromCharCode(remainder + 65);
            }
            ctx.fillText(ch, x + (w / 2), (setting.headerHeight / 2));
        }

        
        if (setting.selectedCell) {
            const w = setting.getColWidth(setting.selectedCell.col);
            const h = setting.getRowHeight(setting.selectedCell.row);

            const selectX = setting.getColX(setting.selectedCell.col) + headerWidth - scrollX;
            const selectY = setting.getRowY(setting.selectedCell.row) + headerHeight - scrollY;

            ctx.strokeStyle = '#0abe00';
            ctx.fillStyle = '#0abe0010'
            ctx.fillRect(selectX, selectY, w, h)
            ctx.lineWidth = 2;
            ctx.strokeRect(selectX, selectY, w, h);
            if (input) {
                input.style.left = selectX + 'px';
                input.style.top = selectY + 'px';
            }
        }


        if (selectedFirst && selectedLast) {
            const startColIdx = Math.min(selectedFirst.col, selectedLast.col);
            const endColIdx = Math.max(selectedFirst.col, selectedLast.col);
            const startRowIdx = Math.min(selectedFirst.row, selectedLast.row);
            const endRowIdx = Math.max(selectedFirst.row, selectedLast.row);

            const xStart = setting.getColX(startColIdx) + headerWidth - scrollX;
            const yStart = setting.getRowY(startRowIdx) + headerHeight - scrollY;

            const xEnd = setting.getColX(endColIdx) + headerWidth - scrollX + setting.getColWidth(endColIdx);
            const yEnd = setting.getRowY(endRowIdx) + headerHeight - scrollY + setting.getRowHeight(endRowIdx);

            const rectWidth = xEnd - xStart;
            const rectHeight = yEnd - yStart;

            ctx.strokeStyle = '#00000000';
            ctx.fillStyle = '#00a1be3b'
            ctx.fillRect(xStart, yStart, rectWidth, rectHeight)
            ctx.lineWidth = 2;
            ctx.strokeRect(xStart, yStart, rectWidth, rectHeight);
        }
        
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#afc7a2'
        ctx.fillRect(0, 0, headerWidth, headerHeight)
        ctx.strokeRect(0, 0, headerWidth, headerHeight);

        ctx.restore();
    }
}