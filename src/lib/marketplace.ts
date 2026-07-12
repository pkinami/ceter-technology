import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Cable,
  Camera,
  HardDrive,
  Laptop,
  Monitor,
  Network,
  Printer,
  ScanLine,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";

export const marketplaceDepartments = [
  {
    name: "Printers",
    href: "/products?category=Printers",
    icon: Printer,
    items: [
      "Laser Printers",
      "Inkjet Printers",
      "Multifunction Printers",
      "Photo Printers",
      "Label Printers",
      "Large Format Printers",
    ],
  },
  {
    name: "Printer Consumables & Accessories",
    href: "/products?category=Printer%20Consumables%20%26%20Accessories",
    icon: BadgeCheck,
    items: ["Toners", "Ink Cartridges", "Ink Bottles", "Printer Parts", "Printing Paper", "Printer Accessories"],
  },
  {
    name: "Office Equipment",
    href: "/products?category=Office%20Equipment",
    icon: Building2,
    items: ["Photocopiers", "Scanners", "Laminators", "Binding Machines", "Paper Cutters", "Shredders", "Office Accessories"],
  },
  {
    name: "Computers & Laptops",
    href: "/products?category=Computers%20%26%20Laptops",
    icon: Laptop,
    items: ["HP", "Dell", "Lenovo", "Asus", "Acer", "Desktops", "Workstations", "Servers"],
  },
  {
    name: "Computer Accessories",
    href: "/products?category=Computer%20Accessories",
    icon: Monitor,
    items: ["Monitors", "Keyboards", "Mouse", "Webcams", "Speakers", "Laptop Accessories", "Computer Cables"],
  },
  {
    name: "Storage Devices",
    href: "/products?category=Storage%20Devices",
    icon: HardDrive,
    items: ["SSD", "HDD", "Flash Drives", "Memory Cards"],
  },
  {
    name: "Networking Equipment",
    href: "/products?category=Networking%20Equipment",
    icon: Network,
    items: ["Routers", "Switches", "Access Points", "WiFi Extenders", "Network Cabling"],
  },
  {
    name: "Power Solutions",
    href: "/products?category=Power%20Solutions",
    icon: Zap,
    items: ["UPS Systems", "Surge Protectors", "Power Cables", "Inverters"],
  },
  {
    name: "Security Systems",
    href: "/products?category=Security%20Systems",
    icon: Camera,
    items: ["CCTV Cameras", "DVR/NVR", "Access Control", "Biometrics"],
  },
  {
    name: "Software & IT Services",
    href: "/services",
    icon: ShieldCheck,
    items: ["Antivirus", "Microsoft Licenses", "Backup Solutions", "Cloud Services", "Network Installation", "IT Support"],
  },
  {
    name: "Business Solutions",
    href: "/services",
    icon: BriefcaseBusiness,
    items: ["POS Systems", "Barcode Solutions", "School ICT Solutions", "Corporate ICT Solutions", "Maintenance Contracts"],
  },
] as const;

export const marketplaceHighlights = [
  { label: "Same-day quote support", icon: ScanLine },
  { label: "Genuine toner and ink", icon: BadgeCheck },
  { label: "Installation available", icon: Cable },
  { label: "Repair and maintenance", icon: Wrench },
] as const;

