import { keccak256, pack } from '@ethersproject/solidity'
import { Token } from '@uniswap/sdk-core'
import { getCreate2Address } from 'ethers/lib/utils'

export const computePairAddress = ({
  factoryAddress,
  tokenA,
  tokenB,
}: {
  factoryAddress: string
  tokenA: Token
  tokenB: Token
}): string => {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
  return getCreate2Address(
    factoryAddress,
    keccak256(['bytes'], [pack(['address', 'address'], [token0.address, token1.address])]),
    '0xfc06b5b82f8a10ef64adcca4f7882b85f7a766960874989d055c18ea1d8d56a5'
  )
}
