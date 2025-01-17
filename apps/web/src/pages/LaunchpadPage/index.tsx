/* eslint-disable @typescript-eslint/no-unused-vars */
import { BigNumber } from '@ethersproject/bignumber'
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
import { formatUnits } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { useUbestarterLaunchpadV1 } from 'hooks/useContract'
import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { getUserSignatureAtom } from 'pages/LaunchpadCreate/launchpad-state'
import { useLaunchpad } from 'pages/LaunchpadList/data/useLaunchpads'
import { useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import LaunchpadAction from './LaunchpadAction'
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

const disclaimerMsg = `Ubestarter provides a platform for decentralized application (DApp) developers to launch new projects and for users to participate in these projects by purchasing tokens. The information provided on Ubestarter's website and through its services is for general informational purposes only and should not be considered financial, legal, or investment advice.
Cryptocurrency investments are inherently risky and subject to market fluctuations. The value of tokens is highly volatile, and investors may lose all or a substantial portion of their investment. Users should conduct their own research, assess their risk tolerance, and consult a financial advisor before making any investment decisions.
Ubestarter does not guarantee the success of any project or the performance of any token issued through its platform. The success of blockchain projects and the utility of their tokens can be affected by a multitude of factors beyond our control.
Users are responsible for ensuring that their participation in token sales and their use of Ubestarter's services comply with laws and regulations in their jurisdiction, including but not limited to securities laws, anti-money laundering (AML) and know your customer (KYC) requirements.
Ubestarter, its affiliates, and its service providers will not be liable for any loss or damage arising from your use of the platform, including, but not limited to, any losses, damages, or claims arising from: (a) user error, such as forgotten passwords or incorrectly construed smart contracts; (b) server failure or data loss; (c) unauthorized access or activities by third parties, including the use of viruses, phishing, brute-forcing, or other means of attack against the platform or cryptocurrency wallets.
This disclaimer is subject to change at any time without notice. It is the user's responsibility to review it regularly to stay informed of any changes.
By using the Ubestarter, you acknowledge that you have read this disclaimer, understand it, and agree to be bound by its terms.`

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
  const { account, provider } = useWeb3React()
  const chainId = ChainId.CELO
  const { launchpadAddress } = useParams<{ launchpadAddress: string }>()
  const { launchpad, loading } = useLaunchpad(launchpadAddress)

  const [signature, setSignature] = useAtom(getUserSignatureAtom(account))
  const [isDisclaimerNecessary, setIsDisclaimerNecessary] = useState(false)
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false)

  const token = useToken(launchpad?.options.tokenInfo.tokenAddress, ChainId.CELO)
  const contract = useUbestarterLaunchpadV1(launchpadAddress)
  const call1 = useSingleCallResult(contract, 'getParticipantTotalTokenAmount', [account])
  const userTotalTokenAmountBn = call1.result?.[0] as BigNumber | undefined
  const userTotalTokenAmount = userTotalTokenAmountBn
    ? parseFloat(formatUnits(userTotalTokenAmountBn, token?.decimals))
    : 0
  const call2 = useSingleCallResult(contract, 'getParticipantUnclaimedAmount', [account])
  const userUnclaimedAmountBn = call2.result?.[0] as BigNumber | undefined
  console.log('userUnclaimedAmountBn', userUnclaimedAmountBn?.toString())
  const userUnclaimedAmount = userUnclaimedAmountBn
    ? parseFloat(formatUnits(userUnclaimedAmountBn, token?.decimals))
    : 0
  const showDisclaimer = useMemo(() => {
    return !(signature && signature.length > 5) && isDisclaimerNecessary
  }, [signature, isDisclaimerNecessary])
  const handleCheckbox = () => {
    setIsDisclaimerAccepted(!isDisclaimerAccepted)
  }
  const signDisclaimer = async () => {
    const signature = await provider?.getSigner().signMessage('I accept the following disclaimer:\n' + disclaimerMsg)
    if (signature && signature.length > 5) {
      setSignature(signature)
    }
  }
  const onBuyAction = () => {
    setIsDisclaimerNecessary(true)
  }

  if (!isSupportedChain(chainId)) {
    return <WrongNetworkCard />
  }

  return (
    <Trace page={InterfacePageName.FARM_V3} shouldLogImpression>
      <Modal isOpen={showDisclaimer} $scrollOverlay={true} maxWidth={550}>
        <div style={{ padding: '16px' }}>
          <div>
            {disclaimerMsg.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <Checkbox checked={isDisclaimerAccepted} hovered={true} onChange={handleCheckbox}>
            <div style={{ marginRight: '10px' }}>I accept this disclaimer</div>
          </Checkbox>
          <AutoColumn justify="center">
            <ButtonPrimary
              disabled={!isDisclaimerAccepted}
              style={{ marginTop: '16px', width: 'fit-content', padding: '8px 20px' }}
              onClick={signDisclaimer}
            >
              Sign With Wallet
            </ButtonPrimary>
          </AutoColumn>
        </div>
      </Modal>
      <PageWrapper>
        {launchpad && launchpadAddress ? (
          <LaunchpadView
            options={launchpad.options}
            participants={launchpad.stats.participants}
            totalRaisedAsQuote={launchpad.stats.totalRaised}
            status={launchpad.stats.status}
            userTokens={userTotalTokenAmount}
            userClaimableTokens={userUnclaimedAmount}
            launchpadAddress={launchpadAddress}
            userActionComponent={() => (
              <LaunchpadAction launchpadAddress={launchpadAddress} launchpad={launchpad} onBuy={onBuyAction} />
            )}
          />
        ) : (
          <div>Loading...</div>
        )}
      </PageWrapper>
    </Trace>
  )
}
