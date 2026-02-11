// js/services/export.js
import { notify } from "../core/ui.js";

/* =========================
   CSV Export
========================= */

/**
 * Exporta dados para CSV
 * @param {string} filename
 * @param {object[]} rows
 * @param {{ headers?: string[], separator?: string }} options
 */
export function exportToCSV(filename, rows, options = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    notify.warning("Nada para exportar.");
    return;
  }

  const separator = options.separator || ";";

  const headers = options.headers && options.headers.length
    ? options.headers
    : Object.keys(rows[0]);

  const csv = [
    headers.join(separator),
    ...rows.map(r =>
      headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(separator)
    )
  ].join("\n");

  downloadFile(csv, filename || "export.csv", "text/csv;charset=utf-8;");
}

/* =========================
   Print / PDF
========================= */

/**
 * Imprime HTML usando o print do navegador
 * @param {string} html
 * @param {string} title
 */
export function printHTML(html, title = "Impressão") {
  const win = window.open("", "_blank");
  if (!win) {
    notify.error("O navegador bloqueou a abertura da janela de impressão.");
    return;
  }

  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

/* =========================
   Helpers
========================= */

function downloadFile(content, filename, mime) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notify.success("Arquivo gerado com sucesso.");
  } catch (e) {
    console.error(e);
    notify.error("Erro ao gerar arquivo.");
  }
}
