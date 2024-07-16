import { Client, CommandInteraction, TextableChannel } from "eris";
import { BaseCommand } from "../Structs/Command";
import { MessageFlags } from "discord-api-types/v10";
import { EmbedBuilder } from "../utils/EmbedBuilder";
import { refreshPersonalTokens } from "../utils/spotify";
import { userExists } from "../utils/mongo";

export default class Status extends BaseCommand {
    name: string = "status"
    description: string = "Check the linked status of Spotify with your Discord account"

    async execute(_: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        await ctx.defer(MessageFlags.Ephemeral)

        const userId = ctx.user?.id ?? ctx.member?.user?.id

        if(!userId) {
            ctx.createFollowup({
                embeds: [
                    EmbedBuilder.failEmbed("Unable to detect user")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const exists = await userExists(userId)

        if(!exists) {
            ctx.createFollowup({
                embeds: [
                    EmbedBuilder.failEmbed("Account is not connected! Use `/link`")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        let tokens: any

        try {
            const is_refreshed = await refreshPersonalTokens(userId)

            if(!is_refreshed.success) {
                ctx.createFollowup({
                    embeds: [
                        EmbedBuilder.failEmbed("Unable to refresh tokens")
                    ],
                    flags: MessageFlags.Ephemeral
                })
                return
            }

            tokens = is_refreshed.tokens
        } catch {
            // no
            ctx.createFollowup({
                embeds: [
                    EmbedBuilder.failEmbed("Unable to refresh tokens")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const accountInfo = await fetch("https://api.spotify.com/v1/me", {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`
            }
        })

        if(!accountInfo.ok) {
            ctx.createFollowup({
                embeds: [
                    EmbedBuilder.failEmbed("Unable to get your profile\n\n*If this issue presists, contact our developers*")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const accountData = await accountInfo.json()

        const { display_name, images } = accountData

        const embed = EmbedBuilder.successEmbed(`Logged into Spotify as ${display_name}`, images[0].url)

        ctx.createFollowup({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        })
    }
}