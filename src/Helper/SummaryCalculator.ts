import type { Data } from "../Data.js";
interface SummaryResult {
    count: number;
    min: number;
    max: number;
    sum: number;
    average: string;
}

export class SummaryCalculator {
    private startCol: number = -1;
    private endCol: number = -1;
    private startRow: number = -1;
    private endRow: number = -1;

    private countEl = document.querySelector("#count");
    private minEl = document.querySelector("#min");
    private maxEl = document.querySelector("#max");
    private sumEl = document.querySelector("#sum");
    private avgEl = document.querySelector("#avg");

    constructor(private data: Data) { }

    setValues(col1: number, col2: number, row1: number, row2: number,flag:boolean): void {
        this.startCol = Math.min(col1, col2);
        this.endCol = Math.max(col1, col2);
        this.startRow = Math.min(row1, row2);
        this.endRow = Math.max(row1, row2);
        const result = this.computeSummary(flag);
        this.render(result);
    }

    private computeSummary(flag:boolean): SummaryResult {
        let count = 0;
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        let sum = 0;
        if(flag){
            for (const [row, col, cellData] of this.data.entries()) {
                if (row < this.startRow || row > this.endRow) continue;
                if (col < this.startCol || col > this.endCol) continue;

            const value = cellData.value.trim();
            if (value === "" || isNaN(Number(value))) continue;
            
            const num = parseFloat(value);
            count++;
            sum += num;
            if (num < min) min = num;
            if (num > max) max = num;
        }}else{
            for (let i = this.startCol; i <= this.endCol; i++) {
            // if (i < this.startRow || i > this.endRow) continue;
            for (let j = this.startRow; j <= this.endRow; j++) {
                let data = this.data.getData(j, i);
                if (data === null) continue;
                if (data.value === "" || isNaN(Number(data.value))) continue;
                // if (this.isNumeric(data.value)) {
                    // this.dataArray.push(parseInt(data.value));
                    const val = parseInt(data.value);
                    count++;
                    sum += val;
                    if (val < min) min = val;
                    if (val > max) max = val;

                // }
            }
        }}

        return {
            count,
            min: count === 0 ? 0 : min,
            max: count === 0 ? 0 : max,
            sum,
            average: count === 0 ? "0.0000" : (sum / count).toFixed(4),
        };
    }

    private render(result: SummaryResult): void {
        if (this.countEl) this.countEl.textContent = result.count.toString();
        if (this.minEl) this.minEl.textContent = result.min.toString();
        if (this.maxEl) this.maxEl.textContent = result.max.toString();
        if (this.sumEl) this.sumEl.textContent = result.sum.toString();
        if (this.avgEl) this.avgEl.textContent = result.average;
    }
}