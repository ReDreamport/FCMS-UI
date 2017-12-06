import $ = require("jquery")

export function toastNormal(message: string, duration = 2000) {
    toast(message, "toast-normal", duration)
}

export function toastSuccess(message: string, duration = 2000)  {
    toast(message, "toast-success", duration)
}

export function toastWarning(message: string, duration = 4000)  {
    toast(message, "toast-warning", duration)
}

export function toastError(message: string, duration = 4000)  {
    toast(message, "toast-error", duration)
}

function toast(message: string, extraClass: string, duration = 2000) {
    const $t = $("<div>", {class: "toast " + extraClass, html: message})
        .appendTo($(".toast-box"))
        .hide().slideDown(200)

    setTimeout(() => {
        $t.slideUp(200, () => $t.remove())
    }, duration)
}
