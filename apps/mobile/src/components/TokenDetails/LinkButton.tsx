import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useSelector } from 'react-redux'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Flex, GeneratedIcon, IconProps, Text, TouchableArea } from 'ui/src'
import { CopySheets } from 'ui/src/components/icons'
import { selectHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/selectors'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'

export enum LinkButtonType {
  Copy = 'copy',
  Link = 'link',
}

export type LinkButtonProps = {
  label: string
  Icon?: React.FC<SvgProps & { size?: IconProps['size'] }> | GeneratedIcon
  element: ElementName
  openExternalBrowser?: boolean
  isSafeUri?: boolean
  testID?: TestIDType
  /** Override default press behavior (link/copy). When provided, buttonType and value are unused. */
  onPress?: () => void
  /** Controls default press behavior and icon display. Not required when onPress is provided. */
  buttonType?: LinkButtonType
  /** URI to open or address to copy. Not required when onPress is provided. */
  value?: string
}

export function LinkButton({
  buttonType,
  label,
  Icon,
  element,
  openExternalBrowser = false,
  isSafeUri = false,
  value,
  testID,
  onPress: onPressProp,
}: LinkButtonProps): JSX.Element {
  const hasViewedContractAddressExplainer = useSelector(selectHasViewedContractAddressExplainer)
  const { openContractAddressExplainerModal, copyAddressToClipboard } = useTokenDetailsContext()

  const copyValue = async (): Promise<void> => {
    if (!value) {
      return
    }
    if (!hasViewedContractAddressExplainer) {
      openContractAddressExplainerModal()
      return
    }
    await copyAddressToClipboard(value)

    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CopyAddress,
      screen: MobileScreens.TokenDetails,
    })
  }

  const onPress = async (): Promise<void> => {
    if (onPressProp) {
      onPressProp()
      return
    }
    if (buttonType === LinkButtonType.Link && value) {
      await openUri({ uri: value, openExternalBrowser, isSafeUri })
    } else {
      await copyValue()
    }
  }

  return (
    <Trace logPress element={element}>
      <TouchableArea
        backgroundColor="$surface3"
        borderRadius="$roundedFull"
        p="$spacing8"
        pr="$spacing12"
        testID={testID}
        onPress={onPress}
      >
        <Flex centered row shrink gap="$spacing8" width="auto">
          {Icon && <Icon color="$neutral1" size="$icon.20" />}
          <Text $short={{ variant: 'buttonLabel3' }} color="$neutral1" variant="buttonLabel2">
            {label}
          </Text>
          {buttonType === LinkButtonType.Copy && <CopySheets color="$neutral2" size="$icon.20" />}
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
