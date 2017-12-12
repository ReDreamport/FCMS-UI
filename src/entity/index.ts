import _ = require("lodash")

import { api } from "../api"
import { entityListToMap } from "../common"
import { getMeta, getUser } from "../globals"

export const ENTITY_LIST_TD_PADDING = 4

export function tdStyleOfField(fm: FieldMeta) {
    let style: any
    switch (fm.type) {
    case "ObjectId":
    case "Reference":
    case "String":
    case "Password":
        style = {"width": "140px", "text-align": "center"}
        break
    case "Boolean":
        style = {"width": "30px", "text-align": "center"}
        break
    case "Int":
    case "Float":
        style = {"width": "80px", "text-align": "right"}
        break
    case "Date":
    case "Time":
    case "DateTime":
        style = {"width": "160px", "text-align": "center"}
        break
    case "Image":
    case "File":
        style = {"width": "90px", "text-align": "center"}
        break
    default:
        style = {"width": "100px", "text-align": "center"}
        break
    }
    if (style) {
        style.paddingLeft = `${ENTITY_LIST_TD_PADDING}px`
        style.paddingRight = `${ENTITY_LIST_TD_PADDING}px`
    }
    return style
}

interface LoadRefEntityTask {
    _id: string
    $ref: JQuery
}

export function loadDigestedEntities($area: JQuery) {
    let allTasks: {[entityName: string]: LoadRefEntityTask[]} = {}

    $area.find(".loading-ref").iterate(function($this) {
        $this.removeClass("loading-ref")
        const entityName = $this.mustAttr("entityName")
        const id = $this.mustAttr("_id")

        const meta = getMeta()
        const digestFields = meta.entities[entityName].digestFields
        if (!(digestFields && digestFields.length > 0
            && digestFields !== "_id")) return

        allTasks[entityName] = allTasks[entityName] || []
        allTasks[entityName].push({_id: id, $ref: $this})
    })

    Object.keys(allTasks).forEach(function(entityName) {
        const tasks = allTasks[entityName]
        doLoadDigestedEntity(entityName, tasks)
    })

    allTasks = {}
}

export function doLoadDigestedEntity(entityName: string,
    tasks: LoadRefEntityTask[]) {

    const ids = tasks.map(t => t._id)
    const criteria = {field: "_id", operator: "in", value: ids}

    const meta = getMeta()
    const entityMeta = meta.entities[entityName]
    const query = {_digest: true, _pageSize: -1,
        _criteria: JSON.stringify(criteria)}
    const q = api.get(`entity/${entityName}`, query)
    q.then(function(r) {
        const list = r.page
        const eMap = entityListToMap(list)
        for (const task of tasks) {
            const entity = eMap[task._id]
            if (entity) task.$ref.html(digestEntity(entityMeta, entity))
        }
    })
}

export function digestEntity(entityMeta: EntityMeta, entityValue: EntityValue) {
    if (!entityValue) return ""
    if (entityMeta.digestFields) {
        const groups = entityMeta.digestFields.split(",")
        const digest: {field: string; value: any}[] = []
        for (const group of groups) {
            const fields = group.split("|")
            let df
            for (const field of fields) {
                const v = entityValue[field]
                if (v) {
                    df = {field, value: v}
                    break
                }
            }
            if (df) digest.push(df)
        }
        return ST.EntityDigest({entityMeta, digest})
    } else {
        return digestId(entityValue._id)
    }
}

export function digestId(id?: string) {
    if (id)
        return id[0] + "..." + id.substring(id.length - 6)
    else
        return ""
}

export function isFieldOfTypeDateOrTime(fieldMeta: FieldMeta) {
    const type = fieldMeta.type
    return type === "Date" || type === "Time" || type === "DateTime"
}

export function isFieldOfTypeNumber(fieldMeta: FieldMeta) {
    return fieldMeta.type === "Int" || fieldMeta.type === "Float"
}

export function isFieldOfInputTypeOption(fieldMeta: FieldMeta) {
    return fieldMeta.inputType === "Select"
        || fieldMeta.inputType === "CheckList"
}

export function digestEntityById(entityMeta: EntityMeta, id: string,
    $parent: JQuery) {

    const q = api.get(`entity/${entityMeta.name}/${id}`)
    q.catch(x => $parent.html("?Fail " + x.status))
    q.then(entityValue => $parent.html(digestEntity(entityMeta, entityValue)))
}

export function hasEntityPermission(action: string, entityName: string) {
    const user = getUser()
    if (user.admin) return true
    let e = user.acl && user.acl.entity && user.acl.entity[entityName]
    if (e && (e[action] || e["*"])) return true
    if (user.roles) {
        const roleNames = Object.keys(user.roles)
        for (const rn of roleNames) {
            const role = user.roles[rn]
            e = role.acl && role.acl.entity && role.acl.entity[entityName]
            if (e && (e[action] || e["*"])) return true
        }
    }
    return false
}

const SYSTEM_FIELDS = ["_id", "_version", "_createdOn", "_createdBy",
    "_modifiedOn", "_modifiedBy"]

export function isSystemFieldName(fieldName: string) {
    return SYSTEM_FIELDS.indexOf(fieldName) >= 0
}

export function optionsArrayToMap(options: any[]) {
    const map: {[k: string]: string} = {}
    for (const o of options)
        map[o.name] = o.label
    return map
}

// 确保值是一个数组，如果不是，将其包围到一个数组中
export function ensureValueIsArray(value: any) {
    if (_.isArray(value))
        return value
    else
        return value ? [value] : []
}

export function normalizeSingleOrArray<T>(values: T[], multiple: boolean) {
    if (multiple)
        return values
    else
        return values.length ? values[0] : null
}
