import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  TextInput as NativeTextInput,
} from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { WalletSelectorModal } from 'src/components/unitags/WalletSelectorModal'
import InputWithSuffix from 'src/features/import/InputWithSuffix'
import { UNITAG_SUFFIX } from 'src/features/unitags/constants'
import { AnimatedFlex, Flex, Icons, Text } from 'ui/src'
import Unitag from 'ui/src/assets/icons/unitag.svg'
import { fonts, iconSizes } from 'ui/src/theme'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { useAppDispatch } from 'wallet/src/state'

const INPUT_MIN_HEIGHT = 120
const INPUT_MIN_HEIGHT_SHORT = 90

type UnitagInputProps = {
  activeAddress: Maybe<Address>
  value: string | undefined
  errorMessage: string | undefined
  onChange: (text: string | undefined) => void
  placeholderLabel: string | undefined
  onSubmit?: () => void
  inputSuffix?: string
  liveCheck?: boolean
  showUnitagLogo: boolean
  onBlur?: () => void
  onFocus?: () => void
}

export function UnitagInput({
  activeAddress,
  value,
  inputSuffix,
  onBlur,
  onFocus,
  onSubmit,
  onChange,
  liveCheck,
  placeholderLabel,
  showUnitagLogo,
  errorMessage,
}: UnitagInputProps): JSX.Element {
  const { t } = useTranslation()
  const placeholderUnitag = t('yourname') + UNITAG_SUFFIX

  const [focused, setFocused] = useState(false)
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const [showModal, setShowModal] = useState(false)
  const textInputRef = useRef<NativeTextInput>(null)
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()

  const INPUT_FONT_SIZE = fonts.heading2.fontSize
  const INPUT_MAX_FONT_SIZE_MULTIPLIER = fonts.heading2.maxFontSizeMultiplier

  const handleBlur = (): void => {
    setFocused(false)
    onBlur?.()
  }

  const handleFocus = (): void => {
    setFocused(true)
    onFocus?.()
    // Need this to allow for focus on click on container.
    textInputRef?.current?.focus()
  }

  const handleSubmit = (): void => {
    onSubmit && onSubmit()
  }

  const onAddressPress = (): void => setShowModal(true)

  const onCloseModal = (): void => setShowModal(false)

  const onPressAccountOption = (account: Account): void => {
    dispatch(setAccountAsActive(account.address))
    setShowModal(false)
  }
  return (
    <>
      <Flex
        centered
        $short={{
          gap: '$none',
        }}
        gap="$spacing8">
        <Flex centered gap="$spacing16" width="100%" onTouchEnd={handleFocus}>
          <Flex
            centered
            shrink
            $short={{ px: '$spacing24', py: '$spacing8', minHeight: INPUT_MIN_HEIGHT_SHORT }}
            backgroundColor="$surface2"
            borderColor={
              errorMessage && (liveCheck || !focused) && value ? '$statusCritical' : '$surface2'
            }
            borderRadius="$rounded20"
            borderWidth={1}
            minHeight={INPUT_MIN_HEIGHT}
            px="$spacing36"
            py="$spacing16"
            width="100%">
            <Flex row>
              <InputWithSuffix
                blurOnSubmit
                alwaysShowInputSuffix={!showUnitagLogo}
                autoCorrect={false}
                inputAlignment="center"
                inputFontSize={INPUT_FONT_SIZE}
                inputMaxFontSizeMultiplier={INPUT_MAX_FONT_SIZE_MULTIPLIER}
                inputSuffix={value ? inputSuffix : placeholderUnitag}
                inputSuffixColor={value ? '$neutral1' : '$transparent'}
                layout={layout}
                multiline={false}
                textAlign="center"
                textInputRef={textInputRef}
                value={value}
                onBlur={handleBlur}
                onChangeText={onChange}
                onFocus={handleFocus}
                onSubmitEditing={handleSubmit}
              />
              {showUnitagLogo && <Unitag height={iconSizes.icon24} width={iconSizes.icon24} />}
            </Flex>
            {!value && (
              <AnimatedFlex
                centered
                grow
                row
                entering={FadeIn}
                exiting={FadeOut}
                pb="$spacing4"
                position="absolute"
                width="100%"
                onLayout={(event: LayoutChangeEvent): void => setLayout(event.nativeEvent.layout)}>
                {placeholderLabel && (
                  <Text
                    adjustsFontSizeToFit
                    color="$neutral3"
                    numberOfLines={1}
                    style={styles.placeholderLabelStyle}
                    variant="heading2">
                    {placeholderLabel}
                  </Text>
                )}
                <Text
                  adjustsFontSizeToFit
                  color="$neutral1"
                  numberOfLines={1}
                  style={styles.placeholderLabelStyle}
                  variant="heading2">
                  {UNITAG_SUFFIX}
                </Text>
              </AnimatedFlex>
            )}
          </Flex>
          <Flex>
            {errorMessage && value && (liveCheck || !focused) && (
              <Flex centered row gap="$spacing8">
                <Text color="$statusCritical" variant="body2">
                  {errorMessage}
                </Text>
              </Flex>
            )}
          </Flex>
          {activeAddress && (
            <Flex row alignItems="center" gap="$spacing8" onPress={onAddressPress}>
              <Icons.ArrowTurnDownRight color="$neutral3" size={iconSizes.icon24} />
              <Flex row alignItems="center">
                <AddressDisplay
                  hideAddressInSubtitle
                  address={activeAddress}
                  horizontalGap="$spacing4"
                />
                <Icons.AngleRightSmall color="$neutral2" size={iconSizes.icon16} />
              </Flex>
            </Flex>
          )}
        </Flex>
      </Flex>
      {showModal && (
        <WalletSelectorModal
          activeAccount={activeAccount}
          onClose={onCloseModal}
          onPressAccount={onPressAccountOption}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  placeholderLabelStyle: {
    flexShrink: 1,
  },
})
