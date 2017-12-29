import { getMeta } from "../../globals"
import { Page } from "../../page"

import $ = require("jquery")
import { alertAjaxIfError, api } from "../../api"
import { toastSuccess } from "../../toast"

export class ListMeta extends Page {
    pBuild() {
        this.setTitle("META")

        const meta = getMeta()
        const entityMetaMap = meta.entities
        const entityNames = Object.keys(entityMetaMap)
        entityNames.sort()
        const entityNamesByGroup: {[group: string]: string[]} = {}
        for (const entityName of entityNames) {
            const entityMeta = entityMetaMap[entityName]
            if (entityMeta.system) continue
            const groupName = entityMeta.displayGroup || "其他"
            const list = (entityNamesByGroup[groupName] =
                entityNamesByGroup[groupName] || [])
            list.push(entityName)
        }

        const $page = $(ST.ListMetaPage({entityNamesByGroup, entityMetaMap}))
            .appendTo(this.$pageParent)

        $page.on("click", ".remove-entity", function() {
            const entityName = $(this).mustAttr("entityName")
            if (!confirm(`确定要删除 ${entityName} 吗？`)) return
            const q = api.remove("meta/entity/" + entityName)
            alertAjaxIfError(q).then(function() {
                toastSuccess("删除成功")
                setTimeout(() => location.reload(), 1000)
            })
        })
    }

}
