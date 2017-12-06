// cSpell:words nempty jqxhr

import $ = require("jquery")
import _ = require("lodash")

import { alertAjaxError, alertAjaxIfError, api } from "../api"
import { arrayToMapTrue, dateStringToInt, entityListToMap,
    pxToNumber, removeFromArray } from "../common"
import { getMeta } from "../globals"
import { openOrAddPage } from "../page"
import { toastSuccess, toastWarning } from "../toast"

export function toListEntity(entityName: string) {
    const meta = getMeta()

    const pageId = `list-entity-${entityName}`
    const entityMeta = meta.entities[entityName]
    const title = `${entityMeta.label} 列表`

    openOrAddPage(pageId, title, "toListEntity", [entityName], ctx => {
        const $view = $(ST.ListEntity({entityName})).appendTo(ctx.$pageParent)

        function build$table(fieldNames: string[]) {
            return $(ST.ListEntityTable({fieldNames, entityMeta}))
        }

        function build$tbody(fieldNames: string[], page: any[]) {
            return ST.ListEntityTbody({fieldNames, page, entityMeta})
        }

        const entityLister = new EntityLister(entityMeta, $view, build$table,
            build$tbody, pageId)
        const {$action, $table, $refreshPageBtn} = entityLister

        $view.mustFindOne(".remove-entities:first").click(function() {
            const ids: string[] = []
            $table.find(".select:checked").iterate($s => {
                const $tr = $s.closest("tr")
                ids.push($tr.mustAttr("_id"))
            })
            if (!ids.length) return
            if (!confirm(`确认要删除${ids.length}个${entityMeta.label}？`)) return

            const q = api.remove(`entity/${entityName}`, {_ids: ids.join(",")})
            alertAjaxIfError(q).then(function() {
                toastSuccess("删除成功")
                $refreshPageBtn.click()
            })
        })

        // TODO date picker enableDatePicker($view.find(".date-picker"), {})

    })
}

const systemFields = ["_createdOn", "_createdBy", "_modifiedOn", "_modifiedBy"]

const operatorLabels = {
    "==": "等于", "!=": "不等于",
    ">": "大于", ">=": "大于等于", "<": "小于", "<=": "小于等于",
    "in": "等于以下值", "nin": "不等于以下值",
    "start": "开头", "end": "结尾", "contain": "包含",
    "empty": "空", "nempty": "非空"
}

class EntityLister {
    private entityName: string

    private fieldNames: string[]
    private columnsDisplay: {[column: string]: boolean}

    $action: JQuery
    private $pageNo: JQuery
    private $pageSize: JQuery
    $refreshPageBtn: JQuery
    private $columnsDisplay: JQuery

    $table: JQuery

    private listFilter: EntityListFilter

    constructor(private entityMeta: EntityMeta,
        private $view: JQuery,
        build$table: (fieldNames: string[]) => JQuery,
        private build$tbody: (fieldNames: string[], page: any[]) => string,
        private pageId: string,
        private onPageRefresh?: () => void) {

        const entityName = entityMeta.name
        this.listFieldNames()

        this.$action = $(ST.EntityListPaging({entityName: entityMeta.name,
            entityMeta})).appendTo($view)
        this.$pageNo = this.$action.mustFindOne(".page-no")
        this.$pageSize = this.$action.mustFindOne(".page-size")
        this.$refreshPageBtn = this.$action.mustFindOne(".refresh-page")
        this.$columnsDisplay = this.$action
            .mustFindOne(".columns-display:first")

        const $tableScroll = build$table(this.fieldNames).appendTo($view)
        this.$table = $tableScroll.mustFindOne("table:first")

        this.displayColumns()

        this.$action.mustFindOne(".prev-page").click(() => {
            let pageNo = this.$pageNo.intInput(10)
            const pageSize = this.$pageSize.intInput(10)
            pageNo--
            if (pageNo < 1) pageNo = 1
            this.$pageNo.val(pageNo)
            this.loadEntityList(pageNo, pageSize)
        })

        this.$action.mustFindOne(".next-page").click(() => {
            let pageNo = this.$pageNo.intInput(10)
            const pageSize = this.$pageSize.intInput(10)
            pageNo++
            this.$pageNo.val(pageNo)
            this.loadEntityList(pageNo, pageSize)
        })

        this.$refreshPageBtn.click(() => {
            let pageNo = this.$pageNo.intInput(10)
            const pageSize = this.$pageSize.intInput(10)
            if (pageNo < 1) pageNo = 1
            this.$pageNo.val(pageNo)
            this.loadEntityList(pageNo, pageSize)
        })

        this.$action.mustFindOne(".columns").click(() => {
            if (this.$columnsDisplay.is(":visible")) {
                this.$columnsDisplay.hide()
            } else {
                this.$columnsDisplay.show()
                this.$columnsDisplay.mustFindOne(".column-names")
                    .html(ST.CheckColumns({fieldNames: this.fieldNames,
                        columnsDisplay: this.columnsDisplay,
                        fields: this.entityMeta.fields}))
            }
        })

        // 重新确定显示和隐藏哪些列
        this.$action.find(".confirm-columns-display").click(() => {
            this.columnsDisplay = {}
            this.$columnsDisplay.find("input:checked").iterate($i => {
                this.columnsDisplay[$i.val() as string] = true
            })
            this.$columnsDisplay.hide()
            this.displayColumns()
        })

        this.$table.mustFindOne(".toggle-check-all:first").click(() => {
            const checked = $(this).prop("checked")
            this.$table.find(".select").prop("checked", checked)
        })

        this.$table.on("click", ".remove-entity", e => {
            const id = $(e).closest(".remove-entity").attr("_id")
            const q = api.remove(`entity/${entityName}?_ids=${id}`)
            alertAjaxIfError(q).then(() => {
                toastSuccess("删除成功")
                this.$refreshPageBtn.click()
            })
        })

        this.listFilter = new EntityListFilter(this.$action, entityMeta)

        // ===== main
        this.$refreshPageBtn.click()
    }

    private listFieldNames() {
        const fields = this.entityMeta.fields
        const fieldNames: string[] = []
        Object.keys(fields).forEach(fn => {
            const fm = fields[fn]
            if (fn === "_id" || fn === "_version") return
            if (fm.type === "Password" || fm.hideInListPage) return
            // if fm.notShow && not F.checkAclField(entityMeta.name, fn, 'show')
            // return
            fieldNames.push(fn)
        })

        // 其他系统字段放最后
        for (const systemField of systemFields) {
            removeFromArray(fieldNames, systemField)
            fieldNames.push(systemField)
        }

        this.fieldNames = fieldNames
    }

    private displayColumns() {
        this.columnsDisplay = arrayToMapTrue(this.fieldNames)
        const fields = this.entityMeta.fields
        let tableWidth = 100 + 40 + 40
        for (const fieldName of this.fieldNames) {
            if (this.columnsDisplay[fieldName]) {
                this.$table.find(".col-" + fieldName).show()
                const tdStyle = tdStyleOfField(fields[fieldName])
                tableWidth += pxToNumber(tdStyle.width)
            } else {
                this.$table.find(".col-" + fieldName).hide()
            }
        }
        this.$table.width(tableWidth + "px")
    }

    private loadEntityList(pageNo: number, pageSize: number) {
        const query: any = {_pageNo: pageNo, _pageSize: pageSize}

        const filter = this.$action.mustFindOne(".fast-search").stringInput()
        if (filter) {
            query._filter = filter
        } else {
            const criteria = this.listFilter.getListCriteria()
            if (_.size(criteria)) query._criteria = JSON.stringify(criteria)
        }

        query._sortBy = this.$action.mustFindOne(".sort-field:first").val()
        query._sortOrder = this.$action.mustFindOne(".sort-order:first").val()

        const q = api.get("entity/" + this.entityMeta.name, query)
        q.catch(function(jqxhr) {
            // TODO fix
            // F.removePage(pageId) // 加载失败移除页面
            alertAjaxError(jqxhr)
        })
        q.then(r => {
            // TODO $view => $actions
            this.$view.mustFindOne(".total").html(r.total)
            const pageNum = Math.ceil(r.total / pageSize)
            this.$view.mustFindOne(".page-num").html(pageNum.toString())

            if (r.total > 0 && pageNo > pageNum) {
                this.$pageNo.val(pageNum)
                this.loadEntityList(pageNum, pageSize)
                return
            }

            this.$table.find("tbody").remove()
            this.$table.append(this.build$tbody(this.fieldNames, r.page))
            loadDigestedEntities(this.$table)

            this.onPageRefresh && this.onPageRefresh()
        })
    }
}

class EntityListFilter {
    private $filters: JQuery
    private $filtersAction: JQuery

    private filtersList: any[]

    constructor(private $action: JQuery, private entityMeta: EntityMeta) {
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
                        this.addFilter(c.field, c.operator, c.value)
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

    private addFilter(field?: string, operator?: string, value?: any) {
        new EntityFilterItem(this.entityMeta, this.$filters, field, operator,
            value)
    }

    private refreshFiltersList() {
        const query = {pageSize: -1,
            _criteria: JSON.stringify({entityName: this.entityMeta.name})}
        const listFiltersQ = api.get("entity/F_ListFilters", query)
        alertAjaxIfError(listFiltersQ).then(fl => {
            this.filtersList = fl.page
            this.$filtersAction.find(".pre-filters").remove()
            for (const f of this.filtersList) {
                // FS.$LinkButton().addClass("pre-filters plain-btn")
                //     .html(f.name).attr('_id': f._id).appendTo($filtersAction)
            }
        })
    }
}

class EntityFilterItem {
    private $filter: JQuery
    private $fieldName: JQuery
    private $operator: JQuery
    private $filterInput: JQuery

    private lastFieldName: string
    private lastOperator: string

    constructor(private entityMeta: EntityMeta, $filters: JQuery,
        private field?: string, private operator?: string,
        private value?: any) {

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
        this.$operator.html(ST.FilterOperatorOption({operatorLabels,
            operators}))
        if (operator) this.$operator.val(operator)

        this.operatorChanged()
    }

    private operatorChanged() {
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
            const meta = getMeta()
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

function toSelectEntity(entityName: string,
    multipleOption: {multiple: boolean; multipleUnique: boolean},
    selectedEntityIds: string[],
    callback: (idOrIds: string[] | string) => void) {
    //
}

function tdStyleOfField(fm: FieldMeta) {
    switch (fm.type) {
    case "ObjectId":
    case "Reference":
    case "String":
    case "Password":
        return {"width": "140px", "text-align": "center"}
    case "Boolean":
        return {"width": "30px", "text-align": "center"}
    case "Int":
    case "Float":
        return {"width": "80px", "text-align": "right"}
    case "Date":
    case "Time":
    case "DateTime":
        return {"width": "160px", "text-align": "center"}
    case "Image":
    case "File":
        return {"width": "90px", "text-align": "center"}
    default:
        return {"width": "100px", "text-align": "center"}
    }
}

interface LoadRefEntityTask {
    _id: string
    $ref: JQuery
}

export function loadDigestedEntities($area: JQuery) {
    let allTasks: {[entityName: string]: LoadRefEntityTask[]} = {}

    $area.find(".loading-ref").iterate(function($this) {
        $this.removeClass("loading-ref")
        const entityName = $this.mustAttr("entityName")
        const id = $this.mustAttr("_id")

        const meta = getMeta()
        const digestFields = meta.entities[entityName].digestFields
        if (!(digestFields && digestFields.length > 0
            && digestFields !== "_id")) return

        allTasks[entityName] = allTasks[entityName] || []
        allTasks[entityName].push({_id: id, $ref: $this})
    })

    Object.keys(allTasks).forEach(function(entityName) {
        const tasks = allTasks[entityName]
        doLoadDigestedEntity(entityName, tasks)
    })

    allTasks = {}
}

function doLoadDigestedEntity(entityName: string, tasks: LoadRefEntityTask[]) {
    const ids = tasks.map(t => t._id)
    const criteria = {field: "_id", operator: "in", value: ids}

    const meta = getMeta()
    const entityMeta = meta.entities[entityName]
    const query = {_digest: true, _pageSize: -1,
        _criteria: JSON.stringify(criteria)}
    const q = api.get(`entity/${entityName}`, query)
    q.then(function(r) {
        const list = r.page
        const eMap = entityListToMap(list)
        for (const task of tasks) {
            const entity = eMap[task._id]
            if (entity) task.$ref.html(digestEntity(entityMeta, entity))
        }
    })
}

function digestEntity(entityMeta: EntityMeta, entityValue: EntityValue) {
    if (!entityValue) return ""
    if (entityMeta.digestFields) {
        const groups = entityMeta.digestFields.split(",")
        const digest: {field: string; value: any}[] = []
        for (const group of groups) {
            const fields = group.split("|")
            let df
            for (const field of fields) {
                const v = entityValue[field]
                if (v) {
                    df = {field, value: v}
                    break
                }
            }
            if (df) digest.push(df)
        }
        return ST.EntityDigest({entityMeta, digest})
    } else {
        return digestId(entityValue._id)
    }
}

function digestId(id?: string) {
    if (id)
        return id[0] + "..." + id.substring(id.length - 6)
    else
        return ""
}

function isFieldOfTypeDateOrTime(fieldMeta: FieldMeta) {
    const type = fieldMeta.type
    return type === "Date" || type === "Time" || type === "DateTime"
}

function isFieldOfTypeNumber(fieldMeta: FieldMeta) {
    return fieldMeta.type === "Int" || fieldMeta.type === "Float"
}

function isFieldOfInputTypeOption(fieldMeta: FieldMeta) {
    return fieldMeta.inputType === "Select"
        || fieldMeta.inputType === "CheckList"
}

function digestEntityById(entityMeta: EntityMeta, id: string, $parent: JQuery) {
    const q = api.get(`entity/${entityMeta.name}/${id}`)
    q.catch(x => $parent.html("?Fail " + x.status))
    q.then(entityValue => $parent.html(digestEntity(entityMeta, entityValue)))
}
