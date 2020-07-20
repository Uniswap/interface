import { CurrencyAmount, ETHER, Percent, Route, TokenAmount, Trade } from '@uniswap/sdk'
import { DAI, USDC } from '../constants'
import { MockV1Pair } from '../data/V1'
import v1SwapArguments from './v1SwapArguments'

describe('v1SwapArguments', () => {
  const USDC_WETH = new MockV1Pair('1000000', new TokenAmount(USDC, '1000000'))
  const DAI_WETH = new MockV1Pair('1000000', new TokenAmount(DAI, '1000000'))

  // just some random address
  const TEST_RECIPIENT_ADDRESS = USDC_WETH.liquidityToken.address

  function checkDeadline(hex: string | string[], ttl: number) {
    if (typeof hex !== 'string') throw new Error('invalid hex')
    const now = new Date().getTime() / 1000
    expect(parseInt(hex) - now).toBeGreaterThanOrEqual(ttl - 3)
    expect(parseInt(hex) - now).toBeLessThanOrEqual(ttl + 3)
  }

  it('exact eth to token', () => {
    const trade = Trade.exactIn(new Route([USDC_WETH], ETHER), CurrencyAmount.ether('100'))
    const result = v1SwapArguments(trade, {
      recipient: TEST_RECIPIENT_ADDRESS,
      allowedSlippage: new Percent('1', '100'),
      ttl: 20 * 60
    })
    expect(result.methodName).toEqual('ethToTokenTransferInput')
    expect(result.args[0]).toEqual('0x62')
    expect(result.args[2]).toEqual(TEST_RECIPIENT_ADDRESS)
    checkDeadline(result.args[1], 20 * 60)
    expect(result.value).toEqual('0x64')
  })
  it('exact token to eth', () => {
    const trade = Trade.exactIn(new Route([USDC_WETH], USDC, ETHER), new TokenAmount(USDC, '100'))
    const result = v1SwapArguments(trade, {
      recipient: TEST_RECIPIENT_ADDRESS,
      allowedSlippage: new Percent('1', '100'),
      ttl: 20 * 60
    })
    expect(result.methodName).toEqual('tokenToEthTransferInput')
    expect(result.args[0]).toEqual('0x64')
    expect(result.args[1]).toEqual('0x62')
    checkDeadline(result.args[2], 20 * 60)
    expect(result.args[3]).toEqual(TEST_RECIPIENT_ADDRESS)
    expect(result.value).toEqual('0x0')
  })
  it('exact token to token', () => {
    const trade = Trade.exactIn(new Route([USDC_WETH, DAI_WETH], USDC), new TokenAmount(USDC, '100'))
    const result = v1SwapArguments(trade, {
      recipient: TEST_RECIPIENT_ADDRESS,
      allowedSlippage: new Percent('1', '100'),
      ttl: 20 * 60
    })
    expect(result.methodName).toEqual('tokenToTokenTransferInput')
    expect(result.args[0]).toEqual('0x64')
    expect(result.args[1]).toEqual('0x61')
    expect(result.args[2]).toEqual('0x1')
    expect(result.args[4]).toEqual(TEST_RECIPIENT_ADDRESS)
    expect(result.args[5]).toEqual(DAI.address)
    checkDeadline(result.args[3], 20 * 60)
    expect(result.value).toEqual('0x0')
  })
  it('eth to exact token', () => {
    const trade = Trade.exactOut(new Route([USDC_WETH], ETHER), new TokenAmount(USDC, '100'))
    const result = v1SwapArguments(trade, {
      recipient: TEST_RECIPIENT_ADDRESS,
      allowedSlippage: new Percent('1', '100'),
      ttl: 20 * 60
    })
    expect(result.methodName).toEqual('ethToTokenTransferOutput')
    expect(result.args[0]).toEqual('0x64')
    checkDeadline(result.args[1], 20 * 60)
    expect(result.args[2]).toEqual(TEST_RECIPIENT_ADDRESS)
    expect(result.value).toEqual('0x66')
  })
  it('token to exact eth', () => {
    const trade = Trade.exactOut(new Route([USDC_WETH], USDC, ETHER), CurrencyAmount.ether('100'))
    const result = v1SwapArguments(trade, {
      recipient: TEST_RECIPIENT_ADDRESS,
      allowedSlippage: new Percent('1', '100'),
      ttl: 20 * 60
    })
    expect(result.methodName).toEqual('tokenToEthTransferOutput')
    expect(result.args[0]).toEqual('0x64')
    expect(result.args[1]).toEqual('0x66')
    checkDeadline(result.args[2], 20 * 60)
    expect(result.args[3]).toEqual(TEST_RECIPIENT_ADDRESS)
    expect(result.value).toEqual('0x0')
  })
  it('token to exact token', () => {
    const trade = Trade.exactOut(new Route([USDC_WETH, DAI_WETH], USDC), new TokenAmount(DAI, '100'))
    const result = v1SwapArguments(trade, {
      recipient: TEST_RECIPIENT_ADDRESS,
      allowedSlippage: new Percent('1', '100'),
      ttl: 20 * 60
    })
    expect(result.methodName).toEqual('tokenToTokenTransferOutput')
    expect(result.args[0]).toEqual('0x64')
    expect(result.args[1]).toEqual('0x67')
    expect(result.args[2]).toEqual(`0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`)
    checkDeadline(result.args[3], 20 * 60)
    expect(result.args[4]).toEqual(TEST_RECIPIENT_ADDRESS)
    expect(result.args[5]).toEqual(DAI.address)
    expect(result.value).toEqual('0x0')
  })
})
