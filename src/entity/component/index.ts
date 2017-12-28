import _ = require("lodash")

import { SYSTEM_FIELDS } from "../../common"
import { initDialog } from "../../dialog"
import { getMeta } from "../../globals"

const NOT_LIST_TYPES = ["Password", "Component", "Object"]
const NOT_LIST_INPUT_TYPES = ["TextArea", "RichText"]

export function decideListFields(entityName: string) {
    const fields = getMeta().entities[entityName].fields
    const fieldNames = Object.keys(fields)
    _.pull(fieldNames, ...SYSTEM_FIELDS) // 去掉 id 等所有系统字段
    const finalFieldNames: string[] = []

    for (const fn of fieldNames) {
        const fm = fields[fn]
        if (NOT_LIST_TYPES.indexOf(fm.type) >= 0) return
        if (NOT_LIST_INPUT_TYPES.indexOf(fm.inputType) >= 0) return
        finalFieldNames.push(fn)
    }

    return finalFieldNames
}
export function editComponent(entityName: string, componentValue: any,
    callback: (newComValue: any) => void) {

    const $overlay = $(ST.EditComponentDialog()).appendTo($("body"))
    initDialog($overlay, null)
}
