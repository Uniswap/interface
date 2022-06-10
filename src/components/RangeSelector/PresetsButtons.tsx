import { Trans } from '@lingui/macro'
import { Swap as SwapIcon } from 'components/Icons'
import React, { useContext } from 'react'
import { TYPE } from 'theme'
import { Flex } from 'rebass'
import { ThemeContext } from 'styled-components'
// import { ArrowWrapper } from 'components/swapv2/styleds'
import { ArrowWrapper } from 'pages/AddLiquidityV2'

export default function PresetsButtons({ setFullRange }: { setFullRange: () => void }) {
  const theme = useContext(ThemeContext)
  return (
    <Flex justifyContent={'end'} style={{ color: theme.primary }} alignItems={'center'}>
      <ArrowWrapper clickable={false} rotated={true}>
        <SwapIcon size={18}/>
      </ArrowWrapper>
      <TYPE.body
        fontSize={14}
        marginLeft={'2px'}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          setFullRange()
        }}
      >
        <Trans>Full Price Range</Trans>
      </TYPE.body>
    </Flex>
  )
}
