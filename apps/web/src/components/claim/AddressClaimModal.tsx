import { isAddress } from '@ethersproject/address'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import Circle from 'assets/images/blue-loader.svg'
import tokenLogo from 'assets/images/token-logo.png'
import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button/buttons'
import { AutoColumn, ColumnCenter } from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import { Break, CardBGImage, CardBGImageSmaller, CardNoise, CardSection, DataCard } from 'components/earn/styled'
import { useAccount } from 'hooks/useAccount'
import styled from 'lib/styled-components'
import { useState } from 'react'
import { X } from 'react-feather'
import { useClaimCallback, useUserHasAvailableClaim, useUserUnclaimedAmount } from 'state/claim/hooks'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { ClickableStyle, CustomLightSpinner, ExternalLink, ThemedText, UniTokenAnimated } from 'theme/components'
import { Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #021d43 100%);
`

const ConfirmOrLoadingWrapper = styled.div<{ activeBG: boolean }>`
  width: 100%;
  padding: 24px;
  position: relative;
  background: ${({ activeBG }) =>
    activeBG &&
    'radial-gradient(76.02% 75.41% at 1.84% 0%, rgba(255, 0, 122, 0.2) 0%, rgba(33, 114, 229, 0.2) 100%), #FFFFFF;'};
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

const CloseIcon = styled(X)<{ onClick: () => void; $color?: string }>`
  color: ${({ theme, $color }) => $color ?? theme.neutral1};
  cursor: pointer;
  ${ClickableStyle}
`

export default function AddressClaimModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const { chainId } = useAccount()

  // state for smart contract input
  const [typed, setTyped] = useState('')
  function handleRecipientType(val: string) {
    setTyped(val)
  }

  // monitor for third party recipient of claim
  const { address: parsedAddress } = useENS({ nameOrAddress: typed })

  // used for UI loading states
  const [attempting, setAttempting] = useState<boolean>(false)

  // monitor the status of the claim from contracts and txns
  const { claimCallback } = useClaimCallback(parsedAddress)
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(parsedAddress)

  // check if the user has something available
  const hasAvailableClaim = useUserHasAvailableClaim(parsedAddress)

  const [hash, setHash] = useState<string | undefined>()

  // monitor the status of the claim from contracts and txns
  const claimPending = useIsTransactionPending(hash ?? '')
  const claimConfirmed = hash && !claimPending

  // use the hash to monitor this txn

  function onClaim() {
    setAttempting(true)
    claimCallback()
      .then((hash) => {
        setHash(hash)
      })
      // reset modal and log error
      .catch((error) => {
        setAttempting(false)
        logger.warn('AddressClaimModal', 'onClaim', 'error', error)
      })
  }

  function wrappedOnDismiss() {
    setAttempting(false)
    setHash(undefined)
    setTyped('')
    onDismiss()
  }

  const amount = unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')
  const unclaimedUni = unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')

  // Avoiding translating because the structure for "Claiming UNI for address" is wrong but this modal is rarely used
  // and ran into difficulties with testing it
  return (
    <Modal name={ModalName.AddressClaim} isModalOpen={isOpen} onClose={wrappedOnDismiss} padding={0}>
      {!attempting && (
        <ContentWrapper gap="lg">
          <ModalUpper>
            <CardBGImage />
            <CardNoise />
            <CardSection gap="md">
              <RowBetween>
                <Text color="$white" fontWeight="$medium">
                  Claim UNI token
                </Text>
                <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} stroke="white" />
              </RowBetween>
              <Text color="$white" fontWeight="$medium" fontSize={36}>
                {amount} UNI
              </Text>
            </CardSection>
            <Break />
          </ModalUpper>
          <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
            <ThemedText.DeprecatedSubHeader fontWeight={535}>
              Enter an address to trigger a UNI claim. If the address has any claimable UNI it will be sent to them on
              submission.
            </ThemedText.DeprecatedSubHeader>
            <AddressInputPanel value={typed} onChange={handleRecipientType} />
            {parsedAddress && !hasAvailableClaim && <Text color="$statusCritical">Address has no available claim</Text>}
            <ButtonPrimary
              disabled={!isAddress(parsedAddress ?? '') || !hasAvailableClaim}
              padding="16px 16px"
              width="100%"
              $borderRadius="12px"
              mt="1rem"
              onClick={onClaim}
            >
              Claim UNI
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {(attempting || claimConfirmed) && (
        <ConfirmOrLoadingWrapper activeBG={true}>
          <CardNoise />
          <CardBGImageSmaller desaturate />
          <RowBetween>
            <div />
            <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} stroke="black" />
          </RowBetween>
          <ConfirmedIcon>
            {!claimConfirmed ? (
              <CustomLightSpinner src={Circle} alt="loader" size="90px" />
            ) : (
              <UniTokenAnimated width="72px" src={tokenLogo} alt="UNI logo" />
            )}
          </ConfirmedIcon>
          <AutoColumn gap="100px" justify="center">
            <AutoColumn gap="md" justify="center">
              <ThemedText.DeprecatedLargeHeader fontWeight={535} color="black">
                {claimConfirmed ? 'Claimed' : 'Claiming'}
              </ThemedText.DeprecatedLargeHeader>
              {!claimConfirmed && (
                <Text fontSize={36} color="#ff007a" fontWeight="$medium">
                  {unclaimedUni} UNI
                </Text>
              )}
              {parsedAddress && (
                <ThemedText.DeprecatedLargeHeader fontWeight={535} color="black">
                  for {shortenAddress(parsedAddress)}
                </ThemedText.DeprecatedLargeHeader>
              )}
            </AutoColumn>
            {claimConfirmed && (
              <>
                <ThemedText.DeprecatedSubHeader fontWeight={535} color="black">
                  <span role="img" aria-label="party-hat">
                    🎉{' '}
                  </span>
                  {'Welcome to team Unicorn :) '}
                  <span role="img" aria-label="party-hat">
                    🎉
                  </span>
                </ThemedText.DeprecatedSubHeader>
              </>
            )}
            {attempting && !hash && (
              <ThemedText.DeprecatedSubHeader color="black">
                Confirm this transaction in your wallet
              </ThemedText.DeprecatedSubHeader>
            )}
            {attempting && hash && !claimConfirmed && chainId && hash && (
              <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)} style={{ zIndex: 99 }}>
                View transaction on Explorer
              </ExternalLink>
            )}
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
    </Modal>
  )
}
