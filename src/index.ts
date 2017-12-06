// cSpell:words

import $ = require("jquery")

import { api } from "./api"
import { setMeta, setUser } from "./globals"
import { extend } from "./jquery-ext"
import { toListEntity } from "./list-entity"
import { pInitMenu } from "./menu"

extend()

$(() => {
    pPing()
    .then(pFetchMeta)
    .then(pInitMenu)
    .then(function() {
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

        const $this = $(this)
        toListEntity($this.mustAttr("entityName"))
    })
}

function reopenPages() {
    //
}

