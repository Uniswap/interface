import { ethers } from 'ethers'

import FACTORY_ABI from '../abi/factory'
import ERC20_ABI from '../abi/erc20'
import ERC20_WITH_BYTES_ABI from '../abi/erc20_symbol_bytes32'

const factoryAddresses = {
  1: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
  4: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36'
}

export const errorCodes = ['TOKEN_DETAILS_DECIMALS', 'TOKEN_DETAILS_SYMBOL'].reduce(
  (accumulator, currentValue, currentIndex) => {
    accumulator[currentValue] = currentIndex
    return accumulator
  },
  {}
)

function getFactoryContract(networkId, signerOrProvider) {
  return getContract(factoryAddresses[networkId], FACTORY_ABI, signerOrProvider)
}

export function isAddress(value) {
  try {
    ethers.utils.getAddress(value)
    return true
  } catch {
    return false
  }
}

export function getSignerOrProvider(library, account) {
  return account ? library.getSigner(account) : library
}

export function getContract(contractAddress, ABI, signerOrProvider) {
  return new ethers.Contract(contractAddress, ABI, signerOrProvider)
}

export async function getTokenDetails(tokenAddress, signerOrProvider) {
  const contract = getContract(tokenAddress, ERC20_ABI, signerOrProvider)

  const decimalsPromise = contract.decimals().catch(error => {
    console.log(error)
    error.code = errorCodes.TOKEN_DETAILS_DECIMALS
    throw error
  })
  const symbolPromise = contract
    .symbol()
    .catch(() => {
      const contractBytes32 = getContract(tokenAddress, ERC20_WITH_BYTES_ABI, signerOrProvider)
      return contractBytes32.symbol().then(bytes32 => ethers.utils.parseBytes32String(bytes32))
    })
    .catch(error => {
      error.code = errorCodes.TOKEN_DETAILS_SYMBOL
      throw error
    })

  return Promise.all([decimalsPromise, symbolPromise]).then(([decimals, symbol]) => ({
    decimals,
    symbol,
    tokenAddress
  }))
}

export async function getExchangeDetails(networkId, tokenAddress, signerOrProvider) {
  const factoryContract = getFactoryContract(networkId, signerOrProvider)

  return factoryContract.getExchange(tokenAddress).then(exchangeAddress => ({ exchangeAddress, tokenAddress }))
}
