import { PileOfPieces } from './PileOfPieces.js'
import { MixedObjectsAndVerb } from '../main/MixedObjectsAndVerb.js'
import { Happenings } from '../main/Happenings.js'
import { Mix } from '../main/Mix.js'
import { ReadOnlyJsonSingle } from '../main/ReadOnlyJsonSingle.js'
import { SingleBigSwitch } from '../main/SingleBigSwitch.js'

function CollectAllJsonRecursively (json: ReadOnlyJsonSingle, map: Map<string, ReadOnlyJsonSingle>): void {
  for (const bag of json.GetMapOfBags()) {
    const node: ReadOnlyJsonSingle = bag[1]
    map.set(bag[0], node)
  }
}
/**
 * So the most important part of this class is that the data
 * in it is read only. So I've put that in the name.
 * I wanted to convey the idea that it represents  *.json files,
 * in this case multiple, so that goes in there too.
 * */
export class ReadOnlyJsonMultipleFilenames {
  readonly allProps: string[]
  readonly allFlags: string[]
  readonly allInvs: string[]
  readonly allChars: string[]
  readonly mapOfStartingThingsWithChars: Map<string, Set<string>>
  readonly startingInvSet: Set<string>
  readonly startingPropSet: Set<string>
  readonly startingFlagSet: Set<string>
  readonly allScenes: Map<string, ReadOnlyJsonSingle>
  readonly mapOfBags: Map<string, ReadOnlyJsonSingle>

  constructor (rootJson: ReadOnlyJsonSingle) {
    this.allScenes = new Map<string, ReadOnlyJsonSingle>()
    CollectAllJsonRecursively(rootJson, this.allScenes)

    // create sets for the 3 member and 4 indirect sets
    this.mapOfStartingThingsWithChars = new Map<string, Set<string>>()
    this.mapOfBags = new Map<string, ReadOnlyJsonSingle>()
    this.startingPropSet = new Set<string>()
    this.startingInvSet = new Set<string>()
    this.startingFlagSet = new Set<string>()
    const setProps = new Set<string>()
    const setFlags = new Set<string>()
    const setInvs = new Set<string>()
    const setChars = new Set<string>()

    // collate the 3 member and 4 indirect sets
    for (const json of this.allScenes.values()) {
      json.AddStartingThingCharsToGivenMap(this.mapOfStartingThingsWithChars)
      json.AddBagsToGivenMap(this.mapOfBags)
      json.AddStartingPropsToGivenSet(this.startingPropSet)
      json.AddStartingInvsToGivenSet(this.startingInvSet)
      json.AddStartingFlagsToGivenSet(this.startingFlagSet)
      json.AddPropsToGivenSet(setProps)
      json.AddFlagsToGivenSet(setFlags)
      json.AddInvsToGivenSet(setInvs)
      json.AddCharsToGivenSet(setChars)
    }

    // clean 3 member and 4 indirect sets
    this.startingPropSet.delete('')
    this.startingInvSet.delete('')
    this.mapOfStartingThingsWithChars.delete('')
    this.startingFlagSet.delete('')
    setChars.delete('')
    setProps.delete('')
    setFlags.delete('')
    setInvs.delete('')

    // finally set arrays for the four
    this.allProps = Array.from(setProps.values())
    this.allFlags = Array.from(setFlags.values())
    this.allInvs = Array.from(setInvs.values())
    this.allChars = Array.from(setChars.values())
  }

  GetArrayOfProps (): string[] {
    return this.allProps
  }

  GetArrayOfInvs (): string[] {
    return this.allInvs
  }

  GetArrayOfFlags (): string[] {
    return this.allFlags
  }

  static GetArrayOfSingleObjectVerbs (): string[] {
    return ['grab', 'toggle']
  }

  GetArrayOfSingleObjectVerbs (): string[] {
    return this.GetArrayOfSingleObjectVerbs()
  }

  static GetArrayOfInitialStatesOfSingleObjectVerbs (): boolean[] {
    return [true, true]
  }

  GetArrayOfInitialStatesOfSingleObjectVerbs (): boolean[] {
    return this.GetArrayOfInitialStatesOfSingleObjectVerbs()
  }

  GetArrayOfInitialStatesOfFlags (): number[] {
    const array: number[] = []
    for (const flag of this.allFlags) {
      array.push(flag.length > 0 ? 0 : 0)// I used value.length>0 to get rid of the unused variable warnin
    };
    return array
  }

  GetSetOfStartingProps (): Set<string> {
    return this.startingPropSet
  }

  GetSetOfStartingInvs (): Set<string> {
    return this.startingInvSet
  }

  GetMapOfAllStartingThings (): Map<string, Set<string>> {
    return this.mapOfStartingThingsWithChars
  }

  GetStartingThingsForCharacter (charName: string): Set<string> {
    const startingThingSet = new Set<string>()
    this.mapOfStartingThingsWithChars.forEach((value: Set<string>, thing: string) => {
      for (const item of value) {
        if (item === charName) {
          startingThingSet.add(thing)
          break
        }
      }
    })

    return startingThingSet
  }

  GetArrayOfInitialStatesOfProps (): boolean[] {
    // construct array of booleans in exact same order as ArrayOfProps - so they can be correlated
    const startingSet = this.GetSetOfStartingProps()
    const visibilities: boolean[] = []
    for (const prop of this.allProps) {
      const isVisible = startingSet.has(prop)
      visibilities.push(isVisible)
    };

    return visibilities
  }

  GetArrayOfInitialStatesOfInvs (): boolean[] {
    // construct array of booleans in exact same order as ArrayOfProps - so they can be correlated
    const startingSet = this.GetSetOfStartingInvs()
    const visibilities: boolean[] = []
    for (const inv of this.allInvs) {
      const isVisible = startingSet.has(inv)
      visibilities.push(isVisible)
    };

    return visibilities
  }

  GetArrayOfCharacters (): string[] {
    return this.allChars
  }

  GenerateSolutionNodesMappedByInput (): PileOfPieces {
    const solutionNodesMappedByInput = new PileOfPieces(null)

    for (const filename of this.allScenes.keys()) {
      const notUsed = new MixedObjectsAndVerb(Mix.ErrorVerbNotIdentified, '', '', '', 'ScenePreAggregator')
      SingleBigSwitch(filename, solutionNodesMappedByInput, notUsed)
    }
    return solutionNodesMappedByInput
  }

  FindHappeningsIfAny (objects: MixedObjectsAndVerb): Happenings | null {
    for (const filename of this.allScenes.keys()) {
      const result = SingleBigSwitch(filename, null, objects) as unknown as Happenings | null
      if (result != null) { return result }
    }
    return null
  }

  GetMapOfBags (): Map<string, ReadOnlyJsonSingle> {
    return this.mapOfBags
  }
}
