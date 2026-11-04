import { Flex, Text, Tooltip } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  MarginExplainerLineId,
  MarginExplainerRow,
  MarginExplainerRowId,
  MarginRealizedLineId,
} from '~/pages/Swap/Margin/marginPnlExplainer'

// Every key is a literal t() call: a dynamic t(variable) is silently pruned by the extractor, and both
// safety gates in this repo are off, so the string would just disappear.
function useMarginPnlCopy(): {
  line: Record<MarginExplainerLineId, string>
  row: Record<MarginExplainerRowId, string>
  realized: Record<MarginRealizedLineId, string>
  entryPrice: string
  glossaryHeading: string
} {
  const { t } = useTranslation()
  return {
    entryPrice: t('margin.pnl.explain.entryPrice'),
    glossaryHeading: t('margin.pnl.explain.glossaryHeading'),
    line: {
      lead: t('margin.pnl.explain.lead'),
      basis: t('margin.pnl.explain.basis'),
      frozen: t('margin.pnl.explain.frozen'),
      roe: t('margin.pnl.explain.roe'),
    },
    row: {
      marginAtCost: t('margin.table.tooltip.marginAtCost'),
      proceeds: t('margin.pnl.label.proceeds'),
      estRealized: t('margin.manage.estPnl'),
    },
    realized: {
      realizedLead: t('margin.pnl.explain.realizedLead'),
      realizedBasis: t('margin.pnl.explain.realizedBasis'),
      liquidated: t('margin.pnl.explain.liquidated'),
      partialLiq: t('margin.pnl.explain.partialLiq'),
    },
  }
}

const TONE_COLOR = { positive: '$statusSuccess', negative: '$statusCritical' } as const

// `<highlight>` is the catalog's existing emphasis tag (35 strings outside margin already use it).
// Those are rendered with <Trans components={{ highlight }}>, which is not available here: this
// feature resolves every key to a string up front so no call site passes a variable to t(), and
// <Trans i18nKey={id}> would put the key back in a variable. Splitting the resolved string keeps the
// tag translators already know without reintroducing a dynamic key.
const HIGHLIGHT_SPLIT = /(<highlight>.*?<\/highlight>)/g
const HIGHLIGHT_MATCH = /^<highlight>(.*)<\/highlight>$/

function MarginExplainerProse({ text, color }: { text: string; color: string }): JSX.Element {
  return (
    <Text variant="body4" color={color}>
      {text.split(HIGHLIGHT_SPLIT).map((part, index) => {
        const inner = HIGHLIGHT_MATCH.exec(part)
        return inner ? (
          // Brighter, not accented: the glossary leans on "Margin at cost" line after line, so it reads
          // as a defined term. An accent run on every line would read as a warning on every line.
          <Text key={`${index}-${part}`} variant="body4" color="$neutral1">
            {inner[1]}
          </Text>
        ) : (
          part
        )
      })}
    </Text>
  )
}

export function MarginExplainerRowView({ label, value, tone }: MarginExplainerRow & { label: string }): JSX.Element {
  return (
    <Flex row justifyContent="space-between" gap="$gap12">
      <Text variant="body4" color="$neutral2">
        {label}
      </Text>
      <Text variant="body4" color={tone ? TONE_COLOR[tone] : '$neutral1'}>
        {value}
      </Text>
    </Flex>
  )
}

// Tooltip.Content centres its children, so the wrapper takes the full width or one-line prose renders
// centred under a left-aligned lead.
export function MarginExplainerContent({
  lines,
  rows,
  realized,
  estimate,
  slippagePercent,
}: {
  lines?: MarginExplainerLineId[]
  rows?: MarginExplainerRow[]
  realized?: MarginRealizedLineId[]
  estimate?: boolean
  slippagePercent?: number
}): JSX.Element {
  const { t } = useTranslation()
  const copy = useMarginPnlCopy()
  return (
    <Flex gap="$gap8" width="100%" minWidth={180} maxWidth={326}>
      {estimate ? (
        <>
          <Text variant="body4" color="$neutral1">
            {t('margin.pnl.explain.estLead')}
          </Text>
          {/* Only a debt-bearing close swaps, and the modal hides its own Max-slippage row otherwise. */}
          {slippagePercent !== undefined ? (
            <Text variant="body4" color="$neutral2">
              {t('margin.pnl.explain.estSlippage', { slippage: slippagePercent })}
            </Text>
          ) : null}
          <Text variant="body4" color="$neutral2">
            {t('margin.pnl.explain.estExcludesGas')}
          </Text>
        </>
      ) : null}
      {realized?.map((id) => (
        <Text key={id} variant="body4" color={id === 'realizedLead' ? '$neutral1' : '$neutral2'}>
          {copy.realized[id]}
        </Text>
      ))}
      {rows && rows.length > 0 ? (
        <Flex gap="$gap4">
          {rows.map((row) => (
            <MarginExplainerRowView key={row.id} {...row} label={copy.row[row.id]} />
          ))}
        </Flex>
      ) : null}
      {lines?.map((id) => (
        <MarginExplainerProse key={id} text={copy.line[id]} color="$neutral2" />
      ))}
    </Flex>
  )
}

// The margin convention: the raw primitive, not InfoTooltip. InfoTooltip wraps its trigger in a Flex
// row that would inject layout into a right-aligned numeric cell, renders a single Text so it cannot
// host rows, and hardcodes a zero open delay that flashes on every pointer traverse across a table.
export function MarginExplainerTooltip({
  content,
  children,
}: {
  content: ReactNode
  children: ReactNode
}): JSX.Element {
  return (
    <Tooltip placement="top" delay={{ open: 200, close: 0 }} allowFlip stayInFrame>
      <Tooltip.Trigger>{children}</Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        {content}
      </Tooltip.Content>
    </Tooltip>
  )
}

export { useMarginPnlCopy }
