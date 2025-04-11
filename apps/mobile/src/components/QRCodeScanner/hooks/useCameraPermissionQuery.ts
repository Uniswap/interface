import { queryOptions, useQuery, UseQueryResult } from '@tanstack/react-query'
import { Camera, PermissionResponse } from 'expo-camera'

export const cameraPermissionQuery = queryOptions({
  queryKey: ['cameraPermission'],
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
