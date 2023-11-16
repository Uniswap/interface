import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { useCurrency } from 'hooks/Tokens'
import styled from 'styled-components'

import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'

type WrappedCurrencyToggleProps = {
  currencyIdA?: string
  currencyIdB?: string
  onChangeCurrencies: (currencyIdA?: string, currencyIdB?: string) => void
}

const Container = styled.div`
  width: fit-content;
  display: flex;
  align-items: center;
`

function isNative(currencyId?: string) {
  return currencyId === 'ETH'
}

function isWrappedNative(currencyId?: string, chainId?: number) {
  return chainId !== undefined && currencyId === WRAPPED_NATIVE_CURRENCY[chainId]?.address
}

export function WrappedCurrencyToggle({ currencyIdA, currencyIdB, onChangeCurrencies }: WrappedCurrencyToggleProps) {
  const { chainId } = useWeb3React()

  // Get native and wrapped native Currencies
  const native = useCurrency('ETH', chainId)
  const wrappedNative = chainId ? WRAPPED_NATIVE_CURRENCY[chainId] : undefined

  if (!native || !wrappedNative) return null

  // checking to see if currencyIdA or currencyIdB is native or wrapped native
  const currencyIsNative = isNative(currencyIdA) || isNative(currencyIdB)
  const currencyIsWrappedNative = isWrappedNative(currencyIdA, chainId) || isWrappedNative(currencyIdB, chainId)

  if (!currencyIsNative && !currencyIsWrappedNative) return null

  const handleToggle = () => {
    if (currencyIsNative) {
      if (isNative(currencyIdA)) onChangeCurrencies(wrappedNative?.address, currencyIdB)
      else onChangeCurrencies(currencyIdA, wrappedNative?.address)
    }

    if (currencyIsWrappedNative) {
      if (isWrappedNative(currencyIdA)) onChangeCurrencies('ETH', currencyIdA)
      else onChangeCurrencies(currencyIdA, 'ETH')
    }
  }

  return (
    <Container onClick={handleToggle}>
      <ToggleWrapper width="fit-content">
        <ToggleElement isActive={currencyIsNative} fontSize="12px">
          <Trans>{native.symbol}</Trans>
        </ToggleElement>
        <ToggleElement isActive={currencyIsWrappedNative} fontSize="12px">
          <Trans>{wrappedNative.symbol}</Trans>
        </ToggleElement>
      </ToggleWrapper>
    </Container>
  )
}
