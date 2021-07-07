# Contributing

Thank you for your interest in contributing to the Uniswap interface! 🦄

# Development

## Running the interface locally

1. `yarn install`
1. `yarn start`

## Creating a production build

1. `yarn install`
1. `yarn build`

## Standards

Code merged into the `main` branch of this repository should adhere to high standards of correctness and maintainability. 
Consider these guidelines and use your best judgment when applying them. 
If code is in the critical path, will be frequently visited, or makes large architectural changes,
consider following all the guidelines.

- Have at least one engineer approve of large code refactorings
- Manually test small code changes
- Thoroughly unit test when code is not obviously correct
- Add integration tests for new pages or flows
- Verify that all CI checks pass (or failed only due to flakiness) before merging
- Have at least one product manager or designer approve of significant product or UX changes

In addition, the following points should be emphasized when developing for the interface:

- Security: The interface crafts sensitive transaction data for users to sign, so avoid adding unnecessary dependencies due to [supply chain risk](https://github.com/LavaMoat/lavamoat#further-reading-on-software-supplychain-security)
- Reproducibility: Users should be able to easily run the interface locally and reproduce each release, so avoid adding steps to the development/build processes (especially non-deterministic steps)
- Decentralization: An Ethereum node should be the only hard dependency for the interface to function. All other dependencies should only enhance the UX

## Finding a first issue

Start with issues with the label
[`good first issue`](https://github.com/Uniswap/uniswap-interface/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22).

# Translations

Help Uniswap reach a global audience! 

Uniswap uses [Crowdin](https://crowdin.com/project/uniswap-interface) 
for managing translations. Whenever a new string is added to the project,
it gets uploaded to Crowdin for translation by [this workflow](./.github/workflows/crowdin.yaml).

Every hour, translations are synced from Crowdin to the repository in [this other workflow](./.github/workflows/crowdin-sync.yaml).

You can contribute by joining Crowdin to proofread existing translations [here](https://crowdin.com/project/uniswap-interface/invite?d=93i5n413q403t4g473p443o4c3t2g3s21343u2c3n403l4b3v2735353i4g4k4l4g453j4g4o4j4e4k4b323l4a3h463s4g453q443m4e3t2b303s2a35353l403o443v293e303k4g4n4r4g483i4g4r4j4e4o473i5n4a3t463t4o4)

Or, ask to join us as a translator in the Discord!
