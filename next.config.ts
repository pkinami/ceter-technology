import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.100"],
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      ...[
        "www.hp.com",
        "ssl-product-images.www8-hp.com",
        "en.canon-cna.com",
        "www.epson.co.ke",
        "www.brother.com",
        "www.kyoceradocumentsolutions.com",
        "www.xerox.com",
        "www.ricoh.com",
        "www.dell.com",
        "i.dell.com",
        "www.lenovo.com",
        "p1-ofp.static.pub",
        "www.acer.com",
        "images.acer.com",
        "www.asus.com",
        "dlcdnwebimgs.asus.com",
        "www.tp-link.com",
        "static.tp-link.com",
        "ui.com",
        "images.svc.ui.com",
        "mikrotik.com",
        "i.mt.lv",
        "www.apc.com",
        "www.se.com",
        "www.kingston.com",
        "media.kingston.com",
        "www.logitech.com",
        "resource.logitech.com",
        "www.jumia.co.ke",
        "ke.jumia.is",
        "upload.wikimedia.org",
      ].map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/**",
      })),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
