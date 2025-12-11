import { getTokenDetailsURL, unwrapToken } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { Cell } from 'components/Table/Cell'
import { useTableSize } from 'components/Table/TableSizeProvider'
import { useAbbreviatedTimeString } from 'components/Table/utils'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { PropsWithChildren } from 'react'
import { ArrowDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Flex, styled, Text, TextProps, View } from 'ui/src'
import { breakpoints, zIndexes } from 'ui/src/theme'
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

export const TableHead = (props: PropsWithChildren<{ $isSticky: boolean; $top: number }>): JSX.Element => (
  <Flex
    width="100%"
    zIndex={zIndexes.dropdown - 2}
    top={props.$isSticky ? props.$top : 'unset'}
    justifyContent="flex-end"
    backgroundColor="$surface1"
    className="scrollbar-hidden"
    $platform-web={props.$isSticky ? { position: 'sticky' } : {}}
  >
    {props.$isSticky && <Flex height={12} />}
    {props.children}
  </Flex>
)

export const TableBodyContainer = styled(Flex, {
  width: '100%',
  position: 'relative',
  className: 'scrollbar-hidden',
  justifyContent: 'flex-start',
  borderStyle: 'solid',
  '$platform-web': {
    overscrollBehaviorX: 'none',
    overflowX: 'auto',
    overflowY: 'auto',
  },
  variants: {
    v2: {
      true: {
        borderBottomRightRadius: '$rounded12',
        borderBottomLeftRadius: '$rounded12',
        borderWidth: 0,
      },
      false: {
        borderBottomRightRadius: '$rounded20',
        borderBottomLeftRadius: '$rounded20',
        borderColor: '$surface3',
        borderWidth: 1,
        borderTopWidth: '$none',
      },
    },
  },
})

export const LoadingIndicatorContainer = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'center',
  mt: -48,
  zIndex: zIndexes.sticky,
  '$platform-web': {
    position: 'sticky',
  },
})

export const LoadingIndicator = styled(Flex, {
  row: true,
  backgroundColor: '$accent2Solid',
  borderRadius: '$rounded8',
  width: 'fit-content',
  p: '$padding8',
  gap: '$gap8',
  height: 34,
})

const TableRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  width: 'fit-content',
  minWidth: '100%',
  height: '100%',
  transition: 'background-color 0.1s ease-in-out',
  variants: {
    v2: {
      true: {
        borderRadius: '$rounded12',
      },
      false: {
        borderRadius: '$rounded20',
      },
    },
  },
})

export const DataRow = styled(TableRow, {
  variants: {
    v2: {
      true: {
        hoverStyle: {
          backgroundColor: '$surface1Hovered',
          transition: 'background-color 0ms',
        },
      },
      false: {
        hoverStyle: { backgroundColor: '$surface1Hovered' },
      },
    },
  },
})

export const NoDataFoundTableRow = styled(TableRow, {
  justifyContent: 'center',
})

export const TableScrollMask = styled(View, {
  position: 'absolute',
  zIndex: zIndexes.default,
  top: 0,
  bottom: 0,
  right: 1,
  width: 20,
  pointerEvents: 'none',
  background: `linear-gradient(to right, transparent, var(--surface1))`,
})

export const HeaderRow = styled(TableRow, {
  width: 'unset',
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
    v2: {
      true: {
        backgroundColor: '$surface2',
        borderRadius: '$rounded12',
      },
      false: {
        backgroundColor: '$surface1Hovered',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '$surface3',
        borderTopRightRadius: '$rounded20',
        borderTopLeftRadius: '$rounded20',
        borderBottomRightRadius: 'unset',
        borderBottomLeftRadius: 'unset',
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
const StyledInternalLink = styled(Link, {
  ...ClickableTamaguiStyle,
  color: '$neutral1',
  '$platform-web': {
    textDecoration: 'none',
  },
})

export const TableRowLink = styled(Link, {
  cursor: 'pointer',
  '$platform-web': {
    textDecoration: 'none',
  },
})

export const ClickableHeaderRow = styled(Flex, {
  row: true,
  justifyContent: 'flex-end',

  ...ClickableTamaguiStyle,
})

export const HeaderArrow = styled(ArrowDown, {
  height: 14,
  width: 14,
  color: '$neutral1',
  transform: 'rotate(0deg)',
  transition: 'opacity 0.08s ease-in-out',
  '$group-hover': {
    opacity: 0.5,
  },

  variants: {
    orderDirection: {
      asc: {
        transform: 'rotate(180deg)',
      },
      desc: {
        transform: 'rotate(0deg)',
      },
    },
  },
})

export const HeaderSortText = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
  whiteSpace: 'nowrap',

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
  transition: 'all 0.1s ease-in-out',
  ...ClickableTamaguiStyle,

  variants: {
    clickable: {
      true: ClickableTamaguiStyle,
    },
  } as const,
})

const StyledTimestampRow = styled(StyledExternalLink, {
  group: true,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$gap8',
  width: '100%',
  whiteSpace: 'nowrap',
  hoverStyle: {
    opacity: 1,
  },
})

export const TableText = ({ children, ...props }: PropsWithChildren<TextProps>) => {
  const { width: tableWidth } = useTableSize()

  return (
    <Text color="$neutral1" variant={tableWidth <= breakpoints.lg ? 'body3' : 'body2'} {...props}>
      {children}
    </Text>
  )
}

export const EllipsisText = ({ children, ...props }: PropsWithChildren<TextProps>) => {
  return (
    <TableText {...props} whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
      {children}
    </TableText>
  )
}

export const HeaderCell = styled(Cell, {
  py: '$spacing12',
})

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
        <TableText>{abbreviatedTime}</TableText>
      </MouseoverTooltip>
    </StyledTimestampRow>
  )
}

/**
 * Given a token displays the Token's Logo and Symbol with a link to its TDP
 * @param token
 * @returns JSX.Element showing the Token's Logo, Chain logo if non-mainnet, and Token Symbol
 */
export const TokenLinkCell = ({ token, hideLogo }: { token: GraphQLApi.Token; hideLogo?: boolean }) => {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const chainId = fromGraphQLChain(token.chain) ?? defaultChainId
  const unwrappedToken = unwrapToken(chainId, token)
  const isNative = unwrappedToken.address === NATIVE_CHAIN_ID
  const nativeCurrency = useCurrency({
    address: NATIVE_CHAIN_ID,
    chainId,
  })
  return (
    <StyledInternalLink
      to={getTokenDetailsURL({
        address: unwrappedToken.address,
        chain: token.chain,
      })}
    >
      <Flex row gap="$gap8" maxWidth="100px" alignItems="center">
        <EllipsisText>{unwrappedToken.symbol ?? t('common.unknown').toUpperCase()}</EllipsisText>
        {!hideLogo && (
          <PortfolioLogo
            chainId={chainId}
            size={20}
            images={isNative ? undefined : [token.project?.logo?.url]}
            currencies={isNative ? [nativeCurrency] : undefined}
          />
        )}
      </Flex>
    </StyledInternalLink>
  )
}
