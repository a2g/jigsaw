import { SolverViaRootPiece } from './SolverViaRootPiece'
import { SpecialTypes } from './SpecialTypes'
import { Solution } from './Solution'
import { Happenings } from './Happenings'
import { Happen } from './Happen'

export class Piece {
  id: number
  conjoint: number
  type: string
  output: string
  inputs: Array<Piece | null>
  inputHints: string[]
  parent: Piece | null// this is not needed for leaf finding - but *is* needed for command finding.
  count: number
  characterRestrictions: string[]
  happenings: Happenings | null

  constructor(
    id: number,
    conjoint: number,
    output: string,
    type = 'undefined',
    count = 1, // put it here so all the tests don't need to specify it.
    happenings: Happenings | null = null,
    restrictions: Array<{ character: string }> | null | undefined = null, // put it here so all the tests don't need to specify it.
    inputA = 'undefined',
    inputB = 'undefined',
    inputC = 'undefined',
    inputD = 'undefined',
    inputE = 'undefined',
    inputF = 'undefined' // no statics in typescript, so this seemed preferable than global let Null = "Null";
  ) {
    this.id = id
    this.conjoint = conjoint
    this.parent = null

    this.count = count
    this.output = output
    this.type = type
    this.happenings = happenings
    this.characterRestrictions = new Array<string>()
    if (typeof restrictions !== 'undefined' && restrictions !== null) {
      for (const restriction of restrictions) {
        this.characterRestrictions.push(restriction.character)
      }
    }
    this.inputs = new Array<Piece>()
    this.inputHints = new Array<string>()
    if (inputA !== 'undefined' && inputA !== undefined) {
      this.inputHints.push(inputA)
      this.inputs.push(null)
    }
    if (inputB !== 'undefined' && inputB !== undefined) {
      this.inputHints.push(inputB)
      this.inputs.push(null)
    }
    if (inputC !== 'undefined' && inputC !== undefined) {
      this.inputHints.push(inputC)
      this.inputs.push(null)
    }
    if (inputD !== 'undefined' && inputD !== undefined) {
      this.inputHints.push(inputD)
      this.inputs.push(null)
    }
    if (inputE !== 'undefined' && inputE !== undefined) {
      this.inputHints.push(inputE)
      this.inputs.push(null)
    }
    if (inputF !== 'undefined' && inputF !== undefined) {
      this.inputHints.push(inputF)
      this.inputs.push(null)
    }
  }

  CloneNodeAndEntireTree(incompleteNodeSet: Set<Piece>): Piece {
    const clone = new Piece(0, 0, this.output, '')
    clone.id = this.id
    clone.conjoint = this.conjoint
    clone.type = this.type
    clone.count = this.count
    clone.output = this.output

    // the hints
    for (const inputHint of this.inputHints) {
      clone.inputHints.push(inputHint)
    }

    // the nodes
    let isIncomplete = false
    for (const input of this.inputs) {
      if (input != null) {
        const child = input.CloneNodeAndEntireTree(incompleteNodeSet)
        child.SetParent(clone)
        clone.inputs.push(child)
      } else {
        isIncomplete = true
        clone.inputs.push(null)
      }
    }

    if (isIncomplete) { incompleteNodeSet.add(this) }

    for (const restriction of this.characterRestrictions) {
      clone.characterRestrictions.push(restriction)
    }

    return clone
  }

  FindAnyNodeMatchingIdRecursively(id: number): Piece | null {
    if (this.id === id) {
      return this
    }
    for (const input of this.inputs) {
      const result = (input != null) ? input.FindAnyNodeMatchingIdRecursively(id) : null
      if (result != null) { return result }
    };
    return null
  }

  private InternalLoopOfProcessUntilCloning(solution: Solution, solutions: SolverViaRootPiece): boolean {
    for (let k = 0; k < this.inputs.length; k++) { // classic forloop useful because shared index on cloned node
      // without this following line, any clones will attempt to reclone themselves
      // and Solution.ProcessUntilCompletion will continue forever
      if (this.inputs[k] != null) { continue }

      // we check our starting set first!
      // otherwise Toggle pieces will toggle until the count is zero.
      const objectToObtain = this.inputHints[k]
      if (solution.startingThings.has(objectToObtain)) {
        const newLeaf = new Piece(0, 0, objectToObtain, SpecialTypes.VerifiedLeaf)
        newLeaf.parent = this
        this.inputs[k] = newLeaf
        // solution.AddLeafForReverseTraversal(path + this.inputHints[k] + "/", newLeaf);
        continue
      }

      // check whether we've found the flag earlier,
      // then we will eventually come to process the other entry in goals
      // so we can skip on to the next one..I think...
      //
      if (solution.goals.Has(objectToObtain)) {
        continue
      }

      // This is where we get all the pieces that fit
      // and if there is more than one, then we clone
      const matchingNodes = solution.GetNodesThatOutputObject(objectToObtain)
      if ((matchingNodes === undefined) || matchingNodes.length === 0) {
        const newLeaf = new Piece(0, 0, this.inputHints[k], SpecialTypes.VerifiedLeaf)
        newLeaf.parent = this
        this.inputs[k] = newLeaf
        // solution.AddLeafForReverseTraversal(path + this.inputHints[k] + "/", newLeaf);
      } else if (objectToObtain.startsWith('flag_') && matchingNodes.length === 1) {
        // add the node with the flag output to the goal map
        // since matchingNodes[0] has output of "flag_..." (it must be equal to input)
        // and since AddToMap uses output as the key in the map
        // then the goals map will now have another entry with a key equal to "flag_..."
        // which is what we want.
        solution.goals.AddRootNode(matchingNodes[0])
        solution.SetNodeIncomplete(matchingNodes[0])
      } else if (matchingNodes.length > 0) {
        // In our array the currentSolution, is at index zero
        // so we start at the highest index in the list
        // we when we finish the loop, we are with
        for (let i = matchingNodes.length - 1; i >= 0; i--) { // need reverse iterator
          const theMatchingNode = matchingNodes[i]

          // Clone - if needed!
          const isCloneBeingUsed = i > 0
          const theSolution = isCloneBeingUsed ? solution.Clone() : solution

          // This is the earliest possible point we can remove the
          // matching node: i.e. after the cloning has occurred
          theSolution.RemoveNode(theMatchingNode)

          // this is only here to make the unit tests make sense
          // something like to fix a bug where cloning doesn't mark node as complete
          theSolution.MarkNodeAsCompleted(theSolution.GetFlagWin())
          // ^^ this might need to recursively ask for parent, since there are no
          // many rout nodes

          if (isCloneBeingUsed) {
            solutions.GetSolutions().push(theSolution)
          }

          // rediscover the current node in theSolution - again because we might be cloned
          let theNode = null
          for (const rootNode of theSolution.goals.GetValues()) {
            theNode = rootNode.FindAnyNodeMatchingIdRecursively(this.id)
            if (theNode != null) {
              break
            }
          }

          if (theNode != null) {
            theMatchingNode.parent = theNode
            theNode.inputs[k] = theMatchingNode

            // all gates are incomplete when they are *just* added
            theSolution.SetNodeIncomplete(theMatchingNode)
            theSolution.AddRestrictions(theMatchingNode.getRestrictions())

            /*
            if (theNode.conjoint > 0) {
              const theConjoinNode = theSolution.FindAnyNodeMatchingIdRecursively(this.id)
              if (theConjoinNode != null) {
                const theLeafToAttachTo = theSolution.FindNodeWithSomeInputForConjointToAttachTo(theConjoinNode)
                if (theLeafToAttachTo != null) {
                  for (let j = 0; j < theLeafToAttachTo.inputHints.length; j++) {
                    if (theLeafToAttachTo.inputHints[j] === theConjoinNode.output) {
                      theSolution.RemoveNode(theConjoinNode)
                      theSolution.SetNodeIncomplete(theConjoinNode)
                      theSolution.AddRestrictions(theConjoinNode.getRestrictions())
                      theLeafToAttachTo.inputs[j] = theConjoinNode
                      theConjoinNode.parent = theLeafToAttachTo
                    }
                  }
                } else {
                  console.log('theConjoinNode is null - so we are cloning wrong')
                  theSolution.FindAnyNodeMatchingIdRecursively(this.id)
                }
              } else {
                console.log('theConjoinNode is null - so we are cloning wrong')
              }
            } */
          } else {
            console.log('node is null - so we are cloning wrong')
          }
        }

        const hasACloneJustBeenCreated = matchingNodes.length > 1
        if (hasACloneJustBeenCreated) { return true }// yes is incomplete
      }
    }
    return false
  }

  ProcessUntilCloning(solution: Solution, solutions: SolverViaRootPiece, path: string): boolean {
    path += this.output + '/'
    if (this.type === SpecialTypes.VerifiedLeaf) { return false }// false just means keep processing.

    // this is the point we set it as completed
    solution.MarkNodeAsCompleted(this)

    if (this.InternalLoopOfProcessUntilCloning(solution, solutions)) {
      return true
    }

    // now to process each of those nodes that have been filled out
    for (const inputNode of this.inputs) {
      if (inputNode != null) {
        if (inputNode.type === SpecialTypes.VerifiedLeaf) { continue }// this means its already been searched for in the map, without success.
        const hasACloneJustBeenCreated = inputNode.ProcessUntilCloning(solution, solutions, path)
        if (hasACloneJustBeenCreated) { return true }
      } else {

        // this case used to indicate something wrong with InternalLoopOfProcessUntilCloning
        // because in the old days a solution just had one tree in it that was traversed in order
        // With the multi-tree setup, the order can jump from one tree to another
        // to another, so the order isn't clear. So instead we iterate multiple times
        // to solve it.
        //
        // In the old days it said process until cloning. But it really meant
        // process until cloning or finished - and we used some metric to determine
        // whether the traversing was complete - if it wasn't, then we knew it was
        // cloned.
        //
        // With this way, I think we need to choose something else....

        // assert(inputNode && "Input node=" + inputNode + " <-If this fails there is something wrong with InternalLoopOfProcessUntilCloning");
        // console.log('Input node= null <-If this fails there is something wrong with InternalLoopOfProcessUntilCloning')
      }
    }

    return false
  }

  SetParent(parent: Piece | null): void {
    this.parent = parent
  }

  GetParent(): Piece | null {
    return this.parent
  }

  getRestrictions(): string[] {
    return this.characterRestrictions
  }

  UpdateMapWithOutcomes(visibleNodes: Map<string, Set<string>>): void {
    if (this.happenings != null) {
      for (const happening of this.happenings.array) {
        switch (happening.happen) {
          case Happen.FlagIsSet:
          case Happen.InvAppears:
          case Happen.PropAppears:
            visibleNodes.set(happening.item, new Set<string>())
            break
          case Happen.InvGoes:
          case Happen.PropGoes:
          default:
            visibleNodes.delete(happening.item)
            break
        }
      }
    }
  }
}
