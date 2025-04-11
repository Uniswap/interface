import { useEffect } from 'react'
import { useCameraPermissionQuery } from 'src/components/QRCodeScanner/hooks/useCameraPermissionQuery'
import { useRequestCameraPermissionMutation } from 'src/components/QRCodeScanner/hooks/useRequestCameraPermissionMutation'

export function useRequestCameraPermissionOnMountEffect(): void {
  const { data: permission, isFetched } = useCameraPermissionQuery()
  const { mutate, isPending, isError, isSuccess } = useRequestCameraPermissionMutation()

  const isGranted = permission?.granted

  useEffect((): void => {
    // only request permission if we haven't already requested it and we haven't already been granted permission
    const shouldRequestPermission = !isGranted && isFetched && !isPending && !isError && !isSuccess
    if (shouldRequestPermission) {
      mutate()
    }
  }, [isFetched, isGranted, isPending, mutate, isError, isSuccess])
}
