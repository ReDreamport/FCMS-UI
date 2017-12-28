// cSpell:words CKEDITOR

import $ = require("jquery")

export function initDialog($overlay: JQuery,
    dialogOpenOrigin: {left: number; top: number} | null) {

    if (!dialogOpenOrigin) {
        dialogOpenOrigin = {
            left: window.innerWidth / 2, top: window.innerHeight / 2
        }
    }

    // console.log(dialogOpenOrigin)

    // $overlay.css({
    //     left: `${dialogOpenOrigin.left}px`,
    //     right: `${window.innerWidth - dialogOpenOrigin.left}px`,
    //     top: `${dialogOpenOrigin.top}px`,
    //     bottom: `${window.innerHeight - dialogOpenOrigin.top}px`,
    //     opacity: 0
    // })

    $overlay.fadeIn(200)

    $overlay.mustFindOne(".dialog-expand").click(function() {
        const $dialog = $overlay.mustFindOne(".dialog")
        $dialog.toggleClass("expand")
    })

    $overlay.mustFindOne(".dialog-close-btn").click(function() {
        $overlay.remove()
    })
}

export function showRichEditorDialog(text: string,
    callback: (newText: string) => void) {

    const $overlay = $(ST.RichTextEditorDialog({text})).appendTo($("body"))

    const editor = CKEDITOR.replace($overlay.mustFindOne("textarea")[0],
        {height: "375px"})

    initDialog($overlay, null)

    $overlay.mustFindOne(".dialog-footer .finish").click(function() {
        const input = editor.getData()
        editor.destroy()
        $overlay.remove()
        callback(input)
    })
}

