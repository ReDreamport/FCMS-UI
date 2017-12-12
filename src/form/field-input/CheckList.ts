import { equalOrContainInArray } from "../../common"
import { normalizeSingleOrArray } from "../../entity"
import { get$field } from "../index"
import { initSelectInput } from "./index"

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
    const fieldMeta = form.entityMeta.fields[fieldName]

    const $fi = $(ST.CheckList({field: fieldMeta}))
    $fi.appendTo($fieldInputSlot)
    const $list = $fi.mustFindOne(".list:first")

    $fi.find(".toggle-check-all:first").click(function() {
        const checked = $(this).prop("checked")
        $list.find(`.fw-field-item.${form.fClass}`)
            .prop("checked", checked)
    })

    $fi.find(".fw-field-hide-options").click(function(e) {
        e.stopPropagation()
        e.preventDefault()

        const $this = $(this)
        if ($this.hasClass("field-hidden")) {
            $this.removeClass("field-hidden").html("隐藏")
            $list.show()
        } else {
            $this.addClass("field-hidden").html("取消隐藏")
            $list.hide()
        }
    })

    function rebuildOptions(options: SelectOption[], selectedValue: any) {
        // 表示是重新构建，那么需要先取出当前选中的选项
        if ($list.children().length)
            selectedValue = getInput(form, fieldName)
        selectedValue = selectedValue || []

        const inputElementType = fieldMeta.multiple && "checkbox" || "radio"

        $list.empty()

        if (!options) return

        const optionWidth = fieldMeta.optionWidth || "auto"

        function renderItem(option: SelectOption, $parent: JQuery) {
            const checked = equalOrContainInArray(option.name,
                selectedValue)
            const inputName = form.fClass + fieldMeta.name
            const o = {
                inputElementType, inputValue: option.name, checked,
                inputClass: form.fClass, inputName, field: fieldMeta,
                optionLabel: option.label, optionWidth
            }
            $parent.append(ST.CheckListItem(o))
        }

        for (const option of options) {// 只能两层
            if (option.items) {
                const $group = $(ST.CheckListGroup(option)).appendTo($list)
                for (const item of option.items) renderItem(item, $group)
            } else {
                renderItem(option, $list)
            }
        }
    }

    initSelectInput(rebuildOptions, fieldMeta, form, entityInitValue)
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: string[] = []
    $field.find(`.fw-field-item.${form.fClass}:checked`).iterate($i =>
        values.push($i.val() as string))
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}

