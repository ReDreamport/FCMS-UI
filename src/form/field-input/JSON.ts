import JSON5 = require("json5")

import { normalizeSingleOrArray } from "../../entity/index"
import { get$field } from "../index"
import { buildNormalField } from "./index"

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
    return buildNormalField(form, fieldName, $fieldInputSlot,
        entityInitValue, buildFieldItem)
}

export function buildFieldItem(form: EntityForm, fieldMeta: FieldMeta,
    itemValue: any) {
    return ST.JSON({field: fieldMeta, fClass: form.fClass,
        value: itemValue})
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: any[] = []
    $field.find(`.fw-field-item-input.${form.fClass}`).iterate($this => {
        const v = $this.stringInput()
        try {
            const o = v && JSON5.parse(v) || null
            values.push(o)
        } catch (e) {
            throw new Error("JSON 对象无法有误 | #{fieldName}")
        }
    })
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
