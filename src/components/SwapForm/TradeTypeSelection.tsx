import { Trans } from '@lingui/macro'
import { useEffect } from 'react'
import { Text } from 'rebass/styled-components'
import styled from 'styled-components'

import { GasStation, MoneyFill } from 'components/Icons'
import { useActiveWeb3React } from 'hooks'

const GroupButtonReturnTypes = styled.div`
  display: flex;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabBackgound};
  padding: 2px;
`

export const ButtonReturnType = styled.div<{ active?: boolean }>`
  border-radius: 999px;
  flex: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.tabActive : theme.tabBackgound)};
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 300ms;
`

type Props = {
  isSaveGas: boolean
  setSaveGas: React.Dispatch<React.SetStateAction<boolean>>
}
const TradeTypeSelection: React.FC<Props> = ({ isSaveGas, setSaveGas }) => {
  const { isSolana } = useActiveWeb3React()

  useEffect(() => {
    if (isSolana) setSaveGas(false)
  }, [isSolana, setSaveGas])

  if (isSolana) return null

  return (
    <GroupButtonReturnTypes>
      <ButtonReturnType onClick={() => setSaveGas(false)} active={!isSaveGas} role="button">
        <MoneyFill />
        <Text marginLeft="4px">
          <Trans>Maximum Return</Trans>
        </Text>
      </ButtonReturnType>
      <ButtonReturnType onClick={() => setSaveGas(true)} active={isSaveGas} role="button">
        <GasStation />
        <Text marginLeft="4px">
          <Trans>Lowest Gas</Trans>
        </Text>
      </ButtonReturnType>
    </GroupButtonReturnTypes>
  )
}

export default TradeTypeSelection
