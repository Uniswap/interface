import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, SpinningLoader, Text, View } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import tokenLogo from '~/assets/images/token-logo.png'
import { isAddress } from '~/chains'
import { AddressInputPanel } from '~/features/claim/AddressInputPanel'
import { useClaimCallback, useUserHasAvailableClaim, useUserUnclaimedAmount } from '~/features/claim/hooks'
import { Break, CardBGImage, CardBGImageSmaller, CardNoise, CardSection } from '~/features/claim/styled'
import { UniTokenAnimated } from '~/features/claim/UniTokenAnimated'
import { useAccount } from '~/hooks/useAccount'
import { ModalState } from '~/hooks/useModalState'
import { useIsTransactionPending } from '~/state/transactions/hooks'
import { ExternalLink } from '~/theme/components/Links'

const CLAIM_LOADER_COLOR = '#2172E5'
const CLAIM_LOADER_SIZE = 90

export default function AddressClaimModal({ isOpen, closeModal }: ModalState) {
  const { t } = useTranslation()
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
      // oxlint-disable-next-line no-shadow
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
            <CardSection gap="$gap12">
              <Flex row justifyContent="space-between" alignItems="center">
                <Text color="$white" fontWeight="$medium">
                  {t('addressClaim.title')}
                </Text>
                <CloseIconWithHover onClose={wrappedOnDismiss} color="$white" hoverColor="$neutral3" />
              </Flex>
              <Text color="$white" fontWeight="$medium" fontSize={36}>
                {t('addressClaim.amountUni', { amount: amount ?? '' })}
              </Text>
            </CardSection>
            <Break />
          </Flex>
          <Flex gap="$gap12" px="$spacing16" pb="$spacing16" pt={0} alignItems="stretch" width="100%">
            <Text variant="subheading1" color="$white">
              {t('addressClaim.description')}
            </Text>
            <AddressInputPanel value={typed} onChange={handleRecipientType} />
            {parsedAddress && !hasAvailableClaim && <Text color="$statusCritical">{t('addressClaim.noClaim')}</Text>}
            <Flex row>
              <Button
                variant="branded"
                size="large"
                disabled={!isAddress(parsedAddress ?? '') || !hasAvailableClaim}
                borderRadius="$rounded12"
                mt="$spacing16"
                onPress={onClaim}
              >
                {t('addressClaim.cta')}
              </Button>
            </Flex>
          </Flex>
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
              <Flex
                width={CLAIM_LOADER_SIZE}
                height={CLAIM_LOADER_SIZE}
                aria-label={t('addressClaim.loaderAlt')}
                role="status"
                $platform-web={{ color: CLAIM_LOADER_COLOR }}
              >
                <SpinningLoader unstyled size={CLAIM_LOADER_SIZE} />
              </Flex>
            ) : (
              <UniTokenAnimated width="72px" src={tokenLogo} alt={t('addressClaim.uniLogoAlt')} />
            )}
          </Flex>
          <Flex gap={100} justifyContent="center">
            <Flex gap="$gap8" justifyContent="center" alignItems="center">
              <Text variant="heading1" color="$black" textAlign="center">
                {claimConfirmed ? t('addressClaim.claimed') : t('addressClaim.claiming')}
              </Text>
              {!claimConfirmed && (
                <Text fontSize={36} color="#ff007a" fontWeight="$medium" textAlign="center">
                  {t('addressClaim.amountUni', { amount: unclaimedUni ?? '' })}
                </Text>
              )}
              {parsedAddress && (
                <Text variant="subheading1" color="$black" textAlign="center">
                  {t('addressClaim.forAddress', {
                    address: shortenAddress({ address: parsedAddress }),
                  })}
                </Text>
              )}
            </Flex>
            {claimConfirmed && (
              <>
                <Text variant="subheading1" color="$black">
                  <span role="img" aria-label="party-hat">
                    🎉{' '}
                  </span>
                  {t('addressClaim.welcome')}
                  <span role="img" aria-label="party-hat">
                    {' '}
                    🎉
                  </span>
                </Text>
              </>
            )}
            {attempting && !hash && (
              <Text variant="subheading1" color="$black" mb="$spacing16">
                {t('addressClaim.confirmWallet')}
              </Text>
            )}
            {attempting && hash && !claimConfirmed && chainId && hash && (
              <ExternalLink
                href={getExplorerLink({ chainId, data: hash, type: ExplorerDataType.TRANSACTION })}
                style={{ zIndex: 99 }}
              >
                {t('addressClaim.viewExplorer')}
              </ExternalLink>
            )}
          </Flex>
        </View>
      )}
    </Modal>
  )
}
