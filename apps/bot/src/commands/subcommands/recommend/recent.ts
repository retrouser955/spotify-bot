import { Client, CommandInteraction, EmbedOptions, TextableChannel } from "eris";
import { BaseCommand } from "../../../Structs/Command"
import { EmbedBuilder } from "../../../utils/EmbedBuilder";
import { MessageFlags } from "discord-api-types/v10";
import { userExists } from "../../../utils/mongo";
import { default as axios, type AxiosResponse } from "axios";
import { getToken, refreshPersonalTokens } from "../../../utils/spotify";

export default class RecentRecommend extends BaseCommand {
    name: string = "recent";
    description: string = "Get recommendations based on recent tracks or artists";

    apiPath = "https://api.spotify.com/v1/me/player/recently-played?limit=20"

    async execute(client: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        const userId = ctx.user?.id || ctx.member?.id || ctx.member?.user?.id

        if(!userId) {
            ctx.createMessage({
                embeds: [
                    EmbedBuilder.failEmbed("Unable to read your user ID")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const exists = await userExists(userId)

        if(!exists) {
            ctx.createMessage({
                embeds: [
                    EmbedBuilder.failEmbed("You have not linked your account.\nUse `/link`")
                ],
                flags: MessageFlags.Ephemeral
            })

            return
        }

        await ctx.defer()

        const { success, tokens } = await refreshPersonalTokens(userId)

        if(!success || !tokens) {
            ctx.createFollowup({
                embeds: [
                    EmbedBuilder.failEmbed("Unable to refresh your Spotify tokens. Try relinking!")
                ]
            })
            return
        }

        let axiosData: AxiosResponse

        try {
            axiosData = await axios.get(this.apiPath, {
                headers: {
                    Authorization: `${tokens.token_type} ${tokens.access_token}`
                }
            })
        } catch (e) {
            ctx.createFollowup({
                embeds: [
                    EmbedBuilder.failEmbed("Something went wrong while fetching your tracks. Try relinking!")
                ]
            })
            return
        }

        const { data } = axiosData as { data: { items: { track: { id: string } }[] } }

        const listOfIDs = Array.from(new Set(data.items.map(v => v.track.id))).join(",")

        const apiBuilderUrls = `https://api.spotify.com/v1/recommendations?limit=10&seed_tracks=${listOfIDs}`

        const jwt = await getToken()

        try {
            const recomemndReq = await axios.get(apiBuilderUrls, {
                headers: {
                    Authorization: `Bearer ${jwt.accessToken}`
                }
            })

            if(!recomemndReq.data || !recomemndReq.data.tracks || recomemndReq.data.tracks.length === 0) {
                ctx.createFollowup({
                    embeds: [
                        EmbedBuilder.failEmbed("Could not get recommendations based on your recent activities")
                    ]
                })
                return
            }

            const mappedTracks = recomemndReq.data.tracks
                .map(
                    (v: { external_urls: { spotify: string }, name: string }, i: number) => `**${i + 1}.** [${v.name}](${v.external_urls.spotify})`
                )
                .join("\n")

            const messageString = `**<:spotify:1264561367411720293> Based on your activities ...**\n${mappedTracks}`

            const embed: EmbedOptions = {
                description: messageString,
                color: 0xffffff,
                footer: {
                    text: "We recommend these tracks",
                    icon_url: ctx.user?.dynamicAvatarURL() ?? ctx.member?.user?.dynamicAvatarURL() ?? ctx.member?.dynamicAvatarURL()
                },
                thumbnail: recomemndReq.data.tracks[0].album.images[0].url
            }

            ctx.createFollowup({
                embeds: [embed]
            })
        } catch (error) {
            ctx.createFollowup({
                embeds: [EmbedBuilder.failEmbed("Could not fetch your recommended tracks\nTry relinking")]
            })
        }
    }
}