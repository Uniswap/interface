# components

This directory contains **reusable UI components, hooks, and utilities** that are shared across the swap transaction flows in the Uniswap application. The goal is to centralize logic and presentation for common swap-related features, ensuring consistency and maintainability across platforms (web, mobile, extension).

## Purpose

- **DRY Principle:** Avoid duplication by providing a single source for swap-related UI and logic.
- **Consistency:** Ensure a unified user experience for swap features across different parts of the app.
- **Modularity:** Enable easy updates and improvements to swap components in one place.

## What's Inside

- **UI Components:** Buttons, rows, info panels, and other elements used in swap forms (e.g., `SwapArrowButton`, `SwapRateRatio`, `RoutingInfo`).
- **Swap Form Button:** The main swap action button and its supporting hooks and logic.
- **Settings Components:** Modular settings for swap forms, such as slippage tolerance, deadline, and routing preferences, with platform-specific implementations.
- **Price Impact & Slippage:** Components and hooks for displaying and calculating price impact and slippage information.
- **Hooks:** Custom React hooks for handling swap form state, button logic, and settings.

## Contributing

- **Add new shared swap UI or logic here** if it is used in more than one place.
- **Follow existing patterns** for component and hook structure.
- **Write tests** for new logic, following the monorepo's testing strategy.
- **Add to What's Inside section**, if appropriate
