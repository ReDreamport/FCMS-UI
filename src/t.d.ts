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
    typedInput: () => any
}

type STFunc = (context?: any) => string

declare const ST: {
    ListMetaPage: STFunc;
    EditMetaPage: STFunc;
    MongoIndexItem: STFunc;
    MySQLIndexItem: STFunc;
    FieldMetaRow: STFunc;
    EditFieldDialog: STFunc;
    //
    EntityLister: STFunc;
    ListEntityPage: STFunc;
    EntityListTbody: STFunc;
    //
    PageSwitch: STFunc;
    MenuItems: STFunc;
    //
    ListEntity: STFunc;
    ListEntityTable: STFunc;
    ListEntityTbody: STFunc;
    EntityListPaging: STFunc;
    CheckColumns: STFunc;
    EntityDigest: STFunc;
    FilterItem: STFunc;
    FilterOperatorOption: STFunc;
    FilterInput: STFunc;
    ViewEntity: STFunc;
    ViewEntityFields: STFunc;
    EditEntity: STFunc;
    Form: STFunc;
    Field: STFunc;
    Check: STFunc;
    CheckList: STFunc;
    CheckListItem: STFunc;
    CheckListGroup: STFunc;
    Date: STFunc;
    DateTime: STFunc;
    File: STFunc;
    FileItem: STFunc;
    Float: STFunc;
    Image: STFunc;
    ImageItem: STFunc;
    InlineComponent: STFunc;
    Int: STFunc;
    JSON: STFunc;
    Password: STFunc;
    PopupComponent: STFunc;
    PopupComponentItem: STFunc;
    Reference: STFunc;
    ReferenceItem: STFunc;
    RichText: STFunc;
    Select: STFunc;
    Text: STFunc;
    TextArea: STFunc;
    Time: STFunc;
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
    nickname?: string
    phone?: string
    email?: string
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
    _id?: string
    [k: string]: any
}

interface FieldMeta {
    name: string
    type: string
    refEntity: string
    inputType: string
    persistType: string
    multiple: boolean
    fastSearch: boolean
    options: any[]
    hideInListPage: boolean
    notShow: boolean
    noCreate: boolean
    noEdit: boolean
    inputFunc?: string
    optionsDependOnField?: string
    optionsFunc?: string
    groupedOptions?: any
    optionWidth?: number
}

interface EntityMeta {
    name: string
    label: string
    system: boolean
    displayGroup?: string
    digestFields?: string
    editEnhanceFunc?: string
    db: string
    dbName: string
    mongoIndexes?: any[]
    mysqlIndexes?: any[]
    fields: {[fieldName: string]: FieldMeta}
}

interface EntityForm {
    entityName: string
    entityMeta: EntityMeta
    fid: string
    fClass: string
    $form: JQuery
}

interface SelectOption {
    name: string
    label: string
    items: SelectOption[]
}

interface UploadResult {
    path: string,
    size?: number
}

type UploadCallback = (r: UploadResult[] | null) => void

declare const wangEditor: any

interface MetaStore {
    entities: {[entityName: string]: EntityMeta}
}
