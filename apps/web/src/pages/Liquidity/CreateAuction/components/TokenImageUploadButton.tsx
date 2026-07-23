import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, TouchableArea, UniversalImage, UniversalImageResizeMode } from 'ui/src'
import { ImageUpload } from 'ui/src/components/icons/ImageUpload'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

/**
 * The token-logo upload button from the create-token form: circular preview / upload affordance
 * with a processing overlay. Presentational — pair with `useTokenImageUpload` for the flow.
 */
export function TokenImageUploadButton({
  displayImageUri,
  isProcessing,
  onPress,
  size = 80,
}: {
  displayImageUri?: string
  isProcessing: boolean
  onPress: () => void
  size?: number
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Trace logPress element={ElementName.AuctionTokenImageUpload}>
      <TouchableArea
        width={size}
        height={size}
        borderRadius="$roundedFull"
        backgroundColor="$surface3"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('toucan.createAuction.step.tokenInfo.image.upload')}
      >
        {displayImageUri ? (
          <UniversalImage
            uri={displayImageUri}
            size={{ width: size, height: size, resizeMode: UniversalImageResizeMode.Cover }}
            allowLocalUri
          />
        ) : (
          <ImageUpload color="$neutral2" size="$icon.24" />
        )}
        {isProcessing && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            alignItems="center"
            justifyContent="center"
            backgroundColor="$scrim"
          >
            <SpinningLoader color="$white" />
          </Flex>
        )}
      </TouchableArea>
    </Trace>
  )
}
