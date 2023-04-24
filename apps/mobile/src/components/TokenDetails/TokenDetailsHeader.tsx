import React from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { SafetyLevel, TokenDetailsScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'
import { fromGraphQLChain } from 'src/utils/chainId'

export interface TokenDetailsHeaderProps {
  data?: TokenDetailsScreenQuery
  loading?: boolean
  onPressWarningIcon: () => void
}

export function TokenDetailsHeader({
  data,
  loading = false,
  onPressWarningIcon,
}: TokenDetailsHeaderProps): JSX.Element {
  const token = data?.token
  const tokenProject = token?.project

  return (
    <Flex gap="spacing12" mx="spacing16">
      <TokenLogo
        chainId={fromGraphQLChain(token?.chain) ?? undefined}
        symbol={token?.symbol ?? undefined}
        url={tokenProject?.logoUrl ?? undefined}
      />
      <Flex row alignItems="center" gap="spacing8">
        <Text
          color="textPrimary"
          loading={loading}
          numberOfLines={1}
          style={flex.shrink}
          variant="subheadLarge">
          {token?.name ?? '—'}
        </Text>
        {/* Suppress warning icon on low warning level */}
        {(tokenProject?.safetyLevel === SafetyLevel.StrongWarning ||
          tokenProject?.safetyLevel === SafetyLevel.Blocked) && (
          <TouchableArea onPress={onPressWarningIcon}>
            <WarningIcon
              height={theme.iconSizes.icon20}
              safetyLevel={tokenProject?.safetyLevel}
              strokeColorOverride="textSecondary"
              width={theme.imageSizes.image20}
            />
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
