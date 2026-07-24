/**
 * Guards the iOS WidgetsCore target against orphaned Apollo codegen references.
 *
 * `apollo-ios-cli generate` (run during native iOS builds) emits one Swift file
 * per GraphQL operation/fragment plus one per schema type transitively used by
 * them. `Uniswap.xcodeproj/project.pbxproj` lists those generated files as
 * compile sources by explicit path, so deleting or renaming an operation in the
 * .graphql inputs without updating the pbxproj breaks every full native iOS
 * build with `error opening input file` — and PR CI never runs native builds.
 *
 * This check recomputes the expected generated-file set from the same inputs
 * apollo-codegen-config.json points at (pure JS, runs on Linux) and diffs it
 * against the pbxproj references, failing with the exact file lists when they
 * disagree.
 */
import { globSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildSchema,
  parse,
  visit,
  TypeInfo,
  visitWithTypeInfo,
  getNamedType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  isScalarType,
  isSpecifiedScalarType,
  type GraphQLSchema,
  type GraphQLNamedType,
  type OperationTypeNode,
} from 'graphql'

const MOBILE_IOS_DIR = resolve(import.meta.dirname, '../ios')
const CONFIG_PATH = join(MOBILE_IOS_DIR, 'apollo-codegen-config.json')
const PBXPROJ_PATH = join(MOBILE_IOS_DIR, 'Uniswap.xcodeproj/project.pbxproj')

interface CodegenConfig {
  schemaNamespace: string
  input: {
    operationSearchPaths: string[]
    schemaSearchPaths: string[]
  }
}

function classify(type: GraphQLNamedType): string | undefined {
  if (isObjectType(type)) {
    return 'Objects'
  }
  if (isInterfaceType(type)) {
    return 'Interfaces'
  }
  if (isUnionType(type)) {
    return 'Unions'
  }
  if (isEnumType(type)) {
    return 'Enums'
  }
  if (isInputObjectType(type)) {
    return 'InputObjects'
  }
  if (isScalarType(type) && !isSpecifiedScalarType(type)) {
    return 'CustomScalars'
  }
  return undefined
}

// apollo-ios-cli's generated-file naming per operation kind.
const OPERATION_NAMING: Record<OperationTypeNode, { folder: string; suffix: string }> = {
  query: { folder: 'Queries', suffix: 'Query' },
  mutation: { folder: 'Mutations', suffix: 'Mutation' },
  subscription: { folder: 'Subscriptions', suffix: 'Subscription' },
}

function computeExpectedFiles(config: CodegenConfig, schema: GraphQLSchema, documentSources: string[]): Set<string> {
  const ns = config.schemaNamespace
  const referenced = new Map<string, string>() // type name -> folder
  const files = new Set<string>([
    `${ns}/${ns}.graphql.swift`,
    `${ns}/Schema/SchemaMetadata.graphql.swift`,
    `${ns}/Schema/SchemaConfiguration.swift`,
  ])

  const addType = (type: GraphQLNamedType | null | undefined): void => {
    if (!type || type.name.startsWith('__')) {
      return
    }
    const folder = classify(type)
    if (!folder || referenced.has(type.name)) {
      return
    }
    referenced.set(type.name, folder)
    // Input objects pull in their transitive field types (inputs/enums/scalars).
    if (isInputObjectType(type)) {
      for (const field of Object.values(type.getFields())) {
        addType(getNamedType(field.type))
      }
    }
  }

  for (const source of documentSources) {
    const doc = parse(source)
    const typeInfo = new TypeInfo(schema)
    visit(
      doc,
      visitWithTypeInfo(typeInfo, {
        OperationDefinition(node) {
          if (!node.name) {
            throw new Error('Anonymous GraphQL operations are not supported by the codegen check')
          }
          const naming = OPERATION_NAMING[node.operation]
          files.add(`${ns}/Operations/${naming.folder}/${node.name.value}${naming.suffix}.graphql.swift`)
          addType(schema.getRootType(node.operation) ?? undefined)
        },
        FragmentDefinition(node) {
          files.add(`${ns}/Fragments/${node.name.value}.graphql.swift`)
          addType(schema.getType(node.typeCondition.name.value))
        },
        InlineFragment(node) {
          if (node.typeCondition) {
            addType(schema.getType(node.typeCondition.name.value))
          }
        },
        Field() {
          // Return types and parent types surface in the generated Swift
          // (response models). Argument types passed as inline literals do
          // not — apollo-ios-cli only emits input/enum types that appear as
          // variable types or in response positions.
          const fieldDef = typeInfo.getFieldDef()
          if (fieldDef) {
            addType(getNamedType(fieldDef.type))
          }
          const parent = typeInfo.getParentType()
          if (parent) {
            addType(getNamedType(parent))
          }
        },
        VariableDefinition(node) {
          let t = node.type
          while (t.kind !== 'NamedType') {
            t = t.type
          }
          addType(schema.getType(t.name.value))
        },
      }),
    )
  }

  // Fixpoint: apollo-ios-cli also emits (a) every interface implemented by an
  // emitted object type and (b) every object type implementing an emitted
  // interface (possible-types metadata for fragment matching).
  let grew = true
  while (grew) {
    grew = false
    const before = referenced.size
    for (const name of [...referenced.keys()]) {
      const type = schema.getType(name)
      if (isObjectType(type)) {
        for (const iface of type.getInterfaces()) {
          addType(iface)
        }
      }
      if (isInterfaceType(type)) {
        for (const impl of schema.getPossibleTypes(type)) {
          addType(impl)
        }
      }
      if (isUnionType(type)) {
        for (const member of type.getTypes()) {
          addType(member)
        }
      }
    }
    grew = referenced.size > before
  }

  for (const [name, folder] of referenced) {
    files.add(`${ns}/Schema/${folder}/${name}.graphql.swift`)
  }
  return files
}

function pbxprojReferencedFiles(pbxproj: string, ns: string): Set<string> {
  const out = new Set<string>()
  const re = new RegExp(`path = (WidgetsCore/${ns}/[^;]+);`, 'g')
  for (const match of pbxproj.matchAll(re)) {
    const path = match[1]
    if (path !== undefined) {
      out.add(path.replace(/^WidgetsCore\//, ''))
    }
  }
  return out
}

function main(): void {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as CodegenConfig
  const schemaSource = config.input.schemaSearchPaths
    .map((p) => readFileSync(resolve(MOBILE_IOS_DIR, p), 'utf8'))
    .join('\n')
  const schema = buildSchema(schemaSource)
  // operationSearchPaths are glob search patterns: entries matching no file
  // are silently skipped by apollo-ios-cli, so a missing path is not an error.
  const documentSources = config.input.operationSearchPaths
    .flatMap((pattern) => globSync(pattern, { cwd: MOBILE_IOS_DIR }))
    .map((match) => readFileSync(resolve(MOBILE_IOS_DIR, match), 'utf8'))

  const expected = computeExpectedFiles(config, schema, documentSources)
  const referenced = pbxprojReferencedFiles(readFileSync(PBXPROJ_PATH, 'utf8'), config.schemaNamespace)

  const orphaned = [...referenced].filter((f) => !expected.has(f)).sort()
  const unreferenced = [...expected].filter((f) => !referenced.has(f)).sort()

  if (orphaned.length === 0 && unreferenced.length === 0) {
    console.log(`✅ project.pbxproj is in sync with Apollo codegen output (${referenced.size} generated files)`)
    return
  }
  if (orphaned.length > 0) {
    console.error('❌ project.pbxproj references generated files Apollo codegen will no longer emit')
    console.error('   (a GraphQL operation/fragment/type was removed or renamed without updating the Xcode project):')
    for (const f of orphaned) {
      console.error(`   - WidgetsCore/${f}`)
    }
    console.error('   Fix: remove these references from apps/mobile/ios/Uniswap.xcodeproj/project.pbxproj')
    console.error('   (build-file, file-reference, group, Sources phase, and codegen file-list entries).')
  }
  if (unreferenced.length > 0) {
    console.error('❌ Apollo codegen will emit generated files project.pbxproj does not reference')
    console.error('   (a GraphQL operation/fragment/type was added without updating the Xcode project):')
    for (const f of unreferenced) {
      console.error(`   - WidgetsCore/${f}`)
    }
    console.error('   Fix: add these to the WidgetsCore target (see scripts/update_apollo_files_in_xcode.rb).')
  }
  process.exit(1)
}

main()
