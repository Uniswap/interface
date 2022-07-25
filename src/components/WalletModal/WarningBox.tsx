import React, { useContext, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { ReactComponent as WarningIcon } from '../../assets/images/warning.svg'
import { Trans } from '@lingui/macro'
import { ChevronUp } from 'react-feather'

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
  color: #31cb9e;
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

interface Props {
  option?: string
}

export const WarningBox: React.FC<Props> = ({ option }) => {
  const theme = useContext(ThemeContext)
  const isCoin98 = option === 'COIN98'

  const [show, setShow] = useState(false)
  return (
    <WarningBoxWrapper>
      <InfoWrapper>
        <StyledAlert />
        {isCoin98 ? (
          <Trans>
            If Metamask wallet opens instead of C98, please close the Metamask popup then follow the steps below to
            disable Metamask Wallet:
          </Trans>
        ) : (
          <Trans>
            If C98 wallet opens instead of Metamask, please close the C98 popup then follow the steps below to disable
            C98 Wallet:
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
            {isCoin98 ? <Trans>Enable Metamask in C98</Trans> : <Trans>Disable Metamask in C98</Trans>}
          </StepContainer>
          <StepContainer>
            <Step>5</Step>
            {isCoin98 ? (
              <Trans>Refresh the page then try to connect to C98 again</Trans>
            ) : (
              <Trans>Refresh the page then try to connect to Metamask again</Trans>
            )}
          </StepContainer>
        </StepsWrapper>
      )}
    </WarningBoxWrapper>
  )
}
