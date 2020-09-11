import { ChainId, Token, Pair, TokenAmount, WETH, Price } from '../src'
import { validateAndParseAddress } from '../src/utils'

describe('Pair', () => {
  const USDC = new Token(ChainId.ROPSTEN, '0xb6dcb2e7e71d9f4226ac8bfd10ace49595bf580f', 18, 'USDC', 'USD Coin')
  const CRO = new Token(ChainId.ROPSTEN, '0xb29b906e8030942f377c8488df14d833e5da290d', 18, 'CRO', 'Crypto.com Coin')

  describe('constructor', () => {
    it('cannot be used for tokens on different chains', () => {
      expect(() => new Pair(new TokenAmount(USDC, '100'), new TokenAmount(WETH[ChainId.RINKEBY], '100'))).toThrow(
        'CHAIN_IDS'
      )
    })
  })

  describe('#getAddress', () => {
    it('returns the correct address', () => {
      expect(Pair.getAddress(USDC, CRO)).toEqual(validateAndParseAddress('0xF553060ead4Afcc799D2560f077f240BBfc4c72C'))
    })
  })

  describe('#token0', () => {
    it('always is the token that sorts before', () => {
      expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '100')).token0).toEqual(CRO)
      expect(new Pair(new TokenAmount(CRO, '100'), new TokenAmount(USDC, '100')).token0).toEqual(CRO)
    })
  })
  describe('#token1', () => {
    it('always is the token that sorts after', () => {
      expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '100')).token1).toEqual(USDC)
      expect(new Pair(new TokenAmount(CRO, '100'), new TokenAmount(USDC, '100')).token1).toEqual(USDC)
    })
  })
  describe('#reserve0', () => {
    it('always comes from the token that sorts before', () => {
      expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '101')).reserve0).toEqual(
        new TokenAmount(CRO, '101')
      )
      expect(new Pair(new TokenAmount(CRO, '101'), new TokenAmount(USDC, '100')).reserve0).toEqual(
        new TokenAmount(CRO, '101')
      )
    })
  })
  describe('#reserve1', () => {
    it('always comes from the token that sorts after', () => {
      expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '101')).reserve1).toEqual(
        new TokenAmount(USDC, '100')
      )
      expect(new Pair(new TokenAmount(CRO, '101'), new TokenAmount(USDC, '100')).reserve1).toEqual(
        new TokenAmount(USDC, '100')
      )
    })
  })

  describe('#token0Price', () => {
    it('returns price of token0 in terms of token1', () => {
      expect(new Pair(new TokenAmount(USDC, '101'), new TokenAmount(CRO, '100')).token0Price).toEqual(
        new Price(CRO, USDC, '100', '101')
      )
      expect(new Pair(new TokenAmount(CRO, '100'), new TokenAmount(USDC, '101')).token0Price).toEqual(
        new Price(CRO, USDC, '100', '101')
      )
    })
  })

  describe('#token1Price', () => {
    it('returns price of token1 in terms of token0', () => {
      expect(new Pair(new TokenAmount(USDC, '101'), new TokenAmount(CRO, '100')).token1Price).toEqual(
        new Price(USDC, CRO, '101', '100')
      )
      expect(new Pair(new TokenAmount(CRO, '100'), new TokenAmount(USDC, '101')).token1Price).toEqual(
        new Price(USDC, CRO, '101', '100')
      )
    })
  })

  describe('#priceOf', () => {
    const pair = new Pair(new TokenAmount(USDC, '101'), new TokenAmount(CRO, '100'))
    it('returns price of token in terms of other token', () => {
      expect(pair.priceOf(CRO)).toEqual(pair.token0Price)
      expect(pair.priceOf(USDC)).toEqual(pair.token1Price)
    })

    it('throws if invalid token', () => {
      expect(() => pair.priceOf(WETH[ChainId.ROPSTEN])).toThrow('TOKEN')
    })
  })

  describe('#reserveOf', () => {
    it('returns reserves of the given token', () => {
      expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '101')).reserveOf(USDC)).toEqual(
        new TokenAmount(USDC, '100')
      )
      expect(new Pair(new TokenAmount(CRO, '101'), new TokenAmount(USDC, '100')).reserveOf(USDC)).toEqual(
        new TokenAmount(USDC, '100')
      )
    })

    it('throws if not in the pair', () => {
      expect(() =>
        new Pair(new TokenAmount(CRO, '101'), new TokenAmount(USDC, '100')).reserveOf(WETH[ChainId.ROPSTEN])
      ).toThrow('TOKEN')
    })
  })

  describe('#chainId', () => {
    it('returns the token0 chainId', () => {
      expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '100')).chainId).toEqual(ChainId.ROPSTEN)
      expect(new Pair(new TokenAmount(CRO, '100'), new TokenAmount(USDC, '100')).chainId).toEqual(ChainId.ROPSTEN)
    })
  })
  describe('#involvesToken', () => {
    expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '100')).involvesToken(USDC)).toEqual(true)
    expect(new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '100')).involvesToken(CRO)).toEqual(true)
    expect(
      new Pair(new TokenAmount(USDC, '100'), new TokenAmount(CRO, '100')).involvesToken(WETH[ChainId.ROPSTEN])
    ).toEqual(false)
  })
})
