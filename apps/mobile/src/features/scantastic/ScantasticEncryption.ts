interface ScantasticEncryption {
  getEncryptedMnemonic: (mnemonicId: string, n: string, e: string) => Promise<string>
}

declare module 'react-native' {
  interface NativeModulesStatic {
    ScantasticEncryption: ScantasticEncryption
  }
}

import { NativeModules } from 'react-native'

const { ScantasticEncryption } = NativeModules

export function getEncryptedMnemonic({
  mnemonicId,
  modulus,
  exponent,
}: {
  mnemonicId: string
  modulus: string
  exponent: string
}): Promise<string> {
  return ScantasticEncryption.getEncryptedMnemonic(mnemonicId, modulus, exponent)
}
