// cSpell:words

import $ = require("jquery")
import _ = require("lodash")
import page = require("page")

import { api } from "./api"
import { fileObjectToInfo, fileObjectToLink, formatDate, isSortableField,
    makeSureArray, showFileSize, SYSTEM_FIELDS, uniqueId } from "./common"
import { showDatePicker } from "./date-picker"
import { showRichEditorDialog } from "./dialog"
import { digestId, displayField, getColumnStyle } from "./entity"
import { decideListFields } from "./entity/component"
import { getMeta, setMeta, setUser } from "./globals"
import { extend } from "./jquery-ext"
import { pInitMenu } from "./menu"
import { decideEntitiesFinalOptions } from "./meta"
import { closeByKey, initRouter } from "./router"

extend()

$(() => {
    pPing()
    .then(pFetchMeta)
    .then(pInitMenu)
    .then(function() {
        initJadeContext()
        initEvents()
        initRouterThenRestore()
    }).catch(function(e) {
        console.error(e)
    })
})

function pPing() {
    const q = api.get("ping")
    return q.then(function(user: User) {
        setUser(user)
        $(".site-username").html(user.nickname
            || user.phone || user.email || user.username)
    })
}

function pFetchMeta() {
    const q = api.get("meta")
    return q.then(function(meta: any) {
        const entities = _.values(meta.entities)
        decideEntitiesFinalOptions(entities)
        setMeta(meta)
    })
}

function initJadeContext() {
    (window as any).JC = {
        formatDate,
        getMeta,
        isSortableField,
        uniqueId,
        getColumnStyle,
        fileObjectToLink,
        fileObjectToInfo,
        digestId,
        makeSureArray,
        showFileSize,
        decideListFields,
        displayField,
        putByKey,
        SYSTEM_FIELDS
    }
}

let anyKey = 0
const anyStore: {[key: string]: any} = {}

function putByKey(value: any) {
    const key = (++anyKey).toString()
    anyStore[key] = value
    return key
}

export function getByKey(key: string) {
    return anyStore[key]
}

export function deleteByKey(key: string) {
    delete anyStore[key]
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

    $("body").on("click", "tbody tr", function() {
        const $this = $(this)
        $this.closest("table").find("tr").removeClass("current")
        $this.addClass("current")
    })

    $("body").on("click", ".open-calendar", function() {
        const $dp = $(this).closest(".date-picker")
        const $input = $dp.mustFindOne("input")
        const initValue = $input.stringInput()
        showDatePicker($dp.mustAttr("type"), initValue, {}, (d, ds) => {
            $input.val(ds)
        })
    })

    $(".exit-site").click(function() {
        if (!confirm("确定要退出系统吗？")) return
        const here = encodeURIComponent(location.href)
        location.href = `/api/sso/client/sign-out?callback=${here}`
    })

    $("body").on("click", ".rich-text-preview .edit-rich-text", function() {
        const $rtp = $(this).closest(".rich-text-preview")
        const $pa = $rtp.mustFindOne(".preview-area")
        const html = $pa.html()
        showRichEditorDialog(html, newText => { $pa.html(newText) })
    })
}

function initRouterThenRestore() {
    const plStr = localStorage.getItem("openLinks")
    const openLinks: string[] = plStr && JSON.parse(plStr) || []

    const ooStr = localStorage.getItem("openOrders")
    const openOrders = ooStr && JSON.parse(ooStr) || []

    if (location.hash !== "") {
        console.log("location hash: " + location.hash)
        location.href = "/"
        return
    }
    initRouter()

    for (let link of openLinks) {
        if (link.indexOf("#!")) link = link.substring(2)
        page(link)
    }

    for (const open of openOrders) page(open)
}

