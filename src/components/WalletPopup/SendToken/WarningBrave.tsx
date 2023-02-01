import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { AlertTriangle } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import AddTokenToMetaMask from 'components/AddToMetamask'
import CopyHelper from 'components/Copy'
import { NetworkLogo } from 'components/Logo'
import Row from 'components/Row'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
  display: flex;
  border-radius: 16px;
  gap: 16px;
  padding: 16px;
  font-size: 12px;
  line-height: 16px;
`
const WarningBrave = ({ token }: { token: Currency | undefined }) => {
  const { chainId, walletKey } = useActiveWeb3React()
  const theme = useTheme()

  if (!token || walletKey !== 'BRAVE' || token.isNative) return null
  return (
    <Wrapper>
      <div>
        <AlertTriangle size={18} color={theme.subText} />
      </div>
      <Flex style={{ gap: 10 }} flexDirection="column">
        <Text color={theme.text} fontWeight="400">
          <Trans> Notice for Brave wallet users</Trans>
        </Text>
        <Text style={{ whiteSpace: 'normal' }}>
          <Trans>
            Please ensure the selected token has been imported in your Brave wallet before sending. Otherwise, your
            transaction will be rejected. In this case, you can quickly import token with contract address below.
          </Trans>
        </Text>
        <Row justify="space-between">
          <Text>
            <Trans>Contract Address</Trans>
          </Text>
          <Flex justifyContent="space-between" style={{ gap: 5, alignItems: 'center' }}>
            <NetworkLogo chainId={chainId} style={{ width: 16, height: 16 }} />
            {shortenAddress(chainId, token.wrapped.address, 5, false)}
            <CopyHelper toCopy={token.wrapped.address} />
            <MouseoverTooltipDesktopOnly text={t`Import token in Brave wallet`}>
              <AddTokenToMetaMask token={token as Token} />
            </MouseoverTooltipDesktopOnly>
          </Flex>
        </Row>
      </Flex>
    </Wrapper>
  )
}
export default WarningBrave
