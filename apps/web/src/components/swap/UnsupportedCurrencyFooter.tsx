import { Currency, Token } from '@uniswap/sdk-core'
import { ButtonEmpty } from 'components/Button'
import Card, { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { useState } from 'react'
import { CloseIcon, ExternalLink, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { Text } from 'ui/src'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const DetailsFooter = styled.div<{ show: boolean }>`
  padding-top: calc(16px + 2rem);
  padding-bottom: 20px;
  margin-left: auto;
  margin-right: auto;
  margin-top: -2rem;
  width: 100%;
  max-width: 400px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.neutral2};
  background-color: ${({ theme }) => theme.surface2};
  z-index: ${Z_INDEX.deprecated_zero};

  transform: ${({ show }) => (show ? 'translateY(0%)' : 'translateY(-100%)')};
  transition: transform 300ms ease-in-out;
  text-align: center;
`

const StyledButtonEmpty = styled(ButtonEmpty)`
  text-decoration: none;
`

const AddressText = styled(Text)`
  color: ${({ theme }) => theme.accent1};
  font-size: 12px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 10px;
`}
`

export default function UnsupportedCurrencyFooter({
  show,
  currencies,
}: {
  show: boolean
  currencies: (Currency | undefined | null)[]
}) {
  const { chainId } = useAccount()
  const [showDetails, setShowDetails] = useState(false)

  const tokens =
    chainId && currencies
      ? currencies.map((currency) => {
          return currency?.wrapped
        })
      : []

  return (
    <DetailsFooter show={show}>
      <Modal isOpen={showDetails} onDismiss={() => setShowDetails(false)}>
        <Card padding="2rem">
          <AutoColumn gap="lg">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader>
                <Trans i18nKey="common.unsupportedAsset_other" />
              </ThemedText.DeprecatedMediumHeader>
              <CloseIcon onClick={() => setShowDetails(false)} data-testid="close-icon" />
            </RowBetween>
            {tokens.map((token) => {
              return (
                <UnsupportedTokenCard key={token?.address?.concat('not-supported')} token={token} chainId={chainId} />
              )
            })}
            <AutoColumn gap="lg">
              <ThemedText.DeprecatedBody fontWeight={535}>
                <Trans i18nKey="swap.limitedAssets.warning" />
              </ThemedText.DeprecatedBody>
            </AutoColumn>
          </AutoColumn>
        </Card>
      </Modal>
      <StyledButtonEmpty padding="0" onClick={() => setShowDetails(true)} data-testid="read-more-button">
        <Text color="$accent1">
          <Trans i18nKey="swap.unsupportedAssets.readMore" />
        </Text>
      </StyledButtonEmpty>
    </DetailsFooter>
  )
}

function UnsupportedTokenCard({ token, chainId }: { token?: Token; chainId?: InterfaceChainId }) {
  const currencyInfo = useCurrencyInfo(token)

  if (!token || (!currencyInfo?.isSpam && currencyInfo?.safetyLevel === SafetyLevel.Verified)) {
    return null
  }

  return (
    <OutlineCard key={token?.address?.concat('not-supported')} data-testid="unsupported-token-card">
      <AutoColumn gap="10px">
        <AutoRow gap="5px" align="center">
          <CurrencyLogo currency={token} size={24} />
          <ThemedText.DeprecatedBody fontWeight={535}>{token.symbol}</ThemedText.DeprecatedBody>
        </AutoRow>
        {chainId && (
          <ExternalLink href={getExplorerLink(chainId, token.address, ExplorerDataType.ADDRESS)}>
            <AddressText>{token.address}</AddressText>
          </ExternalLink>
        )}
      </AutoColumn>
    </OutlineCard>
  )
}
