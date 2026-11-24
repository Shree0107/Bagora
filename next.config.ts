import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is intentionally OFF: almost every page reads the
  // Supabase auth cookie, so the classic "dynamic by default" model is simpler.
  cacheComponents: false,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    // AVIF first (smallest), WebP fallback. Next resizes per device and lazy-loads by default.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Product images uploaded by admins live in Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async redirects() {
    return [{ source: "/shop/backpacks", destination: "/shop/work-bags", permanent: true }];
  },

  experimental: {
    serverActions: {
      // Admin image uploads go through a Server Action. Vercel caps request
      // bodies at 4.5 MB, so stay just under that.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
