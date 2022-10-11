import { GenerateMapOfLeavesRecursively } from './GenerateMapOfLeavesRecursively'
import { Piece } from './Piece'
/**
 * Yes, the only data here is the map.
 *
 * This is the source repository of the solution pieces
 */
export class RootPieceMap {
  private readonly goals: Piece[]
  private readonly names: string[]

  constructor (deepCopyFromMe: RootPieceMap | null, incompletePieces: Set<Piece>) {
    this.goals = []
    this.names = []
    if (deepCopyFromMe != null) {
      for (const piece of deepCopyFromMe.goals.values()) {
        const clonedTree = piece.ClonePieceAndEntireTree(incompletePieces)
        this.goals.push(clonedTree)
      }
    }
  }

  CloneAllRootPiecesAndTheirTrees (incompletePieces: Set<Piece>): RootPieceMap {
    return new RootPieceMap(this, incompletePieces)
  }

  Has (goalToObtain: string): boolean {
    for (const goal of this.goals) {
      if (goal.output === goalToObtain) { return true }
    }

    return false
  }

  Get (goalToObtain: string): Piece | null {
    for (const goal of this.goals) {
      if (goal.output === goalToObtain) { return goal }
    }
    return null
  }

  GetKeys (): string[] {
    return this.names
  }

  AddRootPiece (t: Piece): void {
    // always add to list
    this.goals.push(t)
    this.names.push(t.output)
  }

  Size (): number {
    return this.goals.length
  }

  GetRootPieceByName (name: string): Piece {
    const root = this.Get(name)
    if (typeof root === 'undefined' || root === null) { throw new Error("rootPiece of that name doesn't exist") }
    return root
  }

  GetValues (): Piece[] {
    return this.goals
  }

  GetAt (index: number): Piece {
    return this.goals[index]
  }

  public GenerateMapOfLeaves (): Map<string, Piece> {
    const map = new Map<string, Piece>()

    for (const rootPiece of this.GetValues()) {
      GenerateMapOfLeavesRecursively(rootPiece, rootPiece.output, map)
    }

    return map
  }
}
