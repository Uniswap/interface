import { tokens } from '@uniswap/default-token-list'
import { TokenInfo } from '@uniswap/token-lists'
import { SupportedChainId } from 'constants/chains'
import { DAI, USDC_MAINNET } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import { TokenListProvider } from 'lib/hooks/useTokenList'
import { useEffect } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

import Swap from '.'
import { colorAtom } from './Output'

const validateColor = (() => {
  const validator = document.createElement('div').style
  return (color: string) => {
    validator.color = ''
    validator.color = color
    return validator.color !== ''
  }
})()

function Fixture() {
  const setColor = useUpdateAtom(colorAtom)
  const [color] = useValue('token color', { defaultValue: '' })
  useEffect(() => {
    if (!color || validateColor(color)) {
      setColor(color)
    }
  }, [color, setColor])

  const [convenienceFee] = useValue('convenienceFee', { defaultValue: 100 })
  const FEE_RECIPIENT_OPTIONS = [
    '',
    '0x1D9Cd50Dde9C19073B81303b3d930444d11552f7',
    '0x0dA5533d5a9aA08c1792Ef2B6a7444E149cCB0AD',
    '0xE6abE059E5e929fd17bef158902E73f0FEaCD68c',
  ]
  const [convenienceFeeRecipient] = useSelect('convenienceFeeRecipient', {
    options: FEE_RECIPIENT_OPTIONS,
    defaultValue: FEE_RECIPIENT_OPTIONS[1],
  })

  const optionsToAddressMap: Record<string, string | undefined> = {
    None: undefined,
    Native: 'NATIVE',
    DAI: DAI.address,
    USDC: USDC_MAINNET.address,
  }
  const addressOptions = Object.keys(optionsToAddressMap)

  const [defaultInputToken] = useSelect('defaultInputToken', {
    options: addressOptions,
    defaultValue: addressOptions[1],
  })
  const [defaultInputAmount] = useValue('defaultInputAmount', { defaultValue: 1 })

  const [defaultOutputToken] = useSelect('defaultOutputToken', {
    options: addressOptions,
    defaultValue: addressOptions[2],
  })
  const [defaultOutputAmount] = useValue('defaultOutputAmount', { defaultValue: 0 })

  const tokenListNameMap: Record<string, TokenInfo[] | string> = {
    'default list': tokens,
    'mainnet only': tokens.filter((token) => SupportedChainId.MAINNET === token.chainId),
    'arbitrum only': [
      {
        logoURI: 'https://assets.coingecko.com/coins/images/9956/thumb/4943.png?1636636734',
        chainId: 42161,
        address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
      },
      {
        logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389',
        chainId: 42161,
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        name: 'USD Coin (Arb1)',
        symbol: 'USDC',
        decimals: 6,
      },
    ],
  }

  const tokenListOptions = Object.keys(tokenListNameMap)
  const [tokenListName] = useSelect('tokenList', {
    options: tokenListOptions,
    defaultValue: tokenListOptions[0],
  })

  return (
    <TokenListProvider list={tokenListNameMap[tokenListName]}>
      <Swap
        convenienceFee={convenienceFee}
        convenienceFeeRecipient={convenienceFeeRecipient}
        defaultInputTokenAddress={optionsToAddressMap[defaultInputToken]}
        defaultInputAmount={defaultInputAmount}
        defaultOutputTokenAddress={optionsToAddressMap[defaultOutputToken]}
        defaultOutputAmount={defaultOutputAmount}
        onConnectWallet={() => console.log('onConnectWallet')} // this handler is included as a test of functionality, but only logs
      />
    </TokenListProvider>
  )
}

export default <Fixture />
