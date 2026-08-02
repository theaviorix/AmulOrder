// Client-side export helpers — no backend, so "downloads" are generated
// entirely in the browser via Blob + an anchor click.

import { jsPDF } from 'jspdf';

function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(val) {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCSV(rows) {
  // rows: array of arrays (first row = header)
  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

export function downloadCSV(filename, rows) {
  const csv = toCSV(rows);
  // BOM so Excel opens UTF-8 (₹ symbol) correctly
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(filename.endsWith('.csv') ? filename : filename + '.csv', blob);
}

// Renders the same "rows" shape used for CSV exports (array of arrays —
// a row with a single cell is treated as a section title, an empty row
// starts a new table, and consecutive multi-cell rows form a proper
// bordered table with the first one as the header) into a real,
// column-aligned PDF table — not just wrapped plain text.
export function downloadPDF(filename, rows, options) {
  const title = options && options.title;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginX * 2;
  let y = 48;

  const ensureRoom = (needed) => {
    if (y + (needed || 16) > pageHeight - 40) {
      doc.addPage();
      y = 48;
      return true;
    }
    return false;
  };

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(title, marginX, y);
    y += 14;
    doc.setDrawColor(210);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 22;
  }

  const cellPadX = 6;
  const cellPadY = 6;
  const fontSize = 9;
  const headerFontSize = 9;
  doc.setFontSize(fontSize);

  // Groups consecutive rows into tables: a length-1 row is a section
  // title, a length-0 row is a blank separator (ends the current table),
  // and everything else accumulates into the current table's rows with
  // the first row treated as its header.
  const blocks = []; // { type: 'title', text } | { type: 'table', header, body }
  let current = null;
  rows.forEach((row) => {
    if (!row || row.length === 0) {
      current = null;
      return;
    }
    if (row.length === 1) {
      blocks.push({ type: 'title', text: String(row[0]) });
      current = null;
      return;
    }
    if (!current) {
      current = { type: 'table', header: row.map((c) => (c === null || c === undefined ? '' : String(c))), body: [] };
      blocks.push(current);
    } else {
      current.body.push(row.map((c) => (c === null || c === undefined ? '' : String(c))));
    }
  });

  const drawTable = (block) => {
    const cols = block.header.length;
    if (cols === 0) return;
    // Column widths: size each column to fit its longest cell (header or
    // body), proportionally scaled down to fit the page width.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(headerFontSize);
    const naturalWidths = block.header.map((h, i) => {
      let w = doc.getTextWidth(h) + cellPadX * 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      block.body.forEach((r) => {
        const cellW = doc.getTextWidth(r[i] ?? '') + cellPadX * 2;
        if (cellW > w) w = cellW;
      });
      return Math.max(w, 44);
    });
    const totalNatural = naturalWidths.reduce((a, b) => a + b, 0);
    const scale = totalNatural > maxWidth ? maxWidth / totalNatural : 1;
    const colWidths = naturalWidths.map((w) => w * scale);
    const colX = [marginX];
    for (let i = 1; i < cols; i++) colX.push(colX[i - 1] + colWidths[i - 1]);

    const wrapRow = (cells) => cells.map((c, i) => doc.splitTextToSize(c, colWidths[i] - cellPadX * 2));

    const drawHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(headerFontSize);
      const wrapped = wrapRow(block.header);
      const lines = Math.max(...wrapped.map((w) => w.length), 1);
      const rowH = lines * 11 + cellPadY * 2 - 4;
      doc.setFillColor(243, 243, 243);
      doc.rect(marginX, y, maxWidth, rowH, 'F');
      wrapped.forEach((wLines, i) => {
        wLines.forEach((line, li) => doc.text(line, colX[i] + cellPadX, y + cellPadY + 7 + li * 11));
      });
      doc.setDrawColor(200);
      doc.rect(marginX, y, maxWidth, rowH);
      colX.slice(1).forEach((x) => doc.line(x, y, x, y + rowH));
      y += rowH;
    };

    ensureRoom(30);
    drawHeader();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    block.body.forEach((row, ri) => {
      const wrapped = wrapRow(row);
      const lines = Math.max(...wrapped.map((w) => w.length), 1);
      const rowH = lines * 11 + cellPadY * 2 - 4;
      if (ensureRoom(rowH)) drawHeader();
      if (ri % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(marginX, y, maxWidth, rowH, 'F');
      }
      wrapped.forEach((wLines, i) => {
        wLines.forEach((line, li) => doc.text(line, colX[i] + cellPadX, y + cellPadY + 7 + li * 11));
      });
      doc.setDrawColor(225);
      doc.rect(marginX, y, maxWidth, rowH);
      colX.slice(1).forEach((x) => doc.line(x, y, x, y + rowH));
      y += rowH;
    });
    y += 16;
  };

  blocks.forEach((block) => {
    if (block.type === 'title') {
      ensureRoom(24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.text(block.text, marginX, y);
      y += 18;
    } else {
      drawTable(block);
    }
  });

  doc.save(filename.endsWith('.pdf') ? filename : filename + '.pdf');
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  triggerDownload(filename, blob);
}

// Resize + compress an uploaded image file down to a small square-ish JPEG
// data URL, so profile pictures don't blow up localStorage quota.
export function compressImageFile(file, maxSize, quality) {
  maxSize = maxSize || 320;
  quality = quality === undefined ? 0.82 : quality;
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height); height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
