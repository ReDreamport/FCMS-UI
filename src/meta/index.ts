export function decideEntitiesFinalOptions(entities: EntityMeta[]) {
    for (const entity of entities) {
        decideFinalOptions(entity)
    }
}

function decideFinalOptions(entityMeta: EntityMeta) {
    const fieldNames = Object.keys(entityMeta.fields)
    for (const fn of fieldNames) {
        const fieldMeta = entityMeta.fields[fn]
        const options: KeyValuePair[] = []

        delete fieldMeta.finalOptions

        if (fieldMeta.textOptions && fieldMeta.textOptions.length) {
            for (const o of fieldMeta.textOptions) {
                options.push({key: o, value: o})
            }
            fieldMeta.finalOptions = options
        } else if (fieldMeta.kvOptions && fieldMeta.kvOptions.length) {
            for (const o of fieldMeta.kvOptions) {
               options.push(o)
            }
            fieldMeta.finalOptions = options
        }
    }
}
