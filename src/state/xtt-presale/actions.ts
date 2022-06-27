import { createAction } from '@reduxjs/toolkit'

import { DataWithSigner, XttPresaleState } from './reducer'

export const fetchData = createAction('xtt-presale/fetchData')
export const fetchDataSuccess = createAction<Omit<XttPresaleState, DataWithSigner>>('xtt-presale/fetchDataSuccess')
export const fetchDataError = createAction<any>('xtt-presale/fetchDataError')
export const fetchDataWithSigner = createAction('xtt-presale/fetchDataWithSigner')
export const fetchDataWithSignerSuccess = createAction<Pick<XttPresaleState, DataWithSigner>>(
  'xtt-presale/fetchDataWithSignerSuccess'
)
export const fetchDataWithSignerError = createAction<any>('xtt-presale/fetchDataWithSignerError')
