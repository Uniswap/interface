import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import Row from 'components/Row'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useScreenSize } from 'hooks/useScreenSize'
import { useCallback, useState } from 'react'
import { Copy } from 'react-feather'
import { Link } from 'react-router-dom'
import { useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { css, useTheme } from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'

import ShareButton from './ShareButton'

export const BreadcrumbNavContainer = styled.nav<{ isInfoTDPEnabled?: boolean; isInfoPDPEnabled?: boolean }>`
  display: flex;
  color: ${({ theme }) => theme.neutral1};
  ${({ isInfoTDPEnabled, isInfoPDPEnabled }) =>
    isInfoTDPEnabled || isInfoPDPEnabled
      ? css`
          font-size: 16px;
          line-height: 24px;
        `
      : css`
          font-size: 14px;
          line-height: 20px;
        `}
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
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
  color: inherit;
  white-space: nowrap;
  margin: 0;
`

const TokenAddressHoverContainer = styled(Row)<{ isDisabled?: boolean }>`
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
  gap: 10px;
  white-space: nowrap;
`

const HoverActionsDivider = styled.div`
  height: 16px;
  width: 1px;
  background-color: ${({ theme }) => theme.surface3};
`

const CopyIcon = styled(Copy)`
  ${ClickableStyle}
`
const StyledCopiedSuccess = styled(Row)`
  gap: 4px;
`
const CopiedSuccess = () => {
  const { success } = useTheme()
  return (
    <StyledCopiedSuccess>
      <Copy width={16} height={16} color={success} />
      <ThemedText.Caption color="success">
        <Trans>Copied!</Trans>
      </ThemedText.Caption>
    </StyledCopiedSuccess>
  )
}

// Used in both TDP & PDP.
// On TDP, currency is defined & poolName is undefined. On PDP, currency is undefined & poolName is defined.
export const CurrentPageBreadcrumb = ({
  address,
  chainId,
  currency,
  poolName,
}: {
  address: string
  chainId?: number
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

  const twitterTokenName =
    currency?.name && currency?.symbol ? `${currency.name} (${currency.symbol})` : currency?.name || currency?.symbol
  const twitterName = twitterTokenName ?? poolName ?? ''

  const shareModalOpen = useModalIsOpen(ApplicationModal.SHARE)
  const shouldEnableCopy = screenSize['sm']
  const shouldShowActions = (shouldEnableCopy && hover && !isCopied) || shareModalOpen

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
          ( {shortenAddress(address)} )
          {shouldShowActions && (
            <>
              <CopyIcon data-testid="breadcrumb-hover-copy" width={16} height={16} color={neutral2} />
              {chainId && <HoverActionsDivider />}
            </>
          )}
          {shouldEnableCopy && isCopied && <CopiedSuccess />}
        </TokenAddressHoverContainer>
      )}
      {shouldShowActions && chainId && <ShareButton name={twitterName} />}
    </CurrentPageBreadcrumbContainer>
  )
}
