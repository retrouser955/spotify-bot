import { Client, CommandInteraction, TextableChannel } from "eris";
import { BaseCommand } from "../Structs/Command";
import { userExists } from "../utils/mongo";
import { EmbedBuilder } from "../utils/EmbedBuilder";
import { MessageFlags } from "discord-api-types/v10";
import { refreshPersonalTokens } from "../utils/spotify";
import { default as axios, AxiosResponse} from "axios";

export default class Recent extends BaseCommand {
    apiPath = "https://api.spotify.com/v1/me/player/recently-played?limit=10"

    name: string = "recent"
    description: string = "Get your recent songs!"

    async execute(_: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        const userId = ctx.user?.id || ctx.member?.id || ctx.member?.user?.id

        if(!userId) {
            ctx.createMessage({
                embeds: [
                    EmbedBuilder.failEmbed("Unable to get your user ID")
                ],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const exists = await userExists(userId)

        if(!exists) {
            ctx.createMessage({
                embeds: [
                    EmbedBuilder.failEmbed("Your Spotify account is not linked!")
                ],
                flags: MessageFlags.Ephemeral
            })
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

        const { data } = axiosData

        const descriptionString = `**<:spotify:1036122539384119306> Your recent tracks**\n${
            data.items.map((v: any, i: number) => `**${i + 1}.** [${v.track.name}](${v.track.external_urls.spotify})`).join("\n")
        }`

        ctx.createFollowup({
            embeds: [
                {
                    description: descriptionString,
                    color: 0xffffff,
                    thumbnail: {
                        url: data.items[0].track.album.images[0].url
                    }
                }
            ]
        })
    }
}