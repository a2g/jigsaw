import { ReadOnlyJsonSingle } from '../main/ReadOnlyJsonSingle'
import { SolutionNodeRepository } from '../main/SolutionNodeRepository'

export interface ReadOnlyJsonInterfaceConcoct {
  GetSetOfStartingProps: () => Set<string>
  GetSetOfStartingInvs: () => Set<string>
  GenerateSolutionNodesMappedByInput: () => SolutionNodeRepository
  GetStartingThingsForCharacter: (name: string) => Set<string>
  GetArrayOfCharacters: () => string[]
  GetMapOfAllStartingThings: () => Map<string, Set<string>>
  GetMapOfBags: () => Map<string, ReadOnlyJsonSingle>
}
