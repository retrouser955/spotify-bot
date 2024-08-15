import express from "express"
import { User } from "./mongodb/schemas/User"

const app = express()

app.use(express.json())

const PORT = process.env.NODE_ENV === "development" ?
    4000 :
    8080

app.get("/keepalive", async (req, res) => {
    res.json({
        alive: true
    })
})

app.post("/user", async (req, res) => {
    if(!req.headers.authorization) return res.status(403).json({ message: "Forbidden" })
    if(req.headers.authorization !== process.env.AUTH_KEY) return res.status(403).json({ message: "Bad Auth Key" })

    const { discord, spotify } = req.body as { discord: any, spotify: any }

    if(!discord || !spotify) return res.status(400).json({ message: "Bad Request" })

    const { access_token, token_type } = discord
    if(!access_token || !token_type) return res.status(400).json({ message: "BAD REQUEST" })

    const { code } = spotify
    if(!code) return res.status(400).json({ message: "BAD REQUEST" })

    const user = await fetch('https://discord.com/api/users/@me', {
        headers: {
            Authorization: `${token_type} ${access_token}`
        }
    })

    if(!user.ok) return res.status(400).json({ message: "INVALID USER" })
    const usr = await user.json()

    const body = new FormData()
    body.append("code", code)
    body.append("redirect_uri", process.env.SPOTIFY_CALLBACK)
    body.append("grant_type", "authorization_code")

    const data = new URLSearchParams()
    for(let pair of body) {
        data.append(pair[0], pair[1].toString())
    }

    const authRequest = await fetch(`https://accounts.spotify.com/api/token`, {
        method: "POST",
        body: data,
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`
        }
    })

    const json = await authRequest.json()

    json.expires_in *= 1000

    if(!authRequest.ok) return res.status(400).json({ message: "INVALID USER" })

    const userExists = await User.countDocuments({ userId: usr.id }).then(v => v > 0)

    if(userExists) {
        const findUser = await User.findOne({ userId: usr.id })

        findUser!.set({
            userId: usr.id,
            ...json,
            requested_on: Date.now()
        })

        findUser?.save()
    } else {
        const user = new User({
            userId: usr.id,
            ...json,
            requested_on: Date.now()
        })
        await user.save()
    }

    res.json({
        success: true
    })
})

app.listen(PORT, () => console.log(`WEB SERVER: Started on port: ${PORT}`))