import _ = require("lodash")
import { fileObjectToLink, formatDate } from "../../common"

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
