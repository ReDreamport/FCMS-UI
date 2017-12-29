import { getMeta } from "../../globals"
import { Page } from "../../page"
import { EntityLister } from "./entity-lister"

import $ = require("jquery")
import { alertAjaxIfError, api } from "../../api"
import { toastSuccess, toastWarning } from "../../toast/index"

export class ListEntity extends Page {
    private $page: JQuery
    private entityLister: EntityLister

    pBuild() {
        const entityName = this.routeCtx.params.entityName
        const entityMeta = getMeta().entities[entityName]

        this.$page = $(ST.ListEntityPage({entityName, label: entityMeta.label}))
            .appendTo(this.$pageParent)

        this.setTitle(entityMeta.label)

        this.entityLister = new EntityLister(entityName, false)
        this.$page.append(this.entityLister.$root)

        this.$page.mustFindOne(".remove-entities").click(() => {
            const ids = this.entityLister.getSelectedIds()
            if (!ids.length) {
                toastWarning("请先选择要删除的行")
                return
            }
            if (!confirm(`确定要删除 ${ids.length} 个 ${entityMeta.label} 吗？`)) {
                return
            }

            const q = api.remove(`entity/${entityName}?_ids=${ids.join(",")}`)
            alertAjaxIfError(q).then(() => {
                toastSuccess("删除成功")
                this.entityLister.refreshList()
            })
        })
    }
}
