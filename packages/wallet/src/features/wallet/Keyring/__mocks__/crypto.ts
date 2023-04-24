// NOTE: ideally would not need to mock `crypto`, but `global.crypto` is undefined in jest

import { SAMPLE_PASSWORD, SAMPLE_SEED } from 'wallet/src/test/__fixtures__'

// and common drop-in crypto libs do not support PBKDF2
export const getRandomValues = () => new Uint8Array()

export const encrypt = () => Promise.resolve('encrypted')

export const decrypt = (
  password: typeof SAMPLE_PASSWORD | 'fail',
  secretPayload: { ciphertext: 'success' | 'fail' } = { ciphertext: 'success' }
) => {
  if (secretPayload.ciphertext === 'fail') {
    return Promise.resolve(
      'an invalid seed phrase that will fail at Wallet.fromMnemonic()'
    )
  }

  if (password === SAMPLE_PASSWORD) {
    return Promise.resolve(SAMPLE_SEED)
  }

  return Promise.reject('Wrong password')
}
