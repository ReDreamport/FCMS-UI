import $ = require("jquery")
import { alertAjaxIfError, api } from "../../api"
import { onEnterKeyOrChange, pxToNumber } from "../../common"
import { getMeta } from "../../globals"

export class EntityLister {
    $root: JQuery

    private pageNum = 0

    private entityMeta: EntityMeta

    private listFieldNames: string[]

    private $listTable: JQuery

    private $pageNo: JQuery
    private $pageSize: JQuery
    private $pageNum: JQuery
    private $total: JQuery
    private $fastSearch: JQuery

    constructor(private entityName: string) {
        this.entityMeta = getMeta().entities[entityName]
        this.decideListFields()

        this.$root = $(ST.EntityLister({entityMeta: this.entityMeta,
            listFieldNames: this.listFieldNames}))

        this.$listTable = this.$root.mustFindOne(".list-parent table")
        this.setTableWidth()

        this.enableSearchAndPaging()
        this.refreshList()
    }

    private decideListFields() {
        // TODO showInList 创建、修改时间放后
        this.listFieldNames = []
        Object.keys(this.entityMeta.fields).forEach(fn => {
            const fieldMeta = this.entityMeta.fields[fn]
            if (fieldMeta.type === "Password") return // 密码一定不显示
            this.listFieldNames.push(fn)
        })
    }

    private setTableWidth() {
        let tableWidth = 2
        this.$root.find(".list-parent thead th").iterate($th => {
            const width = pxToNumber($th.css("width")) || 0
            tableWidth += width + 0 // 左右 border 余量
        })

        this.$listTable.width(tableWidth)
    }

    private enableSearchAndPaging() {
        const $paging = this.$root.mustFindOne(".paging-parent")

        this.$pageNo = $paging.mustFindOne("input.page-no")
        this.$pageSize = $paging.mustFindOne("input.page-size")
        this.$pageNum = $paging.mustFindOne(".page-num")
        this.$total = $paging.mustFindOne(".total")

        $paging.mustFindOne(".refresh-list").click(() => {
            this.refreshList()
        })

        $paging.mustFindOne(".prev-page").click(() => {
            const pageNo = this.$pageNo.intInput(1)
            if (pageNo <= 1) return
            this.$pageNo.val(pageNo - 1)
            this.refreshList()
        })

        $paging.mustFindOne(".next-page").click(() => {
            const pageNo = this.$pageNo.intInput(1)
            if (pageNo >= this.pageNum) return
            this.$pageNo.val(pageNo + 1)
            this.refreshList()
        })

        onEnterKeyOrChange(this.$pageNo, e => this.refreshList())
        onEnterKeyOrChange(this.$pageSize, e => this.refreshList())

        this.$fastSearch = this.$root.mustFindOne(".fast-search")
        onEnterKeyOrChange(this.$fastSearch, e => this.refreshList())
    }

    refreshList() {
        const pageNo = this.$pageNo.intInput(1)
        const pageSize = this.$pageSize.intInput(20)
        const fastSearch = this.$fastSearch.stringInput()

        const query: any = {_forConsole: "1",
            _pageNo: pageNo, _pageSize: pageSize}
        if (fastSearch) query._filter = fastSearch

        const q = api.get(`entity/${this.entityName}`, query)
        alertAjaxIfError(q).then(r => {
            this.$pageNo.val(r.pageNo)
            this.$pageSize.val(r.pageSize)
            this.pageNum = Math.ceil(r.total / r.pageSize)
            this.$pageNum.text(this.pageNum)
            this.$total.text(r.total)

            this.$listTable.find("tbody").remove()

            const jadeCtx = {
                entityName: this.entityName, entityMeta: this.entityMeta,
                listFieldNames: this.listFieldNames, page: r.page}
            this.$listTable.append(ST.EntityListTbody(jadeCtx))
        })
    }
}
