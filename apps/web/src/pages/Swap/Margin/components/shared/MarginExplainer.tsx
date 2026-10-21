import { Flex, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'ui/src'
import {
  MARGIN_PNL_EXAMPLE_LINES,
  type MarginExplainerLineId,
  type MarginExplainerNoteId,
  type MarginExplainerRow,
  type MarginExplainerRowId,
  type MarginPnlSuppression,
  type MarginRealizedLineId,
} from '~/pages/Swap/Margin/marginPnlExplainer'

// Every key is a literal t() call: a dynamic t(variable) is silently pruned by the extractor, and both
// safety gates in this repo are off, so the string would just disappear.
function useMarginPnlCopy(): {
  line: Record<MarginExplainerLineId, string>
  note: Record<MarginExplainerNoteId, string>
  row: Record<MarginExplainerRowId, string>
  realized: Record<MarginRealizedLineId, string>
  suppression: Record<MarginPnlSuppression, string>
  aboutPnl: string
  entryPrice: string
  breakEvenRow: string
  title: string
  glossaryHeading: string
} {
  const { t } = useTranslation()
  return {
    // These five are read by surfaces that mount later. They are resolved here anyway so every key
    // keeps a literal call site — string extraction prunes any key it cannot see one for.
    aboutPnl: t('margin.pnl.explain.aboutPnl'),
    entryPrice: t('margin.pnl.explain.entryPrice'),
    breakEvenRow: t('margin.pnl.explain.breakEvenRow'),
    title: t('margin.pnl.title'),
    glossaryHeading: t('margin.pnl.explain.glossaryHeading'),
    line: {
      lead: t('margin.pnl.explain.lead'),
      basis: t('margin.pnl.explain.basis'),
      frozen: t('margin.pnl.explain.frozen'),
      withdrawals: t('margin.pnl.explain.withdrawals'),
      moves: t('margin.pnl.explain.moves'),
      excludes: t('margin.pnl.explain.excludes'),
      leverage: t('margin.pnl.explain.leverage'),
      roe: t('margin.pnl.explain.roe'),
      exampleLong: t('margin.pnl.explain.exampleLong'),
      exampleShort: t('margin.pnl.explain.exampleShort'),
    },
    note: { floored: t('margin.pnl.explain.floored') },
    row: {
      marginAtCost: t('margin.table.tooltip.marginAtCost'),
      marginNow: t('margin.pnl.label.marginNow'),
      unrealized: t('margin.table.tooltip.upnl'),
      roe: t('margin.pnl.label.roe'),
      realized: t('margin.pnl.label.realized'),
      netDeposited: t('margin.pnl.label.netDeposited'),
      breakEven: t('margin.pnl.label.breakEven'),
      proceeds: t('margin.pnl.label.proceeds'),
      estRealized: t('margin.manage.estPnl'),
    },
    realized: {
      realizedLead: t('margin.pnl.explain.realizedLead'),
      realizedBasis: t('margin.pnl.explain.realizedBasis'),
      liquidated: t('margin.pnl.explain.liquidated'),
      partialLiq: t('margin.pnl.explain.partialLiq'),
    },
    suppression: {
      untradable: t('margin.pnl.explain.unavailableUntradable'),
      unvalued: t('margin.pnl.explain.unavailableUnvalued'),
      noPrice: t('margin.pnl.explain.unavailableNoPrice'),
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
          // Brighter, not accented: the card leans on "Margin at cost" six times, so it reads as a
          // defined term. Six accent runs in ten lines would read as six warnings.
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
  suppression,
  lead,
  lines,
  rows,
  notes,
  realized,
  estimate,
  slippagePercent,
}: {
  suppression?: MarginPnlSuppression
  lead?: 'unrealizedLead' | 'basisLead'
  lines?: MarginExplainerLineId[]
  rows?: MarginExplainerRow[]
  notes?: MarginExplainerNoteId[]
  realized?: MarginRealizedLineId[]
  estimate?: boolean
  slippagePercent?: number
}): JSX.Element {
  const { t } = useTranslation()
  const copy = useMarginPnlCopy()
  const leadCopy = lead === 'basisLead' ? t('margin.pnl.explain.basisLead') : t('margin.pnl.explain.unrealizedLead')
  const definitionLines = lines?.filter((id) => !MARGIN_PNL_EXAMPLE_LINES.includes(id)) ?? []
  const exampleLines = lines?.filter((id) => MARGIN_PNL_EXAMPLE_LINES.includes(id)) ?? []
  return (
    <Flex gap="$gap8" width="100%" minWidth={180} maxWidth={326}>
      {suppression ? (
        <Text variant="body4" color="$neutral1">
          {copy.suppression[suppression]}
        </Text>
      ) : null}
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
      {lead ? (
        <Text variant="body4" color="$neutral1">
          {leadCopy}
        </Text>
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
      {definitionLines.map((id) => (
        <MarginExplainerProse key={id} text={copy.line[id]} color="$neutral2" />
      ))}
      {/* The worked examples sit under a rule: they illustrate the definition rather than continue it. */}
      {exampleLines.length > 0 ? (
        <Flex gap="$gap8" borderTopWidth={1} borderColor="$surface3" pt="$spacing8">
          {exampleLines.map((id) => (
            <MarginExplainerProse key={id} text={copy.line[id]} color="$neutral2" />
          ))}
        </Flex>
      ) : null}
      {notes?.map((id) => (
        <Text key={id} variant="body4" color="$neutral2">
          {copy.note[id]}
        </Text>
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
