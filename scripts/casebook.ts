/**
 * Compatibility shim — the Casebook engine lives in apps/cli/src/casebook/.
 * Every documented `bun scripts/casebook.ts …` command (skill, CI, hooks, READMEs)
 * keeps working through this file; delete it once those callers use `bun cli casebook`.
 */
import { main } from '@universe/cli/src/casebook/main'

await main()
