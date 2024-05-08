import { ExternalProvider, JsonRpcProvider, JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { ChainId, CurrencyAmount } from '@uniswap/sdk-core'
import { DAI, nativeOnChain } from 'constants/tokens'
import { act, renderHook } from 'test-utils/render'

import { useCreateTransferTransaction } from './transfer'

type Mutable<T> = { -readonly [P in keyof T]: T[P] }

describe('useCreateTransfer', () => {
  const wallet = '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'

  let signer: JsonRpcSigner
  beforeEach(() => {
    signer = new JsonRpcProvider().getSigner()
    jest.spyOn(signer, 'getAddress').mockResolvedValue(wallet)
    const web3Provider = signer.provider as Mutable<Web3Provider>
    web3Provider.provider = {
      isWalletConnect: true,
      session: { peer: { metadata: { name } } },
    } as ExternalProvider
  })

  it('sending eth', async () => {
    const transferInfo = {
      provider: signer.provider as Web3Provider,
      account: wallet,
      chainId: 1,
      toAddress: '0xaDd287e6d0213e662D400d815C481b4b2ddE5d65',
      currencyAmount: CurrencyAmount.fromRawAmount(nativeOnChain(ChainId.MAINNET), 1e18),
    }
    const transaction = renderHook(() => useCreateTransferTransaction(transferInfo)).result

    await act(async () => {
      transaction.current
    })

    expect(transaction.current).toStrictEqual({
      from: wallet,
      to: '0xaDd287e6d0213e662D400d815C481b4b2ddE5d65',
      value: (1e18).toString(),
      chainId: 1,
    })
  })

  it('sending token', async () => {
    const transferInfo = {
      provider: signer.provider as Web3Provider,
      account: wallet,
      chainId: 1,
      toAddress: '0xaDd287e6d0213e662D400d815C481b4b2ddE5d65',
      currencyAmount: CurrencyAmount.fromRawAmount(DAI, 1e18),
    }
    const transaction = renderHook(() => useCreateTransferTransaction(transferInfo)).result

    await act(async () => {
      transaction.current
    })

    expect(transaction.current).toStrictEqual({
      data: '0xa9059cbb000000000000000000000000add287e6d0213e662d400d815c481b4b2dde5d650000000000000000000000000000000000000000000000000de0b6b3a7640000',
      to: DAI.address,
      from: wallet,
      chainId: 1,
    })
  })

  it('fails when transfer info is not defined', async () => {
    const transferInfo = {}
    const transaction = renderHook(() => useCreateTransferTransaction(transferInfo)).result

    await act(async () => {
      transaction.current
    })

    expect(transaction.current).toBeUndefined()
  })
})
