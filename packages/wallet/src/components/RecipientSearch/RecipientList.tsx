import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { ListRenderItemInfo, SectionList, SectionListData } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex, Text, TouchableArea, isWeb, useDeviceInsets } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { SearchableRecipient } from 'wallet/src/features/address/types'
import { SearchResultType, extractDomain } from 'wallet/src/features/search/SearchResult'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { WalletEventName } from 'wallet/src/telemetry/constants'

interface RecipientListProps {
  renderedInModal?: boolean
  sections: SectionListData<SearchableRecipient>[]
  onPress: (recipient: string) => void
}

export function RecipientList({
  onPress,
  sections,
  renderedInModal = false,
}: RecipientListProps): JSX.Element {
  const insets = useDeviceInsets()

  const renderItem = function ({ item }: ListRenderItemInfo<SearchableRecipient>): JSX.Element {
    return (
      // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
      <AnimatedFlex entering={FadeIn} exiting={isWeb ? undefined : FadeOut} py="$spacing12">
        <RecipientRow recipient={item} onPress={onPress} />
      </AnimatedFlex>
    )
  }

  const List = renderedInModal ? BottomSheetSectionList : SectionList

  return (
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
  )
}

function SectionHeader(info: { section: SectionListData<SearchableRecipient> }): JSX.Element {
  return (
    <AnimatedFlex
      backgroundColor="$surface1"
      entering={FadeIn}
      // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
      exiting={isWeb ? undefined : FadeOut}
      py="$spacing8">
      <Text color="$neutral2" variant="subheading2">
        {info.section.title}
      </Text>
    </AnimatedFlex>
  )
}

function key(recipient: SearchableRecipient): string {
  return `recipient-${recipient.address}`
}

interface RecipientProps {
  recipient: SearchableRecipient
  onPress: (recipient: string) => void
}

export function RecipientRow({ recipient, onPress }: RecipientProps): JSX.Element {
  const domain = recipient.name
    ? extractDomain(
        recipient.name,
        recipient.isUnitag ? SearchResultType.Unitag : SearchResultType.ENSAddress
      )
    : undefined

  const onPressWithAnalytics = (): void => {
    if (domain) {
      sendWalletAnalyticsEvent(WalletEventName.SendRecipientSelected, {
        domain,
      })
    }
    onPress(recipient.address)
  }

  const isNonUnitagSubdomain = !recipient.isUnitag && domain !== undefined && domain !== '.eth'

  return (
    <TouchableArea hapticFeedback onPress={onPressWithAnalytics}>
      <AddressDisplay
        address={recipient.address}
        overrideDisplayName={isNonUnitagSubdomain && recipient.name ? recipient.name : undefined}
        size={35}
      />
    </TouchableArea>
  )
}
