import { useQueryClient } from '@tanstack/react-query'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useInvalidateUnitagsQueries(): () => void {
  const queryClient = useQueryClient()

  return useEvent(() => {
    queryClient.invalidateQueries({ queryKey: [ReactQueryCacheKey.UnitagsApi] }).catch((error) => {
      logger.error(error, {
        tags: {
          file: 'useInvalidateUnitagsQueries.ts',
          function: 'queryClient.invalidateQueries',
        },
      })
    })
  })
}
