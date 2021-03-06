// cSpell:words CKEDITOR Gongju Xianxia

interface KeyValuePair {
    key: string
    value: string
}

interface JQuery {
    intInput: (alternative: number) => number
    floatInput: (alternative: number) => number
    stringInput: () => string
    isChecked: () => boolean
    mustFind: (selector: string) => JQuery
    mustFindOne: (selector: string) => JQuery
    mustClosest: (selector: string) => JQuery
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
    TextOption: STFunc;
    KvOption: STFunc;
    //
    EntityLister: STFunc;
    ListEntityPage: STFunc;
    EntityListTbody: STFunc;
    EditEntityPage: STFunc;
    MultipleInputItem: STFunc;
    EntityEditor: STFunc;
    EntityEditForm: STFunc;
    SelectEntityDialog: STFunc;
    EntityDigest: STFunc;
    LoadingRef: STFunc;
    ComponentItem: STFunc;
    DisplayFieldItem: STFunc;
    EditComponentDialog: STFunc;
    EntityHistoryList: STFunc;
    EntityCriteria: STFunc;
    EntityCriteriaItem: STFunc;
    CriteriaValue: STFunc;
    RemovableCriteriaValueItemInput: STFunc;
    //
    DatePicker: STFunc;
    RichTextEditorDialog: STFunc;
    PageSwitch: STFunc;
    MenuItems: STFunc;
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
    _id: string
    [k: string]: any
}

interface FieldMeta {
    system: boolean
    name: string
    label: string
    type: string
    refEntity: string
    inputType: string
    persistType: string
    sqlColM?: number
    multiple?: boolean
    fastSearch?: boolean
    hideInListPage?: boolean
    inputFunc?: string
    useGuide?: string
    textOptions?: string[]
    kvOptions?: KeyValuePair[]
    finalOptions?: KeyValuePair[]
    showInListPage?: boolean
    hideInCreatePage?: boolean
    inEditPage?: string
}

interface EntityMeta {
    type: string
    name: string
    label: string
    system: boolean
    displayGroup?: string
    iconField?: string
    digestConfig?: string
    fieldsForDigest?: string[]
    editEnhanceFunc?: string
    db: string
    dbName: string
    mongoIndexes?: any[]
    mysqlIndexes?: any[]
    singleton?: boolean
    history?: number
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
    size?: number,
    name?: string
}

type UploadCallback = (r: UploadResult[] | null) => void

declare const wangEditor: any

interface MetaStore {
    entities: {[entityName: string]: EntityMeta}
}

interface DigestInfo {
    id: string
    entityName: string
    icon?: string
    digest: string
}

interface HistoryItem {
    _id: string
    _oldId: string
    _version: number
    _modifiedOn: Date
    _modifiedBy: string
    modifiedByUser: User
}
