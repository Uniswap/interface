import IconButton from 'components/AccountDrawer/IconButton'
import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Column from 'components/Column'
import { Settings } from 'components/Icons/Settings'
import Row, { AutoRow } from 'components/Row'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import { Option } from 'components/WalletModal/Option'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import { useUniswapWalletOptions } from 'hooks/useUniswapWalletOptions'
import { Trans } from 'i18n'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'
import { Text } from 'ui/src'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  padding: 14px 16px 16px;
  flex: 1;
  gap: 16px;
`

const OptionGrid = styled.div`
  display: grid;
  flex: 1;
  grid-gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
`

const TextSectionWrapper = styled.div`
  padding: 0 4px;
`

const Line = styled.div`
  height: 1px;
  width: 100%;
  background: ${({ theme }) => theme.surface3};
`

export default function WalletModal({ openSettings }: { openSettings: () => void }) {
  const showMoonpayText = useShowMoonpayText()
  const showUniswapWalletOptions = useUniswapWalletOptions()
  const connectors = useOrderedConnections(showUniswapWalletOptions)

  return (
    <Wrapper data-testid="wallet-modal">
      <ConnectionErrorView />
      <AutoRow justify="space-between" width="100%">
        <ThemedText.SubHeader>Connect a wallet</ThemedText.SubHeader>
        <IconButton Icon={Settings} onClick={openSettings} data-testid="wallet-settings" />
      </AutoRow>
      {showUniswapWalletOptions && (
        <>
          <UniswapWalletOptions />
          <Row align="center" padding="8px 0px">
            <Line />
            <Text variant="body3" color="$neutral2" mx={18} whiteSpace="nowrap">
              <Trans i18nKey="wallet.other" />
            </Text>
            <Line />
          </Row>
        </>
      )}
      <Column gap="md" flex="1">
        <Row flex="1" align="flex-start">
          <OptionGrid data-testid="option-grid">
            {connectors.map((c) => (
              <Option connector={c} key={c.uid} />
            ))}
          </OptionGrid>
        </Row>
        <Column gap="md">
          <TextSectionWrapper>
            <PrivacyPolicyNotice />
          </TextSectionWrapper>
          {showMoonpayText && (
            <>
              <Line />
              <TextSectionWrapper>
                <ThemedText.Caption color="neutral3">
                  <Trans i18nKey="moonpay.poweredBy" />
                </ThemedText.Caption>
              </TextSectionWrapper>
            </>
          )}
        </Column>
      </Column>
    </Wrapper>
  )
}
