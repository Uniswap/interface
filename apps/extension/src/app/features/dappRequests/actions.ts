import { createAction } from '@reduxjs/toolkit'
import type {
  DappRequestNoDappInfo,
  DappRequestRejectParams,
  DappRequestWithDappInfo,
} from 'src/app/features/dappRequests/shared'

/** This is for requests where the dapp info is not passed along as part of the request because it
 * does not exist yet (i.e. GetAccountRequest). In these cases the dappInfo will need to be saved.
 */
export const confirmRequestNoDappInfo = createAction<DappRequestNoDappInfo>('dappRequest/confirmSaveConnectionRequest')
export const confirmRequest = createAction<DappRequestWithDappInfo>(`dappRequest/confirmRequest`)
export const addRequest = createAction<DappRequestNoDappInfo>(`dappRequest/handleRequest`)
export const rejectRequest = createAction<DappRequestRejectParams>(`dappRequest/rejectRequest`)
export const rejectAllRequests = createAction('dappRequest/rejectAllRequests')
