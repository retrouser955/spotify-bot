import Eris from "eris";

export class BaseCommand {
    name: string = "NOT SET"
    description: string = "NOT SET"
    options: Eris.ApplicationCommandOptions[] = []

    async execute(client: Eris.Client, ctx: Eris.CommandInteraction<Eris.TextableChannel>) {
        throw new Error("NOT IMPLEMENTED")
    }
}