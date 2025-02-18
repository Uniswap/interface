import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { CollapsedIcon } from 'components/Icons/Collapse'
import { ExpandIcon } from 'components/Icons/Expand'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import { Option } from 'components/WalletModal/Option'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import Column from 'components/deprecated/Column'
import Row, { AutoRow } from 'components/deprecated/Row'
import { useIsUniExtensionAvailable } from 'hooks/useUniswapWalletOptions'
import styled, { css } from 'lib/styled-components'
import { useReducer } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle, ThemedText } from 'theme/components'
import { flexColumnNoWrap } from 'theme/styles'
import { Flex, Text } from 'ui/src'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentGroupName, useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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
  const connectors = useOrderedConnections()
  const isUniExtensionAvailable = useIsUniExtensionAvailable()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const [showOtherWallets, toggleShowOtherWallets] = useReducer((s) => !s, !isEmbeddedWalletEnabled)

  const isSignIn =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.SignInSignUp ||
    isEmbeddedWalletEnabled
  const isLogIn =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.LogInCreateAccount &&
    !isEmbeddedWalletEnabled

  return (
    <Wrapper data-testid="wallet-modal" isUniExtensionAvailable={isUniExtensionAvailable}>
      <Flex />
      <ConnectionErrorView />
      {isEmbeddedWalletEnabled ? null : (
        <AutoRow justify="space-between" width="100%">
          <Text variant="subheading2">
            {isSignIn ? t('nav.signIn.button') : isLogIn ? t('nav.logIn.button') : t('common.connectAWallet.button')}
          </Text>
        </AutoRow>
      )}
      <UniswapWalletOptions />
      <Flex
        row
        alignItems="center"
        py={8}
        userSelect="none"
        onPress={() => isUniExtensionAvailable && toggleShowOtherWallets()}
        {...(isUniExtensionAvailable ? ClickableTamaguiStyle : {})}
      >
        <Line />
        <Flex row alignItems="center" mx={18}>
          <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
            <Trans i18nKey="wallet.other" />
          </Text>
          {isUniExtensionAvailable ? showOtherWallets ? <StyledExpandIcon /> : <StyledCollapsedIcon /> : null}
        </Flex>
        <Line />
      </Flex>
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
