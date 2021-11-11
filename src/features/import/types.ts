interface BaseImportAccountParams {
  name?: string
  locale?: string
}

export interface ImportLocalAccountParams extends BaseImportAccountParams {
  privateKey?: string

  mnemonic?: string
  derivationPath?: string
}

export interface ImportReadonlyAccountParams extends BaseImportAccountParams {
  address: Address
}

export function isImportLocalAccountParams(params: unknown): params is ImportLocalAccountParams {
  return (
    Object.prototype.hasOwnProperty.call(params, 'mnemonic') ||
    Object.prototype.hasOwnProperty.call(params, 'privateKey')
  )
}

export type ImportAccountParams = ImportLocalAccountParams | ImportReadonlyAccountParams
