import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

export interface SpotifyTrackOptions {
    title: string;
    authors: string;
    cover: string;
    duration: string;
    album: string;
    progress?: number;
}

GlobalFonts.registerFromPath(`${__dirname}/fonts/opensans.ttf`, "sans")

export class ImageGenerator {
    static async generateSpotfiyTrack(op: SpotifyTrackOptions) {
        const SPOTIFY_ICON = "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/spotify-white-icon.png"
        const ALBUM_URL = op.cover

        if (op.title.length > 30) op.title = `${op.title.slice(0, 27)}...`
        if (op.authors.length > 43) op.authors = `${op.authors.slice(0, 43)}...`

        const album = await loadImage(ALBUM_URL)

        const canvas = createCanvas(1200, 400)
        const ctx = canvas.getContext("2d")

        // PICK PRIMARY COLOR OF ALBUM
        ctx.drawImage(album, 30, (canvas.height / 2) - 175, 1, 1)

        const imageData = ctx.getImageData(30, (canvas.height / 2) - 175, 1, 1)

        let [r, g, b] = imageData.data

        if (r > 50) r -= 50
        if (g > 50) g -= 50
        if (b > 50) b -= 50

        const HEX = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

        // FILL BACKGROUND
        ctx.beginPath()
        const gradi = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        // gradi.addColorStop(0, "#070f2b")
        gradi.addColorStop(0, HEX)
        gradi.addColorStop(1, "#060c24")
        ctx.fillStyle = gradi
        ctx.roundRect(0, 0, canvas.width, canvas.height, 30)
        ctx.stroke()
        ctx.fill()
        ctx.closePath()

        // ADD SPOTIFY ICON
        const img = await loadImage(SPOTIFY_ICON)

        ctx.drawImage(img, canvas.width - 60, 15, 40.96, 40.96)

        // ADD ALBUM IMAGE
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(30, (canvas.height / 2) - 175, 350, 350, 30)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(album, 30, (canvas.height / 2) - 175, 350, 350)
        ctx.restore()

        const TITLE = op.title
        const ALBUM = op.album
        const AUTHORS = op.authors
        const DURATION = op.duration
        // ADD TEXT
        ctx.font = "bold 50px sans"
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText(TITLE, 410, (canvas.height / 2) - 40)

        ctx.font = "bold 30px sans"
        ctx.fillStyle = "#c9c9c9"
        ctx.fillText(AUTHORS, 410, (canvas.height / 2) + 20)

        ctx.font = "bold 25px sans"
        ctx.fillText(`On ${ALBUM}`, 410, (canvas.height / 2) + 55)

        ctx.fillStyle = "#e8e8e8"
        ctx.font = "25px sans"
        ctx.fillText(DURATION, canvas.width - 100, canvas.height - 30)

        if (op.progress) {
            // PROGRESS BAR
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
            ctx.beginPath()
            ctx.roundRect(60 + 350, canvas.height - 41, 650, 10, 20)
            ctx.closePath()

            ctx.fill()

            ctx.fillStyle = "#FFFFFF"

            const percentageCalc = (650) * (op.progress / 100)

            ctx.beginPath()
            ctx.roundRect(60 + 350, canvas.height - 41, percentageCalc, 10, 20)
            ctx.closePath()

            ctx.fill()
        }

        return canvas.encodeSync("png")
    }
}