function getKeyMaterial(password: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
}

function getKey(keyMaterial: CryptoKey, salt: Uint8Array) {
  // TODO: This should use Argon2 like ToB recommended for the mobile app
  // https://github.com/Uniswap/mobile/blob/main/ios/EncryptionHelper.swift
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptPassword(
  password: string,
  iv: Uint8Array,
  salt: Uint8Array,
  mnemonic: string
) {
  const keyMaterial = await getKeyMaterial(password)
  const key = await getKey(keyMaterial, salt)

  const encodedMnemonic = new TextEncoder().encode(mnemonic)
  const encryptedPassword = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedMnemonic
  )

  return new Uint8Array(encryptedPassword)
}

export async function decryptPassword(
  passwordAttempt: string,
  cipherText: ArrayBuffer,
  iv: Uint8Array,
  salt: Uint8Array
) {
  const keyMaterial = await getKeyMaterial(passwordAttempt)
  const key = await getKey(keyMaterial, salt)

  try {
    // if this is successful, the password is correct. Otherwise it will throw an error
    const result = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherText
    )
    return result
  } catch (e) {
    return undefined
  }
}
