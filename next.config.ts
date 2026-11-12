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
    // Product images uploaded by admins live in Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
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
