#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import xlsx from "xlsx";

const defaultInput = path.resolve(
  "reports",
  "catalogue-feed",
  "upload",
  "source-700-20-corrected",
  "catalogue-import-ready-2026-07-20T19-14-00-433Z.xlsx",
);
const defaultOutput = path.resolve("reports", "catalogue-feed", "pilot", "product-import-first-3.xlsx");

function valueAfter(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function parseArgs(argv = process.argv.slice(2)) {
  return {
    input: path.resolve(valueAfter(argv, "--input") ?? valueAfter(argv, "-i") ?? defaultInput),
    output: path.resolve(valueAfter(argv, "--output") ?? valueAfter(argv, "-o") ?? defaultOutput),
    rows: Number(valueAfter(argv, "--rows") ?? 3),
  };
}

export async function createProductImportPilotWorkbook(options = parseArgs()) {
  if (!Number.isInteger(options.rows) || options.rows < 1) {
    throw new Error("--rows must be a positive whole number.");
  }

  const workbook = xlsx.readFile(options.input, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: true });
  if (rows.length < options.rows) {
    throw new Error(`Source workbook has only ${rows.length} rows; ${options.rows} requested.`);
  }

  const selectedRows = rows.slice(0, options.rows);
  const outputWorkbook = xlsx.utils.book_new();
  const outputSheet = xlsx.utils.json_to_sheet(selectedRows, { header: Object.keys(selectedRows[0]) });
  xlsx.utils.book_append_sheet(outputWorkbook, outputSheet, "Rows");
  await mkdir(path.dirname(options.output), { recursive: true });
  xlsx.writeFile(outputWorkbook, options.output, { bookType: "xlsx" });

  return {
    input: options.input,
    output: options.output,
    rows: selectedRows.length,
    prices: selectedRows.map((row) => row.Price),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createProductImportPilotWorkbook().then((result) => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to create pilot workbook.");
    process.exitCode = 1;
  });
}
