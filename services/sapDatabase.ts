
import { DataRow, CustomerMapping, MaterialMapping, MenuRole, ButtonRole, User } from '../types';

// Mimic SAP Transparent Tables
export class SAPDatabase {
  private static instance: SAPDatabase;

  // Table Storage
  public ZNIELSEN: DataRow[] = [];
  public ZPROMOTION: DataRow[] = [];
  public ZFIDOC: DataRow[] = [];
  public ZCOGS: DataRow[] = [];
  public ZLISTPRICE: DataRow[] = [];
  public ZCUSTHIER: DataRow[] = [];
  public ZDISPUTE: DataRow[] = []; 
  public ZCLAIM: any[] = [];
  public ZPROMOSPEND: DataRow[] = []; // New Table
  public ZMAPPING_CUST: CustomerMapping[] = [];
  public ZMAPPING_MAT: MaterialMapping[] = [];
  
  // Authorization Tables
  public ZUSER: User[] = [];
  public ZMENUROLE: MenuRole[] = [];
  public ZBUTTONROLE: ButtonRole[] = [];

  private constructor() {}

  public static getInstance(): SAPDatabase {
    if (!SAPDatabase.instance) {
      SAPDatabase.instance = new SAPDatabase();
    }
    return SAPDatabase.instance;
  }

  // --- DB Operations (INSERT / SELECT / DELETE) ---

  public clearTable(tableName: string) {
    (this as any)[tableName] = [];
  }

  public insertRows(tableName: string, rows: any[]) {
    if ((this as any)[tableName]) {
      (this as any)[tableName] = [...(this as any)[tableName], ...rows];
    }
  }

  public getTable(tableName: string): any[] {
    return (this as any)[tableName] || [];
  }

  // Helper to check if basic data exists
  public isReadyForAnalysis(): boolean {
    return this.ZNIELSEN.length > 0 && this.ZPROMOTION.length > 0;
  }
}

export const SAP_DB = SAPDatabase.getInstance();
