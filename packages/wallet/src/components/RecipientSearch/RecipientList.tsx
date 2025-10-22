import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { memo, useCallback } from 'react'
import { ListRenderItemInfo, SectionList, SectionListData } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Text, TouchableArea } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { extractDomain } from 'uniswap/src/components/lists/items/wallets/utils'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { SearchableRecipient } from 'uniswap/src/features/address/types'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { isWebPlatform } from 'utilities/src/platform'

interface RecipientListProps {
  renderedInModal?: boolean
  sections: SectionListData<SearchableRecipient>[]
  onPress: (recipient: string) => void
}

export function RecipientList({ onPress, sections, renderedInModal = false }: RecipientListProps): JSX.Element {
  const insets = useAppInsets()

  const onRecipientPress = useCallback(
    (recipient: SearchableRecipient) => {
      onPress(recipient.address)
    },
    [onPress],
  )

  const renderItem = function ({ item }: ListRenderItemInfo<SearchableRecipient>): JSX.Element {
    return (
      // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
      <AnimatedFlex entering={FadeIn} exiting={isWebPlatform ? undefined : FadeOut} py="$spacing12">
        <RecipientRow recipient={item} onPress={onRecipientPress} />
      </AnimatedFlex>
    )
  }

  const List = renderedInModal ? BottomSheetSectionList : SectionList

  return (
    <>
      <List
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.spacing12,
        }}
        keyExtractor={key}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        renderItem={renderItem}
        renderSectionHeader={SectionHeader}
        sections={sections}
        showsVerticalScrollIndicator={false}
      />
    </>
  )
}

function SectionHeader(info: { section: SectionListData<SearchableRecipient> }): JSX.Element | null {
  return info.section.title ? (
    <AnimatedFlex
      backgroundColor="$surface1"
      entering={FadeIn}
      // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
      exiting={isWebPlatform ? undefined : FadeOut}
      py="$spacing8"
    >
      <Text color="$neutral2" variant="subheading2">
        {info.section.title}
      </Text>
    </AnimatedFlex>
  ) : null
}

function key(recipient: SearchableRecipient): string {
  return `recipient-${recipient.address}`
}

interface RecipientProps {
  recipient: SearchableRecipient
  onPress: (recipient: SearchableRecipient) => void
}

export const RecipientRow = memo(function RecipientRow({ recipient, onPress }: RecipientProps): JSX.Element {
  const domain = recipient.name
    ? extractDomain(
        recipient.name,
        recipient.isUnitag ? OnchainItemListOptionType.Unitag : OnchainItemListOptionType.ENSAddress,
      )
    : undefined

  const onPressWithAnalytics = (): void => {
    if (domain) {
      sendAnalyticsEvent(WalletEventName.SendRecipientSelected, {
        domain,
      })
    }
    onPress(recipient)
  }

  const isViewOnlyWallet = recipient.type === AccountType.Readonly
  const isUnitag = recipient.isUnitag || domain === UNITAG_SUFFIX
  const isNonUnitagSubdomain = !isUnitag && domain !== undefined && domain !== ENS_SUFFIX

  return (
    <TouchableArea onPress={onPressWithAnalytics}>
      <AddressDisplay
        includeUnitagSuffix
        address={recipient.address}
        overrideDisplayName={isNonUnitagSubdomain && recipient.name ? recipient.name : undefined}
        showViewOnlyBadge={isViewOnlyWallet}
        size={35}
      />
    </TouchableArea>
  )
})
