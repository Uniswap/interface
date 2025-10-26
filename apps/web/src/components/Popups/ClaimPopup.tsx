import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import tokenLogo from 'assets/images/token-logo.png'
import { CardBGImage, CardNoise } from 'components/earn/styled'
import { useAccount } from 'hooks/useAccount'
import { useModalState } from 'hooks/useModalState'
import { useEffect } from 'react'
import { Heart } from 'react-feather'
import { Trans } from 'react-i18next'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from 'state/claim/hooks'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const rotateKeyframe = `
  @keyframes rotate {
  0% {
    transform: perspective(1000px) rotateY(0deg);
  }

  100% {
    transform: perspective(1000px) rotateY(360deg);
  }
`

export default function ClaimPopup() {
  const account = useAccount()

  // dont store these in persisted state yet
  const { isOpen: claimPopupIsOpen, toggleModal: toggleClaimPopup } = useModalState(ModalName.ClaimPopup)

  // toggle for showing this modal
  const { isOpen: showClaimModal, toggleModal: toggleClaimModal } = useModalState(ModalName.AddressClaim)

  // const userHasAvailableclaim = useUserHasAvailableClaim()
  const userHasAvailableclaim: boolean = useUserHasAvailableClaim(account.address)
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account.address)

  // listen for available claim and show popup if needed
  // biome-ignore lint/correctness/useExhaustiveDependencies: toggleClaimPopup function changes every time the popup changes, so this will cause an infinite loop
  useEffect(() => {
    if (userHasAvailableclaim) {
      toggleClaimPopup()
    }
  }, [userHasAvailableclaim])

  return (
    <Flex
      position="absolute"
      top="$spacing12"
      width="100vw"
      alignItems="flex-end"
      pr="$spacing12"
      $sm={{
        alignItems: 'center',
        pr: '$none',
      }}
    >
      <style>{rotateKeyframe}</style>
      <Flex $platform-web={{ position: 'fixed' }} maxWidth={348} width="100%" zIndex="$fixed" animation="fast">
        {claimPopupIsOpen && !showClaimModal && (
          <Flex
            gap="$spacing8"
            borderRadius="$rounded20"
            padding="$spacing24"
            overflow="hidden"
            position="relative"
            maxWidth={360}
            style={{
              background: 'linear-gradient(180deg, #FF007A 0%, #021D43 100%)',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CardBGImage />
            <CardNoise />
            <TouchableArea onPress={toggleClaimPopup} ml="auto">
              <X color="$white" size="$icon.16" />
            </TouchableArea>
            <Flex centered py="$spacing32" zIndex={10}>
              <img
                width="48px"
                src={tokenLogo}
                style={{
                  animation: `rotate 5s cubic-bezier(0.83, 0, 0.17, 1) infinite`,
                }}
              />{' '}
              <Text variant="heading2" color="white" mt="$spacing16">
                {unclaimedAmount?.toFixed(0, { groupSeparator: ',' }) ?? '-'} UNI
              </Text>
              <Text variant="subheading2" color="white" mt="$spacing20">
                <span role="img" aria-label="party">
                  🎉
                </span>{' '}
                <Trans i18nKey="claim.uni.arrived" />{' '}
                <span role="img" aria-label="party">
                  🎉
                </span>
              </Text>
              <Text variant="body3" color="white" mt="$spacing8" textAlign="center">
                <Trans
                  i18nKey="claim.thanks"
                  components={{
                    heart: <Heart size={12} />,
                  }}
                />
              </Text>
            </Flex>
            <Flex centered zIndex={10}>
              <Button variant="branded" fill={false} onPress={toggleClaimModal}>
                <Trans i18nKey="common.claimUnis" />
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
