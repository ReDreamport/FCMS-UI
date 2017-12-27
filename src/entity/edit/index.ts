// cSpell:words sortablejs

import { alertAjaxIfError, api } from "../../api"
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

        const singleSimpleFieldNames: string[] = []
        const multipleSimpleFieldNames: string[] = []
        const bigInputFieldNames: string[] = []
        const fileFieldNames: string[] = []
        const imageFieldNames: string[] = []
        const componentFieldNames: string[] = []
        const referenceFieldNames: string[] = []

        for (const fieldName of fieldNames) {
            const fieldMeta = this.entityMeta.fields[fieldName]
            const type = fieldMeta.type
            const inputType = fieldMeta.inputType

            if (type === "Reference") {
                referenceFieldNames.push(fieldName)
            } else if (type === "Component") {
                componentFieldNames.push(fieldName)
            } else if (type === "File") {
                fileFieldNames.push(fieldName)
            } else if (type === "Image") {
                imageFieldNames.push(fieldName)
            } else if (type === "Object") {
                bigInputFieldNames.push(fieldName)
            } else if (inputType === "RichText" || inputType === "TextArea"
                || inputType === "CheckList") {
                bigInputFieldNames.push(fieldName)
            } else if (fieldMeta.multiple) {
                multipleSimpleFieldNames.push(fieldName)
            } else {
                singleSimpleFieldNames.push(fieldName)
            }
        }

        const jadeCtx = {
            entityMeta: this.entityMeta, entityValue: this.entityInitValue,
            singleSimpleFieldNames, multipleSimpleFieldNames,
            bigInputFieldNames, fileFieldNames, imageFieldNames,
            componentFieldNames, referenceFieldNames}

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
    }

    getInput() {
        this.$root.find("")
    }
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
