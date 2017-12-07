// cSpell:words ftype finput

import $ = require("jquery")
import _ = require("lodash")

import { getMeta } from "../globals"
import { toastError } from "../toast"

let GLOBAL_FORM_ID = 0

const inputTypes: any = {}

type FieldInputChangeListener = (fid: string, fieldName: string) => void

interface FieldInputChangeListenerForField {
    [fieldName: string]: FieldInputChangeListener[]
}

class FieldInputChangeEventManager {
    private listeners: {[fid: string]: FieldInputChangeListenerForField} = {}

    getListeners(fid: string, fieldName: string) {
        this.listeners[fid] = this.listeners[fid] || {}
        return (this.listeners[fid][fieldName]
            = this.listeners[fid][fieldName] || [])
    }
    fire(fid: string, fieldName: string) {
        const listeners = this.getListeners(fid, fieldName)
        for (const l of listeners) l(fid, fieldName)
    }
    on(fid: string, fieldName: string, listener: FieldInputChangeListener) {
        const listeners = this.getListeners(fid, fieldName)
        listeners.push(listener)
    }
    off(fid: string) {
        delete this.listeners[fid]
    }
}

export const fieldInputChangeEventManager = new FieldInputChangeEventManager()


export function buildRootForm(entityName: string,
    entityInitValue: EntityValue) {

    const form = buildForm(entityName, entityInitValue)
    form.$form.attr("_version", entityInitValue && entityInitValue._version)

    // =======================================
    // 仅在最上层表单上绑定，嵌套表单（子组件）不要绑定，否则就重复了！！！
    const $form = form.$form

    // 隐藏字段的所有项
    $form.on("click", ".fw-field-hide-items", function(e) {
        e.stopPropagation()
        e.preventDefault()
        const $this = $(this)
        if ($this.hasClass("items-hidden")) {
            $this.removeClass("items-hidden").html("收起")
            $this.closest(".fw-field")
                .find(".fw-field-input:first>.fw-field-item").show()
        } else {
            $this.addClass("items-hidden").html("展开")
            $this.closest(".fw-field")
                .find(".fw-field-input:first>.fw-field-item").hide()
        }
    })

    // 字段添加一项
    $form.on("click", ".fw-field-add-item", function(e) {
        e.stopPropagation()
        e.preventDefault()

        const $field = $(this).closest(".fw-field")
        const fieldName = $field.mustAttr("name")

        // const $form = $field.closest(".form")
        // const form = $formToForm($form)
        // const entityName = $form.mustAttr("entityName")
        const entityMeta = form.entityMeta
        const fieldMeta = entityMeta.fields[fieldName]

        const $fieldInputSlot = $field.find(".fw-field-input:first")

        $fieldInputSlot.append(inputTypes[fieldMeta.inputType]
            .buildFieldItem(form, fieldMeta, null))
    })

    // 字段移除一项
    $form.on("click", ".fw-field-remove-item", function(e) {
        e.stopPropagation()
        e.preventDefault()

        const $item = $(this).closest(".fw-field-item")
        $item.find(".form").iterate($f => disposeForm($formToForm($f)))
        $item.remove()
    })

    // 移除字段的所有项
    $form.on("click", ".fw-field-remove-all-items", function(e) {
        e.stopPropagation()
        e.preventDefault()

        if (!confirm("确定要全部删除吗？")) return

        const $items = $(this).closest(".fw-field").find(">.fw-field-item")
        $items.iterate($i =>
            $i.find(".form").iterate($f => disposeForm($formToForm($f))))
        $items.remove()
    })

    // 监测输入修改
    $form.on("change", "input, select, textarea", function(e) {
        const $this = $(this)
        const fieldName = $this.closest(".fw-field").mustAttr("name")
        const fid = $this.closest(".form").mustAttr("fid")

        fieldInputChangeEventManager.fire(fid, fieldName)
    })

    return form
}

export function buildForm(entityName: string, entityInitValue?: EntityValue) {
    const meta = getMeta()
    const entityMeta = meta.entities[entityName]
    const fid = (++GLOBAL_FORM_ID).toString() // form id
    const fClass = "fid-" + fid // form mark class
    const isCreate = !(entityInitValue && entityInitValue._id)
    const $form = $(ST.Form({entityName, fid, isCreate}))

    const form: EntityForm = { entityName, entityMeta, fid, fClass, $form }

    rebuildInput(form, isCreate, entityInitValue)

    const $formEditor = $form.mustFindOne(".form-editor:first")
    // 必须通过 $formEditor 限定
    const $fInput = $formEditor.mustFindOne(">.form-input")
    const $fJson = $formEditor.mustFindOne(">.form-json")

    // 整个表单的显隐切换
    $form.mustFindOne(".toggle-form-visible:first").on("click", e => {
        e.stopPropagation()
        e.preventDefault()

        const $this = $(e.target).closest(".toggle-form-visible")
        if ($this.hasClass("fa-plus-square")) { // 应展开
            $this.removeClass("fa-plus-square").addClass("fa-minus-square")
            $formEditor.show()
        } else { // 应折叠
            $this.removeClass("fa-minus-square").addClass("fa-plus-square")
            $formEditor.hide()
        }
    })

    $form.mustFindOne(".show-editor-input:first").click(e => {
        e.stopPropagation()
        e.preventDefault()
        $fInput.show()
        $fJson.hide()
    })

    $form.mustFindOne(".show-editor-json:first").click(e => {
        e.stopPropagation()
        e.preventDefault()

        $fInput.hide()
        $fJson.show()

        const json = {}
        try {
            collectFormInput(form, json, isCreate)
        } catch (e) {
            toastError(e)
            return
        }

        $fJson.find("textarea:first").val(JSON.stringify(json, null, 4))
    })

    $fJson.mustFindOne(".json-to-input:first").click(e => {
        const jsonStr = $fJson.find("textarea:first").stringInput()
        try {
            const json = jsonStr && JSON.parse(jsonStr)
            this.rebuildInput(json)
        } catch (e) {
            toastError("JSON 格式有误")
            return
        }

        $fInput.show()
        $fJson.hide()
    })

    if (this.entityMeta.editEnhanceFunc) {
        const func = _.get(window, this.entityMeta.editEnhanceFunc)
        func(this.entityMeta, this)
    }

    return form
}

function rebuildInput(form: EntityForm, isCreate: boolean,
    entityValue?: EntityValue) {

    const $formInput = form.$form.mustFindOne(".form-input:first").empty()
    const fields = form.entityMeta.fields
    const fieldNames = Object.keys(fields)
    for (const fieldName of fieldNames) {
        const fieldMeta = fields[fieldName]
        if (fieldMeta.notShow) continue
        if (isCreate)
            // if fieldMeta.noCreate
            // && !checkAclField(entityMeta.name, fieldName, 'create')
            if (fieldMeta.noCreate) continue
        else
            // if fieldMeta.noEdit
            // && !checkAclField(entityMeta.name, fieldName, "edit")
            if (fieldMeta.noEdit) continue

        let fieldClass = `fn-${fieldName} ${form.fClass} `
            + `ftype-${fieldMeta.type} finput-${fieldMeta.inputType}`
        if (fieldMeta.multiple) fieldClass += " of-multiple"
        const $field = $(ST.Field({field: fieldMeta, fieldClass,
            fClass: form.fClass}))
        $field.appendTo($formInput)
        const $fieldInputSlot = $field.mustFindOne(".fw-field-input")

        if (fieldMeta.inputFunc) {
            const inputFunc = _.get(window, fieldMeta.inputFunc)
            inputFunc.buildField(form, fieldName, $fieldInputSlot,
                entityValue)
        } else {
            const inputType = inputTypes[fieldMeta.inputType]
            if (!inputType)
                console.log("Not found input type "
                    + fieldMeta.inputType + ", fieldName: " + fieldName)
            else
                inputType.buildField(form, fieldName, $fieldInputSlot,
                    entityValue)

            // 排序使能
            if (fieldMeta.multiple)
                $field.sortable({items: ".fw-field-item"})
        }
    }
}

export function $formToForm($form: JQuery) {
    const entityName = $form.mustAttr("entityName")
    const fid = $form.mustAttr("fid")
    const fClass = "fid-" + fid
    const meta = getMeta()
    const entityMeta = meta.entities[entityName]

    const form: EntityForm = {entityName, entityMeta, fid, fClass, $form}
    return form
}

export function get$field(form: EntityForm, fieldName: string) {
    return form.$form.mustFindOne(`.fn-${fieldName}.${form.fClass}`)
}

function collectFieldInput(form: EntityForm, fieldMeta: FieldMeta) {
    if (fieldMeta.inputFunc) {
        const inputFunc = _.get(window, fieldMeta.inputFunc)
        inputFunc.getInput(form, fieldMeta.name)
    } else {
        inputTypes[fieldMeta.inputType].getInput(form, fieldMeta.name)
    }
}

// 收集界面上输入的实体的值
export function collectFormInput(form: EntityForm, formValue: EntityValue,
    isCreate: boolean) {

    const fields = form.entityMeta.fields
    const fieldNames = Object.keys(fields)
    for (const fieldName of fieldNames) {
        const fieldMeta = fields[fieldName]
        if (isCreate) {
            // &&!checkAclField(form.entityMeta.name, fieldName, 'create')
            if (fieldMeta.noCreate) continue
        } else {
            // checkAclField(form.entityMeta.name, fieldName, 'edit')
            if (fieldMeta.noEdit) continue
        }

        const fv = collectFieldInput(form, fieldMeta)
        if (!_.isUndefined(fv)) formValue[fieldName] = fv // TODO right?
    }

    // 取此表单的版本号
    const versionStr = form.$form.mustAttr("_version")
    const version = parseInt(versionStr, 10)
    if (version) formValue._version = version
}

export function disposeForm(form: EntityForm) {
    fieldInputChangeEventManager.off(form.fid.toString())
    form.$form.find(".form").iterate($i =>
        fieldInputChangeEventManager.off($i.mustAttr("fid")))
}
