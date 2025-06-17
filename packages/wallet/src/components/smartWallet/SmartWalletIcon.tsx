import { Flex } from 'ui/src'
import { SmartWallet } from 'ui/src/components/icons'

const IMAGE_SIZE: number = 48

export interface SmartWalletIconProps {
  isFullyRounded?: boolean
}

export function SmartWalletIcon({ isFullyRounded = false }: SmartWalletIconProps): JSX.Element {
  return (
    <Flex
      centered
      backgroundColor="$accent2"
      borderRadius={isFullyRounded ? '$roundedFull' : '$rounded12'}
      height="$spacing48"
      width={IMAGE_SIZE}
      mb="$spacing4"
      position="relative"
      {...(isFullyRounded && { ml: -(IMAGE_SIZE / 6) })}
    >
      <SmartWallet color="$accent1" size="$icon.24" />
    </Flex>
  )
}
