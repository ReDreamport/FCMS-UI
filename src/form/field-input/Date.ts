import moment = require("moment")

import { normalizeSingleOrArray } from "../../entity"
import { get$field } from "../index"
import { buildNormalField } from "./index"

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
    buildNormalField(form, fieldName, $fieldInputSlot, entityInitValue,
        buildFieldItem)
}

export function buildFieldItem(form: EntityForm, fieldMeta: FieldMeta,
    itemValue: any) {
    const $date = $(ST.Date({field: fieldMeta, fClass: form.fClass,
        value: itemValue}))
    // TODO F.enableDatePicker($date.find('input.date-picker'))
    return $date
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: number[] = []
    $field.find(`.fw-field-item-input.${form.fClass}`).iterate($this => {
        const date = $this.find(".date-picker:first").val()
        if (date) {
            const m = moment(date, ["YYYY-M-D"], true)
            values.push(m.valueOf())
        }
    })
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
