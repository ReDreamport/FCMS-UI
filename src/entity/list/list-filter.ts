// cSpell:words nempty jqxhr

import { alertAjaxIfError, api } from "../../api"
import { dateStringToInt } from "../../common"
import { digestEntityById, isFieldOfInputTypeOption, isFieldOfTypeDateOrTime,
    isFieldOfTypeNumber } from "../../entity/index"
import { getMeta } from "../../globals"
import { toastSuccess, toastWarning } from "../../toast"
import { toSelectEntity } from "../select"

const OPERATOR_LABELS = {
    "==": "等于", "!=": "不等于",
    ">": "大于", ">=": "大于等于", "<": "小于", "<=": "小于等于",
    "in": "等于以下值", "nin": "不等于以下值",
    "start": "开头", "end": "结尾", "contain": "包含",
    "empty": "空", "nempty": "非空"
}

class EntityFilterItem {
    private $filter: JQuery
    private $fieldName: JQuery
    private $operator: JQuery
    private $filterInput: JQuery

    private lastFieldName: string
    private lastOperator: string

    constructor(private entityMeta: EntityMeta, $filters: JQuery,
        field?: string, operator?: string) {

        this.$filter = $(ST.FilterItem({fields: this.entityMeta.fields}))
            .appendTo($filters)
        this.$fieldName = this.$filter.mustFindOne(".field-name:first")
        this.$operator = this.$filter.mustFindOne(".operator:first")
        this.$filterInput = this.$filter.find(".filter-input:first")

        if (field) this.$fieldName.val(field)
        if (operator) this.$operator.val(operator)

        this.$filter.mustFindOne(".remove-item:first").click(() => {
            this.$filter.remove()
        })

        this.$fieldName.change(() => this.fieldChanged())
        this.$operator.change(() => this.operatorChanged())

        this.fieldChanged()
    }

    private fieldChanged() {
        const fieldName = this.$fieldName.val() as string
        if (!fieldName) return

        const fieldMeta = this.entityMeta.fields[fieldName]
        let operators: string[] = []
        if (fieldMeta.type === "Boolean") {
            operators = fieldMeta.multiple ? [] : ["==", "!="]
        } else if (isFieldOfTypeDateOrTime(fieldMeta)
            || isFieldOfTypeNumber(fieldMeta)) {
            operators = ["==", "!=", ">", ">=", "<", "<=", "in", "nin",
                "empty", "nempty"]
        } else if (fieldMeta.type === "Reference") {
            operators = ["==", "!=", "in", "nin", "empty", "nempty"]
        } else if (fieldMeta.type === "String") {
            operators = ["==", "!=", "in", "nin",
                "start", "end", "contain", "empty", "nempty"]
        } else if (fieldMeta.type === "ObjectId") {
            operators = ["==", "!=", "in", "nin", "empty", "nempty"]
        }

        const operator = this.$operator.val() as string
        this.$operator.html(ST.FilterOperatorOption({OPERATOR_LABELS,
            operators}))
        if (operator) this.$operator.val(operator)

        this.operatorChanged()
    }

    private operatorChanged() {
        const meta = getMeta()

        const fieldName = this.$fieldName.val() as string
        const operator = this.$operator.val() as string
        if (!(fieldName && operator)) return
        if (this.lastFieldName === fieldName && this.lastOperator === operator)
            return

        this.lastFieldName = fieldName
        this.lastOperator = operator

        const fieldMeta = this.entityMeta.fields[fieldName]
        const multiple = operator === "in" || operator === "nin"

        if (operator === "empty" || operator === "nempty") {
            this.$filterInput.empty()
        } else if (operator === "start" || operator === "end"
            || operator === "contain") {
            this.$filterInput.html(ST.FilterInput({input: "String",
                multiple: false}))
        } else if (isFieldOfInputTypeOption(fieldMeta)) {
            this.$filterInput.html(ST.FilterInput({input: "Select", multiple,
                options: fieldMeta.options})) // TODO 不使用 options 时
        } else if (fieldMeta.type === "Boolean") {
            this.$filterInput.html(ST.FilterInput({input: "Boolean",
                multiple: false}))
        } else if (isFieldOfTypeDateOrTime(fieldMeta)
            || isFieldOfTypeNumber(fieldMeta)) {
            this.$filterInput.html(ST.FilterInput({input: fieldMeta.type,
                multiple}))
        } else if (fieldMeta.type === "Reference") {
            this.$filterInput.html(ST.FilterInput({input: "Reference", multiple,
                refEntity: fieldMeta.refEntity
            }))
        } else if (fieldMeta.type === "String"
            || fieldMeta.type === "ObjectId") {
            this.$filterInput.html(ST.FilterInput({input: "String", multiple}))
        }

        // 添加项
        this.$filterInput.mustFindOne(".add-input-item:first")
            .click(e => {
            $(e.target).closest(".add-input-item")
                .next(".filter-input-item.hidden").clone()
                .appendTo(this.$filterInput).removeClass("hidden")
        })

        // 删除项
        this.$filterInput.on("click", ".remove-input-item", e => {
            const op = this.$operator.val() as string
            const $ii = $(e).closest(".filter-input-item")
            if ($ii.mustAttr("input") === "Reference"
                && (op !== "in" && op !== "nin")) {
                $ii.mustFindOne(".ref-holder").remove()
                $ii.attr("_id", "")
            } else {
                $ii.remove()
            }
        })

        // 修改关联实体
        this.$filterInput.mustFindOne(".edit-refs:first").click(() => {
            const multipleOptions = {multiple, multipleUnique: true}
            const selectedEntityIds: string[] = []
            this.$filterInput.find(".filter-input-item:visible").iterate($i =>
                selectedEntityIds.push($i.mustAttr("_id")))
            const refEntityMeta = meta.entities[fieldMeta.refEntity]
            const $filterInput = this.$filterInput

            toSelectEntity(fieldMeta.refEntity, multipleOptions,
                selectedEntityIds, idOrIds => {
                if (multiple) {
                    for (const id of idOrIds) {
                        const $ii = $filterInput
                            .mustFindOne(".filter-input-item.hidden")
                            .clone()
                            .appendTo($filterInput)
                            .removeClass("hidden")
                            .attr("_id", id)
                        const $holder = $ii.mustFindOne(".ref-holder:first")
                            .empty()
                        $holder.attr("_id", id)
                        digestEntityById(refEntityMeta, id, $holder)
                    }
                } else {
                    const id = idOrIds as string
                    const $ii = $filterInput
                        .mustFindOne(".filter-input-item:first")
                        .attr("_id", id)
                    const $holder = $ii.mustFindOne(".ref-holder:first")
                        .empty()
                    $holder.attr("_id", id)
                    digestEntityById(refEntityMeta, id, $holder)
                }
            })
        })
    }
}


export class EntityListFilter {
    private $filters: JQuery
    private $filtersAction: JQuery

    private filtersList: any[]

    constructor($action: JQuery, private entityMeta: EntityMeta) {
        this.$filtersAction = $action.mustFindOne(".filters-action")
        this.$filters = $action.mustFindOne(".filters:first")

        $action.mustFindOne(".more-search:first").click(() => {
            this.$filters.toggle()
        })

        $action.mustFindOne(".add-filter:first").click(() => {
            this.addFilter()
        })

        $action.mustFindOne(".clear-filters:first").click(() => {
            $action.find(".filter-item").remove()
        })

        $action.mustFindOne(".save-filters:first").click(() => {
            const criteriaObj = this.getListCriteria(true)
            const criteria = JSON.stringify(criteriaObj)
            const sortBy = $action.mustFindOne(".sort-field:first").val()
            const sortOrder = $action.mustFindOne(".sort-order:first").val()

            const name = $action.mustFindOne(".filters-name:first")
                .stringInput()
            if (!name) {
                toastWarning("请输入一个查询名称")
                return
            }

            const req = {name, entityName: entityMeta.name, criteria,
                sortBy, sortOrder}
            const q = api.put("entity/filters", req)
            alertAjaxIfError(q).then(() => {
                this.refreshFiltersList()
                toastSuccess("保存成功")
            })
        })

        $action.mustFindOne(".remove-filters").click(() => {
            const name = $action.mustFindOne(".filters-name:first")
                .stringInput()
            if (!name) {
                toastWarning("请输入一个查询名称")
                return
            }

            const query = {entityName: entityMeta.name, name}
            const q = api.remove("entity/filters", query)
            alertAjaxIfError(q).then(function() {
                this.refreshFiltersList()
                toastSuccess("删除成功")
            })
        })

        this.$filtersAction.on("click", ".pre-filters", () => {
            if (!this.filtersList) return
            const id = $(this).mustAttr("_id")
            for (const f of this.filtersList) {
                if (f._id === id) {
                    $action.mustFindOne(".filters-name:first").val(f.name)
                    $action.mustFindOne(".sort-field:first").val(f.sortBy)
                    $action.mustFindOne(".sort-order:first").val(f.sortOrder)

                    this.$filters.find(".filter-item").remove()
                    const criteria = JSON.parse(f.criteria)
                    const criteriaList = criteria.items || []
                    for (const c of criteriaList)
                        this.addFilter(c.field, c.operator)
                    break
                }
            }
        })

        // ----- main
        this.refreshFiltersList()
    }

    // 获取搜索条件
    getListCriteria(keepEmptyFilter?: boolean) {
        const criteria: any[] = []
        this.$filters.find(".filter-item").iterate($item => {
            const field = $item.mustFindOne(".field-name:first").val()
            let operator = $item.mustFindOne(".operator:first").val()
            if (!(field && operator)) return
            const values: any[] = []
            $item.find(".filter-input .filter-input-item:visible")
            .iterate($ii => {
                const inputType = $ii.mustAttr("input")
                let value
                if (inputType === "Reference") {
                    value = $ii.mustFindOne(".ref-holder:first").mustAttr("_id")
                } else if (inputType === "Boolean") {
                    const b = $ii.mustFindOne(".input:checked").val()
                    if (b === "false") {
                        // 把等于否改成不等于是
                        operator = operator === "==" ? "!=" : "=="
                        value = true
                    } else {
                        value = b
                    }
                } else if (inputType === "DateTime") {
                    // TODO 检查是否正确
                    const v1 = $ii.mustFindOne(".input-date").stringInput()
                    const v2 = $ii.mustFindOne(".input-time").stringInput()
                    value = dateStringToInt(v1 + " " + v2, "YYYY-MM-DD HH:mm")
                } else if (inputType === "Date") {
                    // TODO 检查是否正确
                    const v = $ii.find(".input").stringInput()
                    value = dateStringToInt(v, "YYYY-MM-DD")
                } else if (inputType === "Date") {
                    const v = $ii.find(".input").stringInput()
                    value = dateStringToInt(v, "HH:mm")
                } else {
                    value = $ii.find(".input").val()
                }
                if (value) values.push(value)
            })

            if (values.length || keepEmptyFilter) {
                if (operator === "in" || operator === "nin")
                    criteria.push({field, operator, value: values})
                else
                    criteria.push({field, operator, value: values[0]})
            }
        })
        console.log(criteria)
        if (criteria.length)
            return {relation: "and", items: criteria}
        else
            return {}
    }

    private addFilter(field?: string, operator?: string) {
        new EntityFilterItem(this.entityMeta, this.$filters, field, operator)
    }

    private refreshFiltersList() {
        const query = {pageSize: -1,
            _criteria: JSON.stringify({entityName: this.entityMeta.name})}
        const listFiltersQ = api.get("entity/F_ListFilters", query)
        alertAjaxIfError(listFiltersQ).then(fl => {
            this.filtersList = fl.page
            this.$filtersAction.find(".pre-filters").remove()

            for (const f of this.filtersList) {
                $("<a>", {href: "javascript:"})
                    .addClass("pre-filters plain-btn")
                    .html(f.name).attr("_id", f._id)
                    .appendTo(this.$filtersAction)
            }
        })
    }
}
