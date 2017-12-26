// cSpell:words sortablejs

import { alertAjaxIfError, api } from "../../api"
import { makeSureArray, SYSTEM_FIELDS } from "../../common"
import { getMeta } from "../../globals"
import { Page } from "../../page"
import { digestId } from "../index"

import * as $ from "jquery"
import _ = require("lodash")
import Sortable = require("sortablejs")

class EntityEditForm {
    private $root: JQuery

    private singleSimpleFieldNames: string[] = []
    private multipleSimpleFieldNames: string[] = []
    private bigInputFieldNames: string[] = []
    private fileFieldNames: string[] = []
    private imageFieldNames: string[] = []
    private componentFieldNames: string[] = []
    private referenceFieldNames: string[] = []

    constructor(private entityMeta: EntityMeta,
        private entityInitValue: EntityValue,
        $parent: JQuery) {

        this.$root = $("<div>", {class: "entity-edit-form mc-form"})
            .appendTo($parent)

        this.decideFieldOrder()

        this.renderSingleSimpleFields()
        this.renderMultipleSimpleFields()
    }

    private decideFieldOrder() {
        const fieldNames = Object.keys(this.entityMeta.fields)
        _.pull(fieldNames, "_id", ...SYSTEM_FIELDS)
        for (const fieldName of fieldNames) {
            const fieldMeta = this.entityMeta.fields[fieldName]
            const type = fieldMeta.type
            const inputType = fieldMeta.inputType

            if (type === "Reference") {
                this.referenceFieldNames.push(fieldName)
            } else if (type === "Component") {
                this.componentFieldNames.push(fieldName)
            } else if (type === "File") {
                this.fileFieldNames.push(fieldName)
            } else if (type === "Image") {
                this.imageFieldNames.push(fieldName)
            } else if (type === "Object") {
                this.bigInputFieldNames.push(fieldName)
            } else if (inputType === "RichText" || inputType === "TextArea") {
                this.bigInputFieldNames.push(fieldName)
            } else if (inputType === "CheckList") {
                this.bigInputFieldNames.push(fieldName)
            } else if (fieldMeta.multiple) {
                this.multipleSimpleFieldNames.push(fieldName)
            } else {
                this.singleSimpleFieldNames.push(fieldName)
            }
        }
    }

    private renderSingleSimpleFields() {
        const $section = newSection().appendTo(this.$root)

        for (const fn of this.singleSimpleFieldNames) {
            const fm = this.entityMeta.fields[fn]
            const fv = this.entityInitValue[fn]
            $section.append(ST.SingleSimpleField({fm, fv}))
        }
    }

    private renderMultipleSimpleFields() {
        const $section = newSection().appendTo(this.$root)

        for (const fn of this.multipleSimpleFieldNames) {
            const fm = this.entityMeta.fields[fn]
            const $field = $(ST.MultipleSimpleField({fm}))
                .appendTo($section)
            const $multipleInput = $field.mustFindOne(".multiple-input:first")
            const fv = makeSureArray(this.entityInitValue[fn])
            // 多值，初始值
            if (fv) {
                for (const item of fv) {
                    $multipleInput.append(ST.MultipleSimpleInputItem({fm,
                        fv: item}))
                }
            }
            // 多值，添加一项
            $field.mustFindOne(".label-actions:first .add").click(() => {
                $multipleInput.append(ST.MultipleSimpleInputItem({fm,
                    fv: null}))

            })
            // 排序使能
            Sortable.create($multipleInput[0], {handle: ".move-handle",
                animation: 600})
        }

        // 多值，清空
        $section.on("click", ".label-actions:first .empty", e => {
            $(e.target).mustClosest(".field")
                .mustFindOne(".multiple-input:first").empty()
        })

        // 多值，删除一项
        $section.on("click", ".remove-m-input-item", e => {
            $(e.target).mustClosest(".multiple-input-item").remove()
        })
    }

    getInput() {
        this.$root.find("")
    }
}

function newSection() {
    return $("<div>", {class: "section"})
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
