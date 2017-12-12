import { normalizeSingleOrArray } from "../../entity"
import { get$field } from "../index"
import { buildNormalField } from "./index"

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
    return buildNormalField(form, fieldName, $fieldInputSlot,
        entityInitValue, buildFieldItem)
}

export function buildFieldItem(form: EntityForm, fieldMeta: FieldMeta,
    itemValue: any) {
    return ST.Check({field: fieldMeta, fClass: form.fClass, value: itemValue})
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: boolean[] = []
    $field.find(`.fw-field-item-input.${form.fClass}`).iterate($i =>
        values.push($i.prop("checked")))
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
