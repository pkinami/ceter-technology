import assert from "node:assert/strict";
import test from "node:test";
import { validateProductReadiness } from "../src/lib/product-validation.ts";

test("product readiness requires all publish fields", () => {
  const result = validateProductReadiness({
    name: "",
    brand: "",
    modelNumber: "",
    sku: "",
    categoryId: "",
    description: "",
    specifications: "",
    price: 0,
    stock: -1,
    manufacturer: "",
    imageUrl: "",
    media: [],
    warranty: "",
  });

  assert.equal(result.ready, false);
  assert.ok(result.issues.some((issue) => issue.field === "Product Image 1 URL"));
  assert.ok(result.issues.some((issue) => issue.field === "Product Image 2 URL"));
  assert.ok(result.issues.some((issue) => issue.field === "Price"));
});

test("product readiness accepts complete product data", () => {
  const result = validateProductReadiness({
    name: "LaserJet Pro MFP 4103fdw",
    brand: "HP",
    modelNumber: "4103fdw",
    sku: "SUP-HP-4103FDW",
    categoryId: "cat-1",
    description: "Business multifunction laser printer",
    specifications: { Functions: "Print, scan" },
    price: 68999,
    stock: 8,
    manufacturer: "HP Inc.",
    imageUrl: "https://example.com/hp-front.png",
    media: [{ url: "https://example.com/hp-side.png" }, { url: "https://example.com/hp-detail.png" }],
    warranty: "1 year",
  });

  assert.equal(result.ready, true);
  assert.equal(result.issues.length, 0);
});

test("product readiness rejects invalid image URLs", () => {
  const result = validateProductReadiness({
    name: "LaserJet Pro MFP 4103fdw",
    brand: "HP",
    modelNumber: "4103fdw",
    sku: "SUP-HP-4103FDW",
    categoryId: "cat-1",
    description: "Business multifunction laser printer",
    specifications: { Functions: "Print, scan" },
    price: 68999,
    stock: 8,
    manufacturer: "HP Inc.",
    imageUrl: "notaurl",
    media: [{ url: "https://example.com/hp-side.png" }, { url: "https://example.com/hp-detail.png" }],
    warranty: "1 year",
  });

  assert.equal(result.ready, false);
  assert.ok(result.issues.some((issue) => issue.field === "Product Image 1 URL"));
});
