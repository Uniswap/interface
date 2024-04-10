import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useCallback } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { getCountry } from 'react-native-localize'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { AnimatedFlex, Flex, Loader, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useFiatOnRampAggregatorTransferInstitutionsQuery } from 'wallet/src/features/fiatOnRamp/api'
import { FORTransferInstitution } from 'wallet/src/features/fiatOnRamp/types'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'
import { ModalName } from 'wallet/src/telemetry/constants'

function key(item: FORTransferInstitution): string {
  return item.id as string
}

const CEX_ICON_SIZE = iconSizes.icon36
const CEX_ICON_BORDER_RADIUS = 12

function CEXItemWrapper({
  institution,
  onSelectTransferInstitution,
}: {
  institution: FORTransferInstitution
  onSelectTransferInstitution: (transferInstitution: FORTransferInstitution) => void
}): JSX.Element | null {
  const onPress = (): void => onSelectTransferInstitution(institution)

  return (
    <TouchableArea hapticFeedback hapticStyle={ImpactFeedbackStyle.Light} onPress={onPress}>
      <Flex
        fill
        row
        alignItems="center"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        gap="$spacing12"
        maxWidth="100%"
        mx="$spacing8"
        p="$spacing16">
        <Flex grow row alignItems="center" flexShrink={1} gap="$spacing12">
          <RemoteImage
            borderRadius={CEX_ICON_BORDER_RADIUS}
            height={CEX_ICON_SIZE}
            resizeMode="cover"
            uri={institution.icon}
            width={CEX_ICON_SIZE}
          />
          <Text flexShrink={1} variant="body2">
            {institution.name}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export function TransferInstitutionSelector({ onClose }: { onClose: () => void }): JSX.Element {
  const dispatch = useAppDispatch()
  const { data, isLoading } = useFiatOnRampAggregatorTransferInstitutionsQuery({
    countryCode: getCountry(),
  })

  const onSelectTransferInstitution = useCallback(
    (transferInstitution: FORTransferInstitution) => {
      dispatch(
        openModal({
          name: ModalName.ExchangeTransferModal,
          initialState: { serviceProvider: transferInstitution },
        })
      )
      onClose()
    },
    [dispatch, onClose]
  )

  const renderItem = useCallback(
    ({ item: institution }: ListRenderItemInfo<FORTransferInstitution>) => (
      <CEXItemWrapper
        institution={institution}
        onSelectTransferInstitution={onSelectTransferInstitution}
      />
    ),
    [onSelectTransferInstitution]
  )

  return (
    <Flex grow>
      <AnimatedFlex grow entering={FadeIn} exiting={FadeOut}>
        {isLoading ? (
          <Loader.TransferInstitution iconSize={CEX_ICON_SIZE} itemsCount={5} />
        ) : (
          <BottomSheetFlatList
            ItemSeparatorComponent={renderItemSeparator}
            bounces={true}
            data={data?.institutions || []}
            keyExtractor={key}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </AnimatedFlex>
    </Flex>
  )
}

const renderItemSeparator = (): JSX.Element => <Flex pt="$spacing12" />
