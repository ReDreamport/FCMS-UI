
// cSpell:words

import moment = require("moment")

export function cloneByJSON(source: any) {
    return JSON.parse(JSON.stringify(source))
}

export function removeFromArray(arr: any[], element: any) {
    const index = arr.indexOf(element)
    if (index >= 0) arr.splice(index, 1)
}

export function arrayToMapTrue(arr: string[]) {
    const map: {[k: string]: boolean} = {}
    for (const item of arr) map[item] = true
    return map
}

export function pxToNumber(value: string | number | null | undefined,
    alternative?: number): number {
    if (value === 0) return 0
    if (!value) return alternative || 0
    if (typeof value === "number") return value

    const ms = value.match("^(.+)(px)?$")
    return ms && ms.length ? parseFloat(ms[1]) : alternative || 0
}

export function entityListToMap(list: {_id: string}[]) {
    const map: {[id: string]: any} = {}
    list.forEach(i => map[i._id] = i)
    return map
}

export function dateStringToInt(val: string, format: string) {
    val = val.trim()
    if (!val) return undefined
    return moment(val, format).valueOf()
}
