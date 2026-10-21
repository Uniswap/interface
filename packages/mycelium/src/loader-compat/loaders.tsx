// The legacy Loader namespace's sub-loaders, ported onto the compat primitives.
// No leg split of their own — primitives compose by their base specifier.
import { isWebPlatform } from '@universe/environment'
import type { JSX } from 'react'
import { FlexCompat } from '../flex-compat/FlexCompat'
import type { FlexCompatProps } from '../flex-compat/props'
import { TextCompat } from '../text-compat/TextCompat'
import { iconSizes } from '../tokens'

const TOKEN_LOADER_LOGO_SIZE = isWebPlatform ? iconSizes.icon36 : iconSizes.icon40

interface TokenLoaderProps {
  opacity: number
  withPrice?: boolean
}

export function TokenLoader({ opacity, withPrice = false }: TokenLoaderProps): JSX.Element {
  return (
    <FlexCompat
      alignItems="flex-start"
      flexDirection="row"
      justifyContent="space-between"
      opacity={opacity}
      py="$spacing8"
    >
      <FlexCompat grow row alignItems="center" gap="$spacing12" overflow="hidden">
        <FlexCompat
          backgroundColor="$neutral3"
          borderRadius="$roundedFull"
          height={TOKEN_LOADER_LOGO_SIZE}
          width={TOKEN_LOADER_LOGO_SIZE}
        />

        <FlexCompat grow alignItems="flex-start">
          <TextCompat
            loading="no-shimmer"
            loadingPlaceholderText="Token Full Name"
            numberOfLines={1}
            variant={isWebPlatform ? 'body3' : 'body1'}
          />
          <FlexCompat row alignItems="center" gap="$spacing8" minHeight={20}>
            <TextCompat
              loading="no-shimmer"
              loadingPlaceholderText="1,000 TFN"
              numberOfLines={1}
              variant={isWebPlatform ? 'body4' : 'body2'}
            />
          </FlexCompat>
        </FlexCompat>

        {withPrice && (
          <FlexCompat alignItems="flex-end">
            <TextCompat loading="no-shimmer" loadingPlaceholderText="$XX.XX" numberOfLines={1} variant="body1" />
            <FlexCompat row alignItems="center" gap="$spacing8" minHeight={20}>
              <TextCompat
                loading="no-shimmer"
                loadingPlaceholderText="X.XX%"
                numberOfLines={1}
                variant={isWebPlatform ? 'subheading2' : 'body2'}
              />
            </FlexCompat>
          </FlexCompat>
        )}
      </FlexCompat>
    </FlexCompat>
  )
}

interface TransactionLoaderProps {
  opacity: number
}

export const TXN_HISTORY_LOADER_ICON_SIZE = iconSizes.icon40

export function TransactionLoader({ opacity }: TransactionLoaderProps): JSX.Element {
  return (
    <FlexCompat opacity={opacity} overflow="hidden" className="TransactionLoader">
      <FlexCompat grow row alignItems="flex-start" gap="$spacing16" justifyContent="space-between" py="$spacing12">
        <FlexCompat row shrink alignItems="center" gap="$spacing12" height="100%" justifyContent="flex-start">
          <FlexCompat
            centered
            backgroundColor="$surface2"
            borderRadius="$roundedFull"
            height={TXN_HISTORY_LOADER_ICON_SIZE}
            width={TXN_HISTORY_LOADER_ICON_SIZE}
          />
          <FlexCompat shrink>
            <FlexCompat row alignItems="center" gap="$spacing4">
              <TextCompat loading loadingPlaceholderText="Contract Interaction" numberOfLines={1} variant="body1" />
            </FlexCompat>
            <TextCompat
              loading
              color="$neutral2"
              loadingPlaceholderText="Caption Text"
              numberOfLines={1}
              variant="subheading2"
            />
          </FlexCompat>
        </FlexCompat>
      </FlexCompat>
    </FlexCompat>
  )
}

export const ADDRESS_WRAPPER_HEIGHT = 36

export function WalletLoader({ opacity }: { opacity: number }): JSX.Element {
  return (
    <FlexCompat
      row
      alignItems="center"
      borderColor="$neutral3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      justifyContent="flex-start"
      opacity={opacity}
      overflow="hidden"
      px="$spacing16"
      py="$spacing16"
      className="WalletLoader"
    >
      <FlexCompat row alignItems="center" gap="$spacing12" height={ADDRESS_WRAPPER_HEIGHT}>
        <FlexCompat backgroundColor="$neutral3" borderRadius="$roundedFull" height={32} width={32} />
        <FlexCompat alignItems="flex-start" width="100%">
          <TextCompat loading loadingPlaceholderText="Wallet Nickname" variant="body1" />
          <TextCompat loading loadingPlaceholderText="0xaaaa...aaaa" variant="subheading2" />
        </FlexCompat>
      </FlexCompat>
    </FlexCompat>
  )
}

export function NftCardLoader(props: FlexCompatProps): JSX.Element {
  return (
    <FlexCompat fill justifyContent="flex-start" m="$spacing4" {...props}>
      <FlexCompat aspectRatio={1} backgroundColor="$neutral3" borderRadius="$rounded12" width="100%" />
    </FlexCompat>
  )
}

export const InsufficientFundsNetworkRowLoader = ({ opacity }: { opacity: number }): JSX.Element => {
  return (
    <FlexCompat
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      flexDirection="row"
      justifyContent="space-between"
      opacity={opacity}
      py="$spacing8"
    >
      <FlexCompat row shrink alignItems="center" gap="$spacing12" overflow="hidden">
        <FlexCompat
          backgroundColor="$neutral3"
          borderRadius="$rounded8"
          height={iconSizes.icon24}
          width={iconSizes.icon24}
          ml="$spacing6"
        />
        <FlexCompat shrink alignItems="flex-start" ml="$spacing4">
          <TextCompat loading loadingPlaceholderText="Network Name" variant="body2" />
        </FlexCompat>
      </FlexCompat>
      <FlexCompat justifyContent="space-between" position="relative">
        <FlexCompat centered fill>
          <TextCompat loading loadingPlaceholderText="Ready to disable" variant="body3" />
        </FlexCompat>
      </FlexCompat>
    </FlexCompat>
  )
}
