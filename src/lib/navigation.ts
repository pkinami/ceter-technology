export type NavigationLink = {
  label: string;
  href: string;
};

export type DepartmentCategory = NavigationLink & {
  children?: NavigationLink[];
};

export type FeaturedNavigationCard = NavigationLink & {
  description: string;
};

export type MarketplaceDepartment = NavigationLink & {
  id: string;
  categories: DepartmentCategory[];
  popularTitle: string;
  popular: NavigationLink[];
  featuredTitle: string;
  featured: FeaturedNavigationCard[];
};

const productSearchHref = (query: string) => `/products?q=${encodeURIComponent(query)}`;
const categoryHref = (category: string) => `/products?category=${encodeURIComponent(category)}`;

export const marketplaceNavigation: MarketplaceDepartment[] = [
  {
    id: "printers",
    label: "Printers",
    href: categoryHref("Printers"),
    categories: [
      {
        label: "Laser Printers",
        href: productSearchHref("Laser Printers"),
        children: [
          { label: "HP LaserJet", href: productSearchHref("HP LaserJet") },
          { label: "Canon Laser", href: productSearchHref("Canon Laser") },
          { label: "Brother Laser", href: productSearchHref("Brother Laser") },
        ],
      },
      {
        label: "Inkjet Printers",
        href: productSearchHref("Inkjet Printers"),
        children: [
          { label: "HP Inkjet", href: productSearchHref("HP Inkjet") },
          { label: "Epson Inkjet", href: productSearchHref("Epson Inkjet") },
          { label: "Canon Inkjet", href: productSearchHref("Canon Inkjet") },
        ],
      },
      {
        label: "Multifunction Printers",
        href: productSearchHref("Multifunction Printers"),
        children: [
          { label: "Print Scan Copy", href: productSearchHref("Print Scan Copy") },
          { label: "Wireless Multifunction", href: productSearchHref("Wireless Multifunction") },
        ],
      },
      { label: "Photo Printers", href: productSearchHref("Photo Printers") },
      { label: "Label Printers", href: productSearchHref("Label Printers") },
      { label: "Large Format Printers", href: productSearchHref("Large Format Printers") },
    ],
    popularTitle: "Laser Printers",
    popular: [
      { label: "HP LaserJet", href: productSearchHref("HP LaserJet") },
      { label: "Canon Laser", href: productSearchHref("Canon Laser") },
      { label: "Brother Laser", href: productSearchHref("Brother Laser") },
    ],
    featuredTitle: "Popular Printer Solutions",
    featured: [
      { label: "HP Enterprise Printers", href: productSearchHref("HP Enterprise Printers"), description: "Managed printing for busy offices." },
      { label: "Business Printing", href: productSearchHref("Business Printing"), description: "Reliable devices for teams and branches." },
      { label: "Printer Installation Services", href: "/services", description: "Setup, networking, drivers, and support." },
    ],
  },
  {
    id: "printer-consumables",
    label: "Printer Consumables",
    href: categoryHref("Printer Consumables"),
    categories: [
      {
        label: "Toners",
        href: productSearchHref("Toners"),
        children: [
          { label: "HP Toners", href: productSearchHref("HP Toners") },
          { label: "Canon Toners", href: productSearchHref("Canon Toners") },
          { label: "Brother Toners", href: productSearchHref("Brother Toners") },
        ],
      },
      {
        label: "Ink Cartridges",
        href: productSearchHref("Ink Cartridges"),
        children: [
          { label: "HP Ink Cartridge", href: productSearchHref("HP Ink Cartridge") },
          { label: "Canon Ink Cartridge", href: productSearchHref("Canon Ink Cartridge") },
        ],
      },
      {
        label: "Ink Bottles",
        href: productSearchHref("Ink Bottles"),
        children: [
          { label: "Epson Ink Bottles", href: productSearchHref("Epson Ink Bottles") },
          { label: "Canon Ink Bottles", href: productSearchHref("Canon Ink Bottles") },
        ],
      },
      { label: "Printer Parts", href: productSearchHref("Printer Parts") },
      { label: "Printing Paper", href: productSearchHref("Printing Paper") },
      { label: "Accessories", href: productSearchHref("Printer Accessories") },
    ],
    popularTitle: "High-Demand Supplies",
    popular: [
      { label: "HP Toners", href: productSearchHref("HP Toners") },
      { label: "Canon Toners", href: productSearchHref("Canon Toners") },
      { label: "Epson Ink Bottles", href: productSearchHref("Epson Ink Bottles") },
    ],
    featuredTitle: "Supply Programs",
    featured: [
      { label: "Genuine Toner Supply", href: productSearchHref("Genuine Toners"), description: "Original cartridges for predictable output." },
      { label: "Office Replenishment", href: "/contact", description: "Quote support for recurring consumables." },
      { label: "Printer Maintenance Parts", href: productSearchHref("Printer Parts"), description: "Parts for service and repair workflows." },
    ],
  },
  {
    id: "office-equipment",
    label: "Office Equipment",
    href: categoryHref("Office Equipment"),
    categories: [
      { label: "Photocopiers", href: productSearchHref("Photocopiers") },
      { label: "Scanners", href: productSearchHref("Scanners") },
      { label: "Laminators", href: productSearchHref("Laminators") },
      { label: "Binding Machines", href: productSearchHref("Binding Machines") },
    ],
    popularTitle: "Office Productivity",
    popular: [
      { label: "Document Scanners", href: productSearchHref("Document Scanners") },
      { label: "A3 Photocopiers", href: productSearchHref("A3 Photocopiers") },
      { label: "Thermal Binding", href: productSearchHref("Binding Machines") },
    ],
    featuredTitle: "Workspace Upgrades",
    featured: [
      { label: "Document Workflow", href: productSearchHref("Office Equipment"), description: "Scan, copy, bind, and finish documents." },
      { label: "Reception Equipment", href: productSearchHref("Laminators"), description: "Tools for front-office daily operations." },
      { label: "Procurement Support", href: "/contact", description: "Guidance for department purchasing." },
    ],
  },
  {
    id: "computers",
    label: "Computers",
    href: categoryHref("Computers"),
    categories: [
      {
        label: "Laptops",
        href: productSearchHref("Laptops"),
        children: [
          { label: "HP Laptops", href: productSearchHref("HP Laptops") },
          { label: "Dell Laptops", href: productSearchHref("Dell Laptops") },
          { label: "Lenovo Laptops", href: productSearchHref("Lenovo Laptops") },
        ],
      },
      {
        label: "Desktop Computers",
        href: productSearchHref("Desktop Computers"),
        children: [
          { label: "HP Desktops", href: productSearchHref("HP Desktops") },
          { label: "Dell Desktops", href: productSearchHref("Dell Desktops") },
        ],
      },
      { label: "Workstations", href: productSearchHref("Workstations") },
      { label: "Servers", href: productSearchHref("Servers") },
    ],
    popularTitle: "Business Computing",
    popular: [
      { label: "HP Laptops", href: productSearchHref("HP Laptops") },
      { label: "Dell Desktops", href: productSearchHref("Dell Desktops") },
      { label: "Lenovo Workstations", href: productSearchHref("Lenovo Workstations") },
    ],
    featuredTitle: "Enterprise Computing",
    featured: [
      { label: "Fleet Laptops", href: productSearchHref("Business Laptops"), description: "Standardized laptops for teams." },
      { label: "Office Desktops", href: productSearchHref("Desktop Computers"), description: "Dependable workstations for daily use." },
      { label: "Server Procurement", href: productSearchHref("Servers"), description: "Infrastructure options for growing teams." },
    ],
  },
  {
    id: "computer-accessories",
    label: "Computer Accessories",
    href: categoryHref("Computer Accessories"),
    categories: [
      { label: "Monitors", href: productSearchHref("Monitors") },
      { label: "Keyboards", href: productSearchHref("Keyboards") },
      { label: "Mouse", href: productSearchHref("Mouse") },
      { label: "Webcams", href: productSearchHref("Webcams") },
    ],
    popularTitle: "Desk Accessories",
    popular: [
      { label: "HD Monitors", href: productSearchHref("HD Monitors") },
      { label: "Wireless Keyboards", href: productSearchHref("Wireless Keyboards") },
      { label: "Conference Webcams", href: productSearchHref("Conference Webcams") },
    ],
    featuredTitle: "Desk Setup",
    featured: [
      { label: "Hybrid Meeting Kits", href: productSearchHref("Webcams"), description: "Webcams and accessories for calls." },
      { label: "Productive Workstations", href: productSearchHref("Computer Accessories"), description: "Peripherals for comfortable work." },
      { label: "Monitor Upgrades", href: productSearchHref("Monitors"), description: "Displays for finance, design, and admin." },
    ],
  },
  {
    id: "storage",
    label: "Storage",
    href: categoryHref("Storage"),
    categories: [
      { label: "SSD", href: productSearchHref("SSD") },
      { label: "HDD", href: productSearchHref("HDD") },
      { label: "Flash Drives", href: productSearchHref("Flash Drives") },
    ],
    popularTitle: "Storage Types",
    popular: [
      { label: "External SSD", href: productSearchHref("External SSD") },
      { label: "Desktop HDD", href: productSearchHref("Desktop HDD") },
      { label: "USB Flash Drives", href: productSearchHref("USB Flash Drives") },
    ],
    featuredTitle: "Data Storage",
    featured: [
      { label: "Backup Drives", href: productSearchHref("Backup Drives"), description: "Capacity for office backups." },
      { label: "Laptop SSD Upgrades", href: productSearchHref("Laptop SSD"), description: "Faster storage for existing devices." },
      { label: "Portable Storage", href: productSearchHref("Flash Drives"), description: "Everyday file movement and sharing." },
    ],
  },
  {
    id: "networking",
    label: "Networking",
    href: categoryHref("Networking"),
    categories: [
      {
        label: "Routers",
        href: productSearchHref("Routers"),
        children: [
          { label: "WiFi Routers", href: productSearchHref("WiFi Routers") },
          { label: "Business Routers", href: productSearchHref("Business Routers") },
        ],
      },
      {
        label: "Switches",
        href: productSearchHref("Switches"),
        children: [
          { label: "PoE Switches", href: productSearchHref("PoE Switches") },
          { label: "Gigabit Switches", href: productSearchHref("Gigabit Switches") },
        ],
      },
      {
        label: "Access Points",
        href: productSearchHref("Access Points"),
        children: [
          { label: "Ceiling Access Points", href: productSearchHref("Ceiling Access Points") },
          { label: "Outdoor Access Points", href: productSearchHref("Outdoor Access Points") },
        ],
      },
      { label: "Cabling", href: productSearchHref("Cabling") },
    ],
    popularTitle: "Network Essentials",
    popular: [
      { label: "WiFi Routers", href: productSearchHref("WiFi Routers") },
      { label: "PoE Switches", href: productSearchHref("PoE Switches") },
      { label: "Ceiling Access Points", href: productSearchHref("Access Points") },
    ],
    featuredTitle: "Connectivity Services",
    featured: [
      { label: "Office WiFi", href: productSearchHref("Office WiFi"), description: "Coverage planning and access points." },
      { label: "Structured Cabling", href: productSearchHref("Cabling"), description: "Cable, switch, and rack essentials." },
      { label: "Network Installation", href: "/services", description: "Deployment support for business sites." },
    ],
  },
  {
    id: "power-solutions",
    label: "Power Solutions",
    href: categoryHref("Power Solutions"),
    categories: [
      { label: "UPS", href: productSearchHref("UPS") },
      { label: "Surge Protectors", href: productSearchHref("Surge Protectors") },
    ],
    popularTitle: "Power Protection",
    popular: [
      { label: "APC UPS", href: productSearchHref("APC UPS") },
      { label: "Line Interactive UPS", href: productSearchHref("Line Interactive UPS") },
      { label: "Surge Guard", href: productSearchHref("Surge Protectors") },
    ],
    featuredTitle: "Business Continuity",
    featured: [
      { label: "UPS for Servers", href: productSearchHref("Server UPS"), description: "Backup power for critical systems." },
      { label: "Desktop Protection", href: productSearchHref("UPS"), description: "Power stability for workstations." },
      { label: "Power Audit Support", href: "/contact", description: "Match capacity to your equipment." },
    ],
  },
  {
    id: "security",
    label: "Security",
    href: categoryHref("Security"),
    categories: [
      { label: "CCTV", href: productSearchHref("CCTV") },
      { label: "DVR/NVR", href: productSearchHref("DVR NVR") },
      { label: "Access Control", href: productSearchHref("Access Control") },
    ],
    popularTitle: "Security Systems",
    popular: [
      { label: "IP Cameras", href: productSearchHref("IP Cameras") },
      { label: "8 Channel NVR", href: productSearchHref("8 Channel NVR") },
      { label: "Biometric Access", href: productSearchHref("Biometric Access") },
    ],
    featuredTitle: "Site Security",
    featured: [
      { label: "CCTV Packages", href: productSearchHref("CCTV Packages"), description: "Camera and recorder bundles." },
      { label: "Access Control", href: productSearchHref("Access Control"), description: "Entry control for staff and visitors." },
      { label: "Security Installation", href: "/services", description: "Deployment and setup for facilities." },
    ],
  },
  {
    id: "software-services",
    label: "Software & Services",
    href: "/services",
    categories: [
      { label: "Antivirus", href: productSearchHref("Antivirus") },
      { label: "Cloud Services", href: "/services" },
      { label: "IT Support", href: "/services" },
    ],
    popularTitle: "Managed Services",
    popular: [
      { label: "Endpoint Security", href: productSearchHref("Antivirus") },
      { label: "Cloud Backup", href: "/services" },
      { label: "IT Maintenance", href: "/services" },
    ],
    featuredTitle: "Support Services",
    featured: [
      { label: "IT Support Desk", href: "/services", description: "Help for devices, users, and networks." },
      { label: "Cloud Services", href: "/services", description: "Business apps and backup support." },
      { label: "Security Software", href: productSearchHref("Antivirus"), description: "Antivirus and endpoint protection." },
    ],
  },
  {
    id: "business-solutions",
    label: "Business Solutions",
    href: "/services",
    categories: [
      { label: "POS Systems", href: productSearchHref("POS Systems") },
      { label: "School ICT", href: "/services" },
      { label: "Corporate ICT", href: "/services" },
    ],
    popularTitle: "Solution Areas",
    popular: [
      { label: "Retail POS", href: productSearchHref("POS Systems") },
      { label: "School Labs", href: "/services" },
      { label: "Corporate Rollouts", href: "/services" },
    ],
    featuredTitle: "Business Programs",
    featured: [
      { label: "POS Systems", href: productSearchHref("POS Systems"), description: "Retail hardware and deployment support." },
      { label: "School ICT", href: "/services", description: "Computer labs, printing, and networking." },
      { label: "Corporate ICT", href: "/services", description: "Procurement and implementation support." },
    ],
  },
];

export const primaryNavigation = [
  { label: "Departments", departmentId: "all" },
  { label: "Printers", departmentId: "printers" },
  { label: "Consumables", departmentId: "printer-consumables" },
  { label: "Office Equipment", departmentId: "office-equipment" },
  { label: "Computers", departmentId: "computers" },
  { label: "Networking", departmentId: "networking" },
  { label: "Security", departmentId: "security" },
  { label: "Services", departmentId: "software-services" },
  { label: "Business Solutions", departmentId: "business-solutions" },
] as const;

export const searchSuggestionGroups = [
  {
    label: "Recent searches",
    items: [
      { label: "HP", href: productSearchHref("HP") },
      { label: "Laser toner", href: productSearchHref("Laser toner") },
    ],
  },
  {
    label: "Products",
    items: [
      { label: "HP LaserJet Pro", href: productSearchHref("HP LaserJet Pro") },
      { label: "HP Ink Cartridge", href: productSearchHref("HP Ink Cartridge") },
    ],
  },
  {
    label: "Categories",
    items: [{ label: "HP Toners", href: productSearchHref("HP Toners") }],
  },
  {
    label: "Brands",
    items: [
      { label: "HP", href: productSearchHref("HP") },
      { label: "Canon", href: productSearchHref("Canon") },
      { label: "Dell", href: productSearchHref("Dell") },
    ],
  },
] satisfies Array<{ label: string; items: NavigationLink[] }>;
