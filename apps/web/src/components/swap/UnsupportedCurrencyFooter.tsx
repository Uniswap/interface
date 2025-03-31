import { Currency, Token } from '@uniswap/sdk-core'
import Card, { OutlineCard } from 'components/Card/cards'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { AutoColumn } from 'components/deprecated/Column'
import { AutoRow, RowBetween } from 'components/deprecated/Row'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import styled from 'lib/styled-components'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { Z_INDEX } from 'theme/zIndex'
import { Button, Flex, ModalCloseIcon, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'

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
  const { t } = useTranslation()
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
      <Modal
        name={ModalName.UnsupportedCurrency}
        isModalOpen={showDetails}
        onClose={() => setShowDetails(false)}
        padding={0}
      >
        <Card padding="2rem">
          <AutoColumn gap="lg">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader>
                <Trans i18nKey="common.unsupportedAsset_other" />
              </ThemedText.DeprecatedMediumHeader>
              <ModalCloseIcon onClose={() => setShowDetails(false)} testId="close-icon" />
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
      <Flex centered>
        <Button emphasis="secondary" onPress={() => setShowDetails(true)} data-testid="read-more-button">
          {t('swap.unsupportedAssets.readMore')}
        </Button>
      </Flex>
    </DetailsFooter>
  )
}

function UnsupportedTokenCard({ token, chainId }: { token?: Token; chainId?: UniverseChainId }) {
  const currencyInfo = useCurrencyInfo(token)

  if (!token || (!currencyInfo?.isSpam && currencyInfo?.safetyInfo?.tokenList === TokenList.Default)) {
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
            <AddressText>{shortenAddress(token.address)}</AddressText>
          </ExternalLink>
        )}
      </AutoColumn>
    </OutlineCard>
  )
}
