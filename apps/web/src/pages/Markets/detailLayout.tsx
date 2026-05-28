import type { ReactNode } from 'react'
import { Flex, Text, styled } from 'ui/src'

export const DetailPage = styled(Flex, {
  width: '100%',
  px: '$spacing32',
  pt: '$spacing20',
  pb: '$spacing40',
  $md: {
    px: '$spacing16',
    pb: '$spacing24',
  },
})

export const DetailPageInner = styled(Flex, {
  width: '100%',
  maxWidth: 1320,
  mx: 'auto',
  gap: '$spacing20',
})

export const SectionCard = styled(Flex, {
  gap: '$spacing16',
  p: '$spacing20',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded20',
  backgroundColor: '$surface1',
})

export const SummaryStrip = styled(Flex, {
  row: true,
  flexWrap: 'wrap',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded16',
  backgroundColor: '$surface1',
  overflow: 'hidden',
})

export const SummaryItem = styled(Flex, {
  gap: '$spacing6',
  flex: 1,
  minWidth: 180,
  p: '$spacing18',
  borderRightWidth: 1,
  borderRightColor: '$surface3',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

export const SummaryValue = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
})

export const Eyebrow = styled(Text, {
  variant: 'body4',
  color: '$neutral3',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
})

export const Label = styled(Text, {
  variant: 'body4',
  color: '$neutral2',
})

export const Value = styled(Text, {
  variant: 'subheading1',
  color: '$neutral1',
})

export const Badge = styled(Text, {
  px: '$spacing8',
  py: '$spacing4',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$roundedFull',
  variant: 'body4',
  color: '$neutral2',
  whiteSpace: 'nowrap',
})

const SectionRow = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '$spacing16',
  py: '$spacing10',
  borderTopWidth: 1,
  borderTopColor: '$surface3',
})

export const HeroBlock = styled(Flex, {
  gap: '$spacing12',
  maxWidth: 760,
})

export const HeroHeaderRow = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '$spacing16',
  flexWrap: 'wrap',
})

export const HeroTitleGroup = styled(Flex, {
  gap: '$spacing4',
})

export const ContentWithSidebar = styled(Flex, {
  row: true,
  gap: '$spacing20',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
})

export const MainColumn = styled(Flex, {
  gap: '$spacing16',
  flex: 1,
  minWidth: 0,
  flexBasis: 0,
})

export const SidebarColumn = styled(Flex, {
  width: '100%',
  maxWidth: 400,
  gap: '$spacing16',
  '$platform-web': { position: 'sticky' },
  top: 88,
})

export const SectionTitle = styled(Text, {
  variant: 'subheading1',
  color: '$neutral1',
})

interface DetailSectionDataRow {
  label: string
  value: ReactNode
}

export function DetailDataSection({
  eyebrow,
  title,
  rows,
  children,
}: {
  eyebrow: string
  title: string
  rows: DetailSectionDataRow[]
  children?: ReactNode
}) {
  return (
    <SectionCard>
      <Flex gap="$spacing6">
        <Eyebrow>{eyebrow}</Eyebrow>
        <SectionTitle>{title}</SectionTitle>
      </Flex>
      {rows.map((row) => (
        <SectionRow key={row.label}>
          <Label>{row.label}</Label>
          {row.value}
        </SectionRow>
      ))}
      {children}
    </SectionCard>
  )
}

export function formatPercentValue(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`
}
