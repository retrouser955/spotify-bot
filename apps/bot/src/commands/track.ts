import Eris, { ApplicationCommandOptions, Client, CommandInteraction, ComponentInteractionSelectMenuData, InteractionDataOptionsString, SelectMenuOptions } from "eris";
import { BaseCommand } from "../Structs/Command";
import { ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionType, MessageFlags } from "discord-api-types/v10";
import { getTrack, search } from "../utils/spotify";
import { EmbedBuilder } from "../utils/EmbedBuilder";
import { awaitComponentInteractions } from "eris-collect"
import { ImageGenerator } from "../utils/Images";
import { Util } from "../utils/Util";

export default class TrackCommand extends BaseCommand {
    name: string = "track"
    description: string = "Get the details of a Spotify Track"

    SPOTIFY_TRACK_REGEX = /^https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(intl-([a-z]|[A-Z])+\/)?(?:track\/|\?uri=spotify:track:)((\w|-){22})(\?si=.+)?$/

    options: ApplicationCommandOptions[] = [
        {
            name: "url",
            description: "The URL of the Spotify track",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ]

    async execute(client: Client, ctx: CommandInteraction<Eris.TextableChannel>): Promise<void> {
        const option = ctx.data.options!.at(0) as InteractionDataOptionsString

        const track = option.value!

        await ctx.defer()

        if (!Util.isURL(track)) {
            // Handle search
            const results = await search(track)

            if (!results.ok) {
                ctx.createFollowup({
                    embeds: [
                        EmbedBuilder.failEmbed(`Looks like we failed to search for \`${track}\` on Spotify`)
                    ]
                })
                return
            }

            const { tracks } = await results.json()

            if (!tracks?.items || tracks?.items?.length === 0) {
                ctx.createFollowup({
                    embeds: [
                        EmbedBuilder.failEmbed(`Looks like we failed to search for \`${track}\` on Spotify`)
                    ]
                })
                return
            }

            const options: SelectMenuOptions[] = (tracks.items as any[]).map((v: any, i) => {
                return {
                    label: v.name as string,
                    value: `${i}`,
                    description: `By: ${(v.artists as any[]).map((v: any) => v.name as string).join(", ")}`
                }
            })

            const select = {
                components: [
                    {
                        type: ComponentType.StringSelect,
                        options,
                        custom_id: `search`,
                        disabled: (false as boolean)
                    }
                ],
                type: ComponentType.ActionRow
            } satisfies Eris.ActionRow

            const msg = await ctx.createFollowup({
                components: [select]
            })

            const values = await awaitComponentInteractions(client, {
                idle: 30_000,
                filter: (c) => {
                    if ((c.user?.id || c.member?.user.id) !== (ctx.user?.id || ctx.member?.user.id)) c.createMessage({
                        embeds: [
                            EmbedBuilder.failEmbed("These are not your interactions")
                        ],
                        flags: MessageFlags.Ephemeral
                    })

                    return (c.user?.id || c.member?.user.id) === (ctx.user?.id || ctx.member?.user.id) && c.channel.id === ctx.channel.id && c.message.id === msg.id && c.type === InteractionType.MessageComponent
                },
                max: 1
            })

            if (!values) {
                select.components[0].disabled = true
                ctx.editOriginalMessage({
                    embeds: [
                        EmbedBuilder.failEmbed(`User did not select an option in 30 seconds`)
                    ],
                    components: [select]
                })
                return
            }

            await values.acknowledge()

            const v = parseInt((values.data as Eris.ComponentInteractionSelectMenuData).values[0])

            const data = tracks.items[v]

            values.editOriginalMessage({
                embeds: [EmbedBuilder.loadingEmbed(`Getting info for \`${data.name}\``)],
                components: []
            })

            const image = await ImageGenerator.generateSpotfiyTrack({
                title: data.name as string,
                authors: `By ${(data.artists as any[]).map((v: any) => v.name as string).join(", ")}`,
                album: `${data.album.name as string} (${data.album.release_date})`,
                cover: data.album.images[0].url,
                duration: Util.createTimeCode(data.duration_ms)
            })

            values?.editOriginalMessage({
                components: [{
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            url: data.external_urls.spotify,
                            style: ButtonStyle.Link,
                            label: "Listen"
                        }
                    ]
                }],
                embeds: [EmbedBuilder.imageEmbed("attachment://card.png")]
            }, {
                file: image,
                name: "card.png"
            })
        } else if(this.SPOTIFY_TRACK_REGEX.test(track)) {
            const trackID = track.split("/").at(-1)!.split("?")[0]
            
            const info = await getTrack(trackID)

            if(!info.ok) {
                ctx.createFollowup({
                    embeds: [EmbedBuilder.failEmbed("Unable to get Spotify track info.\n\nAre you sure that track exists?")]
                })
                return
            }

            const json = await info.json()

            const image = await ImageGenerator.generateSpotfiyTrack({
                title: json.name as string,
                cover: json.album.images[0].url as string,
                authors: `By ${(json.artists as any[]).map((v: { name: string }) => v.name).join(", ")}`,
                duration: Util.createTimeCode(json.duration_ms as number),
                album: json.album.name
            })

            ctx.createFollowup({
                embeds: [
                    EmbedBuilder.imageEmbed("attachment://card.png")
                ],
                components: [{
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            url: json.external_urls.spotify,
                            style: ButtonStyle.Link,
                            label: "Listen"
                        }
                    ]
                }]
            }, {
                file: image,
                name: "card.png"
            })
        } else {
            ctx.createFollowup({
                embeds: [EmbedBuilder.failEmbed("Invalid Spotfiy URL")]
            })
        }
    }
}