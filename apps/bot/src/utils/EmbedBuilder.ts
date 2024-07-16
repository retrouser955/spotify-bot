import { EmbedOptions } from "eris";

export class EmbedBuilder {
    static failEmbed(message: string): EmbedOptions {
        return {
            description: `**<:error:1261296448021069885> Oh-no! Something went wrong...**\n${message}`,
            color: 0xff0019
        }
    }

    static imageEmbed(uri: string): EmbedOptions {
        return {
            color: 0x2b2d31,
            image: {
                url: uri
            }
        }
    }

    static successEmbed(message: string, image?: string): EmbedOptions {
        const embed: EmbedOptions = {
            description: `**<:tick:1089371868420653066> Success!**\n${message}`,
            color: 0x1db954
        }

        if(image) embed.thumbnail = {
            url: image
        }

        return embed
    }

    static infoEmbed(message: string): EmbedOptions {
        return {
            color: 0x2b2d31,
            description: `**<:info:1261972242569498705> ${message}**`
        }
    }

    static loadingEmbed(message: string): EmbedOptions {
        return {
            description: `**<a:loading_color:1089371793468432384> ${message}**`,
            color: 0x1DB954
        }
    }
}