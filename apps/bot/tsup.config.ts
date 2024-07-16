import { defineConfig } from "../../tsup.config"

export default defineConfig({
    format: ["cjs"],
    entry: ["src/**/*"],
    dts: false,
    treeshake: false
})