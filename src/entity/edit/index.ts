// cSpell:words jqxhr
import $ = require("jquery")

import { alertAjaxError, api } from "../../api"
import { buildRootForm, collectFormInput } from "../../form/index"
import { getMeta } from "../../globals"
import { closeById, openOrAddPage } from "../../page"
import { toastError, toastSuccess } from "../../toast/index"
import { digestId, loadDigestedEntities } from "../index"

export function toUpdateEntity(entityName: string, id?: string) {
    const pageId = !id
        ? `create-entity-${entityName}-` + Date.now()
        : `update-entity-${entityName}-${id}`
    const isCreate = !id
    const meta = getMeta()
    const entityMeta = meta.entities[entityName]
    const title = isCreate
        ? "创建 " + entityMeta.label
        : `编辑 ${entityMeta.label} ${digestId(id)}`

    openOrAddPage(pageId, title, "toUpdateEntity", [entityName, id], ctx => {
        const $view = $(ST.EditEntity()).appendTo(ctx.$pageParent)
        const $saveBtn = $view.mustFindOne(".save:first")
        $saveBtn.html("加载原数据...")

        let readyToEdit = false
        let form: EntityForm, entityValue: EntityValue

        function render() {
            if (form) form.$form.remove()
            form = buildRootForm(entityName, entityValue)
            $view.append(form.$form)
            loadDigestedEntities(form.$form)
        }
        if (isCreate) {
            $saveBtn.html("保存")
            readyToEdit = true
            entityValue = {}
            render()
        } else {
            readyToEdit = false
            const q = api.get(`entity/${entityName}/${id}`)
            q.catch(jqxhr => {
                closeById(pageId) // 加载失败移除页面
                alertAjaxError(jqxhr)
            })
            q.then(value => {
                $saveBtn.html("保存")
                readyToEdit = true
                entityValue = value
                render()
            })
        }

        let saving = false
        $saveBtn.click(function() {
            if (!readyToEdit || saving) return

            const entity: any = {}
            try {
                collectFormInput(form, entity, isCreate)
            } catch (e) {
                toastError(e)
                return
            }

            saving = true
            $saveBtn.html("保存中...")

            const q = id
                ? api.put(`entity/${entityName}/${id}`, entity)
                : api.post(`entity/${entityName}`, entity)
            q.then(() => {
                $saveBtn.html("保存")
                saving = false
                toastSuccess("保存成功")
                if (isCreate) closeById(pageId)
                $(".refresh-page.refresh-" + entityName).click()
            })
            q.catch(xhr => {
                saving = false
                $saveBtn.html("保存")
                alertAjaxError(xhr)
            })
        })
    })

    // TODO win.on "AfterClosed", - > F.Form.disposeForm(form) if form
}

// 编辑并返回给调用者
export function openEditEntityDialog(entityName: string,
    entityValue: EntityValue, callback: (ev: EntityValue) => void) {
//     $view = $(FT.EditEntity())
//     form = F.Form.buildRootForm(entityName, entityValue)
//     $view.append(form.$form)
//     F.loadDigestedEntities(form.$form)

//     entityMeta = F.meta.entities[entityName]

//     win = openModalDialog({content: $view, title: "编辑 #{entityMeta.label}"})
//     win.on "AfterClosed", - > F.Form.disposeForm(form)

//     $view.find(".save:first").click - >
//         entity = {}
//         try
//             F.Form.collectFormInput(form, entity) catch e
//             F.toastError(e)
//             return

//         callback(entity)
//         win.close()
}
