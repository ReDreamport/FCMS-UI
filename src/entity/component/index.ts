import $ = require("jquery")
import _ = require("lodash")

import { SYSTEM_FIELDS } from "../../common"
import { initDialog } from "../../dialog"
import { getMeta } from "../../globals"
import { EntityEditForm } from "../edit/index"

const NOT_LIST_TYPES = ["Password", "Component", "Object"]
const NOT_LIST_INPUT_TYPES = ["TextArea", "RichText"]

export function decideListFields(entityName: string) {
    const fields = getMeta().entities[entityName].fields
    const fieldNames = Object.keys(fields)
    _.pull(fieldNames, ...SYSTEM_FIELDS) // 去掉 id 等所有系统字段
    const finalFieldNames: string[] = []

    for (const fn of fieldNames) {
        const fm = fields[fn]
        if (NOT_LIST_TYPES.indexOf(fm.type) >= 0) continue
        if (NOT_LIST_INPUT_TYPES.indexOf(fm.inputType) >= 0) continue
        finalFieldNames.push(fn)
    }

    return finalFieldNames
}
export function editComponent(entityName: string, fieldLabel: string,
    componentValue: any, callback: (newComValue: any) => void) {

    const $overlay = $(ST.EditComponentDialog({fieldLabel}))
        .appendTo($("body"))
    initDialog($overlay, null)
    const $dc = $overlay.mustFindOne(".dialog-content")

    const entityMeta = getMeta().entities[entityName]

    const form = new EntityEditForm(entityMeta, componentValue, $dc)

    $overlay.mustFindOne(".dialog-footer .finish").click(function() {
        const entity = form.getInput()
        $overlay.remove()
        callback(entity)
    })
}
