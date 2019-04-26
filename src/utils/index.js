import { ethers } from 'ethers'

import FACTORY_ABI from '../abi/factory'
import ERC20_ABI from '../abi/erc20'
import ERC20_WITH_BYTES_ABI from '../abi/erc20_symbol_bytes32'

const factoryAddresses = {
  1: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
  4: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36'
}

export const errorCodes = ['TOKEN_DECIMALS', 'TOKEN_SYMBOL'].reduce((accumulator, currentValue, currentIndex) => {
  accumulator[currentValue] = currentIndex
  return accumulator
}, {})

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

export async function getTokenDecimals(tokenAddress, signerOrProvider) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid tokenAddress '${tokenAddress}'.`)
  }

  const contract = getContract(tokenAddress, ERC20_ABI, signerOrProvider)

  return contract.decimals().catch(error => {
    error.code = errorCodes.TOKEN_DECIMALS
    throw error
  })
}

// returns decimals and symbol of a token address
export async function getTokenDetails(tokenAddress, signerOrProvider) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid tokenAddress '${tokenAddress}'.`)
  }

  const contract = getContract(tokenAddress, ERC20_ABI, signerOrProvider)

  const decimalsPromise = getTokenDecimals()
  const symbolPromise = contract
    .symbol()
    .catch(() => {
      const contractBytes32 = getContract(tokenAddress, ERC20_WITH_BYTES_ABI, signerOrProvider)
      return contractBytes32.symbol().then(bytes32 => ethers.utils.parseBytes32String(bytes32))
    })
    .catch(error => {
      error.code = errorCodes.TOKEN_SYMBOL
      throw error
    })

  return Promise.all([decimalsPromise, symbolPromise]).then(([decimals, symbol]) => ({
    decimals,
    symbol,
    tokenAddress
  }))
}

export async function getExchangeDetails(networkId, tokenAddress, signerOrProvider) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid tokenAddress '${tokenAddress}'.`)
  }

  const factoryContract = getFactoryContract(networkId, signerOrProvider)

  return factoryContract.getExchange(tokenAddress).then(exchangeAddress => ({ exchangeAddress, tokenAddress }))
}

export async function getEtherBalance(library, address) {
  if (!isAddress(address)) {
    throw Error(`Invalid address '${address}'`)
  }

  return library.getBalance(address)
}

export async function getTokenBalance(tokenAddress, address, signerOrProvider) {
  if (!isAddress(tokenAddress) || !isAddress(address)) {
    throw Error(`Invalid tokenAddress '${tokenAddress}', or address '${address}'.`)
  }

  const contract = getContract(tokenAddress, ERC20_ABI, signerOrProvider)

  return contract.balanceOf(address)
}

export async function getTokenAllowance(tokenAddress, address, spenderAccount, signerOrProvider) {
  if (!isAddress(tokenAddress) || !isAddress(address) || !isAddress(spenderAccount)) {
    throw Error(`Invalid tokenAddress '${tokenAddress}', address '${address}', or spenderAccount '${spenderAccount}.`)
  }

  const contract = getContract(tokenAddress, ERC20_ABI, signerOrProvider)

  return contract.allowance(address, spenderAccount)
}

export async function getExchangeReserves(library, exchangeAddress, tokenAddress, signerOrProvider) {
  if (!isAddress(exchangeAddress) || !isAddress(tokenAddress)) {
    throw Error(`Invalid exchangeAddress '${exchangeAddress}', or tokenAddress '${tokenAddress}.`)
  }

  const reserveETHPromise = getEtherBalance(library, exchangeAddress)
  const reserveTokenPromise = getTokenBalance(tokenAddress, exchangeAddress, signerOrProvider)

  return Promise.all([reserveETHPromise, reserveTokenPromise]).then(([reserveETH, reserveToken]) => ({
    reserveETH,
    reserveToken
  }))
}

// amount must be a BigNumber, {base,display}Decimals must be Numbers
export function amountFormatter(amount, baseDecimals = 18, displayDecimals = 3) {
  if (baseDecimals > 18 || displayDecimals > 18 || displayDecimals > baseDecimals) {
    throw Error(`Invalid combination of baseDecimals '${baseDecimals}' and displayDecimals '${displayDecimals}.`)
  }

  // if balance is falsy, return undefined
  if (!amount) {
    return undefined
  }
  // if amount is 0, return
  else if (amount.isZero()) {
    return '0'
  }
  // amount > 0
  else {
    // amount of 'wei' in 1 'ether'
    const baseAmount = ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(baseDecimals))

    const minimumDisplayAmount = baseAmount.div(
      ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(displayDecimals))
    )

    // if balance is less than the minimum display amount
    if (amount.lt(minimumDisplayAmount)) {
      return `<${ethers.utils.formatUnits(minimumDisplayAmount, baseDecimals)}`
    }
    // if the balance is greater than the minimum display amount
    else {
      const stringAmount = ethers.utils.formatUnits(amount, baseDecimals)

      // if there isn't a decimal portion
      if (!stringAmount.match(/\./)) {
        return stringAmount
      }
      // if there is a decimal portion
      else {
        const [wholeComponent, decimalComponent] = stringAmount.split('.')
        const roundUpAmount = minimumDisplayAmount.div(ethers.constants.Two)
        const roundedDecimalComponent = ethers.utils
          .bigNumberify(decimalComponent.padEnd(baseDecimals, '0'))
          .add(roundUpAmount)
          .toString()
          .padStart(baseDecimals, '0')
          .substring(0, displayDecimals)

        // decimals are too small to show
        if (roundedDecimalComponent === '0'.repeat(displayDecimals)) {
          return wholeComponent
        }
        // decimals are not too small to show
        else {
          return `${wholeComponent}.${roundedDecimalComponent.toString()}`
        }
      }
    }
  }
}
