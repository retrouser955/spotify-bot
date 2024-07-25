import Eris, { EmbedOptions } from "eris"
import dotenv from "dotenv"
import { ApplicationCommandType, InteractionType, MessageFlags } from "discord-api-types/v10"
import { getCommands } from "./utils/getCommands";
import { BaseCommand } from "./Structs/Command";
import { EmbedBuilder } from "./utils/EmbedBuilder";
import "./server"
import mongoose from "mongoose";
import { fetchTokens, getToken } from "./utils/spotify";

dotenv.config()

const client = new Eris.Client(`Bot ${process.env.TOKEN}`, {
    intents: ["guilds"]
})

const rawCommands = getCommands(`${__dirname}/commands`)

const commands = new Map<string, BaseCommand>()

let isCompleted = false

client.on("ready", async () => {
    console.log(`CLIENT: ${client.user.username} [${client.user.id}] is ready!`)

    if(!isCompleted) {
        for(let command of rawCommands) {
            client.createCommand({
                type: ApplicationCommandType.ChatInput,
                name: command!.name,
                description: command!.description,
                options: command!.options ?? [],
            })
        
            console.log(`LOADED COMMAND: ${command!.name}`)
        
            commands.set(command!.name, command!)
        }

        isCompleted = true
    }
})

client.on("interactionCreate", async (ctx) => {
    if(ctx.type === InteractionType.ApplicationCommand) {
        const cmd = commands.get((ctx as Eris.CommandInteraction<Eris.TextableChannel>).data.name)
        
        if(!cmd) return ctx.createFollowup({
            embeds: [
                EmbedBuilder.failEmbed("Error: Unknown command")
            ],
            flags: MessageFlags.Ephemeral
        })
        cmd.execute(client, (ctx as Eris.CommandInteraction<Eris.TextableChannel>))

        return
    }

    if(ctx.type === InteractionType.MessageComponent) {
        if(ctx instanceof Eris.UnknownInteraction) return

        if(ctx.data.custom_id.startsWith("musistats-recommendations-")) {
            const trackId = ctx.data.custom_id.replace("musistats-recommendations-", "")

            const endPoint = `https://api.spotify.com/v1/recommendations?limit=10&seed_tracks=${trackId}`

            await ctx.defer()
            const tokens = await getToken()

            const request = await fetch(endPoint, {
                headers: {
                    Authorization: `Bearer ${tokens.accessToken}`
                }
            })

            if(!request.ok) {
                ctx.createFollowup({
                    embeds: [EmbedBuilder.failEmbed("Something went wrong!")]
                })
                console.log(request)
                return
            }
            
            const data = await request.json()

            if(data.tracks.length === 0) {
                ctx.createFollowup({
                    embeds: [EmbedBuilder.failEmbed("Not enough data to get recommendations")]
                })

                return
            }

            const topString = data.tracks
                .map(
                    (v: { external_urls: { spotify: string }, name: string }, i: number) => `**${i + 1}.** [${v.name}](${v.external_urls.spotify})`
                )
                .join("\n")

            const embed: EmbedOptions = {
                description: `**<:spotify:1264561367411720293> Recommended tracks**\n${topString}`,
                color: 0xffffff,
                thumbnail: {
                    url: data.tracks[0].album.images[0].url
                },
                footer: {
                    text: `Requested by: ${ctx.user?.username ?? ctx.member?.user?.username ?? ctx.member?.username}`,
                    icon_url: ctx.user?.dynamicAvatarURL() ?? ctx.member?.user?.dynamicAvatarURL() ?? ctx.member?.dynamicAvatarURL()
                }
            }

            ctx.createFollowup({
                embeds: [embed]
            })
        }
    }
})

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("MONGO DB: CONNECTED!")
    return mongoose
})

client.connect()

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            [key: string]: string | undefined;
            NODE_ENV: "development" | "production" | string;
            SPOTIFY_CLIENT_ID: string;
            SPOTIFY_CLIENT_SECRET: string;
            MONGO_URL: string;
            AUTH_KEY: string;
            SPOTIFY_CALLBACK: string;
            AUTH_URL: string;
        }
    }
}