import { TFunction } from 'i18next'
import React, { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { Flex } from 'src/components/layout'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { Text } from 'src/components/Text'
import { OrderBy } from 'src/features/dataApi/zerion/types'
import { ModalName } from 'src/features/telemetry/constants'

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
          isVisible={isVisible}
          name={ModalName.Account}
          options={options}
          onClose={() => toggleModalVisible()}
        />
      ),
      [isVisible, options]
    ),
  }
}

function ModalOption({ isSelected, label }: { isSelected: boolean; label: string }) {
  const theme = useAppTheme()
  return (
    <Flex row flex={1} justifyContent="space-between" p="md">
      <Text variant="body1">{label}</Text>
      {isSelected && <Check color={theme.colors.neutralTextSecondary} height={18} width={18} />}
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
    // TODO: support by volume
    // {
    //   key: OrderBy.Volume,
    //   onPress: () => {
    //     setOrderBy(OrderBy.Volume)
    //   },
    //   render: () => <ModalOption isSelected={selected === OrderBy.Volume} label={t('Volume')} />,
    // },
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
