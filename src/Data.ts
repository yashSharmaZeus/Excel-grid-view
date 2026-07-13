import type { CellData, CellStyle } from "./Type.js";

export class Data {
    private _data: Map<string, CellData>;
    constructor() {
        this._data = new Map();
    }

    public getData(row: number, col: number): CellData | null {
        return this._data.get(`${row},${col}`) || null;
    }

    public setData(row: number, col: number, value: string, style?: CellStyle): void {
        const key = `${row},${col}`;
        this._data.set(key, { value: value, style:style?style: { background: "#fff" },row,col } as CellData);
        // console.log(this._data);
    }

    public setCellData(row: number, col: number, data: CellData | null): void {
        const key = `${row},${col}`;
        if (data === null) {
            this._data.delete(key);
        } else {
            this.setData(row, col, data.value, data.style)
        }
    }

    public clearData():void{
        this._data.clear();
    }

    public entries(): Array<[number, number, CellData]> {
        const out: Array<[number, number, CellData]> = [];
        for (const [key, data] of this._data.entries()) {
            const [rowStr, colStr] = key.split(",");
            out.push([Number(rowStr), Number(colStr), data]);
        }
        return out;
    }

}