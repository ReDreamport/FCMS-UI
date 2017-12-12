
// cSpell:words

import moment = require("moment")

const SYSTEM_FIELDS = ["_id", "_version", "_createdOn", "_createdBy",
    "_modifiedOn", "_modifiedBy"]

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

export function formatDate(v: any, format: string) {
    if (!v) return ""
    const d = moment(v)
    return d.format(format)
}

export function fileObjectToLink(obj: {path: string}) {
    const path = obj && obj.path
    return path && ("/r/" + path) || ""
}

export function isSortableField(fieldMeta: FieldMeta) {
    return fieldMeta.name !== "_id" && fieldMeta.name !== "_version"
        && !fieldMeta.multiple && fieldMeta.type !== "Reference"
        && fieldMeta.type !== "Image" && fieldMeta.type !== "File"
        && fieldMeta.type !== "Component" && fieldMeta.type !== "Password"
}

let uniqueIdNext = 0
export function uniqueId() {
    return ++uniqueIdNext
}

export function equalOrContainInArray(target: string,
    valueOrArray: string | string[]) {
    if (!valueOrArray) return false
    if (target === valueOrArray) return true
    return valueOrArray.indexOf(target) >= 0
}

export function getListFieldNames(fields: {[fn: string]: FieldMeta}) {
    const names: string[] = []
    const fnList = Object.keys(fields)
    for (const fieldName of fnList) {
        const fm = fields[fieldName]
        if (fm.hideInListPage) continue
        if (SYSTEM_FIELDS.indexOf(fieldName) >= 0) continue
        names.push(fieldName)
    }

    return names
}
