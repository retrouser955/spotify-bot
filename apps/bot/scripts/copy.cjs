const fs = require("fs")

const fonts = fs.readdirSync(`${process.cwd()}/src/utils/fonts`)

fs.mkdirSync(`${process.cwd()}/dist/utils/fonts`)

console.log("🕒 | Started copying non-ts files")

for(const font of fonts) {
    console.log(`🕒 | Copying ${font}`)
    fs.copyFileSync(`${process.cwd()}/src/utils/fonts/${font}`, `${process.cwd()}/dist/utils/fonts/${font}`)
    console.log(`🕒 | Copied ${font}`)
}