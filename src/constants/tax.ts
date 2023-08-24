import { ChainId, Currency, Percent } from '@uniswap/sdk-core'

import { ZERO_PERCENT } from './misc'

interface TokenTaxMetadata {
  buyFee?: Percent
  sellFee?: Percent
}

const CHAIN_TOKEN_TAX_MAP: { [chainId in number]?: { [address in string]?: TokenTaxMetadata } } = {
  [ChainId.MAINNET]: {
    // BULLET
    '0x8ef32a03784c8fd63bbf027251b9620865bd54b6': {
      buyFee: new Percent(5, 100), // 5%
      sellFee: new Percent(5, 100), // 5%
    },
    // X
    '0xabec00542d141bddf58649bfe860c6449807237c': {
      buyFee: new Percent(1, 100), // 1%
      sellFee: new Percent(1, 100), // 1%
    },
    // HarryPotterObamaKnuckles9Inu
    '0x2577944fd4b556a99cc5aa0f072e4b944aa088df': {
      buyFee: new Percent(1, 100), // 1%
      sellFee: new Percent(11, 1000), // 1.1%
    },
    // QWN
    '0xb354b5da5ea39dadb1cea8140bf242eb24b1821a': {
      buyFee: new Percent(5, 100), // 5%
      sellFee: new Percent(5, 100), // 5%
    },
    // HarryPotterObamaPacMan8Inu
    '0x07e0edf8ce600fb51d44f51e3348d77d67f298ae': {
      buyFee: new Percent(2, 100), // 2%
      sellFee: new Percent(2, 100), // 2%
    },
    // KUKU
    '0x27206f5a9afd0c51da95f20972885545d3b33647': {
      buyFee: new Percent(2, 100), // 2%
      sellFee: new Percent(21, 1000), // 2.1%
    },
    // AIMBOT
    '0x0c48250eb1f29491f1efbeec0261eb556f0973c7': {
      buyFee: new Percent(5, 100), // 5%
      sellFee: new Percent(5, 100), // 5%
    },
    // PYUSD
    '0xe0a8ed732658832fac18141aa5ad3542e2eb503b': {
      buyFee: new Percent(1, 100), // 1%
      sellFee: new Percent(13, 1000), // 1.3%
    },
    // ND4
    '0x4f849c55180ddf8185c5cc495ed58c3aea9c9a28': {
      buyFee: new Percent(1, 100), // 1%
      sellFee: new Percent(1, 100), // 1%
    },
    // COCO
    '0xcb50350ab555ed5d56265e096288536e8cac41eb': {
      buyFee: new Percent(2, 100), // 2%
      sellFee: new Percent(26, 1000), // 2.6%
    },
  },
}

export function getInputTax(currency: Currency): Percent {
  if (currency.isNative) return ZERO_PERCENT

  return CHAIN_TOKEN_TAX_MAP[currency.chainId]?.[currency.address.toLowerCase()]?.sellFee ?? ZERO_PERCENT
}

export function getOutputTax(currency: Currency): Percent {
  if (currency.isNative) return ZERO_PERCENT

  return CHAIN_TOKEN_TAX_MAP[currency.chainId]?.[currency.address.toLowerCase()]?.buyFee ?? ZERO_PERCENT
}
