import api = require("../../api")
import { normalizeSingleOrArray } from "../../entity"
import { get$field } from "../index"

function upload($file: JQuery, entityName: string, fieldName: string,
    $status: JQuery, callback: (r: UploadResult | null) => void) {

    $status.html("上传中...")
    api.upload($file, entityName, fieldName, data => {
        $status.html("")
        callback(data && data[0])
    })
}

export function buildFileOrImageField(inputTemplate: STFunc,
    itemTemplate: STFunc) {
    function build(form: EntityForm, fieldName: string, $fieldInputSlot: JQuery,
        entityInitValue: EntityValue) {
        const $field = $fieldInputSlot.closest(".fw-field")
        const fieldMeta = form.entityMeta.fields[fieldName]
        const $upload = $(inputTemplate({field: fieldMeta}))
            .appendTo($fieldInputSlot)
        const $file = $field.find("input.file:first")
        const $status = $upload.find(".status:first")
        // $field.find('.select-file:first').click -> $file.click()
        $file.on("change", () => {
            upload($file, form.entityName, fieldName, $status, ur => {
                if (!fieldMeta.multiple) $upload.find(".fw-field-item").remove()
                $upload.append(itemTemplate({file: ur, fClass: form.fClass}))
            })
        $file.val("") // 以允许选择相同的文件上传
        })

        // 初始值
        const fieldValue = entityInitValue[fieldName]
        if (fieldMeta.multiple && fieldValue) {
            for (const file of fieldValue)
                $upload.append(itemTemplate({file, fClass: form.fClass}))
        } else if (fieldValue) {
            $upload.append(itemTemplate({file: fieldValue,
                fClass: form.fClass}))
        }
        $field.on("click", ".fw-remove-file", e => { // 多值，删除一项
            e.stopPropagation()
            e.preventDefault()

            const $item = $(e).closest(".fw-field-item")
            $item.remove()
        })

        $field.on("click", ".fw-remove-all-file", e => { // 多值，删除所有项
            e.stopPropagation()
            e.preventDefault()

            $upload.find(".fw-field-item").remove()
        })

        $field.on("click", ".fw-hide-all-file", e => {
            e.stopPropagation()
            e.preventDefault()

            const $this = $(e).closest(".fw-hide-all-file")
            if ($this.hasClass("file-hidden")) {
                $this.removeClass("file-hidden").html("收起")
                $upload.find(".fw-field-item").show()
            } else {
                $this.addClass("file-hidden").html("展开")
                $upload.find(".fw-field-item").hide()
            }
        })
    }
    return build
}

export const buildField =  buildFileOrImageField(ST.File, ST.FileItem)

export function getInput(form: EntityForm, fieldName: string) {
    const $field = get$field(form, fieldName)
    const values: any[] = []
    $field.find(`.fw-field-item.${form.fClass}`).iterate($i =>
        values.push(JSON.parse($i.attr("file") || "")))
    return normalizeSingleOrArray(values,
        form.entityMeta.fields[fieldName].multiple)
}
