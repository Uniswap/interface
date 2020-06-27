import { Token, ChainId } from 'dxswap-sdk'

export default [
  new Token(ChainId.KOVAN, '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', 18, 'DAI', 'Dai Stablecoin'),
  new Token(ChainId.KOVAN, '0xAaF64BFCC32d0F15873a02163e7E500671a4ffcD', 18, 'MKR', 'Maker'),
  new Token(ChainId.KOVAN, '0xDd25BaE0659fC06a8d00CD06C7f5A98D71bfB715', 18, 'DXD', 'DXdao')
]
