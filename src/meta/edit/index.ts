import { getMeta } from "../../globals"
import { Page } from "../../page"

import $ = require("jquery")

export class EditMeta extends Page {
    private entityName: string
    private entityMeta: EntityMeta

    private $page: JQuery

    pBuild() {
        this.entityName = this.routeCtx.params.entityName
        this.entityMeta = getMeta().entities[this.entityName]

        this.setTitle(this.entityName)

        this.$page = $(ST.EditMetaPage({entityMeta: this.entityMeta}))
            .appendTo(this.$pageParent)

        this.$page.mustFindOne(".add-mongo-index").click(() => {
            $(ST.MongoIndexItem())
                .appendTo(this.$page.mustFindOne("tbody.mongo-indexes"))
        })

        this.$page.mustFindOne(".add-mysql-index").click(() => {
            $(ST.MySQLIndexItem())
                .appendTo(this.$page.mustFindOne("tbody.mysql-indexes"))
        })

        this.$page.mustFindOne(".add-field").click(() => {
            $(ST.FieldMetaRow())
            .appendTo(this.$page.mustFindOne("tbody.fields"))
        })

        this.$page.on("click", ".remove-row", e => {
            $(e.target).closest("tr").remove()
        })

        this.entityMeta.toString()
        this.$page.toString()
    }
}

export class CreateMeta extends Page {

}
