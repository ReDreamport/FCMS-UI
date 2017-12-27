// cSpell:words sortablejs

import $ = require("jquery")
import _ = require("lodash")
import Sortable = require("sortablejs")

import { alertAjaxIfError, api } from "../../api"
import { cloneByJSON, collectInputByFieldName } from "../../common"
import { getMeta } from "../../globals"
import { Page } from "../../page"
import { closeByKey } from "../../router"
import { toastError, toastSuccess } from "../../toast"
import { editFieldMeta } from "./edit-field"

export class CreateEditMeta extends Page {
    protected entityName: string
    protected entityMeta: EntityMeta

    private $page: JQuery
    private $tbodyFields: JQuery

    pBuild() {
        this.$page = $(ST.EditMetaPage({entityMeta: this.entityMeta}))
            .appendTo(this.$pageParent)
        this.$tbodyFields = this.$page.mustFindOne("tbody.fields")

        this.$page.mustFindOne(".add-mongo-index").click(() => {
            this.addMongoIndex()
        })

        this.$page.mustFindOne(".add-mysql-index").click(() => {
            this.addMySQLIndex()
        })

        const $addField = this.$page.mustFindOne(".add-field")
        $addField.click(() => {
            this.addFieldRow()
            const xy = $addField.offset() || null
            editFieldMeta(this.entityMeta, null, xy, (n, o) => {
                this.finishEditFieldMeta(n, o)
            })
        })

        this.$page.on("click", ".remove-row", e => {
            $(e.target).closest("tr").remove()
        })

        this.$page.on("click", ".remove-field", e => {
            const $row = $(e.target).closest("tr")
            const fieldName = $row.attr("field-name")

            if (fieldName) {
                if (!confirm(`确定删除 ${fieldName} 吗？`)) return
                delete this.entityMeta.fields[fieldName]
                $row.remove()
            } else {
                $row.remove()
            }
        })

        this.$page.on("click", ".edit-field", e => {
            const $row = $(e.target).closest("tr")
            const xy = $row.offset() || null
            const fieldName = $row.attr("field-name") || ""
            editFieldMeta(this.entityMeta,
                this.entityMeta.fields[fieldName] || null, xy, (n, o) => {
                    this.finishEditFieldMeta(n, o)
                })
        })

        Sortable.create(this.$tbodyFields[0], {animation: 300})

        this.$page.mustFindOne(".save").click(() => {
            this.save()
        })

        // main
        this.showFieldsTable()
        this.showIndexesTable()
    }

    private showFieldsTable() {
        this.$tbodyFields.empty()
        if (!this.entityMeta.fields) return
        const fields = _.values(this.entityMeta.fields)
        for (const fm of fields) {
            this.addFieldRow(fm)
        }
    }

    private showIndexesTable() {
        if (this.entityMeta.mongoIndexes) {
            for (const ic of this.entityMeta.mongoIndexes) {
                this.addMongoIndex(ic)
            }
        }
        if (this.entityMeta.mysqlIndexes) {
            for (const ic of this.entityMeta.mysqlIndexes) {
                this.addMySQLIndex(ic)
            }
        }
    }

    private addMongoIndex(ic?: any) {
        $(ST.MongoIndexItem(ic))
                .appendTo(this.$page.mustFindOne("tbody.mongo-indexes"))
    }

    private addMySQLIndex(ic?: any) {
        $(ST.MySQLIndexItem(ic))
                .appendTo(this.$page.mustFindOne("tbody.mysql-indexes"))
    }

    private addFieldRow(fieldMeta?: FieldMeta) {
        $(ST.FieldMetaRow(fieldMeta || {})).appendTo(this.$tbodyFields)
    }

    private finishEditFieldMeta(newFM: FieldMeta, oldFM: FieldMeta | null) {
        const name = oldFM && oldFM.name || newFM.name
        this.entityMeta.fields[name] = newFM
        this.showFieldsTable()
    }

    private save() {
        let newEntityMeta: any
        try {
            newEntityMeta = this.getInput()
        } catch (e) {
            toastError(e.message)
            return
        }

        const q = api.put(`meta/entity/${newEntityMeta.name}`, newEntityMeta)
        alertAjaxIfError(q).then(() => {
            toastSuccess("保存成功!")
            closeByKey(this.routeCtx.path)
            $(".page.page-list-meta .refresh-list").click()
        })
    }

    private getInput() {
        const mongoIndexes: any[] = []
        this.$page.find(".mongo-indexes tr").iterate($tr => {
            const ic = collectInputByFieldName($tr, "td")
            mongoIndexes.push(ic)
            this.checkIndexConfig(ic)
        })

        const mysqlIndexes: any[] = []
        this.$page.find(".mysql-indexes tr").iterate($tr => {
            const ic = collectInputByFieldName($tr, "td")
            mysqlIndexes.push(ic)
            this.checkIndexConfig(ic)
        })

        const $mainForm = this.$page.mustFindOne(".entity-form.mc-form")
        const em = collectInputByFieldName($mainForm)

        if (!em.name) throw new Error("实体名必填")
        if (!em.label) throw new Error("显示名必填")
        em.tableName = em.tableName || em.name

        if (em.digestFields) {
            const digestFields = em.digestFields.split("|")
            const finalList = []
            for (let f of digestFields) {
                f = f.trim()
                if (!this.entityMeta.fields[f])
                    throw new Error("摘要字段错误，无字段：" + f)
                finalList.push(f)
            }
            em.digestFields = finalList
        }

        const newEntityMeta = cloneByJSON(this.entityMeta)
        Object.assign(newEntityMeta, em)

        newEntityMeta.mongoIndexes = mongoIndexes
        newEntityMeta.mysqlIndexes = mysqlIndexes

        // fields 按顺序取一遍
        const fields = newEntityMeta.fields
        newEntityMeta.fields = {}
        this.$tbodyFields.find("tr").iterate($tr => {
            const fieldName = $tr.mustAttr("field-name")
            newEntityMeta.fields[fieldName] = fields[fieldName]
        })

        console.log(newEntityMeta)
        return newEntityMeta
    }

    private checkIndexConfig(ic: any) {
        if (!ic.name) throw new Error("索引名不能为空")
        if (!(ic.name.match(/^[_a-zA-Z0-9]+$/)))
            throw new Error("索引名包含非法字符")
        if (!ic.fields) throw new Error("索引字段列表不能为空")
        ic.fields = parseIndexFields(ic.fields, this.entityMeta)
        if (!ic.fields.length) throw new Error("索引字段列表不能为空")
    }
}

export class EditMeta extends CreateEditMeta {
    pBuild() {
        this.entityName = this.routeCtx.params.entityName
        this.entityMeta = getMeta().entities[this.entityName]

        this.setTitle(this.entityName)

        return super.pBuild()
    }
}
export class CreateMeta extends CreateEditMeta {
    pLoadData() {
        const q = api.get("meta-empty")
        return alertAjaxIfError(q).then(em => this.entityMeta = em)
    }
    pBuild() {
        this.entityName = ""

        this.setTitle("新建实体")

        return super.pBuild()
    }
}

function parseIndexFields(fieldsString: string, entityMeta: EntityMeta) {
    const tp = /([+\-]\w+)/g
    const fields: {order: string; field: string}[] = []
    let match = tp.exec(fieldsString)
    while (match) {
        const m = match[1]
        const order = m[0]
        const field = m.substring(1)
        if (!entityMeta.fields[field]) throw new Error("索引中的字段不存在：" + m)
        fields.push({order, field})
        match = tp.exec(fieldsString)
    }
    return fields
}
