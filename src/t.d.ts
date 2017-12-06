// cSpell:words CKEDITOR Gongju Xianxia

interface JQuery {
    intInput: (alternative: number) => number
    floatInput: (alternative: number) => number
    stringInput: () => string
    isChecked: () => boolean
    mustFind: (selector: string) => JQuery
    mustFindOne: (selector: string) => JQuery
    mustAttr: (name: string) => string
    mustIntAttr: (name: string) => number
    iterate: (func: ((j: JQuery, index: number) => any)) => void
    widthOr0: () => number
    heightOr0: () => number
}

type STFunc = (context?: any) => string

declare const ST: {
    MenuItems: STFunc;
    ListEntity: STFunc;
    ListEntityTable: STFunc;
    ListEntityTbody: STFunc;
    EntityListPaging: STFunc;
    CheckColumns: STFunc;
    EntityDigest: STFunc;
    FilterItem: STFunc;
    FilterOperatorOption: STFunc;
    FilterInput: STFunc;
}

declare const CKEDITOR: any

interface ListResult {
    pageNo: number,
    pageSize: number,
    total: number,
    page: Array<{ _id: string }>,
    [s: string]: any
}

interface User {
    _id: string
    username: string
    acl: any
    roles?: any
    admin: boolean
}

interface GlobalData {
    user?: User
}

interface FilePath {
    path: string
}

interface EntityValue {
    _id: string
    [k: string]: any
}

interface FieldMeta {
    name: string
    type: string
    inputType: string
    multiple: boolean
    options: any[]
    refEntity: string
    hideInListPage: boolean
}

interface EntityMeta {
    name: string
    digestFields?: string
    fields: {[fieldName: string]: FieldMeta}
}
