#  Kinetix Interface

An open source interface for Kinetix -- a protocol for decentralized exchange of Ethereum tokens.


## Unsupported tokens

Check out `useUnsupportedTokenList()` in [src/state/lists/hooks.ts](./src/state/lists/hooks.ts) for blocking tokens in your instance of the interface.

You can block an entire list of tokens by passing in a tokenlist like [here](./src/constants/lists.ts)

## Contributions

For steps on local deployment, development, and code contribution, please see [CONTRIBUTING](./CONTRIBUTING.md).

#### PR Title
Your PR title must follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary), and should start with one of the following [types](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#type):

- build: Changes that affect the build system or external dependencies (example scopes: yarn, eslint, typescript)
- ci: Changes to our CI configuration files and scripts (example scopes: vercel, github, cypress)
- docs: Documentation only changes
- feat: A new feature
- fix: A bug fix
- perf: A code change that improves performance
- refactor: A code change that neither fixes a bug nor adds a feature
- style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- test: Adding missing tests or correcting existing tests

Example commit messages:

- feat: adds support for gnosis safe wallet
- fix: removes a polling memory leak
- chore: bumps redux version

Other things to note:

- Please describe the change using verb statements (ex: Removes X from Y)
- PRs with multiple changes should use a list of verb statements
- Add any relevant unit / integration tests
- Changes will be previewable via vercel. Non-obvious changes should include instructions for how to reproduce them


