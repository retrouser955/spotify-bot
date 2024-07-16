export class Util {
    /**
     * BOTH FUNCTIONS TAKEN FROM retrouser955/sonata
     */
    static createTimeCode(ms: number) {
        const minutes = Math.floor(ms / 60000)
        const seconds = ((ms % 60000) / 1000)
        const secondsText = seconds < 10 ? "0" + Math.floor(seconds) : "" + Math.floor(seconds)

        return `${minutes}:${secondsText}`
    }

    static isURL(q: string) {
        try {
            new URL(q)
            return true
        } catch {
            return false
        }
    }
}