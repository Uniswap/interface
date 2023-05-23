import { TypedDataDomain, TypedDataField } from 'ethers'

export type EthTypedMessage = {
  domain: TypedDataDomain
  types: Record<string, Array<TypedDataField>>
  message: Record<string, unknown>
}
