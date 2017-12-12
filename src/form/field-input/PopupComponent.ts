import { getListFieldNames } from "../../common"
import { openEditEntityDialog } from "../../entity/edit/index"
import { normalizeSingleOrArray } from "../../entity/index"
import { getMeta } from "../../globals"
import { $formToForm, disposeForm, fieldInputChangeEventManager,
    get$field } from "../index"

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
    const $field = $fieldInputSlot.closest(".fw-field")
    const fieldMeta = form.entityMeta.fields[fieldName]
    const fieldInitValue = entityInitValue && entityInitValue[fieldName]
    const fieldValue = !fieldMeta.multiple && [fieldInitValue]
        || fieldInitValue || []

    const meta = getMeta()
    const refEntityMeta = meta.entities[fieldMeta.refEntity]
    const listFieldNames = getListFieldNames(refEntityMeta.fields)
    const $fieldInput = $(ST.PopupComponent({field: fieldMeta, fieldValue,
        fClass: form.fClass, listFieldNames}))
    $fieldInputSlot.append($fieldInput)
    const $tbody = $fieldInput.find("tbody:first")

    $field.on("click", ".fw-add-item-component", function(e) {
        // 多值，添加一项
        e.stopPropagation()
        e.preventDefault()
        $tbody.append(ST.PopupComponentItem({itemValue: {}, field: fieldMeta,
            fClass: form.fClass, listFieldNames}))
    })

    $fieldInput.on("click", ".fw-remove-item-component", function(e) {
        // 多值，删除一项
        e.stopPropagation()
        e.preventDefault()
        const $item = $(this).closest("tr")
        $item.find(".form").iterate($i => disposeForm($formToForm($i)))
        $item.remove()
    })


    $field.on("click", ".fw-remove-all-item-component", function(e) {
        // 多值，删除所有项
        e.stopPropagation()
        e.preventDefault()
        if (!confirm("确定要全部删除吗？"))return
        $tbody.find(".form").iterate($i => disposeForm($formToForm($i)))
        $tbody.empty()
    })

    $field.on("click", ".fw-hide-all-item-component", function(e) {
        e.stopPropagation()
        e.preventDefault()
        const $this = $(this)
        if ($this.hasClass("component-hidden")) {
            $this.removeClass("component-hidden").html("收起")
            $tbody.show()
        } else {
            $this.addClass("component-hidden").html("展开")
            $tbody.hide()
        }
    })

    $fieldInput.on("click", ".fw-edit-item-component", function(e) {
        // 编辑项
        e.stopPropagation()
        e.preventDefault()

        const $tr = $(this).closest("tr")
        const itemValueStr = $tr.attr("itemValue")
        const itemValue = itemValueStr && JSON.parse(itemValueStr) || {}

        // const $closestView = $fieldInput.closest(".view")
        openEditEntityDialog(fieldMeta.refEntity, itemValue, entityValue => {
            const $item = $(ST.PopupComponentItem({
                itemValue: entityValue, field: fieldMeta, fClass: form.fClass,
                listFieldNames
            }))
            $tr.replaceWith($item)
            fieldInputChangeEventManager.fire(form.fid, fieldName) // 触发事件
        })
    })
}

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: any[] = []
    $field.find(`tr.fw-field-item.${form.fClass}`).iterate($i => {
        const iv = $i.attr("itemValue")
        if (iv) values.push(JSON.parse(iv))
    })

    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
