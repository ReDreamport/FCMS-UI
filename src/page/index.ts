
interface PageContext {
    $pageParent: JQuery
}

export function openOrAddPage(pageId: string, title: string, action: string,
    actionArgs: any[], buildFunc: (ctx: PageContext) => void) {
    //
}

export function closeById(pageId: string) {
    //
}
