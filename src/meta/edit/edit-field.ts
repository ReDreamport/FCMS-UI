// cSpell:words varchar tinyint bigint datetime sortablejs

import $ = require("jquery")
import Sortable = require("sortablejs")

import { collectInputByFieldName, FIELD_TYPES,
    isEnterKey,
    replaceSelectOptionsByStringArray,
    stringArrayToOptionArray } from "../../common"
import { initDialog } from "../../dialog"
import { getMeta } from "../../globals"
import { toastError } from "../../toast"

const ObjectIdStringLength = 24

const typesInputPersist = {
    String: {
        input: ["Text", "TextArea", "RichText", "Select", "CheckList"],
        mongodb: ["String"],
        mysql: ["varchar", "char", "blob", "text"]
    },
    Password: {
        input: ["Password", "Text"],
        mongodb: ["String"],
        mysql: ["varchar", "char"]
    },
    Boolean: {
        input: ["Check"],
        mongodb: ["Boolean"],
        mysql: ["bit", "char", "varchar", "int", "tinyint"]
    },
    Int: {
        input: ["Int", "Select"],
        mongodb: ["Number"],
        mysql: ["int", "bit", "tinyint", "bigint", "decimal"]
    },
    Float: {
        input: ["Float", "Select"],
        mongodb: ["Number"],
        mysql: ["decimal", "float", "double"]
    },
    Date: {
        input: ["Date", "Select"],
        mongodb: ["Date"],
        mysql: ["datetime", "date", "timestamp"]
    },
    Time: {
        input: ["Time", "Select"],
        mongodb: ["Date"],
        mysql: ["datetime", "time", "timestamp"]
    },
    DateTime: {
        input: ["DateTime", "Select"],
        mongodb: ["Date"],
        mysql: ["datetime", "timestamp"]
    },
    Image: {
        input: ["Image"],
        mongodb: ["Document"],
        mysql: ["varchar"]
    },
    File: {
        input: ["File"],
        mongodb: ["Document"],
        mysql: ["varchar"]
    },
    Component: {
        input: ["InlineComponent", "PopupComponent"],
        mongodb: ["Document"],
        mysql: ["text", "blob"]
    },
    Reference: {
        input: ["Reference"],
        mongodb: ["ObjectId"],
        mysql: ["varchar", "char"]
    },
    Object: {
        input: ["JSON"],
        mongodb: ["Document"],
        mysql: ["varchar", "char", "text"]
    },
    ObjectId: {
        input: ["Text", "Select", "CheckList"],
        mongodb: ["ObjectId"],
        mysql: ["varchar", "char"]
    }
}

// TODO 特别在 MYSQL，引用字段的存粗类型应该匹配参考实体的IDE类型，输入时自动填写；保存时应校验
export function editFieldMeta(entityMeta: EntityMeta,
    fieldMeta: FieldMeta | null,
    dialogOpenOrigin: {left: number; top: number} | null,
    callback: (newFM: FieldMeta, oldFM: FieldMeta | null) => void) {

    const meta = getMeta()

    const fieldTypesOptions = stringArrayToOptionArray(FIELD_TYPES)
    const entityNames = Object.keys(meta.entities)
    entityNames.splice(0, 0, "")
    const entityOptions = stringArrayToOptionArray(entityNames)
    const jadeCtx = {fieldTypesOptions, entityOptions,
        fieldMeta: fieldMeta || {}}
    const $overlay = $(ST.EditFieldDialog(jadeCtx)).appendTo($("body"))

    const $type = $overlay.mustFindOne(".for-type")

    $type.on("change", function() {
        onTypeChange(entityMeta, $type, $overlay, fieldMeta)
    })

    // 保存
    $overlay.mustFindOne(".finish").click(function() {
        const newFM = collectInputByFieldName($overlay.mustFindOne(".mc-form"))

        // textOptions
        newFM.textOptions = []
        $overlay.find(".text-options .option").iterate($o => {
            const text = $o.mustFindOne(".text").text()
            newFM.textOptions.push(text)
        })

        // kvOptions
        newFM.kvOptions = []
        $overlay.find(".kv-options .option").iterate($o => {
            const key = $o.mustFindOne(".key").stringInput()
            const value = $o.mustFindOne(".value").stringInput()
            newFM.kvOptions.push({key, value})
        })

        try {
            checkFieldInput(newFM, entityMeta)
        } catch (e) {
            toastError(e.message)
            return
        }

        callback(newFM as FieldMeta, fieldMeta)

        $overlay.remove()
    })

    initTextOptions($overlay, fieldMeta)
    initKvOptions($overlay, fieldMeta)

    // 初始化
    onTypeChange(entityMeta, $type, $overlay, fieldMeta)


    initDialog($overlay, dialogOpenOrigin)
}

function initTextOptions($overlay: JQuery, fieldMeta: FieldMeta | null) {
    const $list = $overlay.mustFindOne(".text-options .options-list")

    if (fieldMeta && fieldMeta.textOptions) {
        for (const text of fieldMeta.textOptions) {
           $list.append(ST.TextOption({text}))
        }
    }

    Sortable.create($list[0], {handle: ".move-handle", animation: 300})

    $overlay.mustFindOne(".text-options input.new-option").on("keydown", e => {
        if (!isEnterKey(e)) return
        const $i = $(e.target)
        const text = $i.stringInput()
        if (!text) return
        $list.append(ST.TextOption({text}))
        $i.val("")
    })

    $list.on("click", ".remove-option", function() {
        $(this).closest(".option").remove()
    })
}

function initKvOptions($overlay: JQuery, fieldMeta: FieldMeta | null) {
    const $list = $overlay.mustFindOne(".kv-options .options-list")

    const $addBtn = $overlay.mustFindOne(".kv-options .add-option")

    if (fieldMeta && fieldMeta.kvOptions) {
        for (const o of fieldMeta.kvOptions) {
           $addBtn.before(ST.KvOption(o))
        }
    }

    Sortable.create($list[0], {handle: ".move-handle", animation: 300})

    $addBtn.on("click", e => { $addBtn.before(ST.KvOption({})) })

    $list.on("click", ".remove-option", function() {
        $(this).closest(".option").remove()
    })
}

export function checkFieldInput(fieldMeta: any, entityMeta: EntityMeta) {
    if (!fieldMeta.name) throw new Error("名字不能为空")
    if (!(fieldMeta.name.match(/^[_a-zA-Z0-9]+$/)))
        throw new Error("名字只能是字母数字下划线")

    if (!fieldMeta.label) throw new Error("显示名不能为空")

    const type = fieldMeta.type
    if (!type) throw new Error("类型不能为空")

    if ((type === "Component" || type === "Reference")
        && !fieldMeta.refEntity) {
        throw new Error("关联实体/组件不能为空")
    }

    const typeInputPersist = (typesInputPersist as any)[fieldMeta.type]

    const persistType = fieldMeta.persistType
    if (!persistType) throw new Error("持久化类型不能为空")
    const validPersistTypes = typeInputPersist[entityMeta.db]
    if (validPersistTypes
        && validPersistTypes.indexOf(persistType) < 0) {
        throw new Error("持久化类型与逻辑类型不匹配")
    }

    if (entityMeta.db === "mysql") {
        if (!noSQLColMType(persistType) && !(fieldMeta.sqlColM > 0)) {
            throw new Error("SQL列宽必须大于零")
        }
        if (fieldMeta.multiple) {
            throw new Error("MySQL存储不支持多值")
        }
    }

    const validInputTypes = typeInputPersist.input
    if (validInputTypes
        && validInputTypes.indexOf(fieldMeta.inputType) < 0) {
        throw new Error("输入类型与逻辑类型不匹配")
    }
}

function noSQLColMType(persistType: string) {
    return persistType === "time" || persistType === "datetime"
        || persistType === "timestamp"
}

function onTypeChange(entityMeta: EntityMeta, $type: JQuery, $overlay: JQuery,
    initFieldMeta: FieldMeta | null) {

    const $input = $overlay.mustFindOne(".for-input-type")
    const $persist = $overlay.mustFindOne(".for-persist-type")
    const $sqlColM = $overlay.mustFindOne(".sql-col-m")

    const type = $type.val() as string
    const inputPersist = (typesInputPersist as any)[type]

    const inputType = $input.val()
        || (initFieldMeta && initFieldMeta.inputType)
    replaceSelectOptionsByStringArray($input, inputPersist.input)
    if (inputType) $input.val(inputType)

    const persistType = $persist.val()
        || (initFieldMeta && initFieldMeta.persistType)
    if (entityMeta.db === "mongodb") {
       replaceSelectOptionsByStringArray($persist, inputPersist.mongodb)
    } else if (entityMeta.db === "mysql") {
        replaceSelectOptionsByStringArray($persist, inputPersist.mysql)
    } else {
        $persist.empty()
    }
    if (persistType) $persist.val(persistType)

    if (entityMeta.db === "mysql") {
        if (type === "Image" || type === "File") {
            $sqlColM.val(200)
        } else if (type === "ObjectId") {
            $sqlColM.val(ObjectIdStringLength)
        }
    }
}

export function systemFieldsForCommon(fields: {[fn: string]: FieldMeta}) {
    fields._id = fields._id || {
        system: true, name: "_id", label: "ID",
        type: "", persistType: "",
        inputType: "Text", hideInCreatePage: true, inEditPage: "hide",
        fastSearch: true
    }
    fields._version = fields._version || {
        system: true, name: "_version", label: "修改版本",
        type: "Int", persistType: "",
        inputType: "Int", hideInCreatePage: true, inEditPage: "hide"
    }
    fields._createdOn = fields._createdOn || {
        system: true, name: "_createdOn", label: "创建时间",
        type: "DateTime", persistType: "",
        inputType: "DateTime", hideInCreatePage: true, inEditPage: "hide",
        showInListPage: true
    }
    fields._modifiedOn = fields._modifiedOn || {
        system: true, name: "_modifiedOn", label: "修改时间",
        type: "DateTime", persistType: "",
        inputType: "DateTime", hideInCreatePage: true, inEditPage: "hide",
        showInListPage: true
    }
    fields._createdBy = fields._createdBy || {
        system: true, name: "_createdBy", label: "创建人",
        type: "Reference",  persistType: "", refEntity: "F_User",
        inputType: "Reference", hideInCreatePage: true, inEditPage: "hide"
    }
    fields._modifiedBy = fields._modifiedBy || {
        system: true, name: "_modifiedBy", label: "修改人",
        type: "Reference", persistType: "", refEntity: "F_User",
        inputType: "Reference", hideInCreatePage: true, inEditPage: "hide"
    }
}

export function systemFieldsForMongo(fields: {[fn: string]: FieldMeta}) {
    fields._id.type = "ObjectId"
    fields._id.persistType = "ObjectId"

    fields._version.persistType = "Number"

    fields._createdOn.persistType = "Date"
    fields._modifiedOn.persistType = "Date"

    fields._createdBy.persistType = "String"
    fields._modifiedBy.persistType = "String"
}

export function systemFieldsForMySQL(fields: {[fn: string]: FieldMeta}) {
    fields._id.type = "String"
    fields._id.persistType = "char"
    fields._id.sqlColM = ObjectIdStringLength

    fields._version.persistType = "int"
    fields._version.sqlColM = 12

    fields._createdOn.persistType = "timestamp"
    fields._modifiedOn.persistType = "timestamp"

    fields._createdBy.persistType = "char"
    fields._createdBy.sqlColM = ObjectIdStringLength
    fields._modifiedBy.persistType = "char"
    fields._modifiedBy.sqlColM = ObjectIdStringLength
}
