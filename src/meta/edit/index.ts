// cSpell:words sortablejs

import $ = require("jquery")
import _ = require("lodash")
import Sortable = require("sortablejs")

import { alertAjaxIfError, api } from "../../api"
import { cloneByJSON, collectInputByFieldName } from "../../common"
import { Page } from "../../page"
import { closeByKey } from "../../router"
import { toastError, toastSuccess } from "../../toast"
import { checkFieldInput, editFieldMeta, systemFieldsForCommon,
    systemFieldsForMongo, systemFieldsForMySQL } from "./edit-field"

interface IndexField {
    order: string
    field: string
}

const ValidDigestFieldTypes = ["String", "Boolean", "Int", "Float",
    "Date", "Time", "DateTime", "Reference"]

export class CreateEditMeta extends Page {
    protected entityName: string
    protected entityMeta: EntityMeta

    private $page: JQuery
    private $tbodyFields: JQuery
    private $metaType: JQuery
    private $selectDB: JQuery

    pBuild() {
        this.$page = $(ST.EditMetaPage({entityMeta: this.entityMeta}))
            .appendTo(this.$pageParent)
        this.$tbodyFields = this.$page.mustFindOne("tbody.fields")

        // 添加 MongoDB 索引
        this.$page.mustFindOne(".add-mongo-index").click(() => {
            this.addMongoIndex()
        })

        // 添加 MySQL 索引
        this.$page.mustFindOne(".add-mysql-index").click(() => {
            this.addMySQLIndex()
        })

        // 删除 MongoDB MySQL 索引
        this.$page.on("click", ".remove-row", e => {
            $(e.target).closest("tr").remove()
        })

        // 添加字段
        this.$page.mustFindOne(".add-field").click(() => {
            this.addFieldRow()
            editFieldMeta(this.entityMeta, null, null, (n, o) => {
                this.finishEditFieldMeta(n, o)
            })
        })

        // 删除字段
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

        // 编辑字段
        this.$page.on("click", ".edit-field", e => {
            const $row = $(e.target).closest("tr")
            const fieldName = $row.attr("field-name") || ""
            editFieldMeta(this.entityMeta,
                this.entityMeta.fields[fieldName] || null, null, (n, o) => {
                    this.finishEditFieldMeta(n, o)
                })
        })

        // 拷贝字段
        this.$page.on("click", ".copy-field", e => {
            const $row = $(e.target).closest("tr")
            const fieldName = $row.attr("field-name")
            if (!fieldName) return
            const tmpFieldName = this.generateNextFieldName(fieldName)
            const tmpFieldMeta = cloneByJSON(this.entityMeta.fields[fieldName])
            tmpFieldMeta.name = tmpFieldName
            this.entityMeta.fields[tmpFieldName] = tmpFieldMeta

            $(ST.FieldMetaRow(tmpFieldMeta)).insertAfter($row)

            editFieldMeta(this.entityMeta,
                this.entityMeta.fields[tmpFieldName] || null, null, (n, o) => {
                    this.finishEditFieldMeta(n, o)
                })
        })

        // 字段排序
        Sortable.create(this.$tbodyFields[0], {animation: 300})

        // 修改：实体还是组件
        this.$metaType = this.$page.mustFindOne(".meta-type")
        this.$metaType.change(() => {
            this.switchEntityOrComponent()
        })

        // 选择数据库类型
        this.$selectDB = this.$page.mustFindOne(".select-db")
        this.$selectDB.change(() => {
            this.onDBChanged()
        })

        // 保存
        this.$page.mustFindOne(".save").click(() => {
            this.save()
        })

        // main
        this.showFieldsTable()
        this.onDBChanged() // 必须先调用上面的方法
        this.showIndexesTable()

        this.switchEntityOrComponent()
    }

    private generateNextFieldName(fieldName: string) {
        let next = 1
        while (true) {
            const newName = fieldName + next
            if (this.entityMeta.fields[newName]) {
                next++
            } else {
                return newName
            }
        }
    }

    private switchEntityOrComponent() {
        const type = this.$metaType.val()
        const $forEntity = this.$page.find(".for-entity")
        if (type === "Entity") {
            $forEntity.show()
        } else {
            $forEntity.hide()
        }
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
            setTimeout(() => {location.reload()}, 1000)
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

        if (em.digestConfig) {
            em.fieldsForDigest = []
            const digestGroups = em.digestConfig.split("&")
            for (let digestGroup of digestGroups) {
                digestGroup = digestGroup.trim()
                const digestFields = digestGroup.split("|")
                for (let df of digestFields) {
                    df = df.trim()
                    const fieldMeta = this.entityMeta.fields[df]
                    if (!fieldMeta)
                        throw new Error("摘要字段错误，无字段：" + df)
                    if (!(ValidDigestFieldTypes.indexOf(fieldMeta.type) >= 0))
                        throw new Error("摘要字段类型错误：" + df)

                    em.fieldsForDigest.push(df)
                }
            }
        }
        if (em.iconField) {
            const fieldMeta = this.entityMeta.fields[em.iconField]
            if (!fieldMeta)
                throw new Error("图标字段不存在")
            if (fieldMeta.type !== "Image")
                throw new Error("图标字段不是图片")
        }

        const newEntityMeta = cloneByJSON(this.entityMeta)
        Object.assign(newEntityMeta, em)

        newEntityMeta.mongoIndexes = mongoIndexes
        newEntityMeta.mysqlIndexes = mysqlIndexes

        checkFieldsInput(newEntityMeta)

        this.readFieldsTable(newEntityMeta)

        return newEntityMeta
    }

    // fields 按顺序取一遍；取表格上的布尔值
    private readFieldsTable(entityMeta: EntityMeta) {
        const fields = entityMeta.fields
        entityMeta.fields = {}
        this.$tbodyFields.find("tr").iterate($tr => {
            const fieldName = $tr.mustAttr("field-name")
            const fm = fields[fieldName]
            entityMeta.fields[fieldName] = fm

            fm.fastSearch = $tr.mustFindOne(".fast-search").prop("checked")
            fm.showInListPage = $tr.mustFindOne(".show-list").prop("checked")
        })
    }

    private checkIndexConfig(ic: any) {
        if (!ic.name) throw new Error("索引名不能为空")
        if (!(ic.name.match(/^[_a-zA-Z0-9]+$/)))
            throw new Error("索引名包含非法字符")
        if (!ic.fields) throw new Error("索引字段列表不能为空")
        ic.fields = parseIndexFields(ic.fields, this.entityMeta)
        if (!ic.fields.length) throw new Error("索引字段列表不能为空")
    }

    private onDBChanged() {
        const type = this.$metaType.val() as string
        if (type !== "Entity") return

        const db = (this.$selectDB.val() as string) || "mongodb"
        this.entityMeta.db = db
        const fields = this.entityMeta.fields
        systemFieldsForCommon(fields)
        if (db === "mongodb") {
            systemFieldsForMongo(fields)
        } else if (db === "mysql") {
            systemFieldsForMySQL(fields)
        }
        this.readFieldsTable(this.entityMeta)
        this.showFieldsTable()
    }
}

export class EditMeta extends CreateEditMeta {
    pLoadData() {
        this.entityName = this.routeCtx.params.entityName
        const q = api.get(`meta/entity/${this.entityName}`)
        return alertAjaxIfError(q).then(em => this.entityMeta = em)
    }
    pBuild() {
        this.setTitle(this.entityName)
        return super.pBuild()
    }
}
export class CreateMeta extends CreateEditMeta {
    pLoadData() {
        const q = api.get("meta-empty?db=mongodb")
        return alertAjaxIfError(q).then(em => this.entityMeta = em)
    }
    pBuild() {
        this.entityName = ""

        this.setTitle("新建实体")

        return super.pBuild()
    }
}

// 字段列表格式：字段前缀+或-，如 +name+age+school
function parseIndexFields(fieldsString: string, entityMeta: EntityMeta) {
    const tp = /([+\-]\w+)/g
    const fields: IndexField[] = []
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

function checkFieldsInput(newEntityMeta: EntityMeta) {
    const fieldNames = Object.keys(newEntityMeta.fields)
    for (const fieldName of fieldNames) {
        const fieldMeta = newEntityMeta.fields[fieldName]
        try {
            checkFieldInput(fieldMeta, newEntityMeta)
        } catch (e) {
            throw new Error(`[${fieldName}] ${e.message}`)
        }
    }
}
