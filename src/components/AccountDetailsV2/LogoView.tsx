import { TransactionInfo, TransactionType } from 'state/transactions/types'
import styled, { css } from 'styled-components/macro'

import { useCurrency } from '../../hooks/Tokens'
import CurrencyLogo from '../CurrencyLogo'

const CurrencyWrap = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
`

const CurrencyWrapStyles = css`
  position: absolute;
  height: 24px;
`

const CurrencyLogoWrap = styled.span<{ isCentered: boolean }>`
  ${CurrencyWrapStyles};
  left: ${({ isCentered }) => (isCentered ? '50%' : '0')};
  top: ${({ isCentered }) => (isCentered ? '50%' : '0')};
  transform: ${({ isCentered }) => isCentered && 'translate(-50%, -50%)'};
`
const CurrencyLogoWrapTwo = styled.span`
  ${CurrencyWrapStyles};
  bottom: 0px;
  right: 0px;
`

export const LogoView = ({ currencyId0, currencyId1 }: { currencyId0: string; currencyId1?: string }) => {
  const currency0 = useCurrency(currencyId0)
  const currency1 = useCurrency(currencyId1)
  const isCentered = !(currency0 && currency1)

  return (
    <CurrencyWrap>
      <CurrencyLogoWrap isCentered={isCentered}>
        <CurrencyLogo size="24px" currency={currency0} />
      </CurrencyLogoWrap>
      {!isCentered && (
        <CurrencyLogoWrapTwo>
          <CurrencyLogo size="24px" currency={currency1} />
        </CurrencyLogoWrapTwo>
      )}
    </CurrencyWrap>
  )
}

export const getLogoView = ({ info }: { info: TransactionInfo }) => {
  switch (info.type) {
    case TransactionType.ADD_LIQUIDITY_V3_POOL:
    case TransactionType.REMOVE_LIQUIDITY_V3:
      const { baseCurrencyId, quoteCurrencyId } = info
      return <LogoView currencyId0={baseCurrencyId} currencyId1={quoteCurrencyId} />
    case TransactionType.SWAP:
      const { inputCurrencyId, outputCurrencyId } = info
      return <LogoView currencyId0={inputCurrencyId} currencyId1={outputCurrencyId} />
    default:
      return <LogoView currencyId0="" />
  }
}
