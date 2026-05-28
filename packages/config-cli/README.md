# @universe/config-cli

CLI for authenticating against Okta and fetching app configs from the backend Config Service. Replaces the patchwork of `.env` files, 1Password vaults, and Vercel/GitHub Secrets that apps currently use to source their configuration.

Built on [`incur`](https://github.com/wevm/incur).

## Commands

| Command | Purpose |
| --- | --- |
| `bun config:login` | Authenticate via Okta Device Authorization Flow; tokens stored in macOS Keychain |
| `bun config:logout` | Revoke tokens and clear Keychain entries |
| `bun config:view <app>` | Print an app's config parameters to stdout |
| `bun config:pull <app>` | Fetch parameters and write them to the app's local env file |
| `bun config:zip` | Bundle all apps' configs into a single zip for sharing or onboarding |
| `bun config:unzip <file>` | Unpack a config zip into each app's env file location |

## How it fits in

`bun start` / `bun dev` in each app depend on a `config:pull` Nx target that wraps this CLI, so the latest configs are fetched (and cached for 10 minutes) before the dev server boots. CI invokes the same commands to load environment values before testing, building, or deploying.
