import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone", // pour livraison Option B : build autonome + lanceur (double-clic)
  // Réduire les avertissements Turbopack (lockfiles multiples, cache) : lancer depuis la racine du projet
  ...(typeof process !== "undefined" && { turbopack: { root: process.cwd() } } as { turbopack?: { root: string } }),
  outputFileTracingExcludes: { "*": ["GestiCom-Portable/**"] },
};

const pwaConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Désactiver en développement pour éviter les problèmes
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  },
});

export default pwaConfig(nextConfig);
