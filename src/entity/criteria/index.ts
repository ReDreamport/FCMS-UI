// cSpell:words cvii

import $ = require("jquery")
import _ = require("lodash")

import { collectSimpleInput } from "../../common"
import { loadReferences } from "../digest/index"
import { selectEntity } from "../select/index"

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
    private $overview: JQuery

    private fieldNames: string[]

    constructor($cp: JQuery, private entityMeta: EntityMeta,
        private onCriteriaChange: () => void,
        initCriteriaItems?: CriteriaItem[]) {

        this.$root = $(ST.EntityCriteria()).appendTo($cp)
        this.$details = this.$root.mustFindOne(".details")
        this.$add = this.$root.mustFindOne(".add-item")
        this.$overview = this.$root.mustFindOne(".overview")

        this.fieldNames = Object.keys(entityMeta.fields)

        this.$add.click(() => this.addItem())

        this.$details.on("change", ".field-name", e => {
            const $ci = $(e.target).mustClosest(".entity-criteria-item")
            this.onFieldChange($ci)
        })

        this.$details.on("change", ".operator", e => {
            const $ci = $(e.target).mustClosest(".operator")
            this.onOperatorChange($ci)
        })

        // 删除条件行
        this.$details.on("click", ".remove-item", e => {
            $(e.target).mustClosest(".entity-criteria-item").remove()
            this.onCriteriaChange()
        })

        // 编辑引用
        this.$details.on("click", ".edit-ref", e => {
            const $ci = $(e.target).mustClosest(".entity-criteria-item")
            this.editReference($ci)
        })

        // 添加一项
        this.$details.on("click", ".add-value-item", e => {
            const $add = $(e.target).mustClosest(".add-value-item")
            const $ci = $add.mustClosest(".entity-criteria-item")
            const fieldName = $ci.mustFindOne(".field-name").val() as string
            const fm = this.entityMeta.fields[fieldName]
            $add.before(ST.RemovableCriteriaValueItemInput({fm, fv: null}))
        })

        // 删除一项输入
        this.$details.on("click", ".remove-cvii", e => {
            $(e.target).mustClosest(".removable-criteria-value-item-input")
                .remove()
        })

        if (initCriteriaItems && initCriteriaItems.length) {
            for (const item of initCriteriaItems) {
                this.addItem(item)
            }
            this.updateOverview(initCriteriaItems.length)

            loadReferences(this.$details)

            this.show()
        }
    }

    show() {
        this.$details.removeClass("hidden")
        this.$overview.addClass("hidden")
    }

    hide() {
        this.$details.addClass("hidden")
        this.updateOverview(this.$details.find("table tr").length)
        this.$overview.removeClass("hidden")
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
            } else if (type === "Boolean") {
                $i.find(".criteria-value-item-input").iterate($fi => {
                    const v = $fi.mustFindOne("input:checked").val() === "true"
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

            if (multiple) {
                if (list.length) {
                    const item: CriteriaItem = {field, operator, value: list}
                    items.push(item)
                }
            } else {
                const value = list.length ? list[0] : null
                if (value !== null) {
                    const item: CriteriaItem = {field, operator, value}
                    items.push(item)
                }
            }
        })
        return items
    }

    private editReference($ci: JQuery) {
        const ids: string[] = []
        const $iiList = $ci.find(".removable-criteria-value-item-input")
        $iiList.iterate($i => {
            const id = $i.mustFindOne(".entity-digest:first").mustAttr("id")
            ids.push(id)
        })

        const fieldName = $ci.mustFindOne(".field-name").val() as string
        const fieldMeta = this.entityMeta.fields[fieldName]

        const $operator = $ci.mustFindOne(".operator")
        const operator = $operator.val() as string
        const multiple = isMultipleOperator(operator)

        const $cv = $ci.mustFindOne(".criteria-value")

        selectEntity(fieldMeta, ids, multiple, (newIds, idToInfo) => {
            $iiList.remove()
            for (const id of newIds) {
                const info = idToInfo[id]
                if (!info) continue
                $cv.append(ST.RemovableCriteriaValueItemInput({fv: info.digest,
                    fm: fieldMeta}))
            }
        })
    }

    private updateOverview(itemCount: number) {
        if (itemCount) {
            this.$overview.html(`当前有 ${itemCount} 项筛选条件`)
        } else {
            this.$overview.html("")
        }
    }

    private addItem(ci?: CriteriaItem) {
        const jadeCtx = {
            fieldNames: this.fieldNames,
            entityMeta: this.entityMeta, ci
        }
        const $ci = $(ST.EntityCriteriaItem(jadeCtx)).insertBefore(this.$add)

        this.onFieldChange($ci)
        if (ci) {
            const $operator = $ci.mustFindOne(".operator")
            $operator.val(ci.operator)
            this.showValue($ci, ci.operator, ci.value)
        }
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
                .appendTo($operator).prop("selected", operator === o)
        }

        this.onOperatorChange($operator)
    }

    private onOperatorChange($operator: JQuery) {
        const operator = $operator.val() as string

        const $item = $operator.mustClosest(".entity-criteria-item")
        if (!operator) return
        this.showValue($item, operator)
    }

    private showValue($item: JQuery, operator: string, value?: any) {
        const fieldName = $item.mustFindOne(".field-name").val() as string
        const fieldMeta = this.entityMeta.fields[fieldName]
        const multiple = isMultipleOperator(operator)

        const $valueParent = $item.mustFindOne(".criteria-value-col").empty()

        const jadeCtx = { fm: fieldMeta, fv: value, multiple }
        $valueParent.append(ST.CriteriaValue(jadeCtx))
    }
}

function isMultipleOperator(operator: string) {
    return operator === "in" || operator === "nin"
}
