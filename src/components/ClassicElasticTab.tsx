import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { APP_PATHS } from 'constants/index'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { isInEnum } from 'utils/string'

import { PoolClassicIcon, PoolElasticIcon } from './Icons'
import { MouseoverTooltip } from './Tooltip'

function ClassicElasticTab() {
  const { tab: tabQS = VERSION.ELASTIC, ...qs } = useParsedQueryString<{ tab: string }>()
  const tab = isInEnum(tabQS, VERSION) ? tabQS : VERSION.ELASTIC
  const { mixpanelHandler } = useMixpanel()

  const { chainId } = useActiveWeb3React()
  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId]

  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const isFarmpage = location.pathname.includes('/farms')

  return (
    <Flex width="max-content">
      <MouseoverTooltip text={notSupportedMsg || ''}>
        <Flex
          alignItems={'center'}
          onClick={() => {
            if (!!notSupportedMsg) return
            const newQs = { ...qs, tab: VERSION.ELASTIC }
            let type: MIXPANEL_TYPE | '' = ''
            if (location.pathname.startsWith(APP_PATHS.POOLS)) {
              type = MIXPANEL_TYPE.ELASTIC_POOLS_ELASTIC_POOLS_CLICKED
            } else if (location.pathname.startsWith(APP_PATHS.MY_POOLS))
              type = MIXPANEL_TYPE.ELASTIC_MYPOOLS_ELASTIC_POOLS_CLICKED
            if (type) mixpanelHandler(type)
            navigate({ search: stringify(newQs) }, { replace: true })
          }}
        >
          <PoolElasticIcon size={20} color={tab === VERSION.ELASTIC ? theme.primary : theme.subText} />
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            color={tab === VERSION.ELASTIC ? (!!notSupportedMsg ? theme.disableText : theme.primary) : theme.subText}
            width={'auto'}
            marginLeft="4px"
            role="button"
            style={{
              cursor: !!notSupportedMsg ? 'not-allowed' : 'pointer',
            }}
          >
            {isFarmpage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
          </Text>
        </Flex>
      </MouseoverTooltip>
      <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
        |
      </Text>

      <Flex
        alignItems={'center'}
        onClick={() => {
          const newQs = { ...qs, tab: VERSION.CLASSIC }
          navigate({ search: stringify(newQs) }, { replace: true })
        }}
      >
        <PoolClassicIcon size={20} color={tab === VERSION.ELASTIC ? theme.subText : theme.primary} />
        <Text
          fontWeight={500}
          fontSize={[18, 20, 24]}
          color={tab === VERSION.CLASSIC ? theme.primary : theme.subText}
          width={'auto'}
          marginLeft="4px"
          style={{ cursor: 'pointer' }}
          role="button"
        >
          {isFarmpage ? <Trans>Classic Farms</Trans> : <Trans>Classic Pools</Trans>}
        </Text>
      </Flex>
    </Flex>
  )
}

export default ClassicElasticTab
