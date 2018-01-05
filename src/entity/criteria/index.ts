import $ = require("jquery")
import _ = require("lodash")

import { collectSimpleInput } from "../../common"

interface CriteriaItem {
    field: string
    operator: string
    value?: any
}

const FieldTypeToOperatorList: any = {
    ObjectId: ["==", "!=", "in", "nin"],
    String: ["==", "!=", "in", "nin", "start", "end", "contain"],
    Password: [],
    Boolean: ["==", "!="],
    Int: ["==", "!=", ">", ">=", "<", "<=", "in", "nin"],
    Float: ["==", "!=", ">", ">=", "<", "<=", "in", "nin"],
    Date: ["==", "!=", ">", ">=", "<", "<=", "in", "nin"],
    Time: ["==", "!=", ">", ">=", "<", "<=", "in", "nin"],
    DateTime: ["==", "!=", ">", ">=", "<", "<=", "in", "nin"],
    Reference: ["==", "!=", "in", "nin"]
}

const OperatorLabels: any = {
    "==": "等于",
    "!=": "不等于",
    ">": "大于",
    ">=": "大于等于",
    "<": "小于",
    "<=": "小于等于",
    "in": "包括以下值",
    "nin": "排除以下值",
    "start": "开头",
    "end": "结尾",
    "contain": "包含"
}

export class EntityCriteria {
    $root: JQuery
    private $details: JQuery
    private $add: JQuery

    private fieldNames: string[]

    constructor($cp: JQuery, private entityMeta: EntityMeta) {
        this.$root = $(ST.EntityCriteria()).appendTo($cp)
        this.$details = this.$root.mustFindOne(".details")
        this.$add = this.$root.mustFindOne(".add-item")

        this.fieldNames = Object.keys(entityMeta.fields)

        this.$add.click(() => { this.addItem() })

        this.$root.on("change", ".field-name", e => {
            const $item = $(e.target).mustClosest(".entity-criteria-item")
            this.onFieldChange($item)
        })

        this.$root.on("change", ".operator", e => {
            const $item = $(e.target).mustClosest(".operator")
            this.onChangeOperator($item)
        })

        // 删除条件行
        this.$root.on("click", ".remove-item", e => {
            $(e.target).mustClosest(".entity-criteria-item").remove()
        })
    }

    show() {
        this.$details.removeClass("hidden")
    }

    hide() {
        this.$details.addClass("hidden")
    }

    private addItem(item?: CriteriaItem) {
        const jadeCtx = {
            fieldNames: this.fieldNames,
            entityMeta: this.entityMeta, item
        }
        const $item = $(ST.EntityCriteriaItem(jadeCtx)).insertBefore(this.$add)

        this.onFieldChange($item)
    }

    private onFieldChange($item: JQuery) {
        const fieldName = $item.mustFindOne(".field-name").val() as string
        const $operator = $item.mustFindOne(".operator")
        const operator = $operator.val()
        $operator.empty()
        if (!fieldName) return
        const fieldMeta = this.entityMeta.fields[fieldName]
        const operators: string[] = FieldTypeToOperatorList[fieldMeta.type]
        for (const o of operators) {
            $("<option>", { value: o, text: OperatorLabels[o] })
                .appendTo($operator).prop("selected", operator)
        }

        this.onChangeOperator($operator)
    }

    private onChangeOperator($operator: JQuery) {
        const operator = $operator.val() as string

        const $item = $operator.mustClosest(".entity-criteria-item")
        const $valueParent = $item.mustFindOne(".criteria-value-col").empty()
        if (!operator) return

        const fieldName = $item.mustFindOne(".field-name").val() as string
        const fieldMeta = this.entityMeta.fields[fieldName]
        const multiple = isMultipleOperator(operator)

        const jadeCtx = { fm: fieldMeta, fv: null, multiple }
        $valueParent.append(ST.CriteriaValue(jadeCtx))
    }

    getInput() {
        const items: CriteriaItem[] = []
        this.$root.find(".entity-criteria-item").iterate($i => {
            const field = $i.mustFindOne(".field-name").val() as string
            const operator = $i.mustFindOne(".operator").val() as string
            if (!(field && operator)) return
            const fieldMeta = this.entityMeta.fields[field]
            const type = fieldMeta.type
            const inputType = fieldMeta.inputType

            const multiple = isMultipleOperator(operator)

            // 先当多值处理
            const list: any[] = []

            if (inputType === "CheckList" || inputType === "Select") {
                const $cv = $i.mustFindOne(".criteria-value")
                if (multiple) {
                    // 一律当 string 处理，由服务器转格式
                    $cv.find("input:checked").iterate($fi => {
                        list.push($fi.val())
                    })
                } else {
                    list.push($cv.find("select").typedInput())
                }
            } else if (type === "Check") {
                $i.find(".criteria-value-item-input").iterate($fi => {
                    const v = $fi.mustFindOne("input").prop("checked")
                    list.push(v)
                })
            } else if (type === "Reference") {
                $i.find(".criteria-value-item-input").iterate($fi => {
                    const v = $fi.find(".ref-item").attr("id")
                    if (v) list.push(v)
                })
            } else {
                // 其他一律当 string 处理，由服务器转格式
                $i.find(".criteria-value-item-input").iterate($fi => {
                    const v = collectSimpleInput($fi)
                    if (!_.isNil(v)) list.push(v)
                })
            }

            const value = multiple ? list : list.length ? list[0] : null
            if (value !== null) {
                const item: CriteriaItem = {field, operator, value}
                items.push(item)
            }
        })
        return items
    }
}

function isMultipleOperator(operator: string) {
    return operator === "in" || operator === "nin"
}
