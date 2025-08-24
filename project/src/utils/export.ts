// project/src/utils/export.ts
type Row = Record<string, any>;

/** Excel (.xlsx) – dynamic import để tránh lỗi bundler */
export async function exportToExcel(
  rows: Row[],
  filename = 'bao_cao.xlsx',
  sheetName = 'Sheet1',
) {
  if (!rows?.length) return;
  const XLSX = await import('xlsx'); // dynamic import
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/** PDF – jsPDF + autotable (dynamic import) */
export async function exportToPDF(
  rows: Row[],
  columns?: { header: string; key: string }[],
  filename = 'bao_cao.pdf',
  title = 'BÁO CÁO',
) {
  if (!rows?.length) return;
  const { default: jsPDF } = await import('jspdf'); // dynamic import
  await import('jspdf-autotable');                  // side-effect plugin

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(14);
  doc.text(title, 40, 40);

  const headers = (columns ?? Object.keys(rows[0] ?? {})).map((c: any) =>
    typeof c === 'string' ? c : c.header,
  );
  const keys = (columns ?? Object.keys(rows[0] ?? {})).map((c: any) =>
    typeof c === 'string' ? c : c.key,
  );

  const body = rows.map((r) => keys.map((k) => safe(r[k])));

  // @ts-expect-error: autotable được attach vào instance
  doc.autoTable({
    startY: 60,
    head: [headers],
    body,
    styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [20, 108, 213] },
  });

  doc.save(filename);
}

/** CSV – nhẹ, không cần thư viện */
export function exportToCSV(
  rows: Row[],
  filename = 'bao_cao.csv',
) {
  if (!rows?.length) return;
  const cols = Object.keys(rows[0]);
  const header = cols.join(',');

  const body = rows.map((r) =>
    cols.map((c) => {
      const raw = r?.[c] ?? '';
      const cell = String(raw).replace(/"/g, '""');
      return /[",\n]/.test(cell) ? `"${cell}"` : cell;
    }).join(','),
  ).join('\n');

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safe(v: any) {
  if (v == null) return '';
  if (typeof v === 'number') return v.toLocaleString('vi-VN');
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}
