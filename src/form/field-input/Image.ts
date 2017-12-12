import { buildFileOrImageField, getInput as gi } from "./File"

export const buildField = buildFileOrImageField(ST.Image, ST.ImageItem)

export const getInput = gi
