import React from 'react'
import { MouseoverTooltip } from './Tooltip'
import { Flex, Text } from 'rebass'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { VERSION, ELASTIC_NOT_SUPPORTED } from 'constants/v2'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { stringify } from 'qs'
import { useActiveWeb3React } from 'hooks'
import { Trans } from '@lingui/macro'
import { PoolElasticIcon, PoolClassicIcon } from './Icons'
import useTheme from 'hooks/useTheme'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useHistory } from 'react-router-dom'

function ClassicElasticTab() {
  const qs = useParsedQueryString()
  const tab = (qs.tab as string) || VERSION.ELASTIC
  const { mixpanelHandler } = useMixpanel()

  const { chainId } = useActiveWeb3React()
  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId as ChainId]

  const theme = useTheme()
  const history = useHistory()

  const isFarmpage = history.location.pathname === '/farms'

  return (
    <Flex>
      <MouseoverTooltip text={notSupportedMsg || ''}>
        <Flex
          alignItems={'center'}
          onClick={() => {
            if (!!notSupportedMsg) return
            const newQs = { ...qs, tab: VERSION.ELASTIC }
            let type: MIXPANEL_TYPE | '' = ''
            switch (history.location.pathname) {
              case '/pools':
                type = MIXPANEL_TYPE.ELASTIC_POOLS_ELASTIC_POOLS_CLICKED
                break
              case '/myPools':
                type = MIXPANEL_TYPE.ELASTIC_MYPOOLS_ELASTIC_POOLS_CLICKED
                break

              default:
                break
            }
            if (type) mixpanelHandler(type)
            history.replace({ search: stringify(newQs) })
          }}
        >
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            color={tab === VERSION.ELASTIC ? (!!notSupportedMsg ? theme.disableText : theme.primary) : theme.subText}
            width={'auto'}
            marginRight={'5px'}
            role="button"
            style={{
              cursor: !!notSupportedMsg ? 'not-allowed' : 'pointer',
            }}
          >
            {isFarmpage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
          </Text>
          <PoolElasticIcon size={20} color={tab === VERSION.ELASTIC ? theme.primary : theme.subText} />
        </Flex>
      </MouseoverTooltip>
      <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
        |
      </Text>

      <Flex
        alignItems={'center'}
        onClick={() => {
          const newQs = { ...qs, tab: VERSION.CLASSIC }
          history.replace({ search: stringify(newQs) })
        }}
      >
        <Text
          fontWeight={500}
          fontSize={[18, 20, 24]}
          color={tab === VERSION.CLASSIC ? theme.primary : theme.subText}
          width={'auto'}
          marginRight={'5px'}
          style={{ cursor: 'pointer' }}
          role="button"
        >
          {isFarmpage ? <Trans>Classic Farms</Trans> : <Trans>Classic Pools</Trans>}
        </Text>
        <PoolClassicIcon size={20} color={tab === VERSION.ELASTIC ? theme.subText : theme.primary} />
      </Flex>
    </Flex>
  )
}

export default ClassicElasticTab
