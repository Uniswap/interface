import { Flex, Image, Text, useSporeColors } from 'ui/src'
import { DAI_LOGO, ENS_LOGO, ETH_LOGO, FROGGY, OPENSEA_LOGO, USDC_LOGO } from 'ui/src/assets'
import HeartIcon from 'ui/src/assets/icons/heart.svg'
import SendIcon from 'ui/src/assets/icons/send-action.svg'
import { colors, iconSizes, imageSizes, opacify } from 'ui/src/theme'
import { Arrow } from 'wallet/src/components/icons/Arrow'

export const FroggyElement = (): JSX.Element => {
  return (
    <Flex
      backgroundColor="$surface3"
      borderRadius="$rounded12"
      p="$spacing8"
      transform={[{ rotateZ: '-10deg' }]}>
      <Image
        height={imageSizes.image48}
        resizeMode="contain"
        source={FROGGY}
        width={imageSizes.image48}
      />
    </Flex>
  )
}

export const OpenseaElement = (): JSX.Element => {
  return (
    <Flex backgroundColor="$blue400" borderRadius="$roundedFull" p="$spacing4">
      <Image
        height={imageSizes.image32}
        resizeMode="contain"
        source={OPENSEA_LOGO}
        width={imageSizes.image32}
      />
    </Flex>
  )
}

export const SwapElement = (): JSX.Element => {
  const sporeColors = useSporeColors()
  return (
    <Flex
      centered
      row
      borderRadius="$rounded12"
      gap="$spacing4"
      p="$spacing12"
      transform={[{ rotateZ: '5deg' }]}>
      <Flex
        centered
        row
        borderRadius="$roundedFull"
        gap="$spacing8"
        p="$spacing8"
        style={{ backgroundColor: opacify(20, colors.blue200) }}>
        <Image
          height={imageSizes.image24}
          resizeMode="contain"
          source={ETH_LOGO}
          width={imageSizes.image24}
        />
        <Text color="$blue400" textAlign="center" variant="body2">
          ETH
        </Text>
      </Flex>
      <Arrow color={sporeColors.neutral3.val} direction="e" size={iconSizes.icon20} />
      <Flex
        centered
        row
        borderRadius="$roundedFull"
        gap="$spacing8"
        p="$spacing8"
        style={{ backgroundColor: opacify(20, colors.yellow100) }}>
        <Image
          height={imageSizes.image24}
          resizeMode="contain"
          source={DAI_LOGO}
          width={imageSizes.image24}
        />
        <Text color="$yellow200" textAlign="center" variant="body2">
          DAI
        </Text>
      </Flex>
    </Flex>
  )
}

export const ENSElement = (): JSX.Element => {
  return (
    <Flex
      borderRadius="$rounded12"
      p="$spacing12"
      style={{ backgroundColor: opacify(20, colors.blue300) }}
      transform={[{ rotateZ: '8deg' }]}>
      <Image
        height={imageSizes.image24}
        resizeMode="contain"
        source={ENS_LOGO}
        width={imageSizes.image24}
      />
    </Flex>
  )
}

export const ReceiveUSDCElement = (): JSX.Element => {
  return (
    <Flex
      centered
      row
      borderRadius="$roundedFull"
      gap="$spacing8"
      p="$spacing8"
      style={{ backgroundColor: opacify(20, colors.blue300) }}
      transform={[{ rotateZ: '-1deg' }]}>
      <Text color="$blue400" textAlign="center" variant="buttonLabel3">
        +100
      </Text>
      <Image
        height={imageSizes.image24}
        resizeMode="contain"
        source={USDC_LOGO}
        width={imageSizes.image24}
      />
    </Flex>
  )
}

export const SendElement = (): JSX.Element => {
  return (
    <Flex
      borderRadius="$rounded12"
      p="$spacing8"
      style={{ backgroundColor: opacify(20, colors.green300) }}
      transform={[{ rotateZ: '-4deg' }]}>
      <SendIcon color={colors.green200} height={iconSizes.icon28} width={iconSizes.icon28} />
    </Flex>
  )
}

export const HeartElement = (): JSX.Element => {
  return (
    <Flex
      borderRadius="$rounded12"
      p="$spacing8"
      style={{ backgroundColor: colors.red50 }}
      transform={[{ rotateZ: '-4deg' }]}>
      <HeartIcon color={colors.red300} height={iconSizes.icon20} width={iconSizes.icon20} />
    </Flex>
  )
}

export const TextElement = ({ text }: { text: string }): JSX.Element => {
  return (
    <Flex
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      p="$spacing12"
      transform={[{ rotateZ: '18deg' }]}>
      <Text color="$neutral2" textAlign="center" variant="buttonLabel3">
        {text}
      </Text>
    </Flex>
  )
}

export const EmojiElement = ({ emoji }: { emoji: string }): JSX.Element => {
  return (
    <Flex
      borderRadius="$roundedFull"
      p="$spacing8"
      style={{ backgroundColor: opacify(20, colors.yellow200) }}
      transform={[{ rotateZ: '5deg' }]}>
      <Text color="$neutral2" textAlign="center" variant="buttonLabel3">
        {emoji}
      </Text>
    </Flex>
  )
}
