import { User } from "../mongodb/schemas/User";

export function userExists(userId: string) {
    return User.countDocuments({ userId }).then(v => v > 0)
}