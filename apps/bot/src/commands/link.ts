import { Client, CommandInteraction, TextableChannel } from "eris";
import { BaseCommand } from "../Structs/Command";
import { EmbedBuilder } from "../utils/EmbedBuilder";
import { MessageFlags } from "discord-api-types/v10";
import { User } from "../mongodb/schemas/User";

export default class Link extends BaseCommand {
    name: string = "link";
    description: string = "Link your Spotify account with your Discord Account";

    async execute(_: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        const userId = ctx.user?.id || ctx.member?.id || ctx.member?.user?.id

        if(!userId) {
            ctx.createMessage({
                embeds: [
                    EmbedBuilder.failEmbed("Cannot read the your user")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const userExists = await User.countDocuments({ userId }).then(v => v > 0).catch((_) => false)

        if(userExists) {
            ctx.createMessage({
                embeds: [
                    EmbedBuilder.failEmbed("You are already linked with your spotify account. Use `/unlink` first")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const url = process.env.NODE_ENV === "development" ?
            "http://localhost:3000/auth" :
            "https://example.com/auth"

        ctx.createMessage({
            embeds: [
                EmbedBuilder.infoEmbed(`Follow this [link](${url}) and enter your account information...`)
            ],
            flags: MessageFlags.Ephemeral
        })
    }
}