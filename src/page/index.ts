
export class Page {
    constructor(public key: string,
        public $pageParent: JQuery, public $pageSwitch: JQuery,
        protected routeCtx: PageJS.Context) {
    }

    pLoadData(): Promise<any | void> {
        // console.log("Load data for " + this.routeCtx.path)
        this.$pageParent.find("")
        return Promise.resolve()
    }

    pBuild(): void | Promise<any> {
        this.$pageParent.find("")
        // console.log("Build " + this.routeCtx.path)
    }

    afterShow() {
        this.$pageParent.find("")
        // console.log("After showing " + this.routeCtx.path)
    }

    beforeHide() {
        this.$pageParent.find("")
        // console.log("Before hiding " + this.routeCtx.path)
    }

    close() {
        // console.log("Close " + this.routeCtx.path)
        this.$pageParent.remove()
        this.$pageSwitch.remove()
    }

    setTitle(title: string) {
        this.$pageSwitch.attr("title", title)
        this.$pageSwitch.mustFindOne(".title").text(title)
    }
}

export class NotFoundPage extends Page {
    pBuild() {
        console.log("Not found: " + this.routeCtx.path)
        this.$pageParent
            .append("<div class='page page-not-found'>内容不存在</div>")
    }
}
