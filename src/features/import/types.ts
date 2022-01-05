export enum ImportAccountType {
  Address = 'address',
  Mnemonic = 'mnemonic',
  PrivateKey = 'privateKey',
}

export enum ImportAccountEnsType {
  ENS = 'ens',
}

export const ImportAccountInputType = { ...ImportAccountType, ...ImportAccountEnsType }

interface BaseImportAccountParams {
  type: ImportAccountType
  name?: string
  locale?: string
}

export interface ImportAddressAccountParams extends BaseImportAccountParams {
  type: ImportAccountType.Address
  address: Address
}

export interface ImportMnemonicAccountParams extends BaseImportAccountParams {
  type: ImportAccountType.Mnemonic
  mnemonic: string
}

export interface ImportPrivateKeyAccountParams extends BaseImportAccountParams {
  type: ImportAccountType.PrivateKey
  privateKey: string
}

export type ImportAccountParams =
  | ImportAddressAccountParams
  | ImportMnemonicAccountParams
  | ImportPrivateKeyAccountParams
