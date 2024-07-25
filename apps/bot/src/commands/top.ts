import Eris, { ApplicationCommandOptions, Client, CommandInteraction, TextableChannel } from "eris";
import { BaseCommand } from "../Structs/Command";
import { ApplicationCommandOptionType, MessageFlags } from "discord-api-types/v10";
import fs from "node:fs"
import { EmbedBuilder } from "../utils/EmbedBuilder";

export default class TopTracks extends BaseCommand {
    name: string = "top";
    description: string = "Get the top stats (REQUIRES ACCOUNT)"
    subCommands = new Map<string, BaseCommand>()

    subCommandChoices = [
        { name: "Last 4 months", value: "short_term" },
        { name: "Last 6 months", value: "medium_term" },
        { name: "Last year", value: "long_term" }
    ]

    constructor() {
        super()

        const subCommands = fs.readdirSync(`${__dirname}/subcommands/top`).filter((v) => v.endsWith(".js"))
        for(const cmd of subCommands) {
            const command = new (require(`${__dirname}/subcommands/top/${cmd}`) as { default: typeof BaseCommand }).default()
            this.subCommands.set(command.name, command)
        }
    }

    options: ApplicationCommandOptions[] = [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "tracks",
            description: "Get the top tracks of the user",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "period",
                    description: "Amount of time to look back into",
                    choices: this.subCommandChoices,
                    required: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "artists",
            description: "Get the top artists of the user",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "period",
                    description: "Amount of time to look back into",
                    choices: this.subCommandChoices,
                    required: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "genres",
            description: "Get the top artists of the user",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "period",
                    description: "Amount of time to look back into",
                    choices: this.subCommandChoices,
                    required: true
                }
            ]
        }
    ]

    async execute(client: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        const subCommandName = (ctx.data.options![0] as Eris.InteractionDataOptionsSubCommand).name

        const command = this.subCommands.get(subCommandName)

        if(!command) return ctx.createMessage({
            embeds: [
                EmbedBuilder.failEmbed("Cannot get the subcommand `" + subCommandName + "`")
            ],
            flags: MessageFlags.Ephemeral
        })

        command.execute(client, ctx)
    }
}