import type { Product, ProductCategory } from "@/types";

export const categories: ProductCategory[] = [
  "Printers",
  "Ink & Toners",
  "Printer Accessories",
  "Office Equipment",
  "IT Support Services",
];

export const categoryGroups = {
  Printers: [
    "Inkjet Printers",
    "Laser Printers",
    "Multifunction Printers",
    "Photo Printers",
  ],
  Accessories: [
    "Ink cartridges",
    "Toners",
    "Printer heads",
    "Printer cables",
    "Maintenance kits",
    "Printing paper",
  ],
  "Office Equipment": [
    "Scanners",
    "Copiers",
    "UPS systems",
    "Networking equipment",
  ],
};

export const products: Product[] = [
  {
    id: "prd-001",
    slug: "hp-laserjet-pro-mfp-4103",
    name: "HP LaserJet Pro MFP 4103",
    description: "Fast monochrome multifunction printer for busy teams.",
    longDescription:
      "A reliable all-in-one laser printer built for business documents, scanning, copying, and high-volume office use with low running costs.",
    price: 48500,
    category: "Printers",
    subcategory: "Multifunction Printers",
    imageTone: "blue",
    stock: 18,
    availability: "In stock",
    featured: true,
    specs: {
      Print: "Black and white laser",
      Speed: "Up to 40 ppm",
      Functions: "Print, copy, scan",
      Connectivity: "USB, Ethernet, Wi-Fi",
      Warranty: "12 months",
    },
    reviews: [
      {
        name: "Procurement Lead",
        rating: 5,
        comment: "Stable, quick, and easy for the whole office to share.",
      },
    ],
  },
  {
    id: "prd-002",
    slug: "canon-pixma-g6040-megatank",
    name: "Canon PIXMA G6040 MegaTank",
    description: "High-yield ink tank printer for color documents and photos.",
    longDescription:
      "Designed for homes and small businesses that need affordable color printing, wireless connectivity, and crisp everyday output.",
    price: 36500,
    category: "Printers",
    subcategory: "Inkjet Printers",
    imageTone: "orange",
    stock: 11,
    availability: "In stock",
    featured: true,
    specs: {
      Print: "Color ink tank",
      Yield: "Up to 7,700 color pages",
      Functions: "Print, copy, scan",
      Connectivity: "USB, Wi-Fi",
      Warranty: "12 months",
    },
    reviews: [
      {
        name: "Design Studio Owner",
        rating: 5,
        comment: "Excellent colors and very economical on ink.",
      },
    ],
  },
  {
    id: "prd-003",
    slug: "brother-tn-2480-toner",
    name: "Brother TN-2480 Toner",
    description: "Genuine high-yield black toner cartridge.",
    longDescription:
      "A dependable toner replacement for compatible Brother laser printers, suited for sharp office reports and contracts.",
    price: 8200,
    category: "Ink & Toners",
    subcategory: "Toners",
    imageTone: "slate",
    stock: 42,
    availability: "In stock",
    featured: true,
    specs: {
      Color: "Black",
      Yield: "Up to 3,000 pages",
      Type: "Original toner",
      Compatibility: "Selected Brother laser printers",
      Warranty: "Manufacturer warranty",
    },
    reviews: [
      {
        name: "Operations Manager",
        rating: 4,
        comment: "Clean output and no leakage issues.",
      },
    ],
  },
  {
    id: "prd-004",
    slug: "epson-maintenance-kit-c13",
    name: "Epson Maintenance Kit C13",
    description: "Service kit for keeping Epson printers running cleanly.",
    longDescription:
      "A practical maintenance kit for offices that depend on consistent print quality and want to reduce downtime.",
    price: 6500,
    category: "Printer Accessories",
    subcategory: "Maintenance kits",
    imageTone: "green",
    stock: 24,
    availability: "Limited stock",
    specs: {
      Type: "Maintenance kit",
      Use: "Printer cleaning and servicing",
      Compatibility: "Selected Epson models",
      Includes: "Service consumables",
      Warranty: "7 days replacement",
    },
    reviews: [
      {
        name: "School Administrator",
        rating: 5,
        comment: "Helped us avoid repeat service calls.",
      },
    ],
  },
  {
    id: "prd-005",
    slug: "kyocera-ecosys-m2040dn",
    name: "Kyocera ECOSYS M2040dn",
    description: "Durable workgroup laser MFP with duplex printing.",
    longDescription:
      "A sturdy office printer for teams that need a dependable daily workhorse with network printing and efficient toner usage.",
    price: 59000,
    category: "Printers",
    subcategory: "Laser Printers",
    imageTone: "cyan",
    stock: 7,
    availability: "Limited stock",
    featured: true,
    specs: {
      Print: "Monochrome laser",
      Speed: "Up to 40 ppm",
      Duplex: "Automatic",
      Connectivity: "USB, Ethernet",
      Duty: "Business workgroup",
    },
    reviews: [
      {
        name: "Finance Office",
        rating: 5,
        comment: "A serious machine for daily document-heavy work.",
      },
    ],
  },
  {
    id: "prd-006",
    slug: "apc-easy-ups-1600va",
    name: "APC Easy UPS 1600VA",
    description: "Power backup for printers, routers, and office equipment.",
    longDescription:
      "Protect critical office equipment against outages and voltage instability with a reliable UPS for business continuity.",
    price: 24500,
    category: "Office Equipment",
    subcategory: "UPS systems",
    imageTone: "violet",
    stock: 16,
    availability: "In stock",
    specs: {
      Capacity: "1600VA",
      Output: "Battery backup and surge protection",
      Use: "Routers, PCs, printers, POS",
      Warranty: "12 months",
      Form: "Tower",
    },
    reviews: [
      {
        name: "Retail Owner",
        rating: 4,
        comment: "Keeps our network and counter printer online.",
      },
    ],
  },
  {
    id: "prd-007",
    slug: "usb-printer-cable-3m",
    name: "USB Printer Cable 3m",
    description: "Reliable USB cable for printer and scanner connections.",
    longDescription:
      "A durable office cable for clean printer setup, replacement installations, and dependable wired connections.",
    price: 900,
    category: "Printer Accessories",
    subcategory: "Printer cables",
    imageTone: "blue",
    stock: 90,
    availability: "In stock",
    specs: {
      Length: "3 meters",
      Connector: "USB Type-A to Type-B",
      Use: "Printers and scanners",
      Shielding: "Standard",
      Warranty: "7 days replacement",
    },
    reviews: [
      {
        name: "IT Technician",
        rating: 5,
        comment: "Good cable for installations and quick replacements.",
      },
    ],
  },
  {
    id: "prd-008",
    slug: "managed-printer-support-plan",
    name: "Managed Printer Support Plan",
    description: "Monthly support for printer maintenance and IT assistance.",
    longDescription:
      "A support service for organizations that want scheduled maintenance, troubleshooting, installation support, and fast response.",
    price: 15000,
    category: "IT Support Services",
    subcategory: "Maintenance contracts",
    imageTone: "orange",
    stock: 999,
    availability: "In stock",
    specs: {
      Coverage: "Printer and basic IT support",
      Response: "Business-hours support",
      Includes: "Maintenance, setup, troubleshooting",
      Billing: "Monthly",
      IdealFor: "SMEs and offices",
    },
    reviews: [
      {
        name: "Office Manager",
        rating: 5,
        comment: "Their support reduced downtime for our branch offices.",
      },
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const featuredProducts = products.filter((product) => product.featured);
