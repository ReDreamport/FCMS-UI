let gMeta: any
let gUser: User

export function getMeta() {
    return gMeta
}

export function setMeta(meta: any) {
    gMeta = meta
}

export function getUser() {
    return gUser
}

export function setUser(user: User) {
    gUser = user
}
