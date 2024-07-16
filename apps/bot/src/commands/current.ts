import { Client, CommandInteraction, TextableChannel } from "eris";
import { BaseCommand } from "../Structs/Command";
import { userExists } from "../utils/mongo";
import { EmbedBuilder } from "../utils/EmbedBuilder";
import { ButtonStyle, ComponentType, MessageFlags } from "discord-api-types/v10";
import { refreshPersonalTokens } from "../utils/spotify";
import { default as axios } from "axios";
import { ImageGenerator, SpotifyTrackOptions } from "../utils/Images";
import { Util } from "../utils/Util";

export default class Current extends BaseCommand {
    name: string = "current"
    description: string = "Get the now playing information of yourself"

    async execute(_: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        const userId = ctx.user?.id || ctx.member?.id || ctx.member?.user?.id

        if(!userId) {
            ctx.createMessage({
                embeds: [EmbedBuilder.failEmbed("Unable to look into the user's ID")],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        const exists = await userExists(userId)

        if(!exists) {
            ctx.createMessage({
                embeds: [EmbedBuilder.failEmbed("Your Spotify account is not linked! Use `/link` to link one.")],
                flags: MessageFlags.Ephemeral
            })
            return
        }

        await ctx.defer()

        const { success, tokens } = await refreshPersonalTokens(userId)

        if(!success) {
            ctx.createFollowup({
                embeds: [EmbedBuilder.failEmbed("Unable to refresh tokens")]
            })
            return
        }

        const { access_token, token_type } = tokens! as { access_token: string, token_type: string }

        const url = "https://api.spotify.com/v1/me/player/currently-playing"

        const req = await axios.get<{ item?: Record<string, any>, progress_ms: number, currently_playing_type: "ad"|"episode"|"track"|"unknown" }>(url, {
            headers: {
                Authorization: `${token_type} ${access_token}`
            }
        })

        const isPlaying = ["episode", "track"].includes(req.data.currently_playing_type)

        if(!isPlaying || !req.data.item) {
            ctx.createFollowup({
                embeds: [EmbedBuilder.failEmbed("You are not playing anything on Spotify")]
            })
            return
        }

        let imageOp: SpotifyTrackOptions

        switch(req.data.currently_playing_type) {
            case "episode":
                imageOp = {
                    title: req.data.item.name as string,
                    duration: Util.createTimeCode(req.data.item.duration_ms),
                    cover: req.data.item.show.images[0].url,
                    authors: `By ${req.data.item.show.publisher}`,
                    album: `On ${req.data.item.show.name}`
                }
            default:
                imageOp = {
                    title: req.data.item.name,
                    duration: Util.createTimeCode(req.data.item.duration_ms),
                    album: `${req.data.item.album.name} (${req.data.item.album.release_date})`,
                    cover: req.data.item.album.images[0].url,
                    authors: `By ${(req.data.item.artists as any[]).map((v: any) => v.name as string).join(", ")}`
                }
        }

        const progress = (req.data.progress_ms / req.data.item.duration_ms) * 100

        imageOp.progress = progress

        const image = await ImageGenerator.generateSpotfiyTrack(imageOp)

        ctx.createFollowup({
            embeds: [EmbedBuilder.imageEmbed("attachment://card.png")],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            label: "Listen",
                            url: req.data.item.external_urls.spotify
                        }
                    ]
                }
            ]
        }, {
            name: "card.png",
            file: image
        })
    }
}