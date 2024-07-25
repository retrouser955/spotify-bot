import { Client, CommandInteraction, InteractionDataOptionsString, InteractionDataOptionsSubCommand, TextableChannel } from "eris";
import { BaseCommand } from "../../../Structs/Command";

export default class TopArtists extends BaseCommand {
    name: string = "genres"
    description: string = "Get your top genres on Spotify"
    
    async execute(_: Client, ctx: CommandInteraction<TextableChannel>): Promise<void> {
        const userId = ctx.user?.id || ctx.member?.id || ctx.member?.user?.id

        const options = ((ctx.data.options![0] as InteractionDataOptionsSubCommand).options?.at(0) as InteractionDataOptionsString|undefined)?.value || "tracks"


    }
}