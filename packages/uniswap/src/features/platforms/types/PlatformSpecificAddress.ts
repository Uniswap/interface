import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { HexString } from 'utilities/src/addresses/hex'

/** Generic utility type for narrowing address string type by platform; Mainly used for type enforcement of EVM 0x prefixes which simplifies interactions with some libraries. */
export type PlatformSpecificAddress<P extends Platform> = P extends Platform.EVM ? HexString : string
