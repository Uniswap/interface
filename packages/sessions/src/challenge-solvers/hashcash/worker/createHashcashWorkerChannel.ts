/**
 * Base stub for hashcash worker channel factory.
 * Platform-specific implementations override this file.
 */

import type {
  CreateHashcashWorkerChannelContext,
  HashcashWorkerChannel,
} from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

function createHashcashWorkerChannel(_ctx: CreateHashcashWorkerChannelContext): HashcashWorkerChannel {
  throw new PlatformSplitStubError('createHashcashWorkerChannel')
}

export { createHashcashWorkerChannel }
