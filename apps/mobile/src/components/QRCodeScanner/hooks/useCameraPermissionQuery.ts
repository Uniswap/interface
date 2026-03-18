import { queryOptions, UseQueryResult, useQuery } from '@tanstack/react-query'
import { Camera, PermissionResponse } from 'expo-camera'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export const cameraPermissionQuery = queryOptions({
  queryKey: [ReactQueryCacheKey.CameraPermission],
  queryFn: async () => {
    return await Camera.getCameraPermissionsAsync()
  },
  refetchInterval: false,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
})

export const useCameraPermissionQuery = (): UseQueryResult<PermissionResponse> => {
  return useQuery(cameraPermissionQuery)
}
