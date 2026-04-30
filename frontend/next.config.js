/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Cloud Run Docker deployment
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
