import type { jsPDF } from 'jspdf';
import type { CompanyInfo } from '@/shared/types';

// exceljs y jspdf se cargan solo al exportar para no engordar el paquete inicial.

export interface ExportColumn<T> {
  header: string;
  key: keyof T | string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  value?: (row: T) => string | number | null | undefined;
  numberFormat?: string;
}

export interface ExportOptions<T> {
  title: string;
  subtitle?: string;
  fileName: string;
  columns: ExportColumn<T>[];
  rows: T[];
  company: CompanyInfo;
  generatedBy: string;
  summary?: Array<{ label: string; value: string | number }>;
  landscape?: boolean;
}

function cellValue<T>(column: ExportColumn<T>, row: T): string | number | null {
  const value = column.value
    ? column.value(row)
    : (row as Record<string, unknown>)[column.key as string];
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : String(value);
}

function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const timestamp = () => new Date().toISOString().slice(0, 16).replace(/\D/g, '');

export async function exportToExcel<T>(options: ExportOptions<T>): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = options.company.name;
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(options.title.slice(0, 31), {
    pageSetup: {
      orientation: options.landscape ? 'landscape' : 'portrait',
      fitToPage: true,
      fitToWidth: 1,
    },
  });

  const columnCount = options.columns.length;
  sheet.mergeCells(1, 1, 1, columnCount);
  sheet.getCell(1, 1).value = options.company.name.toUpperCase();
  sheet.getCell(1, 1).font = { bold: true, size: 14, color: { argb: 'FF1D4ED8' } };

  sheet.mergeCells(2, 1, 2, columnCount);
  sheet.getCell(2, 1).value = [
    options.company.ruc ? `RUC ${options.company.ruc}` : null,
    options.company.address,
  ]
    .filter(Boolean)
    .join(' · ');
  sheet.getCell(2, 1).font = { size: 9, color: { argb: 'FF64748B' } };

  sheet.mergeCells(3, 1, 3, columnCount);
  sheet.getCell(3, 1).value = options.title;
  sheet.getCell(3, 1).font = { bold: true, size: 12 };

  sheet.mergeCells(4, 1, 4, columnCount);
  sheet.getCell(4, 1).value =
    `${options.subtitle ? `${options.subtitle} · ` : ''}Generado por ${options.generatedBy} el ${new Date().toLocaleString('es-PE')}`;
  sheet.getCell(4, 1).font = { size: 9, italic: true, color: { argb: 'FF64748B' } };

  const headerRowIndex = 6;
  const headerRow = sheet.getRow(headerRowIndex);
  options.columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { horizontal: column.align ?? 'left', vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF1E40AF' } } };
    sheet.getColumn(index + 1).width = column.width ?? 18;
  });
  headerRow.height = 22;

  options.rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowIndex);
    options.columns.forEach((column, index) => {
      const cell = excelRow.getCell(index + 1);
      cell.value = cellValue(column, row);
      cell.alignment = {
        horizontal: column.align ?? (typeof cell.value === 'number' ? 'right' : 'left'),
      };
      if (column.numberFormat && typeof cell.value === 'number') cell.numFmt = column.numberFormat;
      if (rowIndex % 2 === 1)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    });
  });

  if (options.summary?.length) {
    let rowIndex = headerRowIndex + options.rows.length + 2;
    for (const item of options.summary) {
      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = item.label;
      row.getCell(1).font = { bold: true };
      row.getCell(2).value = item.value;
      row.getCell(2).alignment = { horizontal: 'left' };
      rowIndex += 1;
    }
  }

  sheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];
  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: columnCount },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  download(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${options.fileName}_${timestamp()}.xlsx`,
  );
}

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch('/logo.png');
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportToPdf<T>(options: ExportOptions<T>): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({
    orientation: options.landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const logo = await loadLogo();

  const drawHeader = () => {
    if (logo) doc.addImage(logo, 'PNG', 12, 8, 30, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(29, 78, 216);
    doc.text(options.company.name.toUpperCase(), 46, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const companyLine = [
      options.company.ruc ? `RUC ${options.company.ruc}` : null,
      options.company.address,
      options.company.phone,
    ]
      .filter(Boolean)
      .join(' · ');
    doc.text(companyLine, 46, 19);
    doc.text('Sistema web de control de inventarios', 46, 23);
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.6);
    doc.line(12, 28, pageWidth - 12, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(options.title, 12, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${options.subtitle ? `${options.subtitle} · ` : ''}Generado por ${options.generatedBy} el ${new Date().toLocaleString('es-PE')}`,
      12,
      40,
    );
  };

  autoTable(doc, {
    startY: 44,
    margin: { top: 44, left: 12, right: 12, bottom: 16 },
    head: [options.columns.map((column) => column.header)],
    body: options.rows.map((row) =>
      options.columns.map((column) => {
        const value = cellValue(column, row);
        if (value === null) return '';
        return typeof value === 'number'
          ? value.toLocaleString('es-PE', { maximumFractionDigits: 3 })
          : value;
      }),
    ),
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [30, 41, 59] },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: Object.fromEntries(
      options.columns.map((column, index) => [
        index,
        { halign: column.align ?? 'left', cellWidth: column.width ? column.width * 1.6 : 'auto' },
      ]),
    ),
    didDrawPage: (data) => {
      drawHeader();
      const pageNumber = data.pageNumber;
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${pageNumber}`, pageWidth - 12, doc.internal.pageSize.getHeight() - 8, {
        align: 'right',
      });
      doc.text(options.company.name, 12, doc.internal.pageSize.getHeight() - 8);
    },
  });

  if (options.summary?.length) {
    const finalY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 50;
    let y = finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    for (const item of options.summary) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}:`, 12, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.value), 70, y);
      y += 5;
    }
  }

  doc.save(`${options.fileName}_${timestamp()}.pdf`);
}
