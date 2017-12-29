// cSpell:words sortablejs

import $ = require("jquery")
import json5 = require("json5")
import _ = require("lodash")
import Sortable = require("sortablejs")

import { alertAjaxIfError, api, upload } from "../../api"
import { collectInputByFieldName, collectSimpleInput,
    SYSTEM_FIELDS } from "../../common"
import { getMeta } from "../../globals"
import { deleteByKey, getByKey } from "../../index"
import { Page } from "../../page"
import { closeByKey } from "../../router"
import { toastError, toastSuccess } from "../../toast"
import { editComponent } from "../component"
import { loadReferences } from "../digest"
import { digestId } from "../index"
import { selectEntity } from "../select"

function fieldMetaToActions(fieldMeta: FieldMeta)
    : {add?: boolean; edit?: boolean; empty?: boolean} {

    const type = fieldMeta.type
    const inputType = fieldMeta.inputType
    if (type === "Reference") {
        return {edit: true, empty: true}
    } else if ((type === "File" || type === "Image" || type === "Component")
        && !fieldMeta.multiple) {
        return {edit: true, empty: true}
    } else if (inputType === "CheckList") {
        return {}
    } else if (fieldMeta.multiple) {
        return {add: true, empty: true}
    } else {
        return {}
    }
}

export class EntityEditForm {
    private $root: JQuery

    constructor(private entityMeta: EntityMeta,
        private entityInitValue: EntityValue,
        $parent: JQuery) {

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

        // 加载关联实体
        loadReferences($fields)

        // 多值排序
        $fields.find(".multiple-input").iterate($multiple => {
            Sortable.create($multiple[0], {handle: ".move-handle",
                animation: 300})
        })

        $fields.find("table.component-list tbody").iterate($tbody => {
            Sortable.create($tbody[0], {animation: 200})
        })

        // 多值，添加一项
        $fields.on("click", ".label-actions .add", e => {
            const $field = $(e.target).closest(".field")
            const fieldName = $field.mustAttr("field-name")
            const entityName = $field.mustAttr("entity-name")
            const fieldMeta = getMeta().entities[entityName].fields[fieldName]

            if (fieldMeta.type === "Component") {
                const itemCtx = {entityName: fieldMeta.refEntity,
                    multiple: true, itemValue: {}}
                $field.mustFindOne("table.component-list tbody:first")
                    .append(ST.ComponentItem(itemCtx))
            } else {
                const $multipleInput
                    = $field.mustFindOne(".multiple-input:first")
                $multipleInput.append(ST.MultipleInputItem({fm: fieldMeta}))
            }
        })

        // 多值，清空
        $fields.on("click", ".label-actions .empty", e => {
            const $mi = $(e.target).mustClosest(".field")
                .mustFindOne(".multiple-input:first")
            const $comTbody = $mi.find(">table.component-list tbody:first")
            if ($mi.find(">table.component-list")) {
                $comTbody.empty()
            } else {
                $mi.empty()
            }
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

            uploadFileOrImage($fileInput, $file, $info)
        })

        // 图片上传
        $fields.on("click", ".image-input .upload", function() {
            const $fileInput = $(this).mustClosest(".image-input")
            const $file = $fileInput.mustFindOne(".file")
            const $status = $fileInput.mustFindOne(".status")

            uploadFileOrImage($fileInput, $file, $status)
        })

        // 编辑
        $fields.on("click", ".label-actions .edit", e => {
            const $field = $(e.target).mustClosest(".field")
            this.editField($field)
        })

        // 删除引用行
        $fields.on("click", ".remove-row", e => {
            $(e.target).mustClosest("tr").remove()
        })

        // 编辑引用行
        $fields.on("click", "table.component-list .edit", e => {
            const $tr = $(e.target).mustClosest("tr")
            const $field = $tr.mustClosest(".field")
            const fieldName = $field.mustAttr("field-name")
            const fieldMeta = this.entityMeta.fields[fieldName]
            const itemValue = getByKey($tr.mustAttr("storeKey"))
            editComponent(fieldMeta.refEntity, fieldMeta.label, itemValue,
                newComValue => {
                const itemCtx = {entityName: fieldMeta.refEntity,
                    multiple: fieldMeta.multiple, itemValue: newComValue}
                $tr.replaceWith(ST.ComponentItem(itemCtx))
            })
        })
    }

    // 点击字段的编辑按钮
    editField($field: JQuery) {
        const fieldName = $field.mustAttr("field-name")
        const fieldMeta = this.entityMeta.fields[fieldName]
        const $multipleInput = $field.mustFindOne(".multiple-input:first")
        // 编辑引用
        if (fieldMeta.inputType === "Reference") {
            editReference($multipleInput, fieldMeta)
        } else if (fieldMeta.type === "Image") { // 单值
            if (!$multipleInput.find(".image-input").length)
                $multipleInput.append(ST.MultipleInputItem({fm: fieldMeta}))
            $multipleInput.mustFindOne(".image-input .upload").click()
        } else if (fieldMeta.type === "File") { // 单值
            if (!$multipleInput.find(".image-input").length)
                $multipleInput.append(ST.MultipleInputItem({fm: fieldMeta}))
            $multipleInput.mustFindOne(".file-input .upload").click()
        } else if (fieldMeta.type === "Component") { // 单值
            if (!$multipleInput.find("tbody:first tr").length) {
                const itemCtx = {entityName: fieldMeta.refEntity,
                    multiple: false, itemValue: {}}
                $field.mustFindOne("table.component-list tbody:first")
                    .append(ST.ComponentItem(itemCtx))
            }
            $multipleInput.mustFindOne(".edit").click()
        }
    }

    getInput() {
        const $inlineFields = this.$root.mustFindOne(".section.inline-fields")
        const entity = collectInputByFieldName($inlineFields)

        this.$root.find(".section.block-fields .field").iterate($f => {
            const fieldName = $f.mustAttr("field-name")
            const entityName = $f.mustAttr("entity-name")
            const fieldMeta = getMeta().entities[entityName].fields[fieldName]
            const inputType = fieldMeta.inputType
            const type = fieldMeta.type

            // 先当多值处理
            const list: any[] = []

            if (type === "Component") {
                $f.find("table.component-list:first tbody tr").iterate($tr => {
                    const storeKey = $tr.mustAttr("storeKey")
                    const value = getByKey(storeKey)
                    deleteByKey(storeKey)
                    list.push(value)
                })
            } else if (inputType === "RichText") {
                $f.find(".field-input-parent").iterate($fi => {
                    const value = $fi.mustFindOne(".preview-area").html()
                    if (!_.isNil(value)) list.push(value)
                })
            } else if (inputType === "Check") {
                $f.find(".field-input-parent").iterate($fi => {
                    const value = $fi.mustFindOne("input").prop("checked")
                    list.push(value)
                })
            } else if (inputType === "CheckList") {
                // 一律当 string 处理，由服务器转格式
                $f.find("input:checked").iterate($fi => {
                    list.push($fi.val())
                })
            } else if (type === "Object") {
                $f.find(".field-input-parent").iterate($fi => {
                    const value = $fi.mustFindOne("textarea").stringInput()
                    console.log("JSON", value)
                    if (!value) return
                    try {
                       const json = json5.parse(value)
                       list.push(json)
                    } catch (e) {
                        throw new Error("JSON对象格式错误")
                    }
                })
            } else if (type === "File" || type === "Image") {
                $f.find(".field-input-parent").iterate($fi => {
                    const value = $fi.mustFindOne(".fi-input").attr("value")
                    if (!value) return
                    const json = json5.parse(value)
                    list.push(json)
                })
            } else if (type === "Reference") {
                $f.find(".field-input-parent").iterate($fi => {
                    const value = $fi.find(".ref-item").attr("id")
                    if (value) list.push(value)
                })
            } else {
                // "Text", "Password", "TextArea", "Int", "Float", 
                // "Date", "Time", "DateTime"
                // "Select" 一律当 string 处理，由服务器转格式
                $f.find(".field-input-parent").iterate($fi => {
                    const value = collectSimpleInput($fi)
                    if (!_.isNil(value)) list.push(value)
                })
            }

            if (fieldMeta.multiple) {
                entity[fieldName] = list
            } else {
                entity[fieldName] = list.length ? list[0] : null
            }
        })

        console.log(entity)
        return entity
    }
}

function editReference($mi: JQuery, fieldMeta: FieldMeta) {
    const ids: string[] = []
    $mi.find(".multiple-input-item").iterate($i => {
        const id = $i.mustFindOne(".entity-digest:first").mustAttr("id")
        ids.push(id)
    })

    selectEntity(fieldMeta, ids, (newIds, idToInfo) => {
        $mi.empty()
        for (const id of newIds) {
            const info = idToInfo[id]
            if (!info) continue
            $mi.append(ST.MultipleInputItem({fv: info.digest, fm: fieldMeta}))
        }
    })
}

function uploadFileOrImage($input: JQuery, $file: JQuery, $status: JQuery) {
    $file.off("change").on("change", function() {
        $status.html("上传中...")
        upload($file, r => {
            if (!r) return
            const $inputItem
                = $input.mustClosest(".multiple-input-item")
            const fm = getFieldMetaOfMyField($inputItem)
            for (const fv of r) {
                $inputItem.before(ST.MultipleInputItem({fm, fv}))
            }
            $inputItem.remove()
        })
        $file.val("")
    })
    $file.click()
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
        let inputEntity: any
        try {
            inputEntity = this.rootForm.getInput()
        } catch (e) {
            toastError(e.message)
            return
        }
        const q = this.entityValue && this.entityValue._id
            ? api.put(`entity/${this.entityName}/${this.entityValue._id}`,
                inputEntity)
            : api.post(`entity/${this.entityName}`, inputEntity)
        alertAjaxIfError(q).then(() => {
            toastSuccess("保存成功！")
            closeByKey(this.routeCtx.path)
        })
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
