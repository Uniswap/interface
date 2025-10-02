import { isAddress } from '@ethersproject/address'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import Circle from 'assets/images/blue-loader.svg'
import tokenLogo from 'assets/images/token-logo.png'
import AddressInputPanel from 'components/AddressInputPanel'
import { AutoColumn } from 'components/deprecated/Column'
import { Break, CardBGImage, CardBGImageSmaller, CardNoise, CardSection } from 'components/earn/styled'
import { useAccount } from 'hooks/useAccount'
import { ModalState } from 'hooks/useModalState'
import { useState } from 'react'
import { useClaimCallback, useUserHasAvailableClaim, useUserUnclaimedAmount } from 'state/claim/hooks'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { CustomLightSpinner } from 'theme/components/icons/spinner'
import { UniTokenAnimated } from 'theme/components/icons/uniTokenAnimated'
import { ExternalLink } from 'theme/components/Links'
import { Button, Flex, Text, View } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'

export default function AddressClaimModal({ isOpen, closeModal }: ModalState) {
  const account = useAccount()
  const { chainId } = account
  // state for smart contract input
  const [typed, setTyped] = useState(account.address ?? '')
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
    closeModal()
  }

  const amount = unclaimedAmount?.toFixed(0, { groupSeparator: ',' })
  const unclaimedUni = unclaimedAmount?.toFixed(0, { groupSeparator: ',' })

  // Avoiding translating because the structure for "Claiming UNI for address" is wrong but this modal is rarely used
  // and ran into difficulties with testing it
  return (
    <Modal name={ModalName.AddressClaim} isModalOpen={isOpen} onClose={wrappedOnDismiss} padding={0}>
      {!attempting && (
        <Flex gap="$gap12" width="100%">
          <Flex
            width="100%"
            position="relative"
            overflow="hidden"
            $platform-web={{ background: 'radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #021d43 100%)' }}
            borderRadius="$rounded12"
            boxShadow="0px 4px 10px rgba(0, 0, 0, 0.1)"
          >
            <CardBGImage />
            <CardNoise />
            <CardSection gap="md">
              <Flex row justifyContent="space-between" alignItems="center">
                <Text color="$white" fontWeight="$medium">
                  Claim UNI token
                </Text>
                <CloseIconWithHover onClose={wrappedOnDismiss} />
              </Flex>
              <Text color="$white" fontWeight="$medium" fontSize={36}>
                {amount} UNI
              </Text>
            </CardSection>
            <Break />
          </Flex>
          <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
            <Text variant="subheading1" color="$white">
              Enter an address to trigger a UNI claim. If the address has any claimable UNI it will be sent to them on
              submission.
            </Text>
            <AddressInputPanel value={typed} onChange={handleRecipientType} />
            {parsedAddress && !hasAvailableClaim && <Text color="$statusCritical">Address has no available claim</Text>}
            <Flex row>
              <Button
                variant="branded"
                size="large"
                isDisabled={!isAddress(parsedAddress ?? '') || !hasAvailableClaim}
                borderRadius="$rounded12"
                mt="$spacing16"
                onPress={onClaim}
              >
                Claim UNI
              </Button>
            </Flex>
          </AutoColumn>
        </Flex>
      )}
      {(attempting || claimConfirmed) && (
        <View
          width="100%"
          p="$padding24"
          position="relative"
          alignItems="center"
          $platform-web={{
            background:
              'radial-gradient(76.02% 75.41% at 1.84% 0%, rgba(255, 0, 122, 0.2) 0%, rgba(33, 114, 229, 0.2) 100%), #FFFFFF;',
          }}
        >
          <CardNoise />
          <CardBGImageSmaller desaturate />
          <Flex row alignItems="center" width="100%" pl="$padding16" pt="$padding16">
            <CloseIconWithHover onClose={wrappedOnDismiss} />
          </Flex>
          <Flex justifyContent="center" alignItems="center" py={60}>
            {!claimConfirmed ? (
              <CustomLightSpinner src={Circle} alt="loader" size="90px" />
            ) : (
              <UniTokenAnimated width="72px" src={tokenLogo} alt="UNI logo" />
            )}
          </Flex>
          <Flex gap={100} justifyContent="center">
            <Flex gap="$gap8" justifyContent="center" alignItems="center">
              <Text variant="heading1" color="$black">
                {claimConfirmed ? 'Claimed' : 'Claiming'}
              </Text>
              {!claimConfirmed && (
                <Text fontSize={36} color="#ff007a" fontWeight="$medium">
                  {unclaimedUni} UNI
                </Text>
              )}
              {parsedAddress && (
                <Text variant="subheading1" color="$black">
                  for {shortenAddress({ address: parsedAddress })}
                </Text>
              )}
            </Flex>
            {claimConfirmed && (
              <>
                <Text variant="subheading1" color="$black">
                  <span role="img" aria-label="party-hat">
                    🎉{' '}
                  </span>
                  {'Welcome to team Unicorn :) '}
                  <span role="img" aria-label="party-hat">
                    🎉
                  </span>
                </Text>
              </>
            )}
            {attempting && !hash && (
              <Text variant="subheading1" color="$black" mb="$spacing16">
                Confirm this transaction in your wallet
              </Text>
            )}
            {attempting && hash && !claimConfirmed && chainId && hash && (
              <ExternalLink
                href={getExplorerLink({ chainId, data: hash, type: ExplorerDataType.TRANSACTION })}
                style={{ zIndex: 99 }}
              >
                View transaction on Explorer
              </ExternalLink>
            )}
          </Flex>
        </View>
      )}
    </Modal>
  )
}
