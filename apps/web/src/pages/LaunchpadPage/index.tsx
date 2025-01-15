/* eslint-disable @typescript-eslint/no-unused-vars */
import { InterfacePageName } from '@ubeswap/analytics-events'
import { ChainId } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { isSupportedChain } from 'constants/chains'
import { Trans } from 'i18n'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { useLaunchpad } from 'pages/LaunchpadList/data/useLaunchpads'
import { useEffect, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import LaunchpadView from './LaunchpadView'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 960px;
  width: 100%;

  @media (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 800px;
    padding-top: 48px;
  }

  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-width: 500px;
    padding-top: 20px;
  }
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.neutral2};
  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  }
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

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const NetworkIcon = styled(AlertTriangle)`
  ${IconStyle}
`

const PositionstWrapper = styled.div`
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
`

export const RowBetweenRelative = styled(Row)`
  justify-content: space-between;
  position: relative;
`

export const TwoColumnAuto = styled(Row)<{ gap?: string; justify?: string }>`
  flex-wrap: wrap;
  column-gap: 20px;

  & > * {
    width: calc(50% - 10px);
  }

  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
    & > * {
      width: 100%;
    }
  }
`

function WrongNetworkCard() {
  const theme = useTheme()

  return (
    <>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding="0">
              <ThemedText.H1Large>
                <Trans>Positions</Trans>
              </ThemedText.H1Large>
            </TitleRow>

            <PositionstWrapper>
              <ErrorContainer>
                <ThemedText.BodyPrimary color={theme.neutral3} textAlign="center">
                  <NetworkIcon strokeWidth={1.2} />
                  <div data-testid="pools-unsupported-err">
                    <Trans>Your connected network is unsupported.</Trans>
                  </div>
                </ThemedText.BodyPrimary>
              </ErrorContainer>
            </PositionstWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default function LaunchpadPage() {
  const { account } = useWeb3React()
  const chainId = ChainId.CELO
  const { launchpadAddress } = useParams<{ launchpadAddress: string }>()
  const { launchpad, loading } = useLaunchpad(launchpadAddress)
  const theme = useTheme()

  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false)

  const handleCheckbox = () => {
    setIsDisclaimerAccepted(!isDisclaimerAccepted)
  }

  const [showDisclaimer, setShowDisclaimer] = useState(false)
  useEffect(() => {
    const v3FarmDisclaimerShown = localStorage.getItem('v3FarmDisclaimerShown')
    if (!v3FarmDisclaimerShown) {
      setShowDisclaimer(true)
    }
  }, [])
  const onDisclaimerAccepted = () => {
    localStorage.setItem('v3FarmDisclaimerShown', 'true')
    setShowDisclaimer(false)
  }

  if (!isSupportedChain(chainId)) {
    return <WrongNetworkCard />
  }

  return (
    <Trace page={InterfacePageName.FARM_V3} shouldLogImpression>
      <Modal isOpen={showDisclaimer} $scrollOverlay={true} onDismiss={() => setShowDisclaimer(false)} maxHeight={90}>
        <div style={{ padding: '16px' }}>
          <div>
            <p>
              This website-hosted user interface (this &quot;Interface&quot;) is an open source frontend software portal
              to the Ubeswap protocol, a decentralized and community-driven collection of blockchain-enabled smart
              contracts and tools (the &quot;Ubeswap Protocol&quot;). This Interface and the Ubeswap Protocol are made
              available by QW3 Labs, however all transactions conducted on the protocol are run by related
              permissionless smart contracts. As the Interface is open-sourced and the Ubeswap Protocol and its related
              smart contracts are accessible by any user, entity or third party, there are a number of third party web
              and mobile user-interfaces that allow for interaction with the Ubeswap Protocol.
            </p>
            <p>
              THIS INTERFACE AND THE UBESWAP PROTOCOL ARE PROVIDED &quot;AS IS&quot;, AT YOUR OWN RISK, AND WITHOUT
              WARRANTIES OF ANY KIND. QW3 Labs, does not provide, own, or control the Ubeswap Protocol or any
              transactions conducted on the protocol or via related smart contracts. By using or accessing this
              Interface or the Ubeswap Protocol and related smart contracts, you agree that no developer or entity
              involved in creating, deploying or maintaining this Interface or the Ubeswap Protocol will be liable for
              any claims or damages whatsoever associated with your use, inability to use, or your interaction with
              other users of, this Interface or the Ubeswap Protocol, including any direct, indirect, incidental,
              special, exemplary, punitive or consequential damages, or loss of profits, digital assets, tokens, or
              anything else of value.
            </p>
          </div>
          <Checkbox checked={isDisclaimerAccepted} hovered={true} onChange={handleCheckbox}>
            <div style={{ marginRight: '10px' }}>I understand</div>
          </Checkbox>
          <AutoColumn justify="center">
            <ButtonPrimary
              disabled={!isDisclaimerAccepted}
              style={{ marginTop: '16px', width: 'fit-content', padding: '8px 20px' }}
              onClick={onDisclaimerAccepted}
            >
              OK
            </ButtonPrimary>
          </AutoColumn>
        </div>
      </Modal>
      <PageWrapper>
        {launchpad ? (
          <LaunchpadView
            options={launchpad?.options}
            participants={0}
            totalRaisedAsQuote={0}
            status="Pending"
            userTokens={0}
            userActionComponent={() => <div />}
          />
        ) : (
          <div>Loading...</div>
        )}
      </PageWrapper>
    </Trace>
  )
}
