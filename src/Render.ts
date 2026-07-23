// import type { CellData } from './cellModel.js'
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

    private rowHeaderSelection: { x: number, y: number, w: number, h: number } = { x: -1, y: -1, w: -1, h: -1 };
    private colHeaderSelection: { x: number, y: number, w: number, h: number } = { x: -1, y: -1, w: -1, h: -1 };

    public drawHeaderSelection(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        ctx.fillStyle = '#b6d3c36c'
        ctx.fillRect(x, y, w, h);
    }

    private drawHeaderCell(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, color: string, text: string): void {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#bcbcbc";
        ctx.lineWidth = 1;
        ctx.fillStyle = '#000000'
        ctx.strokeRect(x,y, w, h);
        ctx.fillText(text, x+(w/2), y + (h / 2));
    }
    
    private drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, fillColor: string,strokeColor:string, text: string): void {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.fillStyle = '#000000'
        ctx.strokeRect(x,y, w, h);
        ctx.fillText(text, x + 5, y + (h / 2), w - 5);
        
    }

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

            ctx.strokeStyle = '#137e43';
            ctx.fillStyle = '#92bca25e'
            ctx.fillRect(xStart, yStart, rectWidth, rectHeight)
            ctx.lineWidth = 1;
            ctx.strokeRect(xStart, yStart, rectWidth, rectHeight);
            this.rowHeaderSelection = { x: 0, y: yStart, w: headerWidth, h: rectHeight }
            this.colHeaderSelection = { x: xStart, y: 0, w: rectWidth, h: headerHeight }
            ctx.fillStyle = '#b6d3c36c'
        }


        if (setting.selectedCell) {
            const w = setting.getColWidth(setting.selectedCell.col);
            const h = setting.getRowHeight(setting.selectedCell.row);

            const selectX = setting.getColX(setting.selectedCell.col) + headerWidth - scrollX;
            const selectY = setting.getRowY(setting.selectedCell.row) + headerHeight - scrollY;

            ctx.strokeStyle = '#137e43';
            ctx.fillStyle = '#0abe0010'
            ctx.fillRect(selectX, selectY, w, h)
            ctx.lineWidth = 2;
            ctx.strokeRect(selectX, selectY, w, h);
            if (input) {
                input.style.left = selectX + 'px';
                input.style.top = selectY + 'px';
            }
            if (!selectedFirst && !selectedLast) {
                this.colHeaderSelection.w = w;
                this.rowHeaderSelection.h = h;
            }
        }

        for (let r = startRow; r <= endRow; r++) {
            const y = setting.getRowY(r) + headerHeight - scrollY;
            const h = setting.getRowHeight(r);

            for (let c = startCol; c <= endCol; c++) {

                const x = setting.getColX(c) + headerWidth - scrollX;
                const w = setting.getColWidth(c);

                const cellData = data.getData(r, c);
                this.drawCell(ctx, Math.floor(x) + 0.5, Math.floor(y) + 0.5, h,w,"#dedede00", "#aeaeae", cellData?.value || "");
            }

            this.drawHeaderCell(ctx, 0, Math.floor(y) + 0.5, h, headerWidth, "#f5f5f5", (r + 1).toString());
        }
        
        for (let c = startCol; c <= endCol; c++) {
            const x = setting.getColX(c) + headerWidth - scrollX;
            const w = setting.getColWidth(c);
            let ch: string;
            if (c < 26) {
                ch = String.fromCharCode(c + 65);
            } else {
                let remainder = c % 26;
                ch = String.fromCharCode((c / 26) + 64) + String.fromCharCode(remainder + 65);
            }
            this.drawHeaderCell(ctx,Math.floor(x) + 0.5, 0, headerHeight, w, "#f5f5f5", ch);
        }

        this.drawHeaderSelection(ctx, this.rowHeaderSelection.x, this.rowHeaderSelection.y, this.rowHeaderSelection.w, this.rowHeaderSelection.h);
        this.drawHeaderSelection(ctx, this.colHeaderSelection.x, this.colHeaderSelection.y, this.colHeaderSelection.w, this.colHeaderSelection.h);

        ctx.strokeStyle = '#bcbcbc';
        ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(0, 0, headerWidth, headerHeight)
        ctx.strokeRect(0, 0, headerWidth, headerHeight);

        ctx.restore();
    }
}

