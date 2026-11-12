import type { CellContext } from '@tanstack/react-table'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'
import type { TableColumnMeta } from '~/components/Table/types'
import { HookStatusTooltip } from '~/features/Hooks/components/HookStatusTooltip'
import { HookUnavailableValue } from '~/features/Hooks/components/HookUnavailableValue'
import { HookSortField } from '~/features/Hooks/types'
import { formatHookFiatAmount } from '~/features/Hooks/utils/formatHookFiatAmount'
import type { HookTableRow } from '~/pages/Explore/tables/Hooks/hooksTableTypes'
import { HookTableIdentity } from '~/pages/Explore/tables/Hooks/HookTableIdentity'
import { HookTableLink } from '~/pages/Explore/tables/Hooks/HookTableLink'

export interface HookMetricColumnMeta extends TableColumnMeta {
  metric: HookSortField
  format: 'count' | 'fiat'
}

type HookTableCellProps = Partial<CellContext<HookTableRow, unknown>>

// TanStack renders cell functions as component types; keep them stable across column updates.
export function HookTableIdentityCell({ row }: HookTableCellProps): JSX.Element {
  const media = useMedia()

  return row ? (
    <HookTableIdentity row={row.original} />
  ) : (
    <Cell loading justifyContent="flex-start" px={media.md ? '$spacing8' : '$spacing12'} width="100%" height="100%" />
  )
}

export function HookTableMetricCell({ row, column }: HookTableCellProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const locale = useCurrentLocale()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  if (!row || !column) {
    return <Cell loading px="$spacing12" width="100%" height="100%" />
  }

  const { metric, format } = column.columnDef.meta as HookMetricColumnMeta
  const value = row.original[metric]
  const formatted =
    value === null
      ? undefined
      : format === 'count'
        ? value.toLocaleString(locale)
        : formatHookFiatAmount(value, convertFiatAmountFormatted)
  const customVolume = metric === HookSortField.Volume && row.original.customAccounting
  const textVariant = media.md ? 'body3' : 'body2'

  return (
    <Flex position="relative" width="100%" height="100%">
      <HookTableLink to={row.original.href} tabIndex={-1} className="h-full w-full justify-end">
        <Cell px="$spacing12" py="$none" width="100%" height="100%">
          {customVolume ? (
            <Text className="sr-only">{t('hooks.details.customAccounting')}</Text>
          ) : formatted === undefined ? (
            <HookUnavailableValue variant={textVariant} />
          ) : (
            <TableText variant={textVariant}>{formatted}</TableText>
          )}
        </Cell>
      </HookTableLink>
      {customVolume && (
        <Flex
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          px="$spacing12"
          justifyContent="center"
          pointerEvents="none"
        >
          <Flex pointerEvents="auto">
            <HookStatusTooltip
              label={t('hooks.details.customAccounting')}
              description={t('hooks.details.customAccounting.description')}
              isolateInteraction
            >
              <Flex minWidth={44} minHeight={44} alignItems="flex-end" justifyContent="center">
                <TableText aria-hidden color="$neutral3" variant={textVariant}>
                  —
                </TableText>
              </Flex>
            </HookStatusTooltip>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
