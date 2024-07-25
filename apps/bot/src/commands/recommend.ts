import { ApplicationCommandOptions, Client, CommandInteraction, TextableChannel } from "eris";
import { BaseCommand } from "../Structs/Command";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import fs from "node:fs"
import Eris from "eris";
import { EmbedBuilder } from "../utils/EmbedBuilder";
import { MessageFlags } from "discord-api-types/v10";

export default class Recommend extends BaseCommand {
    name: string = "recommend";
    description: string = "Get recommednations from Spotify";
    subCommands = new Map<string, BaseCommand>()

    options: ApplicationCommandOptions[] = [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "recent",
            description: "Get recommendations based on recent tracks"
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "top",
            description: "Get recommendations based on the top tracks or artists",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "type",
                    description: "Choose a type. Artists or Tracks",
                    choices: [
                        {
                            name: "tracks",
                            value: "tracks"
                        },
                        {
                            name: "artists",
                            value: "artists"
                        }
                    ],
                    required: false
                }
            ]
        }
    ]

    constructor() {
        super()

        const subCommands = fs.readdirSync(`${__dirname}/subcommands/recommend`).filter((v) => v.endsWith(".js"))
        for(const cmd of subCommands) {
            const command = new (require(`${__dirname}/subcommands/recommend/${cmd}`) as { default: typeof BaseCommand }).default()
            this.subCommands.set(command.name, command)
        }
    }

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