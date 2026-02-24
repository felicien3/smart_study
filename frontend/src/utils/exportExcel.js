const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const downloadExcelFromRows = ({
  fileName = "table_export",
  sheetName = "Sheet1",
  columns = [],
  rows = [],
}) => {
  const headerHtml = columns
    .map((column) => `<th>${escapeHtml(column.header)}</th>`)
    .join("");

  const bodyHtml = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${escapeHtml(row[column.key])}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <meta name="ProgId" content="Excel.Sheet" />
        <meta name="Generator" content="SmartStudy Export" />
        <title>${escapeHtml(sheetName)}</title>
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </body>
    </html>
  `.trim();

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `${fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
