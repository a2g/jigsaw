import { SolutionNode } from './SolutionNode'
import { SpecialNodes } from './SpecialNodes'

export function GenerateMapOfLeavesRecursively (node: SolutionNode, path: string, map: Map<string, SolutionNode>): void {
  for (let i = 0; i < node.inputs.length; i++) {
    const input = node.inputs[i]
    if (input != null) {
      if (input.type === SpecialNodes.VerifiedLeaf) { map.set(path + node.inputHints[i], input) } else { GenerateMapOfLeavesRecursively(input, path + node.inputHints[i], map) }
    }
  }
}