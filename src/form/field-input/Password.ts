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
    return ST.Password({field: fieldMeta, fClass: form.fClass,
        value: itemValue})
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: string[] = []
    $field.find(`.fw-field-item-input.${form.fClass}`).iterate($this =>
        values.push($this.stringInput()))
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}

