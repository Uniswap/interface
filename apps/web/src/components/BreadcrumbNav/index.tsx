import { t, Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import Row from 'components/Row'
import Tooltip, { TooltipSize } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useScreenSize } from 'hooks/useScreenSize'
import { useCallback, useState } from 'react'
import { Copy } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle } from 'theme/components'
import { shortenAddress } from 'utilities/src/addresses'

export const BreadcrumbNavContainer = styled.nav`
  display: flex;
  color: ${({ theme }) => theme.neutral2};
  font-size: 16px;
  line-height: 24px;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
  width: fit-content;
`

export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.neutral2};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.neutral3};
  }
`

const CurrentPageBreadcrumbContainer = styled(Row)`
  gap: 6px;
`

// This must be an h1 to match the SEO title, and must be the first heading tag in code.
const PageTitleText = styled.h1`
  font-weight: inherit;
  font-size: inherit;
  line-height: inherit;
  color: ${({ theme }) => theme.neutral1};
  white-space: nowrap;
  margin: 0;
`

const TokenAddressHoverContainer = styled(Row)<{ isDisabled?: boolean }>`
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
  gap: 10px;
  white-space: nowrap;
`

const CopyIcon = styled(Copy)`
  ${ClickableStyle}
`

// Used in both TDP & PDP.
// On TDP, currency is defined & poolName is undefined. On PDP, currency is undefined & poolName is defined.
export const CurrentPageBreadcrumb = ({
  address,
  currency,
  poolName,
}: {
  address: string
  currency?: Currency
  poolName?: string
}) => {
  const { neutral2 } = useTheme()
  const screenSize = useScreenSize()
  const [hover, setHover] = useState(false)

  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(address)
  }, [address, setCopied])

  const isNative = currency?.isNative
  const tokenSymbolName = currency?.symbol ?? <Trans>Symbol not found</Trans>

  const shouldEnableCopy = screenSize['sm']
  const shouldShowActions = shouldEnableCopy && hover && !isCopied

  return (
    <CurrentPageBreadcrumbContainer
      aria-current="page"
      data-testid="current-breadcrumb"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <PageTitleText>{currency ? tokenSymbolName : poolName}</PageTitleText>{' '}
      {(!currency || (currency && !isNative)) && (
        <TokenAddressHoverContainer
          data-testid="breadcrumb-token-address"
          isDisabled={!shouldEnableCopy}
          onClick={shouldEnableCopy ? copy : undefined}
        >
          <Tooltip placement="bottom" size={TooltipSize.Max} show={isCopied} text={t`Copied`}>
            {shortenAddress(address)}
          </Tooltip>
          {shouldShowActions && (
            <CopyIcon data-testid="breadcrumb-hover-copy" width={16} height={16} color={neutral2} />
          )}
        </TokenAddressHoverContainer>
      )}
    </CurrentPageBreadcrumbContainer>
  )
}
