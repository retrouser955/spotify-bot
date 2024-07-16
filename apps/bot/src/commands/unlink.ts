import { Client, CommandInteraction, TextableChannel } from "eris";
import { BaseCommand } from "../Structs/Command";
import { User } from "../mongodb/schemas/User";
import { EmbedBuilder } from "../utils/EmbedBuilder";
import { MessageFlags } from "discord-api-types/v10";

export default class Unlink extends BaseCommand {
    name: string = "unlink";
    description: string = "Unlink your Spotify account from Discord";

    async execute(_: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        const userId = ctx.user?.id || ctx.member?.id || ctx.member?.user?.id

        const userExists = await User.countDocuments({ userId }).then(v => v > 0)

        if(!userExists) {
            ctx.createMessage({
                embeds: [EmbedBuilder.failEmbed("Your account isn't linked with SpotiFinder")],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        await ctx.defer(MessageFlags.Ephemeral)

        await User.findOneAndDelete({ userId })

        ctx.createFollowup({
            embeds: [EmbedBuilder.successEmbed("Successfully unlinked your account.")],
            flags: MessageFlags.Ephemeral
        })
    }
}