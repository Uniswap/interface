import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { useAllTokens } from 'hooks/Tokens'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { tokenComparator } from 'lib/hooks/useTokenList/sorting'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { useMemo } from 'react'
import { X } from 'react-feather'
import { useAllTokenBalances, useCurrencyBalance } from 'state/connection/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const ModalWrapper = styled(Column)`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  height: 368px;
  z-index: ${Z_INDEX.modalOverTooltip};
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  box-shadow: ${({ theme }) => theme.deepShadow};
`

const TitleRow = styled(Row)`
  padding: 20px 20px;
  justify-content: space-between;
`

const TokenSelectorContainer = styled(Column)`
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  padding: 20px 20px;
  height: 100%;
  overflow-y: scroll;
  gap: 8px;
  ::-webkit-scrollbar {
    display: none;
  }
`

const TokenRow = styled(Row)`
  padding: 8px 0px;
  justify-content: space-between;
`

const TokenInfoRow = styled(Row)`
  gap: 8px;
`

const TokenNameColumn = styled(Column)``

const StyledBalanceText = styled(ThemedText.SubHeader)`
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  text-overflow: ellipsis;
  text-align: right;
`

export const BagTokenSelectorModal = ({ overlayClick }: { overlayClick: () => void }) => {
  const defaultTokens = useAllTokens()
  const [balances, balancesAreLoading] = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(
    () =>
      !balancesAreLoading
        ? Object.values(defaultTokens)
            .filter((token) => {
              return balances[token.address]?.greaterThan(0)
            })
            .sort(tokenComparator.bind(null, balances))
        : [],
    [balances, balancesAreLoading, defaultTokens]
  )

  const native = useNativeCurrency()
  const wrapped = native.wrapped

  const currencies: Currency[] = useMemo(() => {
    const tokens = sortedTokens.filter((t) => !t.equals(wrapped))
    const natives = native.equals(wrapped) ? [wrapped] : [native, wrapped]
    return [...natives, ...tokens]
  }, [sortedTokens, native, wrapped])

  return (
    <Portal>
      <ModalWrapper>
        <TitleRow>
          <ThemedText.SubHeader fontWeight={500} lineHeight="24px">
            <Trans>Select a token</Trans>
          </ThemedText.SubHeader>
          <X size={24} cursor="pointer" onClick={overlayClick} />
        </TitleRow>
        <TokenSelectorContainer>
          {currencies.map((currency) => {
            return <CurrencyRow key={currency.isToken ? currency.wrapped.address : currency.name} currency={currency} />
          })}
        </TokenSelectorContainer>
      </ModalWrapper>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}

const CurrencyRow = ({ currency }: { currency: Currency }) => {
  const { account } = useWeb3React()
  const balance = useCurrencyBalance(account ?? undefined, currency)

  return (
    <TokenRow>
      <TokenInfoRow>
        <CurrencyLogo currency={currency} size="36px" />
        <TokenNameColumn>
          <ThemedText.SubHeader fontWeight={500} lineHeight="24px">
            {currency.name}
          </ThemedText.SubHeader>
          <ThemedText.BodySmall lineHeight="20px" color="textSecondary">
            {currency.symbol}
          </ThemedText.BodySmall>
        </TokenNameColumn>
      </TokenInfoRow>
      {balance && <Balance balance={balance} />}
    </TokenRow>
  )
}

const Balance = ({ balance }: { balance: CurrencyAmount<Currency> }) => {
  return (
    <StyledBalanceText fontWeight={500} lineHeight="24px">
      {balance.toSignificant(4)}
    </StyledBalanceText>
  )
}
