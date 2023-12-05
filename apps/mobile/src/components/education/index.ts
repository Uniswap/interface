import { SeedPhraseEducationContent } from 'src/components/education/SeedPhrase'

export enum EducationContentType {
  SeedPhrase,
}

export const educationContent = {
  [EducationContentType.SeedPhrase]: SeedPhraseEducationContent,
}
