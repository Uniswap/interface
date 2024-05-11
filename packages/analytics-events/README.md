# Ubeswap Analytics Events

This package contains constants and definitions that is used with `@ubeswap/analytics`.
This is forked from `@uniswap/analytics-events`

## Installation

Install via `npm` or `yarn`.

```bash
yarn add @ubeswap/analytics-events
```

```bash
npm i --save @ubeswap/analytics-events
```

## Adding Events

Events are composed of an event name, event properties, and user properties. Event names, event properties, and property values are defined by enumerations in this repository to ensure ensure that event logging is not prone to misspelling, inconsistency, repetition, or unexpected logged values.

This README will go over how to design, name, organize, and test your event names, event properties, and property values.

Here is a short illustrative example of what events will look like in code once defined:

```javascript
// Event names example
export enum NFTBuyEvents {
  NFT_BUY_ADDED = 'NFT Buy Bag Added',
  NFT_BUY_BAG_CHANGED = 'NFT Buy Bag Changed',
  NFT_BUY_BAG_REFUNDED = 'NFT Buy Bag Refunded',
  NFT_BUY_BAG_SIGNED = 'NFT Buy Bag Signed',
  NFT_BUY_BAG_SUCCEEDED = 'NFT Buy Bag Succeeded',
}

// Event properties example
export enum WalletEventProperties {
    WALLET_ADDRESS = 'wallet_address',
    TO_ADDRESS = 'to_address',
    TIMESTAMP_EPOCH_SECONDS = 'timestamp_epoch_seconds',
}

// Property values example
export enum DocsSentiment {
  NEGATIVE_SENTIMENT = 'Negative Sentiment',
  NEUTRAL_SENTIMENT = 'Neutral Sentiment',
  POSITIVE_SENTIMENT = 'Positive Sentiment',
}
```

## Designing Events: The Trace Framework

This library implements the [Trace framework](https://slack.engineering/creating-a-react-analytics-logging-library/) to enable easy default properties and basic hierarchy of context. The following context properties are available, in order of specificity. This can be used directly for ease or logged manually for custom trigger events.

| Context     | Description                                                                                                                           |
| :---------  | :------------------------------------------------------------------------------------------------------------------------------------ |
| `page`      | The highest order context in the app. Describes the page / tab, such as Swap, Explore, Pool, Vote, etc.                               |
| `section`   | A section within the top level context. When a modal is open, section describes the part of the page from which the modal originated. |
| `modal`     | A modal, if one exists at the time of the event.                                                                                      |
| `element`   | The most specific element that triggered the event such as a specific button or link.                                                 |

No specific context is required and any or all of these trace fields may be null. Use these as it makes sense for your context, and define possible values in this repository. These fields will work in tandem with your event names and event properties.

Trace context values should follow property value naming conventions.

## Naming Conventions

Event names should:
- follow the Object-Action naming convention (based on this [article](https://segment.com/academy/collecting-data/naming-conventions-for-clean-data/)).
- be human readable
- capitalize each word (e.g [Proper Case](https://www.computerhope.com/jargon/p/proper-case.htm))
- start with object/product to ensure events are grouped together in Amplitude (sorted alphabetically)
- us past tense verbs (e.g. Button *Clicked*).
- *not* use acronyms or short hand (e.g. use `Transaction` over `Txn`)

Property names should:
- be `snake_case`
- be prefixed with `is_` when representing a boolean value
- end in units (unabbreviated) when needed (e.g. `time_seconds`)
- *not* use acronyms or short hand (e.g. use `Transaction` over `Txn`)

Property values should:
- be a boolean, number, string, or enum (of strings) type.
- strings: be consistent within all possible values, opting for either `Proper Case`, `kebab-case`,  or `snake-case`. The default selection should be `Proper Case`.

## Defining Events In Code

Event names, property names, and property values should all be defined in Javascript using `enum`'s and follow the following conventions:
- `enum` names should be as specific as possible (e.g `DocsProtocolVersion` over `Version`).
- `enum` names should be in `PascalCase`.
- Code values of enums should be named in `UPPER_SNAKE_CASE`.

## Organizing Events

These enumerations and events can be shared across products or be specific to a product or use case. All event names, property names, and property values should be defined using enumerations placed in the best folder for ease of reference, and can be split out into separate files when needed. When defining enumerations, consider that the package exports all names at the top level, so adding a specific prefix for your product or use case may be useful. If your use cases are highly generalizable, you can define your enumeration as a primitive or reuse an existing primitive.

Top level files are for such as [primitives](./src/primitives.ts) contain generic data that is supposed to be reused by different applications. This data describes the events being logged, such as `EventName.MENU_CLICK`, which reflects an event on a menu. Specific event context should be captured in additional fields beyond the event name to create user-friendly hierarchy groupings.

Folders should be made by origin or product. For example, [docs](./src/docs) contains events specific to our documentation. Folders can be grouped by product when multiple origins could use these events, such as general actions like swapping.

## Testing Events

For rapid development, a convenience flow is available that allows you to do the following in a single command:
- create a tarball copy of the latest events
- copy this tarball to the specified project
- install this package in the specified project

To set this up, define the following environment variables (in your bash/zsh profile or as desired):
```bash
export ANALYTICS_IMPLEMENTING_REPO_PATH={PATH}
export ANALYTICS_IMPLEMENTING_REPO_INSTALL={npm|yarn}
```
Once set up, run the following command to run the sequence above:

```bash
yarn tarball:install
```

This flow also clears your `tmp` cache only for yarn, ensuring yarn install times are not degraded after testing your analytics changes.

When you're done testing, undo the changes so you don't commit the temporary file to remote:
`git restore package.json yarn.lock && rm ubeswap-analytics-events-dev.tgz && yarn`.

### Manually Installing

To test generate a tarball of the new test package and install it directly, using the following command:

```bash
yarn tarball
```

This will generate a `ubeswap-analytics-events-dev.tgz` including your changes and a `0.0.1` package version number.

To install it in your implementing repo, copy/move the tarball to the top level of your implementing repo and then run the following commands:

```bash
# yarn
yarn cache clean
yarn add file:ubeswap-analytics-dev.tgz

# npm
npm install ubeswap-analytics-dev.tgz
```

## Releasing Events

Releasing a new version of the package is performed automatically after pushing code to main using the [release](/.github/workflows/release.yaml) Github workflow.

This repository uses [semantic-release](https://github.com/semantic-release/semantic-release) for the release process,
which in turn uses the [Angular commit message suggestions](https://github.com/angular/angular/blob/main/CONTRIBUTING.md) to identify the type of release.

Once a release is published, integrating your new events is as simple as updating to the latest version of the package via `npm`/`yarn`, replacing your local tarball.
