export class CellStyle{
  constructor(
    public background: string = '#fff'
  ){}
}

export class CellData {
  constructor(
    public value: string,
    public row: number,
    public col: number,
    public style: CellStyle = new CellStyle(),
  ) { }

}