import { normalizeSingleOrArray } from "../../entity/index"
import { $formToForm, buildForm, collectFormInput, get$field } from "../index"
import { buildNormalField } from "./index"

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
    return buildNormalField(form, fieldName, $fieldInputSlot,
        entityInitValue, buildFieldItem)
}

export function buildFieldItem(form: EntityForm, fieldMeta: FieldMeta,
    itemValue: any) {
    const $item = $(ST.InlineComponent({field: fieldMeta, fClass: form.fClass}))
    form = buildForm(fieldMeta.refEntity, itemValue)
    $item.find(".fw-field-item-input:first").append(form.$form)
    return $item
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: any[] = []
    const $form = $field.find(`.fw-field-item-input.${form.fClass}>.form`)
    $form.iterate($this => {
        const comValue = {}
        const subForm = $formToForm($this)
        collectFormInput(subForm, comValue)
        values.push(comValue)
    })
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
