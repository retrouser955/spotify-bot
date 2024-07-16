import express from "express"
import session from "express-session"
import * as crypto from "node:crypto"
import { default as axios } from "axios"
import { config } from "dotenv"

config()

const secret = crypto.randomBytes(16).toString()

const app = express()

function generateRandomBytes() {
    const select = "ABCDEFGHIJKLMNOPQRSTWXYZabcdefghijklmnopqrstwxyz123456789"
    let returnChar = ""
    for(let i = 0; i < 16; i++) {
        const number = crypto.randomInt(select.length)
        const char = select.charAt(number)
        returnChar += char
    }

    return returnChar
}

let sess = {
    secret,
    cookie: {
        maxAge: 120_000,
        secure: (false as boolean)
    },
    saveUninitialized: false,
    resave: true,
} satisfies session.SessionOptions

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))

app.get("/render/healthcheck", (_, res) => res.send("HEALTHY"))

app.get("/auth", (_, res) => {
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_ID}&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fdiscord&scope=identify`)
})

app.get("/auth/discord", async (req, res) => {
    const code = req.query.code as string | null;

    if(!code) return res.status(400).json({ msg: "bad request" })
    
    const exchange = await axios.post<{ access_token: string, token_type: string }>("https://discord.com/api/v10/oauth2/token", {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': process.env.DISCORD_CALLBACK,
        'client_secret': process.env.DISCORD_SECRET,
        'client_id': process.env.DISCORD_ID
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })

    const { access_token, token_type } = exchange.data
    
    if (!access_token || !token_type) return res.status(400).json({ msg: "bad request" })

    if(!req.session.discord) req.session.discord = {
        access_token,
        token_type
    }

    const url = new URL(`https://accounts.spotify.com/authorize`)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID)
    url.searchParams.set("scope", "user-read-private user-read-recently-played user-top-read user-read-currently-playing")
    url.searchParams.set("redirect_uri", process.env.SPOTIFY_CALLBACK)
    url.searchParams.set("state", generateRandomBytes())

    res.redirect(url.toString())
})

app.get("/auth/spotify/callback",async (req, res) => {
    if(!req.session.discord) return res.status(403).json({ msg: "Authenticate with discord first" })

    const { access_token, token_type } = req.session.discord

    try {
        const post = await axios.post(process.env.REQUEST_URL, {
            discord: {
                access_token,
                token_type
            },
            spotify: {
                code: `${(req.query as any).code}`
            }
        }, {
            headers: {
                Authorization: process.env.AUTHENTICATION_KEY
            }
        })


        if(post.data.success) {
            res.send("CONNECTED")
        } else {
            res.status(500).send("SERVER ERROR")
        }
    } catch (error) {
        res.status(500).send("SERVER ERROR")
    }
})

declare module "express-session" {
    export interface SessionData {
        discord?: {
            access_token: string;
            token_type: string;
        }
    }
}

app.listen(3000, () => console.log("CONNECTED ON PORT: 3000"))

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            AUTHENTICATION_KEY: string;
            [key: string]: string | undefined;
            REQUEST_URL: string;
            SPOTIFY_CALLBACK: string;
            SPOTIFY_CLIENT_ID: string;
            DISCORD_CALLBACK: string;
            DISCORD_ID: string;
            DISCORD_SECRET: string;
        }
    }
}