import { parseRestProtocolVersion } from '@universe/api'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { CREATE_POOL_PATH } from '~/utils/params/poolLinkParams'

/**
 * Redirects the retired `/positions/create` and `/positions/create/:protocolVersion` routes onto the
 * create-pool leg, `/positions/add/new`, which renders the same form.
 *
 * The version has to move from a path segment into the `protocolVersion` search param, because the
 * add leg has no `:protocolVersion` segment to read. It is re-derived through
 * `parseRestProtocolVersion` rather than forwarded verbatim so an unparseable segment
 * (`/positions/create/garbage`) is dropped instead of written into the param, and so the emitted
 * value is normalized — `/positions/create/V3` becomes `?protocolVersion=v3`.
 *
 * Every existing search param is preserved: these URLs are externally linkable, and the pair, fee,
 * hook and range params are what make a deep link land on a pre-seeded form rather than a blank one.
 */
export function CreatePositionRedirects() {
  const { protocolVersion } = useParams<{ protocolVersion?: string }>()
  const [searchParams] = useSearchParams()

  const params = new URLSearchParams(searchParams)
  const version = parseRestProtocolVersion(protocolVersion)
  const versionLabel = version === undefined ? undefined : getProtocolVersionLabel(version)
  if (versionLabel) {
    params.set('protocolVersion', versionLabel)
  }

  const search = params.toString()
  return <Navigate to={search ? `${CREATE_POOL_PATH}?${search}` : CREATE_POOL_PATH} replace />
}

export default CreatePositionRedirects
