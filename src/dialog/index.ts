export function initDialog($overlay: JQuery,
    dialogOpenOrigin: {left: number; top: number} | null) {

    if (!dialogOpenOrigin) {
        dialogOpenOrigin = {
            left: window.innerWidth / 2, top: window.innerHeight / 2
        }
    }

    // console.log(dialogOpenOrigin)

    $overlay.css({
        left: `${dialogOpenOrigin.left}px`,
        right: `${window.innerWidth - dialogOpenOrigin.left}px`,
        top: `${dialogOpenOrigin.top}px`,
        bottom: `${window.innerHeight - dialogOpenOrigin.top}px`,
        opacity: 0
    })

    $overlay.animate({
        left: "0", top: "0", bottom: "0", right: "0",
        opacity: 1
    }, 150, "swing")

    $overlay.mustFindOne(".dialog-expand").click(function() {
        const $dialog = $overlay.mustFindOne(".dialog")
        $dialog.toggleClass("expand")
    })

    $overlay.mustFindOne(".dialog-close-btn").click(function() {
        $overlay.remove()
    })
}

