// js/services/export.js

export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) {
    alert("Nada para exportar.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(";"),
    ...rows.map(r =>
      headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(";")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printHTML(html, title = "Impressão") {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
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
