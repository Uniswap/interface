import { NumberType } from 'utilities/src/format/types'

export type FormatNumberOrStringInput = {
  value: Maybe<number | string>
  type?: NumberType
  currencyCode?: string
  placeholder?: string
}
