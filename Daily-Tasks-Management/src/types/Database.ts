export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface QueryResult {
  columns: string[];
  rows: string[][];
  rowCount: number;
}
