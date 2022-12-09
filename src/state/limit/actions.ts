import { Currency } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'

export const setLimitCurrency = createAction<{ currencyIn: Currency | undefined; currencyOut: Currency | undefined }>(
  'limit/setLimitCurrency',
)
export const setCurrentOrderUpdate = createAction<CreateOrderParam>('limit/setCurrentOrderUpdate')
export const removeCurrentOrderUpdate = createAction<number>('limit/removeCurrentOrderUpdate')
