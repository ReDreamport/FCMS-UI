import _ = require("lodash")
import { ensureValueIsArray, loadDigestedEntities } from "../../entity/index"
import { toSelectEntity } from "../../entity/select/index"
import { getMeta } from "../../globals"
import { get$field } from "../index"

export function buildField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue) {
    const $field = $fieldInputSlot.closest(".fw-field")
    const fieldMeta = form.entityMeta.fields[fieldName]
    const fieldInitValue = entityInitValue[fieldName]
    const meta = getMeta()
    const refEntityMeta = meta.entities[fieldMeta.refEntity]

    $fieldInputSlot.html(ST.Reference({field: fieldMeta, fClass: form.fClass}))
    const $refs = $fieldInputSlot.find(".refs:first")

    function buildRefItem(idOrIds: string[] | string) {
        if (!idOrIds) return

        if (_.isArray(idOrIds)) {
            for (const id of idOrIds) {
                $refs.append(ST.ReferenceItem({fClass: form.fClass,
                    entityMeta: refEntityMeta, id}))
                }
            } else {
                const ii = ST.ReferenceItem({fClass: form.fClass,
                    entityMeta: refEntityMeta, id: idOrIds})
                $refs.html(ii)
            }


        loadDigestedEntities($refs)
    }

    buildRefItem(fieldInitValue)
    if (fieldInitValue) {
        if (fieldMeta.multiple) {
            $refs.attr("value", JSON.stringify(fieldInitValue))
        } else {
            $refs.attr("value", fieldInitValue)
        }
    }

    $field.on("click", ".fw-add-ref", function(e) {
        // 多值，添加一项
        e.stopPropagation()
        e.preventDefault()

        // const $closestView = $fieldInputSlot.closest(".view")
        const multipleOption = fieldMeta
        let selectedEntityIds = getInput(form, fieldName)
        selectedEntityIds = ensureValueIsArray(selectedEntityIds)
        toSelectEntity(refEntityMeta.name, multipleOption, selectedEntityIds,
            function(idOrIds) {
            if (fieldMeta.multiple) {
                const ids = selectedEntityIds.concat(idOrIds)
                $refs.attr("value", JSON.stringify(ids))
            } else {
                $refs.attr("value", idOrIds.toString())
                $refs.empty()
            }
            buildRefItem(idOrIds)
        })
    })

    $fieldInputSlot.on("click", ".fw-remove-ref", function(e) {
        // 多值，删除一项
        e.stopPropagation()
        e.preventDefault()

        const $item = $(this).closest(".ref-item")
        $item.remove()

        if (fieldMeta.multiple) {
            const ids: string[] = []
            $refs.find(".ref-item." + form.fClass).iterate($i =>
                ids.push($i.mustAttr("id")))
            $refs.attr("value", JSON.stringify(ids))
        } else {
            $refs.attr("value", "")
        }
    })

    $field.on("click", ".fw-remove-all-ref", function(e) {
        e.stopPropagation()
        e.preventDefault()
        // 多值，删除所有项
        if (!confirm("确定要全部删除吗？")) return

        $refs.empty()
        $refs.attr("value", "")
    })

    $field.on("click", ".fw-hide-all-ref", function(e) {
        e.stopPropagation()
        e.preventDefault()
        const $this = $(this)
        if ($this.hasClass("ref-hidden")) {
            $this.removeClass("ref-hidden").html("收起")
            $refs.show()
        } else {
            $this.addClass("ref-hidden").html("展开")
            $refs.hide()
        }
    })
}

export function getInput(form: EntityForm, fieldName: string) {
    const values = get$field(form, fieldName).find(".refs:first").attr("value")
    const multiple = form.entityMeta.fields[fieldName].multiple
    if (multiple)
        return values && JSON.parse(values) || []
    else
        return values || undefined
}
