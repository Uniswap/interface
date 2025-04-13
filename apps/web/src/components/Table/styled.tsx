import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { useAbbreviatedTimeString } from 'components/Table/utils'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { OrderDirection, getTokenDetailsURL, unwrapToken } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import deprecatedStyled from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { ArrowDown, ExternalLink as ExternalLinkIcon } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { ClickableStyle, ClickableTamaguiStyle, EllipsisTamaguiStyle } from 'theme/components/styles'
import { Z_INDEX } from 'theme/zIndex'
import { Anchor, Flex, Text, View, styled } from 'ui/src'
import { Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'

export const SHOW_RETURN_TO_TOP_OFFSET = 500
export const LOAD_MORE_BOTTOM_OFFSET = 50

export const TableContainer = styled(Flex, {
  centered: true,
  m: '0 auto 24px auto',
  className: 'scrollbar-hidden',
})

export const TableHead = (props: PropsWithChildren<{ $isSticky: boolean; $top: number }>): JSX.Element => {
  if (props.$isSticky) {
    return (
      <Flex
        width="100%"
        top={props.$top}
        zIndex={Z_INDEX.under_dropdown}
        justifyContent="flex-end"
        backgroundColor="$surface1"
        className="scrollbar-hidden"
        $platform-web={{
          position: 'sticky',
        }}
      >
        {props.$isSticky && <Flex height={12} />}
        {props.children}
      </Flex>
    )
  } else {
    return (
      <Flex
        width="100%"
        position="relative"
        justifyContent="flex-end"
        backgroundColor="$surface1"
        className="scrollbar-hidden"
      >
        {props.children}
      </Flex>
    )
  }
}

export const TableBodyContainer = styled(View, {
  width: '100%',
  position: 'relative',
  className: 'scrollbar-hidden',
  justifyContent: 'flex-start',
  borderColor: '$surface3',
  borderStyle: 'solid',
  borderWidth: 1,
  borderTopWidth: 0,
  borderBottomRightRadius: '$rounded20',
  borderBottomLeftRadius: '$rounded20',
  '$platform-web': {
    overscrollBehaviorX: 'none',
    overflowX: 'auto',
    overflowY: 'scroll',
  },
})

export const LoadingIndicatorContainer = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'center',
  mt: -48,
  '$platform-web': {
    position: 'sticky',
  },
})

export const LoadingIndicator = styled(Flex, {
  row: true,
  backgroundColor: '$accent2',
  borderRadius: '$rounded8',
  width: 'fit-content',
  p: '$padding8',
  gap: '$gap8',
  height: 34,
  zIndex: Z_INDEX.under_dropdown,
})

const TableRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  px: '$padding12',
  width: 'fit-content',
  minWidth: '100%',
  minHeight: 64,
})

export const DataRow = styled(TableRow, {
  hoverStyle: {
    backgroundColor: '$surface3',
  },
})

export const NoDataFoundTableRow = styled(TableRow, {
  justifyContent: 'center',
})

export const HeaderRow = styled(TableRow, {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  borderTopRightRadius: '$rounded20',
  borderTopLeftRadius: '$rounded20',
  width: 'unset',
  minHeight: 52,
  backgroundColor: '$surface2',
  scrollbarWidth: 'none',
  className: 'scrollbar-hidden',

  '$platform-web': {
    overscrollBehavior: 'none',
    overflow: 'auto',
  },
  variants: {
    dimmed: {
      true: {
        opacity: 0.4,
      },
    },
  } as const,
})

export const CellContainer = styled(Flex, {
  grow: true,
  className: 'first-child-flex-grow-0 last-child-justify-end',
})

export const StyledExternalLink = styled(Anchor, {
  textDecorationLine: 'none',
  ...ClickableTamaguiStyle,
  color: '$neutral1',
  target: '_blank',
  rel: 'noopener noreferrer',
})
const StyledInternalLink = deprecatedStyled(Link)`
  text-decoration: none;
  ${ClickableStyle}
  color: ${({ theme }) => theme.neutral1};
`

export const TableRowLink = deprecatedStyled(Link)`
  color: none;
  text-decoration: none;
  cursor: pointer;
`

export const ClickableHeaderRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
  gap: '$gap4',

  ...ClickableTamaguiStyle,
})

export const HeaderArrow = deprecatedStyled(ArrowDown)<{ direction: OrderDirection }>`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.neutral1};
  transform: ${({ direction }) => (direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
`

export const HeaderSortText = styled(Text, {
  variant: 'body2',
  color: '$neutral2',

  variants: {
    active: {
      true: {
        color: '$neutral1',
      },
    },
  } as const,
})

export const FilterHeaderRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  userSelect: 'none',
  gap: '$gap4',
  animation: 'fast',

  ...ClickableTamaguiStyle,

  variants: {
    clickable: {
      true: ClickableTamaguiStyle,
    },
  } as const,
})

const StyledTimestampRow = deprecatedStyled(StyledExternalLink)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  width: 100%;
`
const StyledExternalLinkIcon = deprecatedStyled(ExternalLinkIcon)`
  display: none;
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.neutral2};
  ${StyledTimestampRow}:hover & {
    display: block;
  }
`

/**
 * Converts the given timestamp to an abbreviated format (s,m,h) for timestamps younger than 1 day
 * and a full discreet format for timestamps older than 1 day (e.g. DD/MM HH:MMam/pm).
 * Hovering on the timestamp will display the full discreet format. (e.g. DD/MM/YYYY HH:MMam/pm)
 * Clicking on the timestamp will open the given link in a new tab
 * @param timestamp: unix timestamp in SECONDS
 * @param link: link to open on click
 * @returns JSX.Element containing the formatted timestamp
 */
export const TimestampCell = ({ timestamp, link }: { timestamp: number; link: string }) => {
  const locale = useCurrentLocale()
  const options: Intl.DateTimeFormatOptions = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
  const fullDate = new Date(timestamp * 1000)
    .toLocaleString(locale, options)
    .toLocaleLowerCase(locale)
    .replace(/\s(am|pm)/, '$1')

  const abbreviatedTime = useAbbreviatedTimeString(timestamp * 1000)

  return (
    <StyledTimestampRow href={link}>
      <MouseoverTooltip text={fullDate} placement="top" size={TooltipSize.Max}>
        <ThemedText.BodySecondary>{abbreviatedTime}</ThemedText.BodySecondary>
      </MouseoverTooltip>
      <StyledExternalLinkIcon />
    </StyledTimestampRow>
  )
}

const TokenSymbolText = styled(Text, {
  variant: 'body2',
  color: '$neutral1',
  ...EllipsisTamaguiStyle,
})

/**
 * Given a token displays the Token's Logo and Symbol with a link to its TDP
 * @param token
 * @returns JSX.Element showing the Token's Logo, Chain logo if non-mainnet, and Token Symbol
 */
export const TokenLinkCell = ({ token }: { token: Token }) => {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const chainId = fromGraphQLChain(token.chain) ?? defaultChainId
  const unwrappedToken = unwrapToken(chainId, token)
  const isNative = unwrappedToken.address === NATIVE_CHAIN_ID
  const nativeCurrency = useCurrency(NATIVE_CHAIN_ID, chainId)
  return (
    <StyledInternalLink
      to={getTokenDetailsURL({
        address: unwrappedToken.address,
        chain: token.chain,
      })}
    >
      <Flex row gap="$gap4" maxWidth="68px">
        <PortfolioLogo
          chainId={chainId}
          size={16}
          images={isNative ? undefined : [token.project?.logo?.url]}
          currencies={isNative ? [nativeCurrency] : undefined}
        />
        <TokenSymbolText>{unwrappedToken?.symbol ?? t('common.unknown').toUpperCase()}</TokenSymbolText>
      </Flex>
    </StyledInternalLink>
  )
}
