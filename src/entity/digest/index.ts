import _ = require("lodash")

import { pLoadEntityByIds } from "../../api"
import { fileObjectToLink, formatDate } from "../../common"
import { getMeta } from "../../globals"

export function digestEntity(entityMeta: EntityMeta,
    entityValue: EntityValue): DigestInfo {

    let iconValue = "", digest = ""

    if (entityMeta.iconField) {
        const iconObject = _.get(entityValue, entityMeta.iconField)
        if (iconObject) {
            if (_.isArray(iconObject)) {
                iconValue = fileObjectToLink(iconObject[0])
            } else {
                iconValue = fileObjectToLink(iconObject)
            }
        }
    }

    if (entityMeta.digestConfig) {
        const groupValues: string[] = []
        const groups = entityMeta.digestConfig.split("&")
        for (let group of groups) {
            group = group.trim()
            const fields = group.split("|")
            let groupValue = ""
            for (let field of fields) {
                field = field.trim()
                const fieldValue = _.get(entityValue, field)
                const fieldMeta = entityMeta.fields[field]
                groupValue = fieldValueToString(fieldMeta, fieldValue) || ""
                if (groupValue) break
            }
            groupValues.push(groupValue)
        }
        digest = groupValues.join(" | ")
    }

    digest = digest || entityValue._id

    return {icon: iconValue, digest, id: entityValue._id}
}

function fieldValueToString(fieldMeta: FieldMeta, fieldValue: any) {
    if (_.isNil(fieldValue)) return null

    const list = _.isArray(fieldValue) ? fieldValue : [fieldValue]
    const values = []
    for (const obj of list) {
        if (_.isNil(obj)) continue
        switch (fieldMeta.type) {
        case "Date":
            values.push(formatDate(obj, "YYYY-MM-DD"))
            break
        case "Time":
            values.push(formatDate(obj, "HH:mm:ss"))
            break
        case "DateTime":
            values.push(formatDate(obj, "YYYY-MM-DD HH:mm:ss"))
            break
        case "Float":
            values.push(obj && obj.toPrecision(3))
            break
        case "Reference":
            values.push(ST.LoadingRef({entityName: fieldMeta.refEntity,
                id: obj}))
            break
        default:
            values.push(obj)
        }
    }

    return values.join(", ")
}

export function loadReferences($from: JQuery) {
    const tasks: {[entityName: string]: {[id: string]: JQuery[]}} = {}
    $from.find(".loading-ref").iterate($lr => {
        const entityName = $lr.mustAttr("entityName")
        const id = $lr.mustAttr("id")
        const taskByEntity = (tasks[entityName] = tasks[entityName] || {})
        const refsOfId = (taskByEntity[id] = taskByEntity[id] || [])
        refsOfId.push($lr)
    })

    const entityNames = Object.keys(tasks)
    for (const entityName of entityNames) {
        const entityMeta = getMeta().entities[entityName]
        const tasksByEntity = tasks[entityName]
        const ids = Object.keys(tasksByEntity)

        pLoadEntityByIds(entityName, ids).then(r => {
            for (const entityValue of r.page) {
                const digest = digestEntity(entityMeta, entityValue)
                const $lrList = tasksByEntity[entityValue._id]
                for (const $lr of $lrList) {
                    $lr.replaceWith(ST.EntityDigest(digest))
                }
            }
        })
    }
}
