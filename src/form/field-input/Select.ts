import { normalizeSingleOrArray } from "../../entity/index"
import { get$field } from "../index"
import { initSelectInput } from "./index"

// TODO 暂时只支持单选，multiple==true 暂不支持，可以选择使用 CheckList

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
        const fieldMeta = form.entityMeta.fields[fieldName]

        const $item = $(ST.Select({field: fieldMeta, fClass: form.fClass}))
        $fieldInputSlot.append($item)
        const $select = $item.find("select:first")

        function rebuildOptions(options: SelectOption[],
            selectedValue: string) {
            if ($select.children().length) {
                // 表示是重新构建，那么需要先取出当前选中的选项
                selectedValue = $select.find("option:first").val() as string
            }

            $select.empty()

            if (!options) return
            for (const option of options) {
                if (option.name !== "----") {// TODO 暂时无法显示分割线
                    const selected = option.name === selectedValue
                    $("<option>").attr("value", option.name).html(option.label)
                        .prop("selected", selected).appendTo($select)
                }
            }
        }

        initSelectInput(rebuildOptions, fieldMeta, form, entityInitValue)
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: string[] = []
    $field.find(`.fw-field-item-input.${form.fClass} option:selected`)
        .iterate($i => values.push($i.val() as string))
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
