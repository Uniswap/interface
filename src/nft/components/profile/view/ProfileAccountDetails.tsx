import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Identicon from 'components/Identicon'
import { MouseoverTooltip } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { caption, headlineLarge, lightGrayOverlayOnHover } from 'nft/css/common.css'
import { useCallback } from 'react'
import { Copy } from 'react-feather'
import { shortenAddress } from 'utils'

export const ProfileAccountDetails = () => {
  const { account, ENSName } = useWeb3React()
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(account ?? '')
  }, [account, setCopied])

  return account ? (
    <Row className={headlineLarge} marginBottom="48" gap="4">
      <Identicon size={44} />
      <Box textOverflow="ellipsis" overflow="hidden" marginLeft="8">
        {ENSName ?? shortenAddress(account)}
      </Box>
      <MouseoverTooltip
        text={
          <Box className={caption} color="textPrimary">
            {isCopied ? <Trans>Copied!</Trans> : <Trans>Copy</Trans>}
          </Box>
        }
        placement="right"
      >
        <Box paddingX="12" borderRadius="12" cursor="pointer" className={lightGrayOverlayOnHover} onClick={copy}>
          <Copy strokeWidth={1.5} size={20} />{' '}
        </Box>
      </MouseoverTooltip>
    </Row>
  ) : null
}
