/* eslint-disable-next-line no-restricted-imports */
import { PositionsHeader } from 'pages/Pool/Positions/Header'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { setOpenModal } from 'state/application/reducer'
import { Button, Flex, Text } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export default function Positions() {
  const dispatch = useDispatch()

  const { data } = useGetPositionsQuery()

  const onPressAddLiquidity = useCallback(() => {
    if (!data) {
      return
    }
    dispatch(setOpenModal({ name: ModalName.AddLiquidity, initialState: data.positions[2] }))
  }, [dispatch, data])

  return (
    <Flex width="100%">
      <PositionsHeader />
      <Flex row>
        <Text>Fake Position</Text> <Button onPress={onPressAddLiquidity}>Add Liquidity</Button>
      </Flex>
    </Flex>
  )
}
