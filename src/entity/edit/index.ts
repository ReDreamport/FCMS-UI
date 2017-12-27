// cSpell:words sortablejs

import { alertAjaxIfError, api, upload } from "../../api"
import { SYSTEM_FIELDS } from "../../common"
import { getMeta } from "../../globals"
import { Page } from "../../page"
import { digestId } from "../index"

import $ = require("jquery")
import _ = require("lodash")
import Sortable = require("sortablejs")

function decideFinalOptions(entityMeta: EntityMeta) {
    const fieldNames = Object.keys(entityMeta.fields)
    for (const fn of fieldNames) {
        const fieldMeta = entityMeta.fields[fn]
        const options: KeyValuePair[] = []

        if (fieldMeta.textOptions && fieldMeta.textOptions.length) {
            for (const o of fieldMeta.textOptions) {
                options.push({key: o, value: o})
            }
        } else if (fieldMeta.kvOptions && fieldMeta.kvOptions.length) {
            for (const o of fieldMeta.kvOptions) {
               options.push(o)
            }
        }

        fieldMeta.finalOptions = options
    }
}

function fieldMetaToActions(fieldMeta: FieldMeta)
    : {add?: boolean; edit?: boolean; empty?: boolean} {

    const type = fieldMeta.type
    const inputType = fieldMeta.inputType
    if (type === "Reference") {
        return {edit: true, empty: true}
    } else if (inputType === "CheckList") {
        return {}
    } else if (fieldMeta.multiple) {
        return {add: true, empty: true}
    } else {
        return {}
    }
    // "File", "Image",
    // "InlineComponent", "PopupComponent", "TabledComponent", "Reference"
}

class EntityEditForm {
    private $root: JQuery

    constructor(private entityMeta: EntityMeta,
        private entityInitValue: EntityValue,
        $parent: JQuery) {

        decideFinalOptions(entityMeta)

        this.$root = $("<div>", {class: "entity-edit-form mc-form"})
            .appendTo($parent)

        this.decideFieldOrder()
    }

    private decideFieldOrder() {
        const fieldNames = Object.keys(this.entityMeta.fields)
        _.pull(fieldNames, ...SYSTEM_FIELDS)

        const inlineFieldNames: string[] = []
        const blockFieldNames: string[] = []

        for (const fieldName of fieldNames) {
            const fieldMeta = this.entityMeta.fields[fieldName]
            const type = fieldMeta.type
            const inputType = fieldMeta.inputType

            if (fieldMeta.multiple) {
                blockFieldNames.push(fieldName)
            } else if (type === "Reference" || type === "Component"
                || type === "File" || type === "Image" || type === "Object") {
                blockFieldNames.push(fieldName)
            } else if (inputType === "RichText" || inputType === "TextArea"
                || inputType === "CheckList") {
                blockFieldNames.push(fieldName)
            } else {
                inlineFieldNames.push(fieldName)
            }
        }

        const jadeCtx = {
            entityMeta: this.entityMeta, entityValue: this.entityInitValue,
            inlineFieldNames, blockFieldNames, fieldMetaToActions}

        const $fields = $(ST.EntityEditFields(jadeCtx)).appendTo(this.$root)

        // 多值排序
        $fields.find(".multiple-input").iterate($multiple => {
            Sortable.create($multiple[0], {handle: ".move-handle",
                animation: 600})
        })

        // 多值，添加一项
        $fields.on("click", ".label-actions .add", e => {
            const $field = $(e.target).closest(".field")
            const fieldName = $field.mustAttr("field-name")
            const entityName = $field.mustAttr("entity-name")
            const fieldMeta = getMeta().entities[entityName].fields[fieldName]
            const $multipleInput = $field.mustFindOne(".multiple-input:first")

            $multipleInput.append(ST.MultipleInputItem({fm: fieldMeta}))
        })

        // 多值，清空
        $fields.on("click", ".label-actions .empty", e => {
            $(e.target).mustClosest(".field")
                .mustFindOne(".multiple-input:first").empty()
        })

        // 多值，删除一项
        $fields.on("click", ".remove-m-input-item", e => {
            $(e.target).mustClosest(".multiple-input-item").remove()
        })

        // 文件上传
        $fields.on("click", ".file-input .upload", function() {
            const $fileInput = $(this).mustClosest(".file-input")
            const $file = $fileInput.mustFindOne(".file")
            const $info = $fileInput.mustFindOne(".info")

            $file.off("change").on("change", function() {
                $info.html("上传中...")
                upload($file, r => {
                    if (!r) return
                    const $inputItem
                        = $fileInput.mustClosest(".multiple-input-item")
                    const fm = getFieldMetaOfMyField($inputItem)
                    for (const fv of r) {
                        $inputItem.before(ST.MultipleInputItem({fm, fv}))
                    }
                    $inputItem.remove()
                })
                $file.val("")
            })
            $file.click()
        })
    }

    getInput() {
        this.$root.find("")
    }
}

function getFieldMetaOfMyField($from: JQuery) {
    const $field = $from.mustClosest(".field")
    const entityName = $field.mustAttr("entity-name")
    const fieldName = $field.mustAttr("field-name")
    const entityMeta = getMeta().entities[entityName]
    const fm = entityMeta.fields[fieldName]
    return fm
}

class CreateEditEntity extends Page {
    private entityName: string
    protected entityValue: EntityValue
    private entityMeta: EntityMeta

    private $page: JQuery

    private rootForm: EntityEditForm

    pBuild() {
        this.entityName = this.routeCtx.params.entityName
        this.entityMeta = getMeta().entities[this.entityName]
        this.$page = $(ST.EditEntityPage({})).appendTo(this.$pageParent)

        this.rootForm = new EntityEditForm(this.entityMeta,
            this.entityValue || {}, this.$page)

        this.$page.mustFindOne(".save").click(() => {
            this.save()
        })
    }

    private save() {
        this.rootForm.getInput()
    }
}

export class EditEntity extends CreateEditEntity {
    pLoadData() {
        const entityName = this.routeCtx.params.entityName
        const id = this.routeCtx.params.id
        const q = api.get(`entity/${entityName}/${id}`)
        return alertAjaxIfError(q).then(e => this.entityValue = e)
    }
    pBuild() {
        const entityName = this.routeCtx.params.entityName
        const entityMeta = getMeta().entities[entityName]
        const id = this.routeCtx.params.id

        this.setTitle(`${entityMeta.label} ${digestId(id)}`)

        return super.pBuild()
    }
}
