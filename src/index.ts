// cSpell:words

import $ = require("jquery")

import { api } from "./api"
import { formatDate, isSortableField, uniqueId } from "./common"
import { digestEntity, digestId, ensureValueIsArray, hasEntityPermission,
    isSystemFieldName, optionsArrayToMap, tdStyleOfField } from "./entity"
import { getMeta, setMeta, setUser } from "./globals"
import { extend } from "./jquery-ext"
import { pInitMenu } from "./menu"
import { closeByKey, initRouter } from "./router"

extend()

$(() => {
    pPing()
    .then(pFetchMeta)
    .then(pInitMenu)
    .then(function() {
        initJadeContext()
        initEvents()
        initRouter()
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

    $(".main-header .pages-switches").on("click", ".close-page", function(e) {
        e.stopPropagation()
        e.preventDefault()
        const key = $(this).closest(".page-switch").mustAttr("key")
        closeByKey(key)
    })
}

function reopenPages() {
    //
}

