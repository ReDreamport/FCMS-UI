// cSpell:words jqxhr

import $ = require("jquery")
import _ = require("lodash")

import { alertAjaxError, alertAjaxIfError, api } from "../../api"
import { arrayToMapTrue,
    pxToNumber, removeFromArray } from "../../common"
import { ENTITY_LIST_TD_PADDING,
    loadDigestedEntities,
    tdStyleOfField } from "../../entity"
import { getMeta } from "../../globals"
import { closeById, openOrAddPage } from "../../page"
import { toastSuccess } from "../../toast"
import { EntityListFilter } from "./list-filter"

const SYSTEM_FIELDS = ["_createdOn", "_createdBy", "_modifiedOn", "_modifiedBy"]

// 封装实体列表功能
class EntityLister {
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

        const $tableScroll = $(ST.ListEntityTable({fieldNames: this.fieldNames,
            entityMeta})).appendTo($view)
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
            if (fm.notShow)
                return
            // if fm.notShow && not F.checkAclField(entityMeta.name, fn, 'show')
            // return
            fieldNames.push(fn)
        })

        // 其他系统字段放最后
        for (const systemField of SYSTEM_FIELDS) {
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
                tableWidth += (pxToNumber(tdStyle.width)
                    + ENTITY_LIST_TD_PADDING * 2)
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
        q.catch(jqxhr => {
            alertAjaxError(jqxhr)
            closeById(this.pageId) // 加载失败移除页面
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

    private build$tbody(fieldNames: string[], page: any[]) {
        return ST.ListEntityTbody({fieldNames, page,
            entityMeta: this.entityMeta})
    }
}

export function toListEntity(entityName: string) {
    const meta = getMeta()

    const pageId = `list-entity-${entityName}`
    const entityMeta = meta.entities[entityName]
    const title = `${entityMeta.label} 列表`

    openOrAddPage(pageId, title, "toListEntity", [entityName], ctx => {
        const $view = $(ST.ListEntity({entityName}))
            .appendTo(ctx.$pageParent)

        const entityLister = new EntityLister(entityMeta, $view, pageId)
        const {$table, $refreshPageBtn} = entityLister

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
