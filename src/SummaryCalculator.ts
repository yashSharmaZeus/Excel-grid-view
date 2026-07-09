import type { Data } from "./Data.js";

export class SummaryCalculator {
    private col1: number = -1;
    private col2: number = -1;
    private row1: number = -1;
    private row2: number = -1;
    private startCol : number = -1;
    private endCol : number = -1;
    private startRow : number = -1;
    private endRow : number = -1;
    private dataArray: number[] = [];
    constructor(private data: Data) {
    }

    setValues(col1: number, col2: number, row1: number, row2: number): void {
        this.col1 = col1;
        this.col2 = col2;
        this.row1 = row1;
        this.row2 = row2;
        this.startCol= Math.min(this.col1,this.col2);
        this.endCol = Math.max(this.col1,this.col2);
        this.startRow =  Math.min(this.row1,this.row2);
        this.endRow =  Math.max(this.row1,this.row2);

        this.dataArray = [];
        for (let i = this.startCol; i <= this.endCol; i++) {
            for (let j = this.startRow; j <= this.endRow; j++) {
                let data = this.data.getData(j, i);
                if(data === null) continue;
                if(this.isNumeric(data.value)){
                    this.dataArray.push(parseInt(data.value))
                }
            }
        }
        
        let countElement = document.querySelector("#count");
        if (countElement){
            countElement.innerHTML = this.count().toString();
        }
        let minElement = document.querySelector("#min");
        if (minElement){
            minElement.innerHTML = this.min().toString();
        }
        let maxElement = document.querySelector("#max");
        if (maxElement){
            maxElement.innerHTML = this.max().toString();
        }
        let sumElement = document.querySelector("#sum");
        if (sumElement){
            sumElement.innerHTML = this.sum().toString();
        }
        let averageElement = document.querySelector("#avg");
        if (averageElement){
            averageElement.innerHTML = this.average().toString();
        }
    }

    private isNumeric = (str:string) => str.trim() !== '' && !isNaN(Number(str));

    count(): number {
        return this.dataArray.length;
    }

    min(): number {
        return Math.min(...this.dataArray)
    }

    max(): number {
        return Math.max(...this.dataArray)
    }

    sum(): number {
        let sum = 0;
        this.dataArray.forEach((val:number)=>sum+=val)
        return sum;
    }

    average(): number {
        let sum = this.sum();
        let count = this.count();
        return sum/count;
    }
}