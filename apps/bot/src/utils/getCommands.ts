import * as fs from "node:fs"
import { BaseCommand } from "../Structs/Command"

export function getCommands(dir: string) {
    const commandFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".js"))
    const commands = commandFiles.map((v) => {
        try {
            const cmd = require(`${dir}/${v}`) as { default: typeof BaseCommand }
            return new cmd.default
        } catch (err) {
            console.log(err)
            return undefined
        }
    })

    return commands.filter((c) => {
        return c && typeof c.name === "string" && typeof c.description === "string" && typeof c.execute === "function"
    })
}