import { useQueryClient } from '@tanstack/react-query'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useResetUnitagsQueries(): () => void {
  const queryClient = useQueryClient()

  return useEvent(() => {
    queryClient.resetQueries({ queryKey: [ReactQueryCacheKey.UnitagsApi] }).catch((error) => {
      logger.error(error, {
        tags: {
          file: 'useResetUnitagsQueries.ts',
          function: 'queryClient.resetQueries',
        },
      })
    })
  })
}
