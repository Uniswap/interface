import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  currencyIdToContractInput,
  currencyIdToRestContractInput,
} from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { SAMPLE_BASE_CURRENCY_ID, SAMPLE_CURRENCY_ID_1, SAMPLE_CURRENCY_ID_2 } from 'uniswap/src/test/fixtures'

describe(currencyIdToContractInput, () => {
  it('converts currencyId to ContractInput', () => {
    expect(currencyIdToContractInput(SAMPLE_CURRENCY_ID_1)).toEqual({
      address: SAMPLE_CURRENCY_ID_1.replace('1-', '').toLocaleLowerCase(),
      chain: 'ETHEREUM',
    })
    expect(currencyIdToContractInput(SAMPLE_CURRENCY_ID_2)).toEqual({
      address: SAMPLE_CURRENCY_ID_2.replace('1-', '').toLocaleLowerCase(),
      chain: 'ETHEREUM',
    })
  })
})

describe(currencyIdToRestContractInput, () => {
  it('converts currencyId to RestContract', () => {
    expect(currencyIdToRestContractInput(SAMPLE_CURRENCY_ID_1)).toEqual({
      chainId: UniverseChainId.Mainnet,
      address: SAMPLE_CURRENCY_ID_1.replace('1-', '').toLocaleLowerCase(),
    })
    expect(currencyIdToRestContractInput(SAMPLE_CURRENCY_ID_2)).toEqual({
      chainId: UniverseChainId.Mainnet,
      address: SAMPLE_CURRENCY_ID_2.replace('1-', '').toLocaleLowerCase(),
    })
  })

  it('converts currencyId from non-mainnet chain to RestContract', () => {
    expect(currencyIdToRestContractInput(SAMPLE_BASE_CURRENCY_ID)).toEqual({
      chainId: UniverseChainId.Base,
      address: SAMPLE_BASE_CURRENCY_ID.replace('8453-', '').toLocaleLowerCase(),
    })
  })
})
