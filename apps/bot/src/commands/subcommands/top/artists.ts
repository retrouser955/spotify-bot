import { Client, CommandInteraction, EmbedOptions, InteractionDataOptionsString, InteractionDataOptionsSubCommand, TextableChannel } from "eris";
import { BaseCommand } from "../../../Structs/Command";
import { ApplicationCommandOptionType, MessageFlags } from "discord-api-types/v10";
import { userExists } from "../../../utils/mongo";
import { EmbedBuilder } from "../../../utils/EmbedBuilder";
import { refreshPersonalTokens } from "../../../utils/spotify";

export default class TopArtists extends BaseCommand {
    name: string = "artists"
    description: string = "Get your top artists on spotify"
    
    async execute(_: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        const userId = ctx.user?.id || ctx.member?.id || ctx.member?.user?.id

        const term = (ctx.data.options![0] as InteractionDataOptionsSubCommand).options![0] as InteractionDataOptionsString

        if(!userId) {
            ctx.createMessage({
                embeds: [
                    EmbedBuilder.failEmbed("Unable to read your user ID")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        if(!(await userExists(userId))) {
            ctx.createMessage({
                embeds: [
                    EmbedBuilder.failEmbed("Link your Spotify account first. `/link`")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        await ctx.defer()

        const userData = await refreshPersonalTokens(userId)

        if(!userData.success) {
            ctx.createFollowup({
                embeds: [
                    EmbedBuilder.failEmbed("Unable to refresh your Spotify tokens")
                ]
            })
            return
        }
        
        const tokens = userData.tokens!

        const { token_type, access_token } = tokens as { access_token: string, token_type: string }
        
        const request = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${term.value}&limit=10`, {
            headers: {
                Authorization: `${token_type} ${access_token}`
            }
        })

        if(!request.ok) {
            ctx.createFollowup({
                embeds: [EmbedBuilder.failEmbed("Something went wrong")]
            })

            console.log(request)
            return
        }

        const data = await request.json()

        const embed: EmbedOptions = {
            description: `**<:spotify:1264561367411720293> Your Top Artists**\n${data.items.map((v: any, i: number) => `**${i + 1}.** [${v.name}](${v.external_urls.spotify})`).join("\n")}`,
            color: 0xffffff,
            thumbnail: {
                url: data.items[0].images[0].url
            },
            footer: {
                icon_url: ctx.member?.user?.dynamicAvatarURL(),
                text: `Requested by ${ctx.member?.user?.username}`
            }
        }

        ctx.createFollowup({
            embeds: [embed]
        })
    }
}