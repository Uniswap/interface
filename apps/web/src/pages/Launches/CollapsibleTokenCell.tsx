import { UniverseChainId } from '@universe/chains'
import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CollapsibleCellLayout } from '~/components/Table/PinnedColumns/collapse/CollapsibleCellLayout'
import { EXPANDED_LOGO_SIZE } from '~/components/Table/PinnedColumns/collapse/utils'
import { EllipsisText } from '~/components/Table/shared/TableText'

/**
 * Mobile token cell for the launch table: the expanded state matches Explore's `TokenDescription`,
 * collapsing to a centered logo (see `CollapsibleCellLayout`).
 *
 * The expanded layout restates TokenDescription's rather than composing it because the collapse has
 * to interpolate its parts independently (logo scale, text opacity, the gap between them), which a
 * wrapper around that component cannot reach; it also drops the hover-to-copy address affordance,
 * which mobile has no way to trigger.
 */
export function CollapsibleTokenCell({
  name,
  symbol,
  chainId,
  logoUrl,
}: {
  name: string
  symbol: string
  chainId: UniverseChainId | undefined
  logoUrl?: string
}): JSX.Element {
  return (
    <CollapsibleCellLayout
      logo={<TokenLogo chainId={chainId} name={name} size={EXPANDED_LOGO_SIZE} symbol={symbol} url={logoUrl} />}
    >
      <EllipsisText variant="body2" data-testid={TestID.TokenName}>
        {name}
      </EllipsisText>
      <Text variant="body3" color="$neutral2" numberOfLines={1}>
        {symbol}
      </Text>
    </CollapsibleCellLayout>
  )
}
