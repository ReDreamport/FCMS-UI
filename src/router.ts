// cSpell:words hashbang
/* global */

import $ = require("jquery")
import page = require("page")
import { EditEntity } from "./entity/edit"
import { ListEntity } from "./entity/list"
import { CreateMeta, EditMeta } from "./meta/edit"
import { ListMeta } from "./meta/list"
import { NotFoundPage, Page } from "./Page"

const PageClasses: {[pattern: string]: typeof Page} = {}
const opens: { [s: string]: Page } = {}
const openOrders: string[] = []

export function initRouter() {
    PageClasses["/meta"] = ListMeta
    PageClasses["/meta/entity/:entityName"] = EditMeta
    PageClasses["/meta/entity-add"] = CreateMeta

    PageClasses["/list/:entityName"] = ListEntity
    PageClasses["/edit/:entityName/:id"] = EditEntity

    PageClasses["*"] = NotFoundPage

    page("/", () => {console.log("Home Page")})

    const paths = Object.keys(PageClasses)
    for (const path of paths) {
        configRoute(path, PageClasses[path])
    }

    page.start({hashbang: true})
}

function configRoute(path: string, PageClass: typeof Page) {
    const $pages = $(".pages")

    page(path, function(context) {
        console.log("page path: " + path)
        if (path === "*") {
            if (context.path.indexOf("//") === 0) {
                const toPath = context.path.substring(1) // 保留最前面的一个斜线
                page.redirect(toPath)
                return
            } else if (context.path[0] !== "/") {
                const toPath = "/" + context.path // 必须最前面有一个斜线
                page.redirect(toPath)
                return
            }
        }

        const key = removeLeadingSlash(context.path)

        if (opens[key]) {
            const p = opens[key]
            doShowPage(p)

            const idx = openOrders.indexOf(key)
            if (idx >= 0) openOrders.splice(idx, 1)
            openOrders.push(key)
        } else {
            const $pageParent = $("<div>", { class: "page-parent" })
                .appendTo($pages)
            const $pageSwitch = $(ST.PageSwitch({key}))
                .appendTo($(".pages-switches")).addClass("current")

            const p = new PageClass(key, $pageParent, $pageSwitch, context)
            opens[key] = p

            p.pLoadData().then(() => {
                const qBuild = p.pBuild()
                if (qBuild && qBuild.then) {
                    qBuild.then(() => { doShowPage(p) })
                } else {
                    doShowPage(p)
                }
            })

            openOrders.push(key)

            adjustPageSwitchWidth()
        }

        persistOpensAndOrders()
    })
}

function removeLeadingSlash(path: string) {
    while (path[0] === "/") {
        path =  path.substring(1)
    }
    return path
}

function doShowPage(p: Page) {
    const lastKey = $(".pages-switches .page-switch.current").attr("key")
    if (lastKey) {
        doHidePage(opens[lastKey])
    }

    p.afterShow()
    p.$pageParent.show()
    p.$pageSwitch.addClass("current")
}

function doHidePage(p: Page) {
    p.beforeHide()
    p.$pageParent.hide()
    p.$pageSwitch.removeClass("current")
}

export function closeByKey(key: string) {
    key = removeLeadingSlash(key)

    const p = opens[key]
    if (!p) return

    p.close()

    delete opens[key]

    const idx = openOrders.indexOf(key)
    if (idx >= 0) openOrders.splice(idx, 1)
    if (openOrders.length) {
        page("/" + openOrders[openOrders.length - 1])
    } else {
        page("/")
    }
    persistOpensAndOrders()

    adjustPageSwitchWidth()
}

function adjustPageSwitchWidth() {
    const $parent = $(".pages-switches")
    const width = $parent.widthOr0()
    const $switchList = $parent.find(".page-switch")
    if (!$switchList.length) return
    const newItemOuterWidth = width / $switchList.length
    const $firstItem = $($switchList[0])
    const oldItemOuterWidth = $firstItem.outerWidth(true) || 0
    // 差值都被 title 吸收
    let newTitleWidth = $firstItem.find(".title").widthOr0()
        + newItemOuterWidth - oldItemOuterWidth
    if (newTitleWidth > 120) newTitleWidth = 120
    $parent.find(".title").width(newTitleWidth)
}

function persistOpensAndOrders() {
    const openLinks: string[] = []
    $(".pages-switches .page-switch").iterate($a => {
        openLinks.push($a.mustAttr("href"))
    })

    localStorage.setItem("openLinks", JSON.stringify(openLinks))
    localStorage.setItem("openOrders", JSON.stringify(openOrders))
}
