import { RuleTester } from 'eslint'
import noStrings from './no-unwrapped-t'

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
})

ruleTester.run('no-unwrapped-t', noStrings, {
  valid: [
    {
      code: "const foo = t('bar');",
      options: [{ blockedElements: ['Flex', 'TouchableArea'] }],
    },
    {
      code: `const foo = {bar: t('baz')}`,
      options: [{ blockedElements: ['Flex'] }],
    },
    {
      code: `export default function(){
        return <Text>{t('key')}</Text>
        }`,
      options: [{ blockedElements: ['Flex', 'TouchableArea'] }],
    },
    {
      code: `export default function(){
        return <Blocked prop={t('key')} />
        }`,
      options: [{ blockedElements: ['Blocked'] }],
    },
    {
      code: `export default function(){
        return <Flex><Text>{t('key')}</Text></Flex>
        }`,
      options: [{ blockedElements: ['Flex', 'TouchableArea'] }],
    },
    {
      code: `export default function(){
          return <Flex>{t('key')}</Flex>
          }`,
      options: [{ blockedElements: [] }],
    },
    {
      code: `export default function(){
          return <Flex>{t('key')}</Flex>
          }`,
      options: [{ blockedElements: ['UnrelatedComponent'] }],
    },
    {
      code: `export default function(){
          return <Flex><Text><Trans/></Text></Flex>
          }`,
      options: [{ blockedElements: ['Flex'] }],
    },
  ],
  invalid: [
    {
      code: `export default function(){
          return <Flex>{t('key')}</Flex>
          }`,
      errors: 1,
      options: [{ blockedElements: ['Flex', 'TouchableArea'] }],
    },
    {
      code: `export default function(){
          return <TouchableArea>{t('key')}</TouchableArea>
          }`,
      errors: 1,
      options: [{ blockedElements: ['Flex', 'TouchableArea'] }],
    },
    {
      code: `export default function(){
          return <Text><Flex>{t('key')}</Flex></Text>
          }`,
      errors: 1,
      options: [{ blockedElements: ['Flex', 'TouchableArea'] }],
    },
    {
      code: `export default function(){
          return <Flex><Trans/></Flex>
          }`,
      errors: 1,
      options: [{ blockedElements: ['Flex'] }],
    },
  ],
})
