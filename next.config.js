/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { dev }) {
    if (dev) {
      config.devtool = "source-map";
    }
    return config;
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID,
  },
};

module.exports = nextConfig;
