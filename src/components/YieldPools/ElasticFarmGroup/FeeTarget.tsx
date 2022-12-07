import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import useTheme from 'hooks/useTheme'

const FeeTargetWrapper = styled.div<{ fullUnlock: boolean }>`
  border-radius: 999px;
  display: flex;
  font-size: 12px;
  background: ${({ theme, fullUnlock }) => (fullUnlock ? theme.primary : theme.subText)};
  position: relative;
  color: ${({ theme }) => theme.textReverse};
  height: 4px;
  align-items: center;
  min-width: 140px;
  max-width: 200px;
  position: relative;
  margin-top: 4px;
  overflow: hidden;
`

const FeeArchive = styled.div<{ width: number }>`
  width: ${({ width }) => `${width}%`};
  height: 100%;
  background: ${({ theme, width }) => (width === 100 ? theme.primary : theme.warning)};
  border-radius: 999px;
`

const FeeTarget = ({ percent, style = {} }: { percent: string; style?: CSSProperties }) => {
  const p = Number(percent)
  const theme = useTheme()
  return (
    <>
      <Flex
        justifyContent="space-between"
        fontSize="12px"
        color={theme.subText}
        marginTop="4px"
        maxWidth="200px"
        style={style}
      >
        <Trans>Target Volume</Trans>
        {p >= 100 ? <Text color={theme.primary}>✓</Text> : <div>{p.toFixed(2)}%</div>}
      </Flex>
      <FeeTargetWrapper fullUnlock={p >= 100} style={style}>
        <FeeArchive width={p}></FeeArchive>
      </FeeTargetWrapper>
    </>
  )
}

export default FeeTarget
