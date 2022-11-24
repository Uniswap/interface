import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { AlertTriangle, ChevronUp } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as WarningIcon } from 'assets/images/warning.svg'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { detectInjectedType } from 'utils'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'
import { isOverriddenWallet } from 'utils/index'

const WarningBoxWrapper = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.buttonBlack};
  margin-top: 24px;
  color: ${({ theme }) => theme.subText};
  margin-bottom: 12px;
  border-radius: 8px;
  padding: 16px 24px;
  font-size: 12px;
  line-height: 16px;
`
const InfoWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: center;
`
const StepsWrapper = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  margin-top: 16px;
`
const StyledAlert = styled(WarningIcon)`
  height: 64px;
  width: 64px;
`
const IconWrapper = styled.div<{ show: boolean }>`
  padding: 0 8px;
  transform: rotate(${({ show }) => (show ? '0deg' : '180deg')});
  transition: transform 300ms;
  cursor: pointer;
`
const Step = styled.div`
  width: 24px;
  height: 24px;
  background-color: rgba(49, 203, 158, 0.2);
  border-radius: 50%;
  color: ${({ theme }) => theme.primary};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`
const StepContainer = styled.div`
  display: flex;
  color: ${({ theme }) => theme.subText};
  align-items: center;
`

export const C98OverrideGuide = ({
  walletKey,
  isOpened = true,
}: {
  walletKey?: SUPPORTED_WALLET
  isOpened?: boolean
}) => {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const injectedType = detectInjectedType()

  if (!walletKey) return null
  if (!injectedType) return null

  const walletName = SUPPORTED_WALLETS[walletKey].name
  const injectedName = SUPPORTED_WALLETS[injectedType].name

  const isSelectCoin98 = walletKey === 'COIN98'
  return (
    <WarningBoxWrapper>
      <InfoWrapper>
        <StyledAlert />
        {!isOpened ? (
          <Trans>
            {walletName} is not available. In order to use {walletName}, please follow the steps below to disable{' '}
            {injectedName} Wallet:
          </Trans>
        ) : (
          <Trans>
            If {injectedName} wallet opens instead of {walletName}, please close the {injectedName} popup then follow
            the steps below to disable {injectedName} Wallet:
          </Trans>
        )}
        <IconWrapper show={show} onClick={() => setShow(prev => !prev)}>
          <ChevronUp size={16} color={theme.subText} />
        </IconWrapper>
      </InfoWrapper>
      {show && (
        <StepsWrapper>
          <StepContainer>
            <Step>1</Step>
            <Trans>Open C98 Browser Extension</Trans>
          </StepContainer>
          <StepContainer>
            <Step>2</Step>
            <Trans>Click on the Settings icon</Trans>
          </StepContainer>
          <StepContainer>
            <Step>3</Step>
            <Trans>Select Override Wallets</Trans>
          </StepContainer>
          <StepContainer>
            <Step>4</Step>
            {isSelectCoin98 ? <Trans>Enable Metamask in C98</Trans> : <Trans>Disable Metamask in C98</Trans>}
          </StepContainer>
          <StepContainer>
            <Step>5</Step>
            <Trans>Refresh the page then try to connect to {walletName} again</Trans>
          </StepContainer>
        </StepsWrapper>
      )}
    </WarningBoxWrapper>
  )
}

export const WarningBox = ({ walletKey }: { walletKey?: SUPPORTED_WALLET }) => {
  const theme = useTheme()

  const isBraveBrowser = checkForBraveBrowser()
  const injectedType = detectInjectedType()

  if (!walletKey) return null
  if (!injectedType) return null

  if (walletKey === injectedType) return null

  if (!isBraveBrowser && walletKey === 'BRAVE') {
    return (
      <Flex
        sx={{
          background: theme.buttonBlack,
          borderRadius: '16px',
          padding: '8px 12px',
          alignItems: 'center',
          columnGap: '8px',
          marginTop: '16px',
          minHeight: '48px',
        }}
      >
        <Flex
          sx={{
            flex: '0 0 24px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle color={theme.subText} width="16px" height="16px" />
        </Flex>

        <Text
          as="span"
          sx={{
            color: theme.subText,
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px',
          }}
        >
          <Trans>Brave wallet can only be used in Brave Browser. Download it</Trans>{' '}
          <ExternalLink href="https://brave.com/" style={{ color: theme.primary }}>
            <Trans>here</Trans>
          </ExternalLink>
        </Text>
      </Flex>
    )
  }

  if (isOverriddenWallet(walletKey)) {
    return <C98OverrideGuide walletKey={walletKey} isOpened={false} />
  }

  return null
}
