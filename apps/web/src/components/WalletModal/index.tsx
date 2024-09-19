import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Column from 'components/Column'
import { CollapsedIcon } from 'components/Icons/Collapse'
import { ExpandIcon } from 'components/Icons/Expand'
import { AccountCTAsExperimentGroup } from 'components/NavBar/accountCTAsExperimentUtils'
import Row, { AutoRow } from 'components/Row'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import { Option } from 'components/WalletModal/Option'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import { useIsUniExtensionAvailable } from 'hooks/useUniswapWalletOptions'
import styled, { css } from 'lib/styled-components'
import { useReducer } from 'react'
import { ClickableStyle, ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'
import { Text } from 'ui/src'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'

const Wrapper = styled.div<{ isUniExtensionAvailable?: boolean }>`
  ${flexColumnNoWrap};
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  padding: ${({ isUniExtensionAvailable }) => (isUniExtensionAvailable ? 0 : 14)}px 16px 20px;
  flex: 1;
  gap: 16px;
`

const OptionGrid = styled.div<{ closed?: boolean }>`
  display: grid;
  flex: 1;
  grid-gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    grid-template-columns: 1fr;
  `};
  opacity ${({ closed }) => (closed ? 0 : 1)};
  max-height: ${({ closed }) => (closed ? 0 : '100vh')};
  transition: ${({ theme }) => `max-height ${theme.transition.duration.fast} ${theme.transition.timing.inOut}, opacity ${theme.transition.duration.fast} ${theme.transition.timing.inOut}`};
`

const TextSectionWrapper = styled.div`
  padding: 0 4px;
`

const OtherWalletsDividerRow = styled(Row)<{ clickable?: boolean }>`
  ${({ clickable }) => clickable && ClickableStyle};
  user-select: none;
`
const Line = styled.div`
  height: 1px;
  width: 100%;
  background: ${({ theme }) => theme.surface3};
`

const OtherWalletIconStyles = css`
  height: 20px;
  width: 20px;
  fill: ${({ theme }) => theme.neutral2};
  flex-shrink: 0;
`

const StyledExpandIcon = styled(ExpandIcon)`
  ${OtherWalletIconStyles}
`

const StyledCollapsedIcon = styled(CollapsedIcon)`
  ${OtherWalletIconStyles}
`

export default function WalletModal() {
  const { t } = useTranslation()
  const showMoonpayText = useShowMoonpayText()
  const connectors = useOrderedConnections(true /** exclude uniswap connectors since they're shown separately */)
  const isUniExtensionAvailable = useIsUniExtensionAvailable()
  const [showOtherWallets, toggleShowOtherWallets] = useReducer((s) => !s, true)

  const isSignIn = useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.LogInCreateAccount

  return (
    <Wrapper data-testid="wallet-modal" isUniExtensionAvailable={isUniExtensionAvailable}>
      <ConnectionErrorView />
      <AutoRow justify="space-between" width="100%">
        <Text variant="subheading2">
          {isSignIn ? t('nav.signIn.button') : isLogIn ? t('nav.logIn.button') : t('common.connectAWallet.button')}
        </Text>
      </AutoRow>
      <UniswapWalletOptions />
      <OtherWalletsDividerRow
        align="center"
        padding="8px 0px"
        clickable={isUniExtensionAvailable}
        onClick={() => isUniExtensionAvailable && toggleShowOtherWallets()}
      >
        <Line />
        <Row align="center" marginX={18}>
          <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
            <Trans i18nKey="wallet.other" />
          </Text>
          {isUniExtensionAvailable ? showOtherWallets ? <StyledExpandIcon /> : <StyledCollapsedIcon /> : null}
        </Row>
        <Line />
      </OtherWalletsDividerRow>
      <Column gap="md" flex="1">
        <Row flex="1" align="flex-start">
          <OptionGrid data-testid="option-grid" closed={isUniExtensionAvailable && !showOtherWallets}>
            {connectors.map((c) => (
              <Option connector={c} key={c.uid} detected={c.isInjected} />
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
