import Eris from "eris"
import dotenv from "dotenv"
import { ApplicationCommandType, InteractionType, MessageFlags } from "discord-api-types/v10"
import { getCommands } from "./utils/getCommands";
import { BaseCommand } from "./Structs/Command";
import { EmbedBuilder } from "./utils/EmbedBuilder";
import "./server"
import mongoose from "mongoose";

dotenv.config()

const client = new Eris.Client(`Bot ${process.env.TOKEN}`, {
    intents: ["guilds"]
})

const rawCommands = getCommands(`${__dirname}/commands`)

const commands = new Map<string, BaseCommand>()

client.on("ready", async () => {
    console.log(`CLIENT: ${client.user.username} [${client.user.id}] is ready!`)

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

    await mongoose.connect(process.env.MONGO_URL)

    console.log("MONGO DB: CONNECTED!")
})

client.on("interactionCreate", (ctx) => {
    if(ctx.type === InteractionType.ApplicationCommand) {
        const cmd = commands.get((ctx as Eris.CommandInteraction<Eris.TextableChannel>).data.name)
        
        if(!cmd) return ctx.createFollowup({
            embeds: [
                EmbedBuilder.failEmbed("Error: Unknown command")
            ],
            flags: MessageFlags.Ephemeral
        })
        cmd.execute(client, (ctx as Eris.CommandInteraction<Eris.TextableChannel>))
    }
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