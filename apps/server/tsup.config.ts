import { defineConfig } from "../../tsup.config"

export default defineConfig({
    format: ["cjs"],
    entry: ["api/index.ts"],
    dts: false,
    treeshake: false,
    outDir: "./dist"
})