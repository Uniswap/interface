/* eslint-disable @typescript-eslint/no-unused-vars */

import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import FinalStep from './FinalStep'
import OptionsStep from './OptionsStep'
import PreviewStep from './PreviewStep'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 870px;
  width: 100%;

  @media (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 600px;
    padding-top: 48px;
  }

  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-width: 500px;
    padding-top: 20px;
  }
`
const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  padding-top: 12px;
`
const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`

export default function CreateLaunchpad() {
  const { account, chainId } = useWeb3React()

  const theme = useTheme()

  const toggleWalletDrawer = useToggleAccountDrawer()

  const [step, setStep] = useState(1)

  return (
    <>
      {!account ? (
        <PageWrapper>
          <Wrapper>
            <ErrorContainer>
              <ThemedText.BodyPrimary color={theme.neutral3} textAlign="center">
                <div>Your should connect wallet before starting.</div>
              </ThemedText.BodyPrimary>
              <ButtonPrimary
                style={{ marginTop: '2em', marginBottom: '2em', padding: '8px 16px' }}
                onClick={toggleWalletDrawer}
              >
                Connect a wallet
              </ButtonPrimary>
            </ErrorContainer>
          </Wrapper>
        </PageWrapper>
      ) : step == 1 ? (
        <OptionsStep onNext={() => setStep(2)} />
      ) : step == 2 ? (
        <PreviewStep onBack={() => setStep(1)} onNext={() => setStep(3)} />
      ) : (
        <FinalStep onBack={() => setStep(2)} />
      )}
    </>
  )
}
