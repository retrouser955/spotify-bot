// @ts-nocheck
// ts ignore for now until the official version comes out
import Eris, { Constants } from "eris";
import type { ApplicationCommandCreateOptions } from "eris";

export interface ApplicationUserInstallabeTypes {
    contexts?: ApplicationCommandCreateOptions<false>['contexts']
    integrationTypes?: ApplicationCommandCreateOptions<false>['integrationTypes']
}

export class BaseCommand {
    name: string = "NOT SET"
    description: string = "NOT SET"
    options: Eris.ApplicationCommandOptions[] = []

    types: ApplicationUserInstallabeTypes = {}
    slashCommandType: ApplicationCommandCreateOptions<false>['type'] = Constants.ApplicationCommandTypes.CHAT_INPUT

    async execute(client: Eris.Client, ctx: Eris.CommandInteraction<Eris.TextableChannel>) {
        throw new Error("NOT IMPLEMENTED")
    }

    toAPIJSON<IsGuildScoped extends boolean>(): ApplicationCommandCreateOptions<IsGuildScoped> {
        return {
            name: this.name,
            description: this.description,
            options: this.options,
            integrationTypes: this.types.integrationTypes,
            contexts: this.types.contexts
        }
    }
}