
// cSpell:words

import $ = require("jquery")
import _ = require("lodash")
import moment = require("moment")

export const SYSTEM_FIELDS = ["_id", "_version", "_createdOn", "_createdBy",
    "_modifiedOn", "_modifiedBy"]

export const FIELD_TYPES = ["String", "Password", "Boolean",
    "Int", "Float", "Date", "Time", "DateTime", "Image", "File",
    "Component", "Reference", "Object", "ObjectId"]

export function stringArrayToOptionArray(strings: string[]) {
    const options = []
    for (const str of strings) {
        options.push([str, str])
    }
    return options
}

export function replaceSelectOptionsByStringArray($select: JQuery,
    strings: string[]) {
    $select.empty()
    for (const str of strings) {
        $("<option>", {value: str, html: str}).appendTo($select)
    }
}

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

export function fileObjectToLink(obj: UploadResult) {
    const path = obj && obj.path
    return path && ("/r/" + path) || ""
}

export function fileObjectToInfo(obj: UploadResult | null | undefined) {
    if (!(obj && obj.path)) {
        return "（无）"
    } else {
        const indexOfExt = obj.path.lastIndexOf(".")
        const ext = indexOfExt > 0 ? obj.path.substring(indexOfExt + 1) : ""
        return `${obj.name || ext} [${showFileSize(obj.size)}]`
    }
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

// 每个字段由 field-name 标识
export function collectInputByFieldName($form: JQuery, fieldClass?: string) {
    const $fields = $form.find(fieldClass || ".field")
    const inputData: {[n: string]: any} = {}

    $fields.iterate($f => {
        if ($f.hasClass("no-auto-collect")) return

        const fieldName = $f.attr("field-name")
        if (!fieldName) return
        inputData[fieldName] = collectSimpleInput($f)
    })

    return inputData
}

// 日期输出为 long
export function collectSimpleInput($f: JQuery) {
    if ($f.length === 0) return null
    if ($f.length > 1) throw new Error("Bad field length " + $f.length)

    const $dp = $f.find(".date-picker")
    if ($dp.length) {
        return getDateInputAsLong($dp)
    } else {
        const $input = $f.find(":input")
        return $input.typedInput()
    }
}

function getDateInputAsLong($dp: JQuery) {
    const str = $dp.find("input").stringInput()
    if (!str) return null
    const type = $dp.mustAttr("type")
    let m: moment.Moment
    if (type === "Date") {
        m = moment(str, "YYYY-MM-DD")
    } else if (type === "Time") {
        m = moment(str, "HH:mm:ss")
    } else if (type === "DateTime") {
        m = moment(str, "YYYY-MM-DD HH:mm:ss")
    } else {
        throw new Error("No date type")
    }
    if (m.isValid()) {
        return m.valueOf()
    } else {
        throw new Error("时间输入错误：" + str)
    }
}

export function isEnterKey(e: JQuery.Event) {
    return e.keyCode === JQuery.Key.Enter
}

export function onEnterKeyOrChange($input: JQuery,
    callback: (e: JQuery.Event) => void) {
    $input.keyup(e => {
        if (isEnterKey(e)) callback(e)
    })

    $input.change(callback)
}

export function makeSureArray(v: any) {
    if (_.isNil(v)) return v
    if (_.isArray(v)) return v
    return [v]
}

export function showFileSize(size: number | null | undefined) {
    if (!size) return "0"
    if (size < 1024)
        return size + " b"
    else if (size < 1024 * 1024)
        return (size / 1024).toFixed(2) + " KB"
    else if (size < 1024 * 1024 * 1024)
        return (size / 1024 / 1024).toFixed(2) + " MB"
    else
        return (size / 1024 / 1024 / 1024).toFixed(2) + " GB"
}
