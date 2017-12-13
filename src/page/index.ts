import $ = require("jquery")
interface PageContext {
    pageId: string
    title: string
    $pageParent: JQuery
    $pageSwitch: JQuery
    onClose?: () => void
    onShow?: () => void
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
        page.onShow && page.onShow()
    } else {
        const $pageParent = $("<div>", {class: "page-parent"})
            .appendTo($(".main-body .pages"))
        const $pageSwitch = $(ST.PageSwitch({title, pageId}))
            .appendTo($(".pages-switches")).addClass("current")

        const ctx = { pageId, title, $pageParent, $pageSwitch }
        buildFunc(ctx)
        pages[pageId] = ctx

        adjustPageSwitchWidth()
    }
}

export function openPageById(pageId: string) {
    const page = pages[pageId]
    if (!page) return

    $(".main-body .pages .page-parent").hide()
    $(".pages-switches .page-switch").removeClass("current")

    page.$pageParent.show()
    page.$pageSwitch.addClass("current")
}

export function closeById(pageId: string) {
    const page = pages[pageId]
    if (!page) return

    delete pages[pageId]

    page.onClose && page.onClose()

    page.$pageParent.remove()

    let $last = page.$pageSwitch.prev()
    if (!$last.length) $last = page.$pageSwitch.next()
    if ($last.length) openPageById($last.mustAttr("pageId"))

    page.$pageSwitch.remove()
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
    if (newTitleWidth > 80) newTitleWidth = 80
    $parent.find(".title").width(newTitleWidth)
}
