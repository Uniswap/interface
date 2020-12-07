#! /usr/bin/env node

const patchFactoryMainnetAddress = async () => {
  const fs = require('fs')
  require('dotenv').config({ path: `${process.cwd()}/.env.local` })

  console.log('Patching mainnet factory address')
  const { MAINNET_FACTORY_ADDRESS: mainnetFactoryAddress } = process.env
  if (!mainnetFactoryAddress) {
    throw new Error('please define a MAINNET_FACTORY_ADDRESS env in your .env.local file')
  }
  const fileNames = await fs.promises.readdir(`${__dirname}/../build/static/js`)
  for (const fileName of fileNames) {
    const filePath = `${__dirname}/../build/static/js/${fileName}`
    const file = await fs.promises.readFile(filePath)
    const newFile = file.toString().replace('0x0000000000000000000000000000000000000001', mainnetFactoryAddress)
    await fs.promises.writeFile(filePath, newFile)
  }
}

patchFactoryMainnetAddress()
  .then(() => {
    console.log('Successfully patched')
  })
  .catch(error => console.error("error patching factory's mainnet address", error))
