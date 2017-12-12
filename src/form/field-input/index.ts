import _ = require("lodash")

import { fieldInputChangeEventManager, inputTypes } from "../index"

type RebuildOptions = (options: any[], fieldValue?: any) => void

export function initSelectInput(rebuildOptions: RebuildOptions,
    fieldMeta: FieldMeta, form: EntityForm, entityInitValue: EntityValue) {
    if (fieldMeta.optionsDependOnField) {
        enableOptionsDependOnField(form, fieldMeta, rebuildOptions,
            entityInitValue)
    } else {
        if (fieldMeta.options && fieldMeta.options.length) {
            const options = fieldMeta.options
            rebuildOptions(options, entityInitValue[fieldMeta.name])
        } else if (fieldMeta.optionsFunc) {
            const func = _.get(window, fieldMeta.optionsFunc)
            const options = func(fieldMeta.name, form)
            rebuildOptions(options, entityInitValue[fieldMeta.name])
        }
    }
}

export function enableOptionsDependOnField(form: EntityForm,
    fieldMeta: FieldMeta, rebuildOptions: RebuildOptions,
    entityInitValue: EntityValue) {
    // 本字段可以是多值的，依赖的字段必须是单值的
    const optionsDependOnField = fieldMeta.optionsDependOnField
    if (!optionsDependOnField) return
    const dependentFieldMeta = form.entityMeta.fields[optionsDependOnField]
    if (!dependentFieldMeta || dependentFieldMeta.multiple) return

    function getOptions(fv: any) {
        if (fieldMeta.groupedOptions && fieldMeta.groupedOptions.length)
            return fieldMeta.groupedOptions[fv]
        else if (fieldMeta.optionsFunc) {
            const func = _.get(window, fieldMeta.optionsFunc)
            return func(fieldMeta.name, form, fv)
        } else {
            return null
        }
    }

    fieldInputChangeEventManager.on(form.fid, optionsDependOnField, () => {
        const fm = form.entityMeta.fields[optionsDependOnField]
        if (!fm) return
        if (!fm.inputType) return
        const fv = inputTypes.getInput(form, optionsDependOnField)
        rebuildOptions(getOptions(fv))
    })

    // 初始化
    const dependentFieldValue = entityInitValue[optionsDependOnField]
    rebuildOptions(getOptions(dependentFieldValue),
        entityInitValue[fieldMeta.name])
}

type BuildFieldItem = (form: EntityForm, fieldMeta: FieldMeta, itemValue: any,
    dependentFieldValue: any) => string | JQuery

export function buildNormalField(form: EntityForm, fieldName: string,
    $fieldInputSlot: JQuery, entityInitValue: EntityValue,
    buildFieldItem: BuildFieldItem) {
    const fieldMeta = form.entityMeta.fields[fieldName]

    let fieldInitValue = entityInitValue && entityInitValue[fieldName]
    fieldInitValue = fieldMeta.multiple ? (fieldInitValue || [])
        : [fieldInitValue]

    const dependOnField = fieldMeta.optionsDependOnField
    let dependentFieldValue
    if (dependOnField && (fieldMeta.groupedOptions
        && fieldMeta.groupedOptions.length)) {
        dependentFieldValue = entityInitValue && entityInitValue[dependOnField]
    }

    for (const itemValue of fieldInitValue)
         $fieldInputSlot.append(buildFieldItem(form, fieldMeta, itemValue,
            dependentFieldValue))
}
