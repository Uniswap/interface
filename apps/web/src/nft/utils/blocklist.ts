import { BlockedNftCollectionsConfigKey, DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'

const baseBlocklistedCollections = [
  '0xd5eeac01b0d1d929d6cffaaf78020af137277293',
  '0x85c08fffa9510f87019efdcf986301873cbb10d6',
  '0x32d7e58933fceea6b73a13f8e30605d80915b616',
  '0x88e49f9fd4cc3d30f2f46c652f59fb52c4874f23',
  '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7',
  '0xd945f759d422ae30a6166838317b937de08380e3',
  '0x8e52fb89b6311bd9ec36bd7cea9a0c311fd27a92',
  '0x2079c2765462af6d78a9ccbddb6ff3c6d4ba2e24',
  '0xd4d871419714b778ebec2e22c7c53572b573706e',
  '0x7219f3a405844a4173ac822ee18994823bec2b4f',
  '0x17239c18d6da14043d9eaea1cd0975a993e09ed5',
  '0xf3ab7381ad118e29a3328e00ea6ff434496d3b95',
  '0xba83bf331e478294e17c46e56a446250aad0b84c',
  '0xa321fc348264492bc08b8bdf9d7bb0421a30212a',
  '0x8e7cdd26d81811bbcd39ffa0c2a01ade14722cb0',
  '0x6a9f7429e04c1a04f02bc2e6a4be3159ff130137',
  '0x495f947276749ce646f68ac8c248420045cb7b5e',
  '0x01bba896c86c2f2739ec814900c12adeff6d5a11',
  '0x92e5c08d485d264a7001fcb36d3b52cbb9d26e04',
  '0x837f60e4f4d010943fdf93e5f3c3de8b6ef71006',
  '0x8ee1b4590420e912a7d2b9820856915adb6dba53',
  '0x58f4fdf20c1a4cd1610af336fe3ebcd2bc9d4931',
  '0x51bca76555a8a44cb6d38380b36ec30526cbd725',
  '0x1d963688fe2209a98db35c67a041524822cf04ff',
  '0x60f80121c31a0d46b5279700f9df786054aa5ee5',
  '0x58e34ae594c592a6adfd81e72faa8755f754dac7',
  '0x446799ae575710fa6a7be9cf2c28c59b13ed52f3',
  '0x22c1f6050e56d2876009903609a2cc3fef83b415',
  '0xde4b40d431c761399c805f5e6eeb687751a35fd9',
  '0xb66a603f4cfe17e3d27b87a8bfcad319856518b8',
  '0xa21a2326b3d2895d0ca2f0d443007c9fa98dc543',
  '0x8c5acf6dbd24c66e6fd44d4a4c3d7a2d955aaad2',
  '0x8a4e39d2e2b88eb7aff9e31ffb1afb4caa096b47',
  '0x015fcab6a246cfc0679c33ef0b9d9ef947d0bde4',
  '0xeaf1ca721aab0151412e5ca5dac8a302b0acb0c9',
  '0xe1eb72894533008a75a50806d77e527e91bde142',
  '0x7adf109c3629d05e6a8a634d1734965855ac2027',
  '0x529d9a622eebb48982497f6a217df2660c8d336c',
  '0x367a5933a74b9ce4472b7e5bb9109d7856d22488',
  '0xda858c5183e9024c0d5301ee85ae1e41dbe0f880',
  '0xc23d925684919c1619f13427817d3fee6c24debb',
  '0x872b3530a120b12ba6ae22c4e467d328ea7c215b',
  '0x736bae7626934763b1dcd2714867ca7462694e60',
  '0x700ccb796874829dfaf93a175de9560f4e7d4e34',
  '0x515370a7aeb834866333c56d81045c7bd70fcd8c',
  '0x4a58d9d3aa63b9617b733955ad7a0462547185d9',
  '0xf924fed62a15c879213e677dada6cf7db5174620',
  '0xd55d0debcd362b6603faa4ec73b667e5e21aec47',
  '0x9201a886740d193e315f1f1b2b193321d6701d07',
  '0x677ce7d51eaad3a63890529a4cbeb74dec218fe1',
  '0x4eb3c41962d5a6f2b892ba7210b880edb78df54a',
  '0x4d67dcc8ab25f604b2dee43f0a12d04f923dd1e3',
  '0x0b50cbcba7c5e310fcf7118930119c9794e3e70e',
  '0x1af0ba488d9e218c2e30dcf4e6c8360cd3234d78',
  '0xf6266f30b7c9b23f48806abe56710e48233b7047',
  '0xe48d330f8e81d8d82924378bb249026155453eb2',
  '0xd60409682eb449a2832af1155e497605a84879f5',
  '0xe379ce867de958048d52e92dcbd6208fc91d9767',
  '0xdfd8858a882afad899c0daf9e44647ae8a08a707',
  '0x67be38166af0dcfb87aa230fddd51f3b5aaa4a6a',
  '0xf82c2b990e50509fec56566c43158c0fd850da77',
  '0xb20c6990dee4b59311ccfa3c3397d7eddabc9fa3',
  '0x4f33a94220a4d1d05aafe0df1ae8a93c15f026e6',
  '0x5084d4f03242ced7cc8766020c97b8f25244fd27',
  '0x81b220fb91958898a2b370d963c64588886e1ef9',
  '0xcb7cbea17fb6cbb7d98e5682128d1079c596e02d',
  '0xce5a4e3855c555b019fe0ac69d439bab09c3728e',
  '0x4560bbf0ed7737821b6ba86e0ff8e062530085e1',
  '0xe804c29b30cc7f8848a32562fe0be6dabb91e7eb',
  '0x9e46904a211133fd2e98b8883c596fdb7aae366c',
  '0x19ff658369141a05079439c2c99596dc6c2fb250',
  '0x35c5a191593271333147ed238894f6dc88d97da5',
  '0x456764666da6b2d27f0f5967202f0c4c5ce542ab',
  '0x7f4d09419d231eda3a2ebe36fa84a2cf44ad5afb',
  '0x844c5e575d9095adb68d85ed7067ed25fbe2992a',
  '0x9c7b630b183566a7af2d89ff522cad82ff9668ec',
  '0xc5e39ca13e22debc2f86762f01e9106645ece068',
  '0xc86452e53dd1fe47089e7ae78c94e43cce0db685',
  '0xdbfdadd6854b1b803b95a78bcca176ffe19a740e',
  '0xe4a1ffb12dd5504d38c4ae2beb48e829dcf12c2a',
  '0xea5eea5d725481b4569b8e84967e56770d95c084',
  '0xee9747575c89326eb9295972f36d56a49691f874',
  '0xf158ecbab7da7e6a0502628ad391a3d29710c576',
  '0xf673623e8507551bde72290e909c7e184a4799a3',
]

export function useDynamicBlocklistedNftCollections() {
  return useDynamicConfigValue(
    DynamicConfigs.BlockedNftCollections,
    BlockedNftCollectionsConfigKey.BlocklistedCollections,
    baseBlocklistedCollections,
  )
}

// Only use this for server side rendered previews where the client statsig constext hasn't been initialized
export async function getDynamicBlocklistedNftCollections(): Promise<string[]> {
  try {
    const response = await fetch('https://interface.gateway.uniswap.org/v1/statsig-proxy/get_config', {
      method: 'POST',
      headers: {
        'statsig-sdk-type': 'react-client',
      },
      body: JSON.stringify({
        configName: DynamicConfigs.BlockedNftCollections,
        key: BlockedNftCollectionsConfigKey.BlocklistedCollections,
      }),
    })
    const data: any = await response.json()
    return data.value.blocklistedCollections ?? baseBlocklistedCollections
  } catch (error) {
    return baseBlocklistedCollections
  }
}
