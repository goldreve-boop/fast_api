import * as XLSX from 'xlsx';
import { ParsedData, DataRow } from '../types';

export const parseExcelFile = async (file: File, expectedHeaders?: string[]): Promise<ParsedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("File is empty"));
          return;
        }

        // Use ArrayBuffer for better compatibility
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 }); // raw array of arrays

        if (rawData.length === 0) {
           resolve({
             fileName: file.name,
             rows: [],
             headers: []
           });
           return;
        }

        // Smart Header Detection
        // Scan first 10 rows to find the row that contains the most matches for expected headers
        let headerRowIndex = 0;
        let maxMatchCount = 0;

        if (expectedHeaders && expectedHeaders.length > 0) {
          const limit = Math.min(rawData.length, 20); // Check first 20 rows
          const expectedLowers = expectedHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

          for (let i = 0; i < limit; i++) {
            const row = rawData[i];
            if (!Array.isArray(row)) continue;

            let matchCount = 0;
            row.forEach(cell => {
              if (cell) {
                const cellStr = String(cell).toLowerCase().replace(/[^a-z0-9]/g, '');
                if (expectedLowers.includes(cellStr)) {
                  matchCount++;
                }
              }
            });

            if (matchCount > maxMatchCount) {
              maxMatchCount = matchCount;
              headerRowIndex = i;
            }
          }
          // If we found a good match (e.g. at least 2 headers or 50% of expected), use it.
          // If not, fallback to 0 or heuristic.
        }

        let rawHeaders = rawData[headerRowIndex];
        
        // Clean headers: convert to string and trim whitespace
        const cleanHeaders = rawHeaders.map((h: any) => 
          (h === undefined || h === null) ? "" : String(h).trim()
        ).filter((h: string) => h !== "");

        // Parse rows using the identified headers
        const rows = rawData.slice(headerRowIndex + 1).map(row => {
            const rowObj: DataRow = {};
            cleanHeaders.forEach((header, index) => {
                let cellValue = row[index];
                
                // Fix: Handle Excel Serial Dates that are parsed as Date objects
                if (cellValue instanceof Date) {
                   try {
                     cellValue = cellValue.toISOString().split('T')[0];
                   } catch (e) {
                     cellValue = String(cellValue);
                   }
                }
                
                rowObj[header] = cellValue !== undefined ? cellValue : "";
            });
            return rowObj;
        });

        resolve({
          fileName: file.name,
          rows: rows,
          headers: cleanHeaders
        });
      } catch (error) {
        console.error("Excel Parse Error:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    
    reader.readAsArrayBuffer(file);
  });
};