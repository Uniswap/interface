import { useQuery } from '@tanstack/react-query'

export type UseQueryApiHelperHookArgs<REQ, RES> = {
  params?: REQ
} & Omit<Parameters<typeof useQuery<RES>>[0], 'queryKey' | 'queryFn'>

export type UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<REQ, RES> = Omit<
  UseQueryApiHelperHookArgs<REQ, RES>,
  'gcTime'
> & { immediateGcTime?: number }
