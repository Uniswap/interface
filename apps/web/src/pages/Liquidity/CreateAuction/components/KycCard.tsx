import { type PropsWithChildren, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { UserCheck } from 'ui/src/components/icons/UserCheck'
import { X } from 'ui/src/components/icons/X'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { shortenAddress } from 'utilities/src/addresses'
import { KycHookSetupModal } from '~/pages/Liquidity/CreateAuction/components/KycHookSetupModal'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { ExternalLink } from '~/theme/components/Links'

function KycCardShell({ children }: PropsWithChildren) {
  return (
    <Flex borderWidth={1} borderColor="$surface3" borderRadius="$rounded12" p="$spacing12" gap="$spacing8" width="100%">
      {children}
    </Flex>
  )
}

function KycCardTitleRow() {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="center" flexShrink={1} flexWrap="wrap" gap="$spacing4">
      <Text variant="buttonLabel3" color="$neutral1">
        {t('toucan.details.kyc')}
      </Text>
      <Text variant="buttonLabel3" color="$neutral2">
        {t('toucan.createAuction.step.configureAuction.kyc.advanced')}
      </Text>
    </Flex>
  )
}

function KycDescriptionAndLearnMore() {
  const { t } = useTranslation()
  return (
    <>
      <Text variant="body4" color="$neutral1">
        {t('toucan.createAuction.step.configureAuction.kyc.description')}
      </Text>
      <ExternalLink href={UniswapHelpUrls.articles.toucanLaunchAuctionConfigureAuctionHelp}>
        <Text variant="buttonLabel4" color="$neutral2">
          {t('toucan.createAuction.step.configureAuction.kyc.learnMore')}
        </Text>
      </ExternalLink>
    </>
  )
}

export function KycCard() {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const kycValidationHookAddress = useCreateAuctionStore((s) => s.configureAuction.kycValidationHookAddress)
  const committed = useCreateAuctionStore((s) => s.configureAuction.committed)
  const { setKycValidationHookAddress } = useCreateAuctionStoreActions()

  const chainId = committed?.totalSupply.currency.chainId

  const openModal = useCallback(() => {
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const handleAccepted = (address: string) => {
    setKycValidationHookAddress(address)
  }

  const handleRemove = () => {
    setKycValidationHookAddress(undefined)
  }

  if (!chainId) {
    return null
  }

  if (kycValidationHookAddress) {
    const short = shortenAddress({ address: kycValidationHookAddress, chars: 6 })

    return (
      <KycCardShell>
        <Flex row alignItems="center" justifyContent="space-between" width="100%" gap="$spacing10">
          <KycCardTitleRow />
          <Flex
            row
            alignItems="center"
            gap={2}
            px="$spacing4"
            py="$spacing2"
            borderRadius="$rounded6"
            backgroundColor="$accent1"
            flexShrink={0}
          >
            <Check size="$icon.12" color="$surface1" />
            <Text fontSize={8} lineHeight={12} fontWeight="$medium" color="$surface1">
              {t('toucan.createAuction.step.configureAuction.kyc.card.enabledBadge')}
            </Text>
          </Flex>
        </Flex>

        <Flex gap="$spacing8">
          <KycDescriptionAndLearnMore />
        </Flex>

        <Flex
          row
          alignItems="center"
          gap="$spacing4"
          width="100%"
          px="$spacing12"
          py="$spacing8"
          borderRadius="$rounded12"
          backgroundColor="$surface3"
        >
          <UserCheck color="$neutral1" size="$icon.16" />
          <Text variant="buttonLabel4" color="$neutral1" flex={1}>
            {short}
          </Text>
          <TouchableArea onPress={handleRemove} hitSlop={8} opacity={0.6} hoverStyle={{ opacity: 1 }}>
            <X color="$neutral1" size="$icon.16" />
          </TouchableArea>
        </Flex>
      </KycCardShell>
    )
  }

  return (
    <>
      <KycCardShell>
        <KycCardTitleRow />

        <Flex gap="$spacing8" flex={1}>
          <KycDescriptionAndLearnMore />
        </Flex>

        <Flex row>
          <Button size="small" emphasis="secondary" fill onPress={openModal}>
            {t('toucan.createAuction.step.configureAuction.kyc.setUp')}
          </Button>
        </Flex>
      </KycCardShell>

      <KycHookSetupModal isOpen={modalOpen} onClose={closeModal} chainId={chainId} onAccepted={handleAccepted} />
    </>
  )
}
