export interface CellStyle {
  background: string;
  color: string;
}
 
export interface CellData {
  value: string;
  style?: CellStyle;
}
 