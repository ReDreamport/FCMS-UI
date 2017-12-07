import $ = require("jquery")

interface PageContext {
    pageId: string
    title: string
    $pageParent: JQuery
    $pageSwitch: JQuery
}

const pages: {[k: string]: PageContext} = {}

export function openOrAddPage(pageId: string, title: string, action: string,
    actionArgs: any[], buildFunc: (ctx: PageContext) => void) {

    $(".main-body .pages .page-parent").hide()
    $(".pages-switches .page-switch").removeClass("current")

    const page = pages[pageId]

    if (page) {
        page.$pageParent.show()
        page.$pageSwitch.addClass("current")
    } else {
        const $pageParent = $("<div>", {class: "page-parent"})
            .appendTo($(".main-body .pages"))
        const $pageSwitch = $(ST.PageSwitch({title, pageId}))
            .appendTo($(".pages-switches")).addClass("current")

        const ctx = {
            pageId,
            title,
            $pageParent,
            $pageSwitch
        }
        buildFunc(ctx)
        pages[pageId] = ctx
    }
}

export function openPageById(pageId: string) {
    $(".main-body .pages .page-parent").hide()
    $(".pages-switches .page-switch").removeClass("current")

    const page = pages[pageId]
    if (!page) return

    page.$pageParent.show()
    page.$pageSwitch.addClass("current")
}

export function closeById(pageId: string) {
    //
}
