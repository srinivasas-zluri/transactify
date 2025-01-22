import path from "path";
// import { defineConfig } from "vite";
import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    coverage: {
      provider: "v8",
      exclude: [
        ...configDefaults.exclude,
        "src/components/ui/**",
        "src/main.tsx",
        "src/const.ts",
        "postcss.config.js",
        "tailwind.config.js",
        "vite-env.d.ts"
      ],
    },
  },
});
