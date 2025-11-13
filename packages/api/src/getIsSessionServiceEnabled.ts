import { getConfig } from '@universe/config'

function getIsSessionServiceEnabled(): boolean {
  return getConfig().enableSessionService
}

export { getIsSessionServiceEnabled }
