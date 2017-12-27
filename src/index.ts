// cSpell:words

import $ = require("jquery")

import { api } from "./api"
import { fileObjectToLink, formatDate, isSortableField,
    makeSureArray, uniqueId } from "./common"
import { showDatePicker } from "./date-picker"
import { showRichEditorDialog } from "./dialog/index"
import { digestId, getColumnStyle } from "./entity"
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
        $(".site-username").html(user.nickname
            || user.phone || user.email || user.username)
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
        formatDate,
        getMeta,
        isSortableField,
        uniqueId,
        getColumnStyle,
        fileObjectToLink,
        digestId,
        makeSureArray
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

function reopenPages() {
    //
}

