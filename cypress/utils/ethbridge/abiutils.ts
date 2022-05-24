import { BigNumber } from '@ethersproject/bignumber/lib.esm'
import { BytesLike, hexStripZeros } from '@ethersproject/bytes'
import { ethers } from 'ethers'

const InputDataDecoder = require('ethereum-input-data-decoder')

export function keccak256(data: BytesLike): string {
  return ethers.utils.keccak256(data)
}

export function encodeEthResult(abi: any, funcName: string, result: (BigNumber | string | number)[]) {
  const iface = new ethers.utils.Interface(abi)
  return iface.encodeFunctionResult(funcName, result)
}

export function decodeEthCall(abi: any, input: any) {
  const decoder = new InputDataDecoder(abi)
  return decoder.decodeData(input)
}

export function formatChainId(chainId: string) {
  return hexStripZeros(BigNumber.from(chainId).toHexString())
}
