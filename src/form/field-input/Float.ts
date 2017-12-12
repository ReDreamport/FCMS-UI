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
    return ST.Float({field: fieldMeta, fClass: form.fClass, value: itemValue})
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: number[] = []
    $field.find(`.fw-field-item-input.${form.fClass}`).iterate($this => {
        const numStr = $(this).val() as string
        if (numStr) {
            const num = parseFloat(numStr)
            values.push(num)
        }
    })
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}

