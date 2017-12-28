export function getColumnStyle(fm: FieldMeta) {
    let style: any
    switch (fm.type) {
    case "ObjectId":
    case "Reference":
    case "String":
    case "Password":
        style = {"width": "140px", "text-align": "left"}
        break
    case "Boolean":
        style = {"width": "30px", "text-align": "center"}
        break
    case "Int":
    case "Float":
        style = {"width": "80px", "text-align": "right"}
        break
    case "Date":
    case "Time":
    case "DateTime":
        style = {"width": "160px", "text-align": "center"}
        break
    case "Image":
    case "File":
        style = {"width": "90px", "text-align": "center"}
        break
    default:
        style = {"width": "100px", "text-align": "left"}
        break
    }

    return style
}

export function digestId(id?: string) {
    if (id)
        return id[0] + "..." + id.substring(id.length - 6)
    else
        return ""
}

export function displayField(fieldMeta: FieldMeta, fieldValue: any) {
    if (fieldMeta.multiple) {
        fieldValue = fieldValue || []
        const list = []
        for (const item of fieldValue) {
            list.push(ST.DisplayFieldItem({fieldMeta, fieldValue: item}))
        }
        return list.join(", ")
    } else {
        return ST.DisplayFieldItem({fieldMeta, fieldValue})
    }
}
