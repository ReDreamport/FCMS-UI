// cSpell:words jqxhr
import $ = require("jquery")

import { alertAjaxError, alertAjaxIfError, api } from "../../api"
import { getMeta } from "../../globals"
import { closeById, openOrAddPage } from "../../page"
import { toastSuccess } from "../../toast/index"
import { digestId, loadDigestedEntities } from "../index"

export function toViewEntity(entityName: string, id: string) {
    const pageId = `view-entity-${entityName}-${id}`
    const entityMeta = getMeta().entities[entityName]
    const title = `${entityMeta.label} - ${digestId(id)}`

    openOrAddPage(pageId, title, "toViewEntity", [entityName, id], ctx => {
        const $view = $(ST.ViewEntity({entityName, _id: id}))
            .appendTo(ctx.$pageParent)

        const allFields = entityMeta.fields
        const fields: {[fn: string]: FieldMeta} = {}
        const fieldNames = Object.keys(allFields)
        for (const fn of fieldNames) {
            const fm = allFields[fn]
            if (fm.type === "Password") continue
            // if（fm.notShow && !checkAclField(entityMeta.name, fn, 'show'))
            if (fm.notShow) continue
            fields[fn] = fm
        }

        let entityValue: EntityValue
        const q = api.get(`entity/${entityName}/${id}`)
        q.catch(jqxhr => {
            closeById(pageId) // 加载失败移除页面
             alertAjaxError(jqxhr)
        })
        q.then(value => {
            entityValue = value
            $view.append(ST.ViewEntityFields({entityValue, fields}))
            loadDigestedEntities($view)
        })

        $view.mustFindOne(".remove-entity").click(() => {
            const rq = api.remove(`entity/${entityName}?_ids=${id}`)
            alertAjaxIfError(rq).then(() => {
                toastSuccess("删除成功")
                closeById(pageId)
            })
        })

        $view.find(".to-update-entity").click(() => closeById(pageId))
    })
}
