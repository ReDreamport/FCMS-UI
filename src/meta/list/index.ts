import { getMeta } from "../../globals"
import { Page } from "../../page"

import $ = require("jquery")
import { alertAjaxIfError, api } from "../../api"
import { isEnterKey } from "../../common"
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

        const $search = $page.mustFindOne(".search")
        $search.on("change,blur", search)
        $search.keydown(function(e) {
            if (isEnterKey(e)) search()
        })

        function search() {
            const keyword = $search.stringInput()
            const $entities = $page.find(".entity")
            if (!keyword) {
                $entities.show()
            } else {
                $entities.iterate($e => {
                    const label = $e.mustFindOne(".entity-label span").text()
                    const name = $e.mustFindOne(".entity-name").text()
                    if (label.indexOf(keyword) >= 0
                        || name.indexOf(keyword) >= 0) {
                        $e.show()
                    } else {
                        $e.hide()
                    }
                })
            }
        }
    }

}
