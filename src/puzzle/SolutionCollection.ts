import { Box } from './Box'
import { GoalWordMap } from './GoalWordMap'
import { Piece } from './Piece'
import { Solution } from './Solution'

/**
 * Does only a few things:
 * 1. A simple collection of Solutions
 * 2. Methods that call the same thing on all solutions
 * 3. Generating solution names - which is why it needs mapOfStartingThings...
 */
export class SolutionCollection {
  private readonly solutions: Solution[]
  private readonly startingBox: Box
  private readonly setOfDoubles: Set<string>
  private readonly mapOfStartingThingsAndWhoStartsWithThem: Map<string, Set<string>>

  constructor (startingBox: Box, setOfDoublesForMerging: Set<string>|null) {
    this.solutions = []
    this.startingBox = startingBox
    this.setOfDoubles = new Set<string>()
    setOfDoublesForMerging?.forEach(x => { this.setOfDoubles.add(x) })

    // now lets initialize the first solution
    const solution1 = Solution.createSolution(
      startingBox.GetPieces(),
      startingBox.GetTalkFiles(),
      startingBox.GetMapOfAllStartingThings(),
      this.CreateRootMapFromGoalWords(startingBox.GetSetOfGoalWords()),
      setOfDoublesForMerging
    )
    this.solutions.push(solution1)

    this.mapOfStartingThingsAndWhoStartsWithThem = new Map<string, Set<string>>()
    const staringThings = solution1.GetStartingThings()
    for (const thing of staringThings.GetIterableIterator()) {
      const key = thing[0]
      // characters is mostly an empty set
      // because because less than one percent of objects
      // are constrained to a particular character
      const characters = thing[1]
      const newSet = new Set<string>()
      for (const character of characters) {
        newSet.add(character)
      }
      this.mapOfStartingThingsAndWhoStartsWithThem.set(key, newSet)
    }
  }

  public NumberOfSolutions (): number {
    return this.solutions.length
  }

  public SolvePartiallyUntilCloning (): Piece | null {
    console.warn('Clone - if any are waiting...')
    let pieceThatCausedCloning: Piece | null = null
    const solutions = this.solutions
    for (const solution of solutions) {
      if (solution.IsUnsolved()) {
        pieceThatCausedCloning = solution.ProcessUntilCloning(this)
        if (pieceThatCausedCloning != null) {
          break// breaking here at a smaller step, allows catching of bugs as soon as they occur
        }
      }
    }
    if (pieceThatCausedCloning != null) {
      console.warn(`Cloned piece output == ${pieceThatCausedCloning.output}`)
    } else {
      console.warn('Cloned piece output == null')
    }
    return pieceThatCausedCloning
  }

  public GetSolutions (): Solution[] {
    return this.solutions
  }

  public MarkGoalsAsCompletedAndMergeIfNeeded (): void {
    for (const solution of this.solutions) {
      solution.MarkGoalsAsCompletedAndReturnWhetherBoxesWereMerged()
    }
  }

  IterateOverGoalMapWhilstSkippingBranchesUntilExhausted (): void {
    console.warn('Do everything BUT cloning .....')
    for (const solution of this.solutions) {
      solution.IterateOverGoalMapWhilstSkippingCloningUntilExhausted(this)
    }
  }

  public RemoveSolution (solution: Solution): void {
    for (let i = 0; i < this.solutions.length; i++) {
      if (this.solutions[i] === solution) {
        this.solutions.splice(i, 1)
      }
    }
  }

  public CreateRootMapFromGoalWords (set: Set<string>): GoalWordMap {
    const rootMapFromGoalWords = new GoalWordMap(null)
    for (const goal of set) {
      rootMapFromGoalWords.AddGoalWord(goal)
    }
    return rootMapFromGoalWords
  }

  public PerformThingsNeededAfterAllSolutionsFound (): void {
    this.FindEssentialIngredientsPerSolution()
    this.GenerateSolutionNamesTheOldWay()
  }

  private FindEssentialIngredientsPerSolution (): void {
    const characters = this.startingBox.GetArrayOfCharacters()
    for (const character of characters) {
      const charactersSet = this.startingBox.GetStartingThingsForCharacter(character)
      for (const solution of this.solutions) {
        const arrayOfCommands = solution.GetOrderOfCommands()
        for (const command of arrayOfCommands) {
          const hasObjectA: boolean = charactersSet.has(command.objectA)
          const hasObjectB: boolean = charactersSet.has(command.objectB)
          if (hasObjectA || hasObjectB) {
            solution.AddToListOfEssentials([character])
          }
        }
      }
    }
  }

  private GenerateSolutionNamesTheOldWay (): void {

    /*
    for (let i = 0; i < this.solutions.length; i++) {
      // now lets find out the amount leafNode name exists in all the other solutions
      const mapForCounting = new Map<string, number>()
      for (let j = 0; j < this.solutions.length; j++) {
        if (i === j) {
          continue
        }
        const otherSolution = this.solutions[j]
        const otherLeafs = otherSolution
          .GetRootMap()
          .GenerateMapOfLeavesFromWinGoal()
        for (const leafNode of otherLeafs.values()) {
          if (leafNode != null) {
            const otherLeafNodeName = leafNode.GetOutput()
            let otherLeafNodeNameCount = 0
            const result = mapForCounting.get(otherLeafNodeName)
            if (result !== undefined) {
              otherLeafNodeNameCount = result
            }
            mapForCounting.set(otherLeafNodeName, otherLeafNodeNameCount + 1)
          }
        }
      }

      // find least popular leaf in solution i
      const currSolution = this.solutions[i]
      let minLeafNodeNameCount = 1000 // something high
      let minLeafNodeName = ''

      // get the restrictions accumulated from all the solution nodes
      const accumulatedRestrictions = currSolution.GetAccumulatedRestrictions()

      // GenerateMapOfLeaves
      const currLeaves = currSolution
        .GetRootMap()
        .GenerateMapOfLeavesFromWinGoal()
      for (const leafNode of currLeaves.values()) {
        if (leafNode != null) {
          const result = mapForCounting.get(leafNode.GetOutput())
          if (result !== undefined && result < minLeafNodeNameCount) {
            minLeafNodeNameCount = result
            minLeafNodeName = leafNode.GetOutput()
          } else if (!mapForCounting.has(leafNode.GetOutput())) {
            // our leaf is no where in the leafs of other solutions - we can use it!
            minLeafNodeNameCount = 0
            minLeafNodeName = leafNode.GetOutput()
          }

          // now we potentially add startingSet items to restrictions
          this.mapOfStartingThingsAndWhoCanHaveThem.forEach(
            (characters: Set<string>, key: string) => {
              if (key === leafNode.GetOutput()) {
                for (const character of characters) {
                  accumulatedRestrictions.add(character)
                }
              }
            }
          )
        }
      }

      if (minLeafNodeName !== '') {
        if (!currSolution.GetLastDisplayNameSegment().startsWith('sol_')) {
          currSolution.PushDisplayNameSegment(
            'sol_' +
            minLeafNodeName +
            Colors.Reset +
            (accumulatedRestrictions.size > 0
              ? AddBrackets(GetDisplayName(Array.from(accumulatedRestrictions)))
              : '')
          )
        }
      }
    } */
  }
}
