import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["pureblood-krypton-saloon.ngrok-free.dev"],
};

export default withNextIntl(nextConfig);