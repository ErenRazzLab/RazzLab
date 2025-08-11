/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',      // enable static export
  distDir: 'out',        // build output directory
  images: { unoptimized: true },
  trailingSlash: false
};

export default nextConfig;
