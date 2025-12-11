import { Project, SourceFile, TypeLiteralNode } from 'ts-morph'

const project = new Project()

const path = './src/clients/trading/__generated__/models'

// Request types
const approvalRequestFile = project.addSourceFileAtPath(`${path}/ApprovalRequest.ts`)
const createSendRequestFile = project.addSourceFileAtPath(`${path}/CreateSendRequest.ts`)
const createSwapRequestFile = project.addSourceFileAtPath(`${path}/CreateSwapRequest.ts`)
const quoteRequestFile = project.addSourceFileAtPath(`${path}/QuoteRequest.ts`)
const requestFiles = [approvalRequestFile, createSendRequestFile, createSwapRequestFile, quoteRequestFile]

// Response types
const approvalResponseFile = project.addSourceFileAtPath(`${path}/ApprovalResponse.ts`)
const createSwapResponseFile = project.addSourceFileAtPath(`${path}/CreateSwapResponse.ts`)
const createSendResponseFile = project.addSourceFileAtPath(`${path}/CreateSendResponse.ts`)
const classicQuoteFile = project.addSourceFileAtPath(`${path}/ClassicQuote.ts`)
const chainedQuoteFile = project.addSourceFileAtPath(`${path}/ChainedQuote.ts`)
const responseFiles = [approvalResponseFile, createSwapResponseFile, createSendResponseFile, classicQuoteFile]



const nullablePermitFile = project.addSourceFileAtPath(`${path}/NullablePermit.ts`)
const planStepFile = project.addSourceFileAtPath(`${path}/PlanStep.ts`)


// Enums
const routingFile = project.addSourceFileAtPath(`${path}/Routing.ts`)
const orderTypeFile = project.addSourceFileAtPath(`${path}/OrderType.ts`)
const orderStatusFile = project.addSourceFileAtPath(`${path}/OrderStatus.ts`)

function addImport(params: { file: SourceFile, importName: string, importPath?: string }): void {
  const { file, importName, importPath = '../../types' } = params
  if (!file.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === importPath)) {
    file.addImportDeclaration({
      namedImports: [importName],
      moduleSpecifier: importPath,
    })
  } else {
    const existingImport = file.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === importPath)
    if (
      existingImport &&
      !existingImport.getNamedImports().some((namedImport) => namedImport.getName() === importName)
    ) {
      existingImport.addNamedImport(importName)
    }
  }
}

function saveFiles(params: { files: (SourceFile | SourceFile[])[] }) {
  params.files.forEach((file) => {
    if (Array.isArray(file)) {
      file.forEach((f) => f.saveSync())
    } else {
      file.saveSync()
    }
  })
}

function modifyType(params: {
  file: SourceFile,
  typeName: string,
  newProperties: { name: string; type: string; isOptional?: boolean }[],
  replace?: boolean,
}): void {
  const { file, typeName, newProperties, replace = false } = params
  const typeAlias = file.getTypeAlias(typeName)
  if (typeAlias) {
    const typeNode = typeAlias.getTypeNode()
    if (typeNode && TypeLiteralNode.isTypeLiteral(typeNode)) {
      newProperties.forEach((prop) => {
        const existingProperty = typeNode.getProperty(prop.name)
        if (!existingProperty) {
          typeNode.addProperty({
            name: prop.name,
            type: prop.type,
            hasQuestionToken: prop.isOptional,
          })
          console.log(`Added property ${prop.name} to ${typeName}`)
        } else {
          console.log(`Property ${prop.name} already exists in ${typeName}`)
          if (replace) {
            existingProperty.remove()
            typeNode.addProperty({
              name: prop.name,
              type: prop.type,
              hasQuestionToken: prop.isOptional,
            })
            console.log(`Replaced property ${prop.name} in ${typeName}`)
          }
        }
      })
    } else {
      console.log(`Type ${typeName} is not an object type`)
    }
  } else {
    console.log(`Type ${typeName} not found`)
  }
}

function addToTypeAlias(params: { file: SourceFile, typeName: string, typeToAdd: string }): void {
  const { file, typeName, typeToAdd } = params
  const typeAlias = file.getTypeAlias(typeName)
  if (typeAlias) {
    const typeNode = typeAlias.getTypeNode()
    if (typeNode && TypeLiteralNode.isTypeLiteral(typeNode)) {
      // Note: this isn't the best matcher for the incoming type but until we need more complex matching, this will do.
      if (!typeNode.getText().includes(typeToAdd)) {
        typeAlias.setType(`${typeNode.getText()} ${typeToAdd}`)
        console.log(`Added ${typeToAdd} to ${typeName}`)
      } else {
        console.log(`${typeToAdd} already exists in ${typeName}`)
      }
    }
  } else {
    console.log(`Type ${typeName} not found`)
  }
}

function addEnumMember(params: {
  file: SourceFile,
  enumName: string,
  newMember: { name: string; value: string }
  deprecated?: boolean
}): void {
  const { file, enumName, newMember, deprecated } = params
  const enumDecl = file.getEnum(enumName)

  if (!enumDecl) {
    console.log(`Enum ${enumName} not found in ${file.getBaseName()}`)
    return
  }

  const existing = enumDecl.getMember(newMember.name)

  if (existing) {
    console.log(`Enum member ${newMember.name} already exists in ${enumName}`)
    return
  }

  enumDecl.addMember({
    name: newMember.name,
    initializer: `"${newMember.value}"`,
    docs: deprecated ? [{ description: '@deprecated Deprecation flag added via modifyTradingApiTypes.mts in order to not break existing code.' }] : undefined,
  })

  console.log(`Added enum member ${newMember.name} = "${newMember.value}" to ${enumName}`)
}


function main() {
  // Modify the request interfaces
  requestFiles.forEach((file) => {
    addImport({ file, importName: 'GasStrategy' })
    modifyType({
      file,
      typeName: file.getBaseName().replace('.ts', ''),
      newProperties: [
        { name: 'gasStrategies', type: 'GasStrategy[]', isOptional: true },
      ],
    })
  })

  // Modify the response interfaces
  responseFiles.forEach((file) => {
    addImport({ file, importName: 'GasEstimate' })
    modifyType({
      file,
      typeName: file.getBaseName().replace('.ts', ''),
      newProperties: [
        { name: 'gasEstimates', type: 'GasEstimate[]', isOptional: true },
      ],
    })
  })
  addImport({ file: chainedQuoteFile, importName: 'GasEstimate' })
  addImport({ file: chainedQuoteFile, importName: 'slippageTolerance', importPath: './slippageTolerance' })
  modifyType({
    file: chainedQuoteFile,
    typeName: 'ChainedQuote',
    newProperties: [
      { name: 'gasEstimates', type: 'GasEstimate[]', isOptional: true },
      { name: 'slippage', type: 'slippageTolerance', isOptional: true },
    ],
    replace: true,
  })

  modifyType({
    file: planStepFile,
    typeName: 'PlanStep',
    newProperties: [
      { name: 'stepType', type: 'string', isOptional: true },
    ],
  })

  // TODO: NullablePermit is marked as nullable in api.json but not in the generated types.
  addToTypeAlias({
    file: nullablePermitFile,
    typeName: 'NullablePermit',
    typeToAdd: '| null',
  })


  // Add new enum member
  addEnumMember({ file: routingFile, enumName: 'Routing', newMember: { name: 'JUPITER', value: 'JUPITER' } })

  // TODO: Check if this was removed from the API. Leaving it in to not break existing code.
  addEnumMember({ file: routingFile, enumName: 'Routing', newMember: { name: 'DUTCH_LIMIT', value: 'DUTCH_LIMIT' }, deprecated: true })
  addEnumMember({ file: orderTypeFile, enumName: 'OrderType', newMember: { name: 'DUTCH', value: 'DUTCH' }, deprecated: true })
  addEnumMember({ file: orderTypeFile, enumName: 'OrderType', newMember: { name: 'DUTCH_LIMIT', value: 'DUTCH_LIMIT' }, deprecated: true })
  addEnumMember({ file: orderStatusFile, enumName: 'OrderStatus', newMember: { name: 'UNVERIFIED', value: 'unverified' }, deprecated: true })


  saveFiles({
    files: [
      requestFiles,
      responseFiles,
      routingFile,
      nullablePermitFile,
      orderTypeFile,
      orderStatusFile,
      chainedQuoteFile,
      planStepFile,
    ]

  })
  console.log('Trading API types have been updated')
}

main()
