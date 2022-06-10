import { TFunction } from 'i18next'
import React, { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { Box, Flex } from 'src/components/layout'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { OrderBy } from 'src/features/dataApi/zerion/types'
import { ModalName } from 'src/features/telemetry/constants'
import { flex } from 'src/styles/flex'

const CheckmarkSize = 18

export function useOrderByModal() {
  const { t } = useTranslation()
  const [isVisible, toggleModalVisible] = useReducer((visible) => !visible, false)
  const [orderBy, setOrderBy] = useState(OrderBy.MarketCap)

  const options = useMemo(
    () =>
      getOrderByModalOptions(
        orderBy,
        (newOrderBy: OrderBy) => {
          setOrderBy(newOrderBy)
          toggleModalVisible()
        },
        t
      ),
    [orderBy, t]
  )

  return {
    orderBy,
    toggleModalVisible,
    orderByModal: useMemo(
      () => (
        <ActionSheetModal
          header={t('Sort tokens by')}
          isVisible={isVisible}
          name={ModalName.Account}
          options={options}
          onClose={() => toggleModalVisible()}
        />
      ),
      [isVisible, options, t]
    ),
  }
}

function ModalOption({ isSelected, label }: { isSelected: boolean; label: string }) {
  const theme = useAppTheme()
  return (
    <Flex row justifyContent="space-between" p="md">
      {/* fake element to center the label  */}
      <Box height={CheckmarkSize} width={CheckmarkSize} />
      <Text style={flex.fill} textAlign="center" variant="body1">
        {label}
      </Text>
      <Box height={CheckmarkSize} width={CheckmarkSize}>
        {isSelected && (
          <Check
            color={theme.colors.neutralTextSecondary}
            height={CheckmarkSize}
            width={CheckmarkSize}
          />
        )}
      </Box>
    </Flex>
  )
}

const getOrderByModalOptions = (
  selected: OrderBy,
  setOrderBy: (orderBy: OrderBy) => void,
  t: TFunction
) => {
  return [
    {
      key: OrderBy.MarketCap,
      onPress: () => {
        setOrderBy(OrderBy.MarketCap)
      },
      render: () => (
        <ModalOption isSelected={selected === OrderBy.MarketCap} label={t('Market Cap')} />
      ),
    },
    {
      key: OrderBy.RelativeChange1D,
      onPress: () => {
        setOrderBy(OrderBy.RelativeChange1D)
      },
      render: () => (
        <ModalOption isSelected={selected === OrderBy.RelativeChange1D} label={'Percent change'} />
      ),
    },
  ]
}
