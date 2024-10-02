import { Project, SourceFile, TypeLiteralNode } from 'ts-morph'

const project = new Project()

const path = './src/data/tradingApi/__generated__/models'

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
const responseFiles = [approvalResponseFile, createSwapResponseFile, createSendResponseFile, classicQuoteFile]

function addImport(file: SourceFile, importName: string) {
  if (!file.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === '../../types')) {
    file.addImportDeclaration({
      namedImports: [importName],
      moduleSpecifier: '../../types',
    })
  } else {
    const existingImport = file.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === '../../types')
    if (
      existingImport &&
      !existingImport.getNamedImports().some((namedImport) => namedImport.getName() === importName)
    ) {
      existingImport.addNamedImport(importName)
    }
  }
}

function modifyType(
  file: SourceFile,
  typeName: string,
  newProperties: { name: string; type: string; isOptional?: boolean }[],
) {
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
        }
      })
    } else {
      console.log(`Type ${typeName} is not an object type`)
    }
  } else {
    console.log(`Type ${typeName} not found`)
  }
}

// Modify the request interfaces
requestFiles.forEach((file) => {
  addImport(file, 'GasStrategy')
  modifyType(file, file.getBaseName().replace('.ts', ''), [
    { name: 'gasStrategies', type: 'GasStrategy[]', isOptional: true },
  ])
})

// Modify the response interfaces
responseFiles.forEach((file) => {
  addImport(file, 'GasEstimate')
  modifyType(file, file.getBaseName().replace('.ts', ''), [
    { name: 'gasEstimates', type: 'GasEstimate[]', isOptional: true },
  ])
})

// Save the changes
requestFiles.forEach((file) => {
  file.saveSync()
})
responseFiles.forEach((file) => {
  file.saveSync()
})

console.log('Trading API types have been updated')
