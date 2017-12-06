// cSpell:words

import $ = require("jquery")

import { api } from "./api"
import { formatDate, isSortableField, uniqueId } from "./common"
import { digestEntity, digestId, ensureValueIsArray, hasEntityPermission,
    isSystemFieldName, optionsArrayToMap, tdStyleOfField } from "./entity"
import { toListEntity } from "./entity/list"
import { getMeta, setMeta, setUser } from "./globals"
import { extend } from "./jquery-ext"
import { pInitMenu } from "./menu"

extend()

$(() => {
    pPing()
    .then(pFetchMeta)
    .then(pInitMenu)
    .then(function() {
        initJadeContext()
        initEvents()
        reopenPages()
    }).catch(function(e) {
        console.error(e)
    })
})

function pPing() {
    const q = api.get("ping")
    return q.then(function(user: User) {
        setUser(user)
    })
}

function pFetchMeta() {
    const q = api.get("meta")
    return q.then(function(meta: any) {
        setMeta(meta)
    })
}

function initJadeContext() {
    (window as any).JC = {
        hasEntityPermission,
        tdStyleOfField,
        isSystemFieldName,
        optionsArrayToMap,
        ensureValueIsArray,
        formatDate,
        getMeta,
        digestEntity,
        digestId,
        isSortableField,
        uniqueId
    }
}

function initEvents() {
    $(".exit-system").on("click", function() {
        const callback = encodeURIComponent(location.href)
        location.href = `/sso/client/sign-out?callback=${callback}`
    })

    initEntityGlobalEvent()
}

function initEntityGlobalEvent() {
    const $doc = $(document)

    $doc.on("click", ".to-view-entity", e => {
        e.preventDefault()
        e.stopPropagation()

        // const $this = $(this)
        // const id = $this.mustAttr("_id")
        // if (!id)return
        // F.toViewEntity($this.attr('entityName'), _id)
    })

    $doc.on("click", ".to-update-entity", e => {
        e.preventDefault()
        e.stopPropagation()

        // const $this = $(this)
        // F.toUpdateEntity($this.attr("entityName"), $this.attr("_id"))
    })

    $doc.on("click", ".to-add-entity", e => {
        e.preventDefault()
        e.stopPropagation()

        // const $this = $(this)
        // F.toUpdateEntity($this.attr("entityName"))
    })

    $doc.on("click", ".to-list-entity", e => {
        e.preventDefault()
        e.stopPropagation()

        const $this = $(e.target).closest(".to-list-entity")
        toListEntity($this.mustAttr("entityName"))
    })
}

function reopenPages() {
    //
}

