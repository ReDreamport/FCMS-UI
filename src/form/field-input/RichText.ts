import { apiRoot } from "../../api"
import { normalizeSingleOrArray } from "../../entity/index"
import { get$field } from "../index"
import { buildNormalField } from "./index"

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
    buildNormalField(form, fieldName, $fieldInputSlot, entityInitValue,
        buildFieldItem)

    $fieldInputSlot.find(".fw-field-item-input").each(function() {
        const editor: any = new wangEditor(this)

        editor.config.menus = [
            "fullscreen", "source", "undo", "redo",
            "|", "bold", "underline", "italic", "strikethrough", "forecolor",
            "bgcolor", "fontsize", "head", "unorderlist", "orderlist",
            "alignleft", "aligncenter", "alignright",
            "|", "link", "unlink", "table", "emotion", "img"
        ]
        editor.config.uploadImgUrl = apiRoot + "rich-text-file"
        editor.config.uploadImgFileName = "f0"

        editor.create()
    })
}

export function buildFieldItem(form: EntityForm, fieldMeta: FieldMeta,
    itemValue: any) {
    return ST.RichText({field: fieldMeta, fClass: form.fClass,
        value: itemValue})
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: string[] = []
    $field.find(`.fw-field-item-input.${form.fClass}`).iterate($i =>
        values.push($i.stringInput()))
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
