# Casebook — regression test-case catalogs

Source of truth for release regression test cases, one directory per product area:
`packages/casebook/<area>/` holds `_defaults.yaml` (area registry entry), `scenarios/*.md`
(cases grouped by functionality, YAML frontmatter + Given/When/Then), and a generated
`COVERAGE_MATRIX.md`. Deliberately not an Nx project, so catalog edits never invalidate
feature-project CI; the engine maps changes to cases via each case's `code_paths`.

Validate: `bun scripts/casebook.ts --validate` · Skill: `/casebook` · Design doc: Notion → Release Strategy Hub → Casebook — Design Doc.
