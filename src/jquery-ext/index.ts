
/* global $ */

import * as $ from "jquery"

export function extend() {
    // 在 jQuery 插件中，this 是 jQuery 对象，不是 DOM 对象
    $.fn.extend({
        intInput(alternative: number): number {
            if (this.length !== 1)
                throw new Error("NotSingleNode" + this.attr("class"))
            let v = this.val()
            v = parseInt(v, 10)
            return v === 0 ? 0 : (v || alternative)
        },
        floatInput(alternative: number): number {
            if (this.length !== 1)
                throw new Error("NotSingleNode" + this.attr("class"))
            let v = this.val()
            v = parseFloat(v)
            return v === 0 ? 0 : (v || alternative)
        },
        stringInput(): string {
            if (this.length !== 1)
                throw new Error("NotSingleNode"  + this.attr("class"))
            const v = this.val()
            return v
        },
        typedInput(): any {
            if (!this.length) return null
            if (this.is("input")) {
                const type = this.attr("type")
                if (type === "checkbox") {
                    return this.prop("checked")
                } else if (type === "number") {
                    return this.floatInput(0)
                } else {
                    return this.stringInput()
                }
            } else if (this.is("select")) {
                // const $selected = this.find("option:selected")
                // if ($selected.length) {
                //     return $selected.attr("value")
                // } else {
                //     return this.find("option:first").attr("value")
                // }
                return this.val()
            }
        },
        isChecked(): boolean {
            if (this.length !== 1)
                throw new Error("NotSingleNode"  + this.attr("class"))
            const v = this.prop("checked")
            return v
        },
        mustFind(selector: string) {
            const $r = this.find(selector)
            if (!$r.length) throw new Error("NotFound " + selector)
            return $r
        },
        mustFindOne(selector: string) {
            const $r = this.find(selector)
            if ($r.length !== 1) throw new Error("NotOne " + selector)
            return $r
        },
        mustAttr(name: string) {
            const v = this.attr(name)
            if (!v) throw new Error("No Attr " + name)
            return v
        },
        mustIntAttr(name: string) {
            const v = this.attr(name)
            if (!v) throw new Error("No Attr " + name)
            return parseInt(v, 10)
        },
        iterate(func: ($i: JQuery, index: number) => boolean | void) {
            this.each((index: number, element: HTMLElement) => {
                return func($(element), index)
            })
        },
        widthOr0(): number {
            return this.width() || 0
        },
        heightOr0(): number {
            return this.height() || 0
        }
    })
}
