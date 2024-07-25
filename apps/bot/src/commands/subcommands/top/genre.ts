import { Client, CommandInteraction, EmbedOptions, InteractionDataOptionsString, InteractionDataOptionsSubCommand, TextableChannel } from "eris";
import { BaseCommand } from "../../../Structs/Command";
import { MessageFlags } from "discord-api-types/v10";
import { userExists } from "../../../utils/mongo";
import { EmbedBuilder } from "../../../utils/EmbedBuilder";
import { getToken, refreshPersonalTokens } from "../../../utils/spotify";
import { occurrenceSort } from "../../../utils/sortOcc";

export default class TopArtists extends BaseCommand {
    name: string = "genres"
    description: string = "Get your top genres on Spotify"
    
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
        
        const request = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${term.value}&limit=10`, {
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

        let artists = (data.items.map((v: { artists: { id: string }[] }) => v.artists.map(v => v.id).join(",")) as string[]).join(",")

        if(artists.split(",").length > 50) artists = artists.split(",").slice(0, 50).join(",")

        const token = await getToken()

        const artistsData = await fetch(`https://api.spotify.com/v1/artists?ids=${artists}`, {
            headers: {
                Authorization: `Bearer ${token.accessToken}`
            }
        })

        if(!artistsData.ok) {
            ctx.createFollowup({
                embeds: [EmbedBuilder.failEmbed("Something went wrong")]
            })

            console.log(request)
            return
        }

        const genreData = await artistsData.json()

        const genres = [].concat(...(genreData.artists.map((v: { genres: string[] }) => v.genres))) as string[]

        const sortedGenres = occurrenceSort(genres).slice(0, 20).map((v, i) => `**${i + 1}.** ${v}`)

        ctx.createFollowup({
            embeds: [
                {
                    description: `**<:spotify:1264561367411720293> Your Top Genres**\n${sortedGenres.join("\n")}`,
                    color: 0xffffff,
                    thumbnail: {
                        url: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/spotify-white-icon.png"
                    },
                    footer: {
                        icon_url: ctx.member?.user?.dynamicAvatarURL(),
                        text: `Requested by ${ctx.member?.user?.username}`
                    }
                }
            ]
        })
    }
}