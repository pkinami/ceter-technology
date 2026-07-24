import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const databaseUrl = process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  throw new Error("POSTGRES_PRISMA_URL is not set. Check .env before running the seed script.");
}

function getConnectionStringWithSslMode(connectionString, sslMode) {
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", sslMode);

  return url.toString();
}

const adapter = new PrismaPg({
  connectionString: getConnectionStringWithSslMode(
    databaseUrl,
    process.env.NODE_ENV === "production" ? "verify-full" : "no-verify",
  ),
});
const prisma = new PrismaClient({ adapter });

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function imageUrl(name) {
  return `https://placehold.co/900x675/0f172a/f97316?text=${encodeURIComponent(name)}`;
}

const categoryTree = {
  Printers: [
    "Laser Printers",
    "Inkjet Printers",
    "Multifunction Printers",
    "Photo Printers",
  ],
  "Printer Accessories": [
    "Toners",
    "Ink Cartridges",
    "Printer Heads",
    "Printing Paper",
    "USB Printer Cables",
    "Maintenance Kits",
  ],
  "Office Equipment": [
    "Scanners",
    "Photocopiers",
    "UPS Systems",
    "Network Equipment",
  ],
};

const products = [
  {
    name: "HP LaserJet Pro M404",
    brand: "HP",
    category: "Laser Printers",
    price: "45000",
    stock: 14,
    description:
      "Fast monochrome laser printer for offices that need sharp documents and reliable daily output.",
    specifications: {
      "Print Technology": "Laser",
      "Print Speed": "40 pages/min",
      Resolution: "1200 dpi",
      Connectivity: "USB / Ethernet / WiFi",
    },
  },
  {
    name: "Canon ImageCLASS LBP6030",
    brand: "Canon",
    category: "Laser Printers",
    price: "22500",
    stock: 10,
    description:
      "Compact Canon laser printer for home offices and small teams with efficient black-and-white printing.",
    specifications: {
      "Print Technology": "Laser",
      "Print Speed": "18 pages/min",
      Resolution: "2400 x 600 dpi",
      Connectivity: "USB",
    },
  },
  {
    name: "Brother HL-L2375DW Laser Printer",
    brand: "Brother",
    category: "Laser Printers",
    price: "33500",
    discountPrice: "31500",
    stock: 8,
    description:
      "Wireless duplex laser printer built for productive workgroups and low running costs.",
    specifications: {
      "Print Technology": "Laser",
      "Print Speed": "34 pages/min",
      Duplex: "Automatic",
      Connectivity: "USB / WiFi / Ethernet",
    },
  },
  {
    name: "Canon PIXMA G6040 MegaTank",
    brand: "Canon",
    category: "Inkjet Printers",
    price: "38000",
    stock: 9,
    description:
      "High-yield MegaTank inkjet printer for affordable colour documents and business reports.",
    specifications: {
      "Print Technology": "Inkjet",
      "Print Speed": "13 ipm black / 6.8 ipm colour",
      Resolution: "4800 x 1200 dpi",
      Connectivity: "USB / WiFi / Ethernet",
    },
  },
  {
    name: "HP Ink Tank 415 Wireless",
    brand: "HP",
    category: "Inkjet Printers",
    price: "25500",
    stock: 12,
    description:
      "Wireless HP ink tank printer for economical colour printing in homes and small offices.",
    specifications: {
      "Print Technology": "Thermal inkjet",
      Functions: "Print / Scan / Copy",
      Resolution: "4800 x 1200 dpi",
      Connectivity: "USB / WiFi",
    },
  },
  {
    name: "Epson EcoTank L3250",
    brand: "Epson",
    category: "Multifunction Printers",
    price: "28000",
    stock: 16,
    description:
      "EcoTank multifunction printer with print, scan, and copy features for everyday office use.",
    specifications: {
      "Print Technology": "Ink tank",
      Functions: "Print / Scan / Copy",
      "Print Speed": "10 pages/min",
      Connectivity: "USB / WiFi",
    },
  },
  {
    name: "HP LaserJet Pro MFP 4103fdw",
    brand: "HP",
    category: "Multifunction Printers",
    price: "62000",
    discountPrice: "59000",
    stock: 5,
    description:
      "Business multifunction laser printer with print, scan, copy, fax, duplex, and wireless support.",
    specifications: {
      "Print Technology": "Laser",
      Functions: "Print / Scan / Copy / Fax",
      "Print Speed": "40 pages/min",
      Connectivity: "USB / Ethernet / WiFi",
    },
  },
  {
    name: "Canon SELPHY CP1500 Photo Printer",
    brand: "Canon",
    category: "Photo Printers",
    price: "28500",
    stock: 6,
    description:
      "Compact photo printer for vibrant lab-quality prints from phones, cameras, and laptops.",
    specifications: {
      "Print Technology": "Dye sublimation",
      "Photo Size": "Postcard and square labels",
      Resolution: "300 x 300 dpi",
      Connectivity: "USB-C / WiFi",
    },
  },
  {
    name: "Brother TN-2480 Toner",
    brand: "Brother",
    category: "Toners",
    price: "4500",
    stock: 35,
    description:
      "Reliable black toner cartridge for compatible Brother laser printers and sharp office output.",
    specifications: {
      Type: "Toner cartridge",
      Colour: "Black",
      Yield: "Up to 3,000 pages",
      Compatibility: "Selected Brother laser printers",
    },
  },
  {
    name: "HP 85A Black Toner Cartridge",
    brand: "HP",
    category: "Toners",
    price: "7800",
    stock: 22,
    description:
      "HP black toner cartridge for dependable monochrome printing and consistent text quality.",
    specifications: {
      Type: "Toner cartridge",
      Colour: "Black",
      Yield: "Up to 1,600 pages",
      Compatibility: "Selected HP LaserJet printers",
    },
  },
  {
    name: "Canon GI-490 Ink Bottle Set",
    brand: "Canon",
    category: "Ink Cartridges",
    price: "6200",
    stock: 28,
    description:
      "Canon ink bottle set for refillable PIXMA printers with high-volume colour printing needs.",
    specifications: {
      Type: "Ink bottle set",
      Colours: "Black / Cyan / Magenta / Yellow",
      Yield: "High yield",
      Compatibility: "Selected Canon PIXMA G series",
    },
  },
  {
    name: "Epson L-Series Print Head",
    brand: "Epson",
    category: "Printer Heads",
    price: "9500",
    stock: 4,
    description:
      "Replacement Epson printer head for restoring print clarity on compatible EcoTank models.",
    specifications: {
      Type: "Printer head",
      Use: "Replacement service part",
      Compatibility: "Selected Epson L-Series printers",
      Warranty: "7 days replacement",
    },
  },
  {
    name: "Premium A4 Printing Paper 80gsm",
    brand: "CETER",
    category: "Printing Paper",
    price: "850",
    stock: 120,
    description:
      "Smooth A4 office paper for everyday printing, copying, invoices, letters, and reports.",
    specifications: {
      Size: "A4",
      Weight: "80gsm",
      Sheets: "500 sheets",
      Use: "Inkjet / Laser / Photocopier",
    },
  },
  {
    name: "USB Printer Cable 3m",
    brand: "CETER",
    category: "USB Printer Cables",
    price: "900",
    stock: 70,
    description:
      "Durable USB Type-A to Type-B cable for reliable printer and scanner connections.",
    specifications: {
      Length: "3 meters",
      Connector: "USB Type-A to Type-B",
      Use: "Printers and scanners",
      Warranty: "7 days replacement",
    },
  },
  {
    name: "APC Easy UPS 1600VA",
    brand: "APC",
    category: "UPS Systems",
    price: "24500",
    stock: 11,
    description:
      "UPS backup power and surge protection for office computers, routers, and key equipment.",
    specifications: {
      Capacity: "1600VA",
      Output: "Battery backup and surge protection",
      Form: "Tower",
      Warranty: "12 months",
    },
  },
  {
    name: "Canon CanoScan LiDE 400",
    brand: "Canon",
    category: "Scanners",
    price: "18500",
    stock: 7,
    description:
      "Slim flatbed document scanner for offices that need clear scans and compact desktop setup.",
    specifications: {
      Type: "Flatbed scanner",
      Resolution: "4800 x 4800 dpi",
      Connectivity: "USB-C",
      "Scan Size": "A4",
    },
  },
  {
    name: "Kyocera TASKalfa Photocopier",
    brand: "Kyocera",
    category: "Photocopiers",
    price: "145000",
    stock: 2,
    description:
      "Office photocopier for document-heavy teams that need copying, scanning, and network printing.",
    specifications: {
      Functions: "Copy / Print / Scan",
      "Print Speed": "25 pages/min",
      Paper: "A3 / A4",
      Connectivity: "USB / Ethernet",
    },
  },
  {
    name: "TP-Link 8-Port Gigabit Switch",
    brand: "TP-Link",
    category: "Network Equipment",
    price: "5500",
    stock: 18,
    description:
      "Gigabit network switch for connecting printers, PCs, and office devices on a stable LAN.",
    specifications: {
      Ports: "8 Gigabit ports",
      Type: "Unmanaged switch",
      Use: "Office LAN",
      Warranty: "12 months",
    },
  },
];

const permissions = [
  ["PRODUCTS", "VIEW", "View all products"],
  ["PRODUCTS", "CREATE", "Create products"],
  ["PRODUCTS", "EDIT", "Edit product details, pricing, inventory, categories, and media"],
  ["PRODUCTS", "DELETE", "Delete products"],
  ["PRODUCTS", "BULK", "Run bulk product updates and deletions"],
  ["ORDERS", "VIEW", "View all orders"],
  ["ORDERS", "EDIT", "Edit order details and internal notes"],
  ["ORDERS", "CANCEL", "Cancel orders"],
  ["ORDERS", "UPDATE_STATUS", "Update order and delivery status"],
  ["CUSTOMERS", "VIEW", "View customer information"],
  ["CUSTOMERS", "EDIT", "Edit customer information"],
  ["REPORTS", "VIEW", "View reports"],
  ["REPORTS", "EXPORT", "Export reports"],
  ["SETTINGS", "MANAGE", "Manage system settings"],
  ["USERS", "VIEW", "View admin users"],
  ["USERS", "CREATE", "Create local user records"],
  ["USERS", "EDIT", "Edit users and role assignments"],
  ["ROLES", "VIEW", "View roles"],
  ["ROLES", "CREATE", "Create custom roles"],
  ["ROLES", "EDIT", "Edit roles"],
  ["ROLES", "DELETE", "Delete custom roles"],
  ["PERMISSIONS", "VIEW", "View permission matrix"],
  ["PERMISSIONS", "MANAGE", "Assign and remove permissions"],
  ["CATEGORIES", "MANAGE", "Manage product categories"],
  ["MEDIA", "MANAGE", "Manage product media"],
  ["MARKETING", "MANAGE", "Manage marketing content"],
];

const rolePermissions = {
  "super-admin": permissions.map(([module, action]) => `${module.toLowerCase()}.${action.toLowerCase()}`),
  "product-manager": [
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
    "products.bulk",
    "categories.manage",
    "media.manage",
  ],
  "order-manager": ["orders.view", "orders.edit", "orders.cancel", "orders.update_status", "customers.view"],
  accountant: ["reports.view", "reports.export", "orders.view"],
  "marketing-manager": ["marketing.manage", "products.view", "reports.view"],
  "customer-support": ["customers.view", "orders.view", "orders.edit"],
};

const roles = [
  ["Super Admin", "super-admin", "Full system access."],
  ["Product Manager", "product-manager", "Products, categories, images, pricing, and inventory."],
  ["Order Manager", "order-manager", "Orders, delivery, and customer issues."],
  ["Accountant", "accountant", "Sales, payments, invoices, and financial reports."],
  ["Marketing Manager", "marketing-manager", "Campaigns, promotions, banners, and SEO content."],
  ["Customer Support", "customer-support", "Customer and order visibility with support notes."],
];

async function main() {
  const categories = new Map();

  for (const [parentName, children] of Object.entries(categoryTree)) {
    const parent = await prisma.category.upsert({
      where: { slug: slugify(parentName) },
      update: {
        name: parentName,
        description: `${parentName} available from CETER Technology.`,
      },
      create: {
        name: parentName,
        slug: slugify(parentName),
        description: `${parentName} available from CETER Technology.`,
      },
    });

    categories.set(parentName, parent);

    for (const childName of children) {
      const child = await prisma.category.upsert({
        where: { slug: slugify(childName) },
        update: {
          name: childName,
          parentId: parent.id,
          description: `${childName} for businesses, schools, and home offices.`,
        },
        create: {
          name: childName,
          slug: slugify(childName),
          parentId: parent.id,
          description: `${childName} for businesses, schools, and home offices.`,
        },
      });

      categories.set(childName, child);
    }
  }

  for (const item of products) {
    const category = categories.get(item.category);
    const url = imageUrl(item.name);
    const product = await prisma.product.upsert({
      where: { slug: slugify(item.name) },
      update: {
        name: item.name,
        description: item.description,
        brand: item.brand,
        price: item.price,
        discountPrice: item.discountPrice ?? null,
        stock: item.stock,
        status: item.stock > 0 ? "PUBLISHED" : "DRAFT",
        imageUrl: url,
        specifications: item.specifications,
        categoryId: category.id,
      },
      create: {
        name: item.name,
        slug: slugify(item.name),
        description: item.description,
        brand: item.brand,
        price: item.price,
        discountPrice: item.discountPrice ?? null,
        stock: item.stock,
        status: item.stock > 0 ? "PUBLISHED" : "DRAFT",
        imageUrl: url,
        specifications: item.specifications,
        categoryId: category.id,
      },
    });

    await prisma.media.deleteMany({ where: { productId: product.id } });
    await prisma.media.create({
      data: {
        productId: product.id,
        url,
        fileName: `${slugify(item.name)}.jpg`,
        fileType: "image/external",
        fileSize: 0,
        storagePath: "",
        type: "IMAGE",
      },
    });
  }

  await prisma.siteContent.upsert({
    where: { section: "homepage-hero" },
    update: {
      title: "Reliable Printing Solutions for Your Business",
      description:
        "Printers, accessories, office equipment, and technical support for Kenyan teams.",
      imageUrl: "/images/ceter-hero.png",
    },
    create: {
      section: "homepage-hero",
      title: "Reliable Printing Solutions for Your Business",
      description:
        "Printers, accessories, office equipment, and technical support for Kenyan teams.",
      imageUrl: "/images/ceter-hero.png",
    },
  });

  await prisma.siteContent.upsert({
    where: { section: "promotions" },
    update: {
      title: "Printer Sale",
      description: "Seasonal deals on selected printers and office essentials.",
      imageUrl: null,
    },
    create: {
      section: "promotions",
      title: "Printer Sale",
      description: "Seasonal deals on selected printers and office essentials.",
      imageUrl: null,
    },
  });

  for (const [module, action, description] of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module, action } },
      update: { code: `${module.toLowerCase()}.${action.toLowerCase()}`, description },
      create: { module, action, code: `${module.toLowerCase()}.${action.toLowerCase()}`, description },
    });
  }

  for (const [name, slug, description] of roles) {
    const role = await prisma.userRole.upsert({
      where: { slug },
      update: { name, description, isSystem: true },
      create: { name, slug, description, isSystem: true },
    });
    const savedPermissions = await prisma.permission.findMany({
      where: { code: { in: rolePermissions[slug] } },
      select: { id: true },
    });

    for (const permission of savedPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`Seeded ${Object.keys(categoryTree).length} category groups and ${products.length} products.`);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
