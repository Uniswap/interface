import { AddressZero } from '@ethersproject/constants'
import { CurrencyAmount, ETHER, Percent, Route, TokenAmount, Trade } from '@uniswap/sdk'
import { DAI, USDC } from '../constants/tokens/mainnet'
import { MockV1Pair } from '../data/V1'
import v1SwapArguments from './v1SwapArguments'

describe('v1SwapArguments', () => {
  const USDC_WETH = new MockV1Pair('1000000', new TokenAmount(USDC, '1000000'))
  const DAI_WETH = new MockV1Pair('1000000', new TokenAmount(DAI, '1000000'))

  function checkDeadline(hex: string | string[], ttl: number) {
    if (typeof hex !== 'string') throw new Error('invalid hex')
    const now = new Date().getTime() / 1000
    expect(parseInt(hex) - now).toBeGreaterThanOrEqual(ttl - 3)
    expect(parseInt(hex) - now).toBeLessThanOrEqual(ttl + 3)
  }

  it('exact eth to token', () => {
    const trade = Trade.exactIn(new Route([USDC_WETH], ETHER), CurrencyAmount.ether('100'))
    const result = v1SwapArguments(trade, {
      recipient: AddressZero,
      allowedSlippage: new Percent('1', '100'),
      ttl: 20 * 60
    })
    expect(result.methodName).toEqual('ethToTokenTransferInput')
    expect(result.args[0]).toEqual('0x62')
    expect(result.args[2]).toEqual('0x0000000000000000000000000000000000000000')
    checkDeadline(result.args[1], 20 * 60)
    expect(result.value).toEqual('0x64')
  })
  it.todo('exact token to eth')
  it('exact token to token', () => {
    const trade = Trade.exactIn(new Route([USDC_WETH, DAI_WETH], USDC), new TokenAmount(USDC, '100'))
    const result = v1SwapArguments(trade, {
      recipient: AddressZero,
      allowedSlippage: new Percent('1', '100'),
      ttl: 20 * 60
    })
    expect(result.methodName).toEqual('tokenToTokenTransferInput')
    expect(result.args[0]).toEqual('0x64')
    expect(result.args[1]).toEqual('0x61')
    expect(result.args[2]).toEqual('0x1')
    expect(result.args[4]).toEqual(AddressZero)
    expect(result.args[5]).toEqual(DAI.address)
    checkDeadline(result.args[3], 20 * 60)
    expect(result.value).toEqual('0x0')
  })
  it.todo('eth to exact token')
  it.todo('token to exact eth')
  it.todo('token to exact token')
})
