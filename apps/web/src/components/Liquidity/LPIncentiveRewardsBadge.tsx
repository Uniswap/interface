import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { LP_INCENTIVES_REWARD_TOKEN } from 'components/LpIncentives/constants'
import { Flex, Text } from 'ui/src'
import Badge, { BadgeVariant } from 'uniswap/src/components/badge/Badge'

export const LPIncentiveRewardsBadge = ({ formattedRewardApr }: { formattedRewardApr: string }) => {
  return (
    <Badge
      width="fit-content"
      badgeVariant={BadgeVariant.SOFT}
      borderRadius="$rounded6"
      py="$spacing2"
      paddingLeft="$spacing4"
      paddingRight="$spacing4"
      marginBottom="$spacing1"
    >
      <Flex row gap="$spacing4" alignItems="center">
        <Text variant="buttonLabel4" color="$accent1">
          +{formattedRewardApr}
        </Text>
        <CurrencyLogo currency={LP_INCENTIVES_REWARD_TOKEN} size={12} />
      </Flex>
    </Badge>
  )
}
