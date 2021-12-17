import { SupportedChainId } from 'constants/chains'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
import { useAtom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { URLS } from 'lib/cosmos/connectors/network'
import { cosmosProviderAtom } from 'lib/cosmos/state/provider'
import { cosmosThemeAtom } from 'lib/cosmos/state/theme'
import { cosmosWidthAtom } from 'lib/cosmos/state/width'
import { useEffect } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

import Swap from '.'
import { colorAtom } from './Output'
import { inputAtom, outputAtom, swapAtom } from './state'

const validateColor = (() => {
  const validator = document.createElement('div').style
  return (color: string) => {
    validator.color = ''
    validator.color = color
    return validator.color !== ''
  }
})()

function Fixture() {
  const width = useAtomValue(cosmosWidthAtom)
  const theme = useAtomValue(cosmosThemeAtom)
  const provider = useAtomValue(cosmosProviderAtom)
  const [jsonRpcEndpoint] = useSelect('jsonRpcEndpoint', {
    defaultValue: URLS[SupportedChainId.MAINNET][0],
    options: Object.values(URLS).flat(),
  })

  const [locale] = useSelect('locale', { defaultValue: DEFAULT_LOCALE, options: ['pseudo', ...SUPPORTED_LOCALES] })

  const [input, setInput] = useAtom(inputAtom)
  const [output, setOutput] = useAtom(outputAtom)
  const [swap, setSwap] = useAtom(swapAtom)
  const [priceFetched] = useValue('price fetched', { defaultValue: false })
  useEffect(() => {
    if (priceFetched && input.token && output.token) {
      const inputValue = input.value || 1
      const inputUsdc = input.usdc || inputValue
      const outputValue = output.value || 1
      const outputUsdc = output.usdc || outputValue
      if (!(inputValue === input.value && inputUsdc === input.usdc)) {
        setInput({ ...input, value: inputValue, usdc: inputUsdc })
      }
      if (!(outputValue === output.value && outputUsdc === output.usdc)) {
        setOutput({ ...output, value: outputValue, usdc: outputUsdc })
      }
      if (!swap || swap.minimumReceived !== outputValue * 0.995) {
        setSwap({
          lpFee: 0.0005,
          priceImpact: 0.01,
          slippageTolerance: 0.5,
          minimumReceived: outputValue * 0.995,
        })
      }
    } else if (swap) {
      setSwap(undefined)
    }
  }, [input, output, priceFetched, setInput, setOutput, setSwap, swap])

  const [tokenApproved] = useValue('token approved', { defaultValue: false })
  useEffect(() => {
    if (tokenApproved !== input.approved) {
      setInput({ ...input, approved: tokenApproved })
    }
  }, [input, setInput, tokenApproved])

  const setColor = useUpdateAtom(colorAtom)
  const [color] = useValue('token color', { defaultValue: '' })
  useEffect(() => {
    if (!color || validateColor(color)) {
      setColor(color)
    }
  }, [color, setColor])

  return <Swap jsonRpcEndpoint={jsonRpcEndpoint} locale={locale} provider={provider} theme={theme} width={width} />
}

export default <Fixture />
