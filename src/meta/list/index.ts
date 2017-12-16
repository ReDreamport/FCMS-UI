import { getMeta } from "../../globals"
import { Page } from "../../page"

import $ = require("jquery")

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
            const groupName = entityMeta.displayGroup || "MAIN"
            const list = (entityNamesByGroup[groupName] =
                entityNamesByGroup[groupName] || [])
            list.push(entityName)
        }

        const $page = $(ST.ListMetaPage({entityNamesByGroup, entityMetaMap}))
            .appendTo(this.$pageParent)
        $page.find("")

    }

}
