import { Flex, iconSizes, validColor } from '@universe/mycelium'
import { Heart } from '@universe/mycelium/icons/Heart'
import { opacify } from '@universe/mycelium/theme-hooks-compat'
import { DEP_accentColors } from '@universe/mycelium/theme-palette'
export const HeartElement = (): JSX.Element => {
  return (
    <Flex
      backgroundColor={opacify(10, DEP_accentColors.red400)}
      borderRadius="$rounded12"
      py="$spacing12"
      px="$spacing16"
      $xs={{ py: '$spacing8', px: '$spacing12' }}
    >
      <Heart
        color={validColor(DEP_accentColors.red300)}
        opacity={0.95}
        size={iconSizes.icon16}
        $xs={{ size: iconSizes.icon12 }}
      />
    </Flex>
  )
}
