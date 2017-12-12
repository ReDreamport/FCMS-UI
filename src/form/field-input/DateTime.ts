import moment = require("moment")

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
    const $date = $(ST.DateTime({field: fieldMeta, fClass: form.fClass,
        value: itemValue}))
    // F.enableDatePicker($date.find('input.date-picker'))
    return $date
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: number[] = []
    $field.find(`.fw-field-item-input.${form.fClass}`).iterate($this => {
        const date = $this.find(".date-picker:first").val()
        const hour = $this.find(".date-hour:first").val()
        const minute = $this.find(".date-minute:first").val()

        if (date || hour || minute) {
            if (!(date && hour && minute)) { // 要么不输入，要么全部输入
                $this.find(".date-hour:first").focus()
                throw new Error("时间输入有误")
            }

            const m = moment(`${date} ${hour}:${minute}`, ["YYYY-M-D H:m"],
                true)
            if (m.isValid()) {
                values.push(m.valueOf())
            } else {
                $this.find(".date-hour:first").focus()
                throw new Error("时间输入有误")
            }
        }
    })
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
