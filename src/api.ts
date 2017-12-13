// cSpell:words jqxhr fcms

/* global location FormData XMLHttpRequest */

import $ = require("jquery")

import { toastError, toastNormal, toastSuccess } from "./toast"

export function alertAjaxError(xhr: JQuery.jqXHR) {
    toastError(parseXhrErrorMessage(xhr))
    throw xhr
}

export function alertAjaxIfError(q: Promise<any>) {
    return q.catch(alertAjaxError)
}

export function parseXhrErrorMessage(xhr: JQuery.jqXHR): string {
    try {
        return xhr.responseText &&
            JSON.parse(xhr.responseText).message ||
            `${xhr.status}:${xhr.responseText}`
    } catch (e) {
        return `${xhr.status}:${xhr.responseText}`
    }
}

export function upload($file: JQuery, entityName: string, fieldName: string,
    callback: UploadCallback) {

    const fileDOM = $file[0]
    const files = (fileDOM as HTMLInputElement).files
    if (!(files && files.length)) return callback(null)

    function parseSuccessMessage(xhr: XMLHttpRequest): UploadResult {
        const response = xhr.responseText && JSON.parse(xhr.responseText)
        const path = response.fileRelativePath
        const size = response.fileSize
        return {path, size}
    }

    let fileCount = files.length
    const resultList: UploadResult[] = []

    function onOneFileDone(index: number, result: boolean,
                           data?: UploadResult) {
        fileCount--
        if (result && data) resultList[index] = data
        if (fileCount === 0) callback(resultList)
    }

    function uploadOne(index: number, file: File) {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", `file?entityName=${entityName}&fieldName=${fieldName}`)
        xhr.onload = () => {
            switch (xhr.status) {
            case 200:
                onOneFileDone(index, true, parseSuccessMessage(xhr))
                toastSuccess("上传成功！")
                break
            case 413:
                onOneFileDone(index, false)
                toastError("文件大小超过限制！")
                break
            default:
                onOneFileDone(index, false)
                toastError(`上传失败[${xhr.status}]。`)
            }
        }

        xhr.onerror = e => {
            console.log(e)
            onOneFileDone(index, false)
            toastError("上传失败，遇到错误！")
        }

        const data = new FormData()
        data.append("f0", file)
        xhr.send(data)
    }

    for (let i = 0 ; i < files.length; i++) {
        const file = files[i]
        uploadOne(i, file)
    }
}

class Relative {
    constructor(private myApiRoot: string) { }

    get(relativeUrl: string, data?: any,
               settings?: JQuery.AjaxSettings) {
        return this.method("GET", relativeUrl, data, settings)
    }

    post(relativeUrl: string, data: any,
                settings?: JQuery.AjaxSettings) {
        return this.method("POST", relativeUrl, data, settings)
    }

    put(relativeUrl: string, data: any,
               settings?: JQuery.AjaxSettings) {
        return this.method("PUT", relativeUrl, data, settings)
    }

    remove(relativeUrl: string, data?: any,
                  settings?: JQuery.AjaxSettings) {
        return this.method("DELETE", relativeUrl, data, settings)
    }

    private method(method: string, relativeUrl: string, data?: any,
                   settings?: JQuery.AjaxSettings) {
        const url = this.myApiRoot + relativeUrl
        const o = ajaxSettings(method, data, settings)
        return Promise.resolve($.ajax(url, o).fail(failHandler()))
    }
}

function ajaxSettings(type: string, data: any, settings?: JQuery.AjaxSettings)
    : JQuery.AjaxSettings {
    const o: JQuery.AjaxSettings = { type, cache: false }

    if (type === "POST" || type === "PUT" || type === "DELETE") {
        o.data = (typeof data === "string") ? data
            : data && JSON.stringify(data)
        o.contentType = "application/json"
    } else
        o.data = data

    if (settings) Object.assign(this, settings)

    return o
}

function failHandler() {
    return (xhr: JQuery.jqXHR) => {
        if (xhr.status === 401) {
            const r = xhr.responseText && JSON.parse(xhr.responseText)
            const href = encodeURIComponent(location.href)
            toastNormal("准备验证用户身份...")
            const redirect = () =>
                location.href = r.signInUrl + `?callback=${href}`
            setTimeout(redirect, 1500)
        }
    }
}

export const apiRoot = "/api/"

export const api = new Relative(apiRoot)
