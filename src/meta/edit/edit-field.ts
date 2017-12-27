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

const typeInputPersist = {
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
        mongodb: ["String"],
        mysql: ["varchar"]
    },
    File: {
        input: ["File"],
        mongodb: ["String"],
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
    const $input = $overlay.mustFindOne(".for-input-type")
    const $persist = $overlay.mustFindOne(".for-persist-type")

    $type.on("change", function() {
        onTypeChange(entityMeta, $type,
            $input, fieldMeta && fieldMeta.inputType,
            $persist, fieldMeta && fieldMeta.persistType)
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
            checkInput(newFM)
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
    onTypeChange(entityMeta, $type,
        $input, fieldMeta && fieldMeta.inputType,
        $persist, fieldMeta && fieldMeta.persistType)


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

function checkInput(fieldMeta: any) {
    if (!fieldMeta.name)
        throw new Error("名字不能为空")
    if (!(fieldMeta.name.match(/^[_a-zA-Z0-9]+$/)))
        throw new Error("名字包含非法字符")
}

function onTypeChange(entityMeta: EntityMeta, $type: JQuery,
    $input: JQuery, initInputType: string | null,
    $persist: JQuery, initPersistType: string | null) {
    const type = $type.val() as string
    const inputPersist = (typeInputPersist as any)[type]

    const inputType = $input.val() || initInputType
    replaceSelectOptionsByStringArray($input, inputPersist.input)
    if (inputType) $input.val(inputType)

    const persistType = $persist.val() || initPersistType
    if (entityMeta.db === "mongodb") {
       replaceSelectOptionsByStringArray($persist, inputPersist.mongodb)
    } else if (entityMeta.db === "mysql") {
        replaceSelectOptionsByStringArray($persist, inputPersist.mysql)
    } else {
        $persist.empty()
    }
    if (persistType) $persist.val(persistType)
}
