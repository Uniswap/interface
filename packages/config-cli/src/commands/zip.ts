import { AppId } from '@universe/config'
import { Environment } from '@universe/environment'
import { Cli, z } from 'incur'

export const zip = Cli.create('zip', {
  description: "Bundle all apps' configs into a single zip file for sharing or onboarding.",
  options: z.object({
    env: z.enum(Environment).default(Environment.Development).describe('Environment stage'),
    out: z.string().optional().describe('Output zip path (default: ./config-<env>-<timestamp>.zip)'),
    apps: z
      .array(z.enum(AppId))
      .optional()
      .describe('Subset of apps to include (repeat flag for multiple, defaults to all)'),
  }),
  run(c) {
    return { todo: 'zip', env: c.options.env, out: c.options.out, apps: c.options.apps }
  },
})
