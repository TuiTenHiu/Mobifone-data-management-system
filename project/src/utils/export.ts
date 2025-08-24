// src/utils/export.ts
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Row = Record<string, any>;

export function exportToExcel(
  rows: Row[],
  filename = 'bao_cao.xlsx',
  sheetName = 'Sheet1',
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportToPdf(
  rows: Row[],
  columns?: { header: string; key: string }[],
  filename = 'bao_cao.pdf',
  title = 'BÁO CÁO',
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(14);
  doc.text(title, 40, 40);

  const headers = (columns ?? Object.keys(rows[0] ?? {})).map((c) =>
    typeof c === 'string' ? c : c.header,
  );
  const keys = (columns ?? Object.keys(rows[0] ?? {})).map((c: any) =>
    typeof c === 'string' ? c : c.key,
  );

  const body = rows.map((r) => keys.map((k) => safe(r[k])));

  autoTable(doc, {
    startY: 60,
    head: [headers],
    body,
    styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [20, 108, 213] },
  });

  doc.save(filename);
}

function safe(v: any) {
  if (v == null) return '';
  if (typeof v === 'number') return v.toLocaleString('vi-VN');
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}
