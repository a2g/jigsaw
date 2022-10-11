import { Piece } from './Piece'
import { SpecialTypes } from './SpecialTypes'

export function GenerateMapOfLeavesRecursively (node: Piece, path: string, map: Map<string, Piece>): void {
  for (let i = 0; i < node.inputs.length; i += 1) {
    const input = node.inputs[i]
    if (input != null) {
      if (input.type === SpecialTypes.VerifiedLeaf) { map.set(path + node.inputHints[i], input) } else { GenerateMapOfLeavesRecursively(input, path + node.inputHints[i], map) }
    }
  }
}
