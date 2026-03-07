import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isVercel = !!process.env.VERCEL;
  return {
    plugins: [react()],
    base: isVercel ? "/" : "/wave-template-generator/",
  };
});
