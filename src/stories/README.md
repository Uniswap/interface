# Storybook

[Storybook](https://storybook.js.org/) helps build UI components in isolation. Testing and component documentation are built into the development workflow, leading to better tested and better documented component libraries.

## Useful resources

- [Official Getting Started](https://storybook.js.org/docs/react/get-started/introduction) by Storybook
- Our [Chromatic app](https://www.chromatic.com/builds?appId=61d89aa649fc7d003ae21c76)
- Our published [Storybook app](https://61d89aa649fc7d003ae21c76-gyrkwmtvsx.chromatic.com/)

## What components should have stories?

Literally any component can have a story, either for visual testing or documentation. I (judo) recommend we treat Storybook as a component library for now—that is, low-level presentational components that have high reusability and minimal dependencies (think spacing components, buttons, pills, etc.)

### Heuristic

If you expect your component to be imported by more than 3 other components, consider writing a story to document it (and get visual testing for free!)

### Recommendation

- Presentational components with short dependency list
- Components with hard to reach use cases (e.g. graph with mocked historical data)
- Design system philosophy (Storybook doesn't _require_ a component to be rendered, pages can also just be documentation)
- Design tokens

As our Storybook grows, this recommendation may extend to "compound" components, components that compose other components that have their own stories. The major benefit here is visual testing and documentation for new engineers.

## How to write stories?

Refer to [Storybook stories documentation](https://storybook.js.org/docs/react/writing-stories/introduction)

Storybook supports various `stories` formats.

- `.mdx`: Markdown with support for `jsx`. **No Typescript support**
- `.tsx`: Draw on canvas with Typescript

We're currently leaning on writing stories `.tsx` because of Typescript support.

### Run Storybook locally
To run Storybook locally and view stories:
```
yarn storybook
```

## Chromatic

Chromatic is a cloud service build for Storybook. It allows running visual tests with zero-config.

Chromatic is set up to build and publish our Storybook for each PR. ([example build](https://www.chromatic.com/build?appId=61d89aa649fc7d003ae21c76&number=25)).

In a PR, you should see 4 checks by Chromatic:

- chromatic-deployment workflow
- Storybook Publish: published Storybook to Chromatic
- [UI Review](https://www.chromatic.com/docs/review): invite reviewers to review the changeset introduced by your PR (code review, but for your UI)
- [UI Test](https://www.chromatic.com/docs/test): capture visual snapshot of every story and compares against baseline

## Going Forward

Storybook inside `@uniswap/mobile` is still experimental. Feel free to modify the config as you think would help!

### To research

- Accessability tests
- Interaction tests

### Addons

Storybook has a ton of [addons](https://storybook.js.org/addons/) that we could leverage / write our own.

- <https://storybook.js.org/addons/@storybook/addon-a11y>

### Open questions

- Figma integration? Can Figma re-use our low-level components and design tokens?
- Possibility to share Storybook with `react` (interface/widgets)
