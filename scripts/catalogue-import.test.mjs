import assert from "node:assert/strict";
import test from "node:test";
import XLSX from "xlsx";
import {
  normalizeProductImportRow,
  productImportTemplateHeaders,
  validateProductImportPricing,
  validateRequiredProductImportHeaders,
} from "../src/lib/product-import-normalization.ts";
import { previewProductImportWithCatalogue } from "../src/lib/imports.ts";

test("product import template headers match the CETER workbook exactly", () => {
  const workbook = XLSX.readFile("public/templates/ai-master-catalogue-sample.xlsx");
  const sheet = workbook.Sheets["Master Catalogue"];
  assert.ok(sheet, "Master Catalogue sheet exists");

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  assert.deepEqual(rows[0], [...productImportTemplateHeaders]);
  assert.deepEqual(validateRequiredProductImportHeaders(rows[0]), []);
});

test("product rows normalize only the approved ecommerce import columns", () => {
  const row = normalizeProductImportRow({
    "Product Name": "LaserJet Pro MFP 4103fdw",
    Brand: "HP",
    "Model Number": "4103fdw",
    "Supplier SKU": "SUP-HP-4103FDW",
    Category: "Printers",
    Description: "Business multifunction laser printer",
    Specifications: "Functions: Print, scan; Connectivity: USB",
    Price: "68,999",
    Stock: "8",
    Manufacturer: "HP Inc.",
    "Product Image 1 URL": "https://example.com/hp-front.png",
    "Product Image 2 URL": "https://example.com/hp-side.png",
    "Product Image 3 URL (Optional)": "https://example.com/hp-detail.png",
    Warranty: "1 year manufacturer warranty",
  });

  assert.equal(row.productName, "LaserJet Pro MFP 4103fdw");
  assert.equal(row.brand, "HP");
  assert.equal(row.modelNumber, "4103fdw");
  assert.equal(row.supplierSku, "SUP-HP-4103FDW");
  assert.equal(row.category, "Printers");
  assert.equal(row.manufacturer, "HP Inc.");
  assert.equal(row.price, "68,999");
  assert.equal(row.stock, "8");
  assert.equal(row.productImage1Url, "https://example.com/hp-front.png");
  assert.equal(row.productImage2Url, "https://example.com/hp-side.png");
  assert.equal(row.productImage3Url, "https://example.com/hp-detail.png");
});

test("product price validation accepts simple and comma-formatted non-negative prices", () => {
  assert.deepEqual(validateProductImportPricing({ price: "68999" }).errors, []);
  assert.deepEqual(validateProductImportPricing({ price: "68,999.50" }).errors, []);
  assert.deepEqual(validateProductImportPricing({ price: "" }).errors, ["Price is required."]);
  assert.deepEqual(validateProductImportPricing({ price: "-10" }).errors, ["Price must be a valid number greater than zero."]);
});

test("product import preview rejects duplicate supplier SKUs", () => {
  const preview = previewProductImportWithCatalogue(
    "products.xlsx",
    [
      {
        productName: "LaserJet Pro MFP 4103fdw",
        brand: "HP",
        modelNumber: "4103fdw",
        supplierSku: "SUP-HP-4103FDW",
        category: "Printers",
        description: "Business multifunction laser printer",
        specifications: "Functions: Print, scan",
        price: "68,999",
        stock: "8",
        manufacturer: "HP Inc.",
        productImage1Url: "https://example.com/hp-front.png",
        productImage2Url: "https://example.com/hp-side.png",
        productImage3Url: "",
        warranty: "1 year",
      },
      {
        productName: "LaserJet Pro MFP 4103fdw A",
        brand: "HP",
        modelNumber: "4103fdw-a",
        supplierSku: "SUP-HP-4103FDW",
        category: "Printers",
        description: "Duplicate SKU",
        specifications: "Functions: Print",
        price: "68,999",
        stock: "8",
        manufacturer: "HP Inc.",
        productImage1Url: "https://example.com/hp-front-2.png",
        productImage2Url: "https://example.com/hp-side-2.png",
        productImage3Url: "",
        warranty: "1 year",
      },
    ],
    [{ name: "Printers", slug: "printers" }],
    [],
  );

  assert.equal(preview.errorRows, 1);
  assert.ok(preview.errors.some((error) => error.errors.some((message) => message.includes("Supplier SKU must be unique"))));
});
