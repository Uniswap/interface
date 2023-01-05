import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useToggle } from 'react-use'

import Card from 'components/Card'
import LightBulbEffect from 'components/Icons/LightBulbEffect'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink, TYPE } from 'theme/index'
import { getEtherscanLink, isAddress, shortenAddress } from 'utils/index'

export default function ApproveMessage({ routerAddress = '' }: { routerAddress?: string }) {
  const { chainId, account } = useActiveWeb3React()
  const theme = useTheme()
  const [showApproveMsgDetails, toggleShowApproveMsgDetails] = useToggle(false)
  const timeout = 1673913600000 // Tuesday, January 17, 2023 0:00:00

  if (![ChainId.BSCMAINNET, ChainId.BTTC, ChainId.VELAS, ChainId.CRONOS, ChainId.ARBITRUM].includes(chainId)) {
    return null
  }

  if (Date.now() > timeout || !isAddress(chainId, routerAddress) || !account) {
    return null
  }

  return (
    <Card m="24px 0" backgroundColor={rgba(theme.subText, 0.2)} padding="12px">
      <RowBetween alignItems="center" gap="6px">
        <LightBulbEffect color={theme.subText} />
        <TYPE.subHeader>
          {showApproveMsgDetails ? (
            <Trans>
              We have deployed an upgraded router contract at{' '}
              <ExternalLink href={getEtherscanLink(chainId, routerAddress, 'address')}>
                {shortenAddress(chainId, routerAddress)}
              </ExternalLink>
              . You may have to approve this contract before you trade your tokens
            </Trans>
          ) : (
            t`We have deployed an upgraded router contract`
          )}
        </TYPE.subHeader>
        {showApproveMsgDetails ? (
          <ChevronUp
            size="16px"
            color={theme.subText}
            style={{ minWidth: '16px', minHeight: '16px' }}
            onClick={toggleShowApproveMsgDetails}
            cursor="pointer"
          />
        ) : (
          <ChevronDown
            size="16px"
            color={theme.subText}
            style={{ minWidth: '16px', minHeight: '16px' }}
            onClick={toggleShowApproveMsgDetails}
            cursor="pointer"
          />
        )}
      </RowBetween>
    </Card>
  )
}
