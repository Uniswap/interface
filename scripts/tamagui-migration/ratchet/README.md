# Converted-directory ratchet

Part of the Tamagui → Tailwind migration tooling (INFRA-2957). The conversion codemod lives in `../codemod/`.

`ratchet.json` lists directories that are fully converted off Tamagui. The dangerfile (see the tamagui import check in `dangerfile.ts`, which calls `check.ts`) fails any PR that adds a `ui/src` or `tamagui` import to a file under a listed directory.

Add the directory to `ratchet.json` **in the same PR** that converts it, so the ratchet only ever tightens. Entries are repo-relative paths with no trailing slash.

```bash
bun test scripts/tamagui-migration/ratchet
```
