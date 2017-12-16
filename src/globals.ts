let gMeta: MetaStore
let gUser: User

export function getMeta() {
    return gMeta
}

export function setMeta(meta: MetaStore) {
    gMeta = meta
}

export function getUser() {
    return gUser
}

export function setUser(user: User) {
    gUser = user
}
