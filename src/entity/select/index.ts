// cSpell:words sortablejs

import $ = require("jquery")
import Sortable = require("sortablejs")

import { getMeta } from "../../globals"
import { EntityLister } from "../list/entity-lister"

import { pLoadEntityByIds } from "../../api"
import { initDialog } from "../../dialog"
import { digestEntity } from "../digest"

interface IdToEntityInfo {
    [id: string]: {entity: EntityValue; digest: DigestInfo}
}

export function selectEntity(fieldMeta: FieldMeta, ids: string[],
    multiple: boolean,
    callback: (newIds: string[], idToEntityInfo: IdToEntityInfo) => void) {

    let ready = false

    const entityName = fieldMeta.refEntity
    const entityMeta = getMeta().entities[entityName]

    const idToEntityInfo: IdToEntityInfo = {}

    const jadeCtx = {entityName, label: entityMeta.label, multiple}
    const $overlay = $(ST.SelectEntityDialog(jadeCtx)).appendTo($("body"))
    initDialog($overlay, null)

    const $selectedList = $overlay.mustFindOne(".selected-list")

    pLoadEntityByIds(entityName, ids).then(r => {
        // 构造摘要信息
        for (const entity of r.page) {
            const digest = digestEntity(entityMeta, entity)
            idToEntityInfo[entity._id] = {entity, digest}
        }
        // 显示之前选中的
        for (const id of ids) {
            const ei = idToEntityInfo[id]
            if (ei) {
                $selectedList.append(ST.MultipleInputItem({fv: ei.digest,
                    fm: fieldMeta}))
            }
        }

        Sortable.create($selectedList[0], {handle: ".move-handle",
            animation: 600})

        ready = true
    })

    const entityLister = new EntityLister(entityName, true, onSelect)
    $overlay.mustFindOne(".list-parent").append(entityLister.$root)

    function onSelect(entity: EntityValue) {
        if (!multiple) $selectedList.empty()

        const digest = digestEntity(entityMeta, entity)
        idToEntityInfo[entity._id] = {entity, digest}
        $selectedList.append(ST.MultipleInputItem({fv: digest, fm: fieldMeta}))
    }

    // 删除已选项
    $selectedList.on("click", ".remove-m-input-item", function() {
        $(this).mustClosest(".multiple-input-item").remove()
    })

    $overlay.mustFindOne(".finish").click(function() {
        if (!ready) return

        const newIds: string[] = []
        $selectedList.find(".multiple-input-item").iterate(function($i) {
            const id = $i.mustFindOne(".entity-digest:first").mustAttr("id")
            newIds.push(id)
        })

        $overlay.remove()

        callback(newIds, idToEntityInfo)
    })
}
