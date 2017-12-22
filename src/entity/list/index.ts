import { Page } from "../../page"
import { EntityLister } from "./entity-lister"

import $ = require("jquery")
import { getMeta } from "../../globals"

export class ListEntity extends Page {
    private $page: JQuery
    private entityLister: EntityLister

    pBuild() {
        const entityName = this.routeCtx.params.entityName
        const entityMeta = getMeta().entities[entityName]

        this.$page = $(ST.ListEntityPage({entityName, label: entityMeta.label}))
            .appendTo(this.$pageParent)

        this.setTitle(entityMeta.label)

        this.entityLister = new EntityLister(entityName)
        this.$page.append(this.entityLister.$root)
        this.$page.find("")
    }
}
