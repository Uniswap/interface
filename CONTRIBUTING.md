
# Contributing

Thank you for your interest in contributing to the Uniswap interface! 🦄

# Development

## Running the interface locally

1. `yarn install`
1. `yarn start`

## Creating a production build

1. `yarn install`
1. `yarn build`

## Engineering standards

Code merged into the `main` branch of this repository should adhere to high standards of correctness and maintainability. 
Use your best judgment when applying these standards.  If code is in the critical path, will be frequently visited, or 
makes large architectural changes, consider following all the standards.

- Have at least one engineer approve of large code refactorings
- At least manually test small code changes, prefer automated tests
- Thoroughly unit test when code is not obviously correct
- If something breaks, add automated tests so it doesn't break again
- Add integration tests for new pages or flows
- Verify that all CI checks pass before merging
- Have at least one product manager or designer approve of significant UX changes

## Guidelines

The following points should help guide your development:

- Security: the interface is safe to use
  - Avoid adding unnecessary dependencies due to [supply chain risk](https://github.com/LavaMoat/lavamoat#further-reading-on-software-supplychain-security)
- Reproducibility: anyone can build the interface
  - Avoid adding steps to the development/build processes
  - The build must be deterministic, i.e. a particular commit hash always produces the same build
- Decentralization: anyone can run the interface
  - An Ethereum node should be the only critical dependency 
  - All other external dependencies should only enhance the UX ([graceful degradation](https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation))
- Accessibility: anyone can use the interface
  - The interface should be responsive, small and run well on low performance devices (majority of swaps on mobile!)

## Release process

Releases are cut automatically from the `main` branch Monday-Thursday in the morning according to the [release workflow](./.github/workflows/release.yaml).

Fix pull requests should be merged whenever ready and tested. 
If a fix is urgently needed in production, releases can be manually triggered on [GitHub](https://github.com/Uniswap/uniswap-interface/actions/workflows/release.yaml)
after the fix is merged into `main`.

Features should not be merged into `main` until they are ready for users.
When building larger features or collaborating with other developers, create a new branch from `main` to track its development.
Use the automatic Vercel preview for sharing the feature to collect feedback.  
When the feature is ready for review, create a new pull request from the feature branch into `main` and request reviews from 
the appropriate UX reviewers (PMs or designers).

## Finding a first issue

Start with issues with the label
[`good first issue`](https://github.com/Uniswap/uniswap-interface/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22).

# Translations

Uniswap uses [Crowdin](https://crowdin.com/project/uniswap-interface) for managing translations. 
[This workflow](./.github/workflows/crowdin.yaml) uploads new strings for translation to the Crowdin project whenever code using the [lingui translation macros](https://lingui.js.org/ref/macro.html) is merged into `main`.

Every hour, translations are synced back down from Crowdin to the repository in [this other workflow](./.github/workflows/crowdin-sync.yaml).
We sync to the repository on a schedule, rather than download translations at build time, so that builds are always reproducible.

You can contribute by joining Crowdin to proofread existing translations [here](https://crowdin.com/project/uniswap-interface/invite?d=93i5n413q403t4g473p443o4c3t2g3s21343u2c3n403l4b3v2735353i4g4k4l4g453j4g4o4j4e4k4b323l4a3h463s4g453q443m4e3t2b303s2a35353l403o443v293e303k4g4n4r4g483i4g4r4j4e4o473i5n4a3t463t4o4)

Or, ask to join us as a translator in the Discord!
