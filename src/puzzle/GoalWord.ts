import { Job } from './Job'
import { Piece } from './Piece'
import { RawObjectsAndVerb } from './RawObjectsAndVerb'
import { Solution } from './Solution'
import { SolutionCollection } from './SolutionCollection'

export class GoalWord {
  public goalHint: string
  public piece: Piece | null
  private isTreeOfPiecesSolved: boolean
  private readonly commandsCompletedInOrder: RawObjectsAndVerb[]

  constructor (goalHint: string, commandsCompletedInOrder: RawObjectsAndVerb[], isSolved = false) {
    this.goalHint = goalHint
    this.isTreeOfPiecesSolved = isSolved
    this.piece = null

    this.commandsCompletedInOrder = []
    if (commandsCompletedInOrder != null) {
      for (const command of commandsCompletedInOrder) {
        this.commandsCompletedInOrder.push(command)
      }
    }
  }

  public CloneIncludingLeaves (): GoalWord {
    const newGoalWord = new GoalWord(this.goalHint, this.commandsCompletedInOrder)
    if (this.piece != null) {
      newGoalWord.piece = this.piece.ClonePieceAndEntireTree()
    }
    return newGoalWord
  }

  public IsSolved (): boolean {
    return this.isTreeOfPiecesSolved
  }

  public SetSolved (): void {
    this.isTreeOfPiecesSolved = true
  }

  public GetCommandsCompletedInOrder (): RawObjectsAndVerb[] {
    // I would like to return a read only array here.
    // I can't do that, so instead, I will clone.
    // The best way to clone in is using 'map'
    return this.commandsCompletedInOrder.map((x) => x)
  }

  public PushCommand (rawObjectsAndVerb: RawObjectsAndVerb): void {
    this.commandsCompletedInOrder.push(rawObjectsAndVerb)
  }

  public ProcessPiecesAndReturnWhetherAnyPlaced (solution: Solution, solutions: SolutionCollection, path: string, jobType: Job): boolean {
    // if the goalword piece is already found, we recurse
    if (this.piece != null) {
      return this.piece.ProcessPiecesAndReturnWhetherAnyPlaced(solution, solutions, path + this.goalHint + '/', jobType)
    }
    // else we find the goal word piece

    const setOfMatchingPieces = solution.GetPiecesThatOutputString(this.goalHint)

    const matchingPieces = Array.from(setOfMatchingPieces)
    // In our array the currentSolution, is at index zero
    // so we start at the highest index in the list
    // we when we finish the loop, we are with
    for (let i = matchingPieces.length - 1; i >= 0; i--) {
      // don't do cloning unless its specifically the job type
      if (jobType !== Job.Cloning && matchingPieces.length > 1) {
        break
      }
      // need reverse iterator
      const theMatchingPiece = matchingPieces[i]

      // Clone - if needed!
      const isCloneBeingUsed = i > 0
      const theSolution = isCloneBeingUsed ? solution.Clone() : solution

      // remove all the pieces after cloning
      for (const theMatchingPiece of setOfMatchingPieces) {
        theSolution.RemovePiece(theMatchingPiece)
      }

      // this is only here to make the unit tests make sense
      // something like to fix a bug where cloning doesn't mark piece as complete
      // theSolution.MarkPieceAsCompleted(theSolution.GetWinGoal())
      // ^^ this might need to recursively ask for parent, since there are no
      // many root pieces
      if (isCloneBeingUsed) {
        solutions.GetSolutions().push(theSolution)
      }

      // rediscover the current GoalWord in theSolution - again because we might be cloned
      const theGoalWord = theSolution.GetRootMap().GetGoalWordByNameNoThrow(this.goalHint)
      console.assert(theGoalWord != null)
      if (theGoalWord != null) {
        if (matchingPieces.length > 1) {
          // }[${i > 0 ? matchingPieces.length - i : 0}]
          const firstInput = theMatchingPiece.inputHints.length > 0 ? theMatchingPiece.inputHints[0] : 'no-hint'
          theSolution.PushSolvingPathSegment(`${firstInput}`)
        }

        theGoalWord.piece = theMatchingPiece

        // all pieces are incomplete when they are *just* added
        theSolution.AddToListOfEssentials(theMatchingPiece.getRestrictions())
      } else {
        console.warn('piece is null - so we are cloning wrong')
        throw new Error('piece is null - so we are cloning wrong')
      }
    }

    if (jobType === Job.Cloning) {
      return setOfMatchingPieces.size > 1
    } else if (jobType === Job.PiecePlacing) {
      return setOfMatchingPieces.size === 1
    }
    return false
  }
}
