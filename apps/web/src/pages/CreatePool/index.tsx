import { InterfaceElementName, InterfaceEventName, InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Loader from 'components/Icons/LoadingSpinner'
import { Trans } from 'i18n'
import styled from 'styled-components'
import { ThemedText } from 'theme/components/text'
import Trace from 'uniswap/src/features/telemetry/Trace'

import { ButtonPrimary } from '../../components/Button'
import { OutlineCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CreateModal from '../../components/createPool/CreateModal'
//import PoolCard from '../../components/earn/PoolCard'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import PoolPositionList from '../../components/PoolPositionList'
import { RowBetween, RowFixed } from '../../components/Row'
import { useModalIsOpen, useToggleCreateModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useAllPoolsData } from '../../state/pool/hooks'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 640px;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`

//const PoolSection = styled.div`
//  display: grid;
//  grid-template-columns: 1fr;
//  column-gap: 10px;
//  row-gap: 15px;
//  width: 100%;
//  justify-self: center;
//`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
flex-direction: column;
`};
`

const WrapSmall = styled(RowBetween)`
  margin-bottom: 1rem;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-wrap: wrap;
  `};
`

export default function CreatePool() {
  const { account } = useWeb3React()
  const toggleWalletDrawer = useToggleAccountDrawer()

  const showDelegateModal = useModalIsOpen(ApplicationModal.CREATE)
  const toggleCreateModal = useToggleCreateModal()

  const { data: allPools, loading: loadingPools } = useAllPoolsData()

  return (
    <Trace logImpression page={InterfacePageName.POOL_PAGE}>
      <PageWrapper gap="lg" justify="center">
        <TopSection gap="md">
          <DataCard>
            <CardBGImage />
            <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedWhite fontWeight={600}>
                    <Trans>Rigoblock Pools</Trans>
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
                <RowBetween>
                  <ThemedText.DeprecatedWhite fontSize={14}>
                    <Trans>Your smart interface with DeFi. Create, mint, swap, earn on your tokens.</Trans>
                  </ThemedText.DeprecatedWhite>
                </RowBetween>{' '}
              </AutoColumn>
            </CardSection>
            <CardBGImage />
            <CardNoise />
          </DataCard>
        </TopSection>

        <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
          <DataRow style={{ alignItems: 'baseline' }}>
            <CreateModal isOpen={showDelegateModal} onDismiss={toggleCreateModal} title={<Trans>Create Pool</Trans>} />
            <WrapSmall>
              <ThemedText.DeprecatedMediumHeader style={{ marginTop: '0.5rem' }}>
                <Trans>Pools</Trans>
              </ThemedText.DeprecatedMediumHeader>
              <RowFixed gap="8px" style={{ marginRight: '4px' }}>
                {account ? (
                  <ButtonPrimary
                    style={{ width: 'fit-content', height: '40px' }}
                    padding="8px"
                    $borderRadius="8px"
                    onClick={toggleCreateModal}
                  >
                    <Trans>Create Pool</Trans>
                  </ButtonPrimary>
                ) : (
                  <Trace
                    logPress
                    eventOnTrigger={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                    properties={{ received_swap_quote: false }}
                    element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                  >
                    <ButtonPrimary
                      style={{ marginTop: '2em', marginBottom: '2em', padding: '8px 16px' }}
                      onClick={toggleWalletDrawer}
                    >
                      <Trans i18nKey="common.connectAWallet.button" />
                    </ButtonPrimary>
                  </Trace>
                )}
              </RowFixed>
            </WrapSmall>
          </DataRow>

          <MainContentWrapper>
            {/* TODO: check why on some mobile wallets pool list not rendered */}
            {!account ? (
              <OutlineCard>
                <Trans>Please connect your wallet</Trans>
              </OutlineCard>
            ) : loadingPools ? (
              <Loader style={{ margin: 'auto' }} />
            ) : allPools && allPools?.length > 0 ? (
              <PoolPositionList positions={allPools} filterByOperator={true} />
            ) : allPools && allPools?.length === 0 ? (
              <OutlineCard>
                <Trans>No pool found, create your own!</Trans>
              </OutlineCard>
            ) : null}
          </MainContentWrapper>
        </AutoColumn>
      </PageWrapper>
    </Trace>
  )
}
