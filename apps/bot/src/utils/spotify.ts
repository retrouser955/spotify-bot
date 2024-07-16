import { User } from "../mongodb/schemas/User";
import { default as axios, AxiosResponse } from "axios"

export interface SpotifyAPITokens {
    clientId: string;
    accessToken: string;
    accessTokenExpirationTimestampMs: number;
    isAnonymous: boolean;
}

export interface PersonalTokens {
    success: boolean,
    tokens?: any
}

let tokens: SpotifyAPITokens
const SPOTI_TOKEN_URL = new URL("https://open.spotify.com/get_access_token?reason=transport&productType=web_player")

export async function refreshPersonalTokens(user_id: string): Promise<PersonalTokens> {
    const tokens = await User.findOne({ userId: user_id })

    if(!tokens) return {
        success: false
    }

    if((tokens.expires_in + tokens.requested_on) > Date.now()) return {
        success: true,
        tokens
    }

    let fetchReq: AxiosResponse

    try {
        fetchReq = await axios.post("https://accounts.spotify.com/api/token", {
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`
            }
        })
    } catch (e) {
        console.log(e)
        return {
            success: false
        }
    }

    const json = fetchReq.data

    json.expires_in *= 1000

    const requested_on = Date.now()

    tokens.set({
        ...json,
        requested_on,
        userId: user_id
    })

    await tokens.save()

    return {
        success: true,
        tokens: {
            ...json,
            requested_on,
            userId: user_id
        }
    }
}

export async function fetchTokens() {
    const req = await fetch(SPOTI_TOKEN_URL)
    return req.json()
}

export async function getToken() {
    if(!tokens) {
        tokens = await fetchTokens()
        return tokens
    }

    if(Date.now() > tokens.accessTokenExpirationTimestampMs) {
        tokens = await fetchTokens()
        return tokens
    }

    return tokens
}

export async function search(query: string) {
    const { accessToken } = await getToken()
    const buildUrl = new URL("https://api.spotify.com/v1/search")
    buildUrl.searchParams.set("q", query)
    buildUrl.searchParams.set("type", "track")
    buildUrl.searchParams.set("market", "US")
    buildUrl.searchParams.set("limit", "5")

    const request = await fetch(buildUrl, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })

    return request
}

export async function getTrack(query: string) {
    const { accessToken } = await getToken()
    const request = fetch(`https://api.spotify.com/v1/tracks/${query}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })

    return request
}