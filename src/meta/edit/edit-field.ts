// cSpell:words varchar tinyint bigint datetime

import $ = require("jquery")
import { collectInputByFieldName, FIELD_TYPES,
    replaceSelectOptionsByStringArray,
    stringArrayToOptionArray } from "../../common"
import { initDialog } from "../../dialog"
import { getMeta } from "../../globals"
import { toastError } from "../../toast/index"

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

    $overlay.mustFindOne(".finish").click(function() {
        const newFM = collectInputByFieldName($overlay.mustFindOne(".mc-form"))
        try {
            checkInput(newFM)
        } catch (e) {
            toastError(e.message)
            return
        }

        callback(newFM as FieldMeta, fieldMeta)

        $overlay.remove()
    })

    // 初始化
    onTypeChange(entityMeta, $type,
        $input, fieldMeta && fieldMeta.inputType,
        $persist, fieldMeta && fieldMeta.persistType)

    initDialog($overlay, dialogOpenOrigin)
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
