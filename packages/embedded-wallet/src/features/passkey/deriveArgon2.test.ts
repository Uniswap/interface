import { deriveArgon2 } from '@universe/embedded-wallet/src/features/passkey/deriveArgon2.web'
import { ARGON2_PARAMS, type Argon2Params } from '@universe/embedded-wallet/src/features/passkey/pinCrypto'
import { hexToUint8, uint8ToHex } from '@universe/encoding'
import { describe, expect, it } from 'vitest'

// Minimal Argon2 params for quick tests
const FAST_ARGON2_PARAMS = { t: 2, m: 1024, p: 4 }
const SALT_STD = '000102030405060708090a0b0c0d0e0f'

interface Argon2Vector {
  name: string
  pin: string
  salt1Hex: string
  argon2Params: Argon2Params
  expectedHex: string
}

// Reference vectors generated from the previous pure-JS
// implementation.(@noble/hashes 2.0.1 argon2id), pinning
// the wasm implementation to its exact output.
const VECTORS: Argon2Vector[] = [
  {
    name: 'basic pin',
    pin: '482916',
    salt1Hex: SALT_STD,
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '42c7620a2e0ac8b4303b95babbfce52742477054ed945b50db9a03f2d3acd4f0',
  },
  {
    name: 'multi-byte UTF-8 pin',
    pin: 'píñ-密码-🔐',
    salt1Hex: SALT_STD,
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '494350344a8ddce3088aa736f9ec4003d974542358a4f7b4d625585793c8c1ae',
  },
  {
    name: 'params t=1 m=64 p=1',
    pin: '482916',
    salt1Hex: SALT_STD,
    argon2Params: { t: 1, m: 64, p: 1 },
    expectedHex: '5bb67253906a35893491e99b5cfdc7cb4dd705836594631918e9227b968dc460',
  },
  {
    name: 'params t=4 m=512 p=2',
    pin: '482916',
    salt1Hex: SALT_STD,
    argon2Params: { t: 4, m: 512, p: 2 },
    expectedHex: '18133110550296233d8988beb3504075056c8bf017364e8abf094899af19f508',
  },
  {
    name: 'params t=1 m=4096 p=8',
    pin: '482916',
    salt1Hex: SALT_STD,
    argon2Params: { t: 1, m: 4096, p: 8 },
    expectedHex: '5bde4601bc7b59569c2ea6d11e1d57f83a4783f5b49d390c454d61274f840c52',
  },
  {
    name: 'params t=3 m=256 p=4',
    pin: '482916',
    salt1Hex: SALT_STD,
    argon2Params: { t: 3, m: 256, p: 4 },
    expectedHex: '6fdf6a059cabc533fc6beac7029ecaaaf01cd15a948093c7f956987da5157ed0',
  },
  {
    name: 'single-char pin',
    pin: '0',
    salt1Hex: SALT_STD,
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '376bf962bff7fa54d72b9c8957397634293c388e6e264d97ecb2ef3bcdbec068',
  },
  {
    name: 'whitespace pin',
    pin: '      ',
    salt1Hex: SALT_STD,
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '335bc4b16b22e8409b0037141ff63841ded69cac2e95b19ac41ed343eb149cb8',
  },
  {
    name: 'null-byte pin',
    pin: String.fromCharCode(0, 0),
    salt1Hex: SALT_STD,
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '0535752ab5371e45e261d33a4e3135158290d8a584158874ce6cc2388c9cfa4c',
  },
  {
    name: '64-char pin',
    pin: '0'.repeat(64),
    salt1Hex: SALT_STD,
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '5bea1505ec2635132118a3dfb47bb606719bc9b2cb48b0d3398c25d66540af9f',
  },
  {
    name: '256-char pin',
    pin: 'a'.repeat(256),
    salt1Hex: SALT_STD,
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '429f55e1d4950253bec1962f882ad2390497d0c181ada5f9bb0c7601715f9553',
  },
  {
    name: '300-char pin',
    pin: '482916'.repeat(50),
    salt1Hex: SALT_STD,
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '9f64d3aeda1ad9b4bc423711d19a54fb328e457b773df7517054668afddee6a3',
  },
  {
    name: 'all-zero salt',
    pin: '482916',
    salt1Hex: '00'.repeat(16),
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '7dc420846630927a587eac67650d7623256ef200625f14d42d0a1a6efd7c9e2c',
  },
  {
    name: 'all-ff salt',
    pin: '482916',
    salt1Hex: 'ff'.repeat(16),
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '4034c715acd3e9ee92434aa33a6e027aba255148216650a53538e3c1ff19deec',
  },
  {
    name: 'fixed 0x07 salt',
    pin: '482916',
    salt1Hex: '07'.repeat(16),
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: 'ffcb7d5944b95136f519399d1eddf283da6c8976e7416824d4a82d9e96b764ba',
  },
  {
    name: 'assorted 1',
    pin: '7391',
    salt1Hex: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: 'a08e61e062b6ec4ffbfdca8d2e42def3270908b3b80df226d599600dd79753c3',
  },
  {
    name: 'assorted 2',
    pin: '000042',
    salt1Hex: 'fedcba9876543210fedcba9876543210',
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '47b1d5093168ddd9bd0eba4a5d5b685f7c9ce798c7bd972cb5f5b279e52d520c',
  },
  {
    name: 'assorted 3',
    pin: '314159265358979',
    salt1Hex: '0f1e2d3c4b5a69788796a5b4c3d2e1f0',
    argon2Params: FAST_ARGON2_PARAMS,
    expectedHex: '350c6102d2aa0aed6ea166085d22bc46206b5c16514af43b0f9efc6cee2d43c8',
  },
]

describe('deriveArgon2 (web, hash-wasm)', () => {
  for (const vector of VECTORS) {
    it(`matches the noble reference vector: ${vector.name}`, async () => {
      const key = await deriveArgon2({
        pin: vector.pin,
        salt1: hexToUint8(vector.salt1Hex),
        argon2Params: vector.argon2Params,
      })
      expect(uint8ToHex(key)).toBe(vector.expectedHex)
    })
  }

  it('matches the noble reference vector at production ARGON2_PARAMS', { timeout: 60_000 }, async () => {
    const key = await deriveArgon2({ pin: '482916', salt1: hexToUint8(SALT_STD), argon2Params: ARGON2_PARAMS })
    expect(uint8ToHex(key)).toBe('569dd95ee13ac32f944ec1ccfc00ca72e60885420dfade6302a57ceacb38da68')
  })

  // hash-wasm rejects passwords (noble implementation derived a key).
  it('rejects empty pins', async () => {
    const salt1 = hexToUint8(SALT_STD)
    await expect(deriveArgon2({ pin: '', salt1, argon2Params: FAST_ARGON2_PARAMS })).rejects.toThrow(
      'Password must be specified',
    )
  })
})
