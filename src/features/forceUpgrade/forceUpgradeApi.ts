import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'
import { getUniqueId } from 'react-native-device-info'
import { config } from 'src/config'
import { flags } from 'src/features/experiments/flagsConstants'
import { UpgradeStatus } from 'src/features/forceUpgrade/types'
import { logger } from 'src/utils/logger'
import { getFullAppVersion } from 'src/utils/version'

type UpgradeStatusReponse = {
  force_upgrade: {
    key: 'on' | 'off'
    payload: {
      minVersion: string
      status: 'recommended' | 'required'
    }
  }
}

export const forceUpgradeApi = createApi({
  reducerPath: 'forceUpgradeApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (builder) => ({
    checkForceUpgrade: builder.query<UpgradeStatus, void>({
      async queryFn() {
        if (__DEV__) {
          return { data: UpgradeStatus.NotRequired }
        }

        const response = await fetchUpgradeStatus()
        const upgradeStatus = transformResponse(response)

        return { data: upgradeStatus }
      },
    }),
  }),
})

export const { useCheckForceUpgradeQuery } = forceUpgradeApi

const fetchUpgradeStatus = async (): Promise<UpgradeStatusReponse> => {
  const request = {
    headers: {
      Authorization: `Api-Key ${config.amplitudeExperimentsDeploymentKey}`,
    },
  }

  const uniqueID = await getUniqueId()
  const response = await fetch(
    `${config.amplitudeApiUrl}?device_id=${uniqueID}&flag_key=${flags.force_upgrade?.name}`,
    request
  )

  try {
    return (await response.json()) as UpgradeStatusReponse
  } catch (error) {
    logger.error('forceUpgrdeApi', 'fetchUpgradeStatus', `${error}`)
    return flags.force_upgrade?.defaultValue as UpgradeStatusReponse
  }
}

const transformResponse = (data: UpgradeStatusReponse): UpgradeStatus => {
  const flagObj = data.force_upgrade

  if (flagObj?.key !== 'on') {
    return UpgradeStatus.NotRequired
  }

  const status = flagObj.payload?.status
  const minVersion = flagObj.payload?.minVersion
  if (!status || !minVersion) {
    return UpgradeStatus.NotRequired
  }

  const appVersion = getFullAppVersion()
  if (appVersion >= minVersion) {
    return UpgradeStatus.NotRequired
  }

  if (status === 'recommended') {
    return UpgradeStatus.Recommended
  } else if (status === 'required') {
    return UpgradeStatus.Required
  } else {
    return UpgradeStatus.NotRequired
  }
}
