export function cellRefToRowCol(ref: string): { row: number; col: number } {
  const match = /^([A-Za-z]+)([0-9]+)$/.exec(ref.trim());
  if (!match) {
    throw new Error(`Invalid cell reference "${ref}"`);
  }
  const [, letters, digits] = match;

  let col = 0;
  const upper = letters!.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    col = col * 26 + (upper.charCodeAt(i) - 64); 
  }
  col -= 1; 

  const row = parseInt(digits!, 10) - 1; 
  return { row, col };
}

export function rowColToCellRef(row: number, col: number): string {
  let c = col + 1;
  let letters = "";
  while (c > 0) {
    const rem = (c - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    c = Math.floor((c - 1) / 26);
  }
  return `${letters}${row + 1}`;
}