import { useAppSelector } from 'state/hooks'
import { AppState } from 'state/reducer'

export function useIsNotOriginCountry(country: string) {
  const originCountry = useAppSelector((state: AppState) => state.user.originCountry)
  return Boolean(originCountry) && originCountry !== country
}
