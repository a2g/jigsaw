import { Colors } from './Colors'
import { AddBrackets } from './AddBrackets'

export function GetDisplayName (input: string | string[], isParenthesisNeeded = false): string {
  // format arrays in to a lovely comma-separated list
  if (Array.isArray(input)) {
    let toReturn = ''
    for (const inputItem of input) {
      const nameToAdd = GetDisplayName(inputItem)// recurse
      toReturn += toReturn.length > 0 ? (', ' + nameToAdd) : nameToAdd
    }
    return toReturn
  }

  const single = input.toString()
  if (single.startsWith('sol_prop_')) { return Colors.Red + AddBrackets(single.slice(9), isParenthesisNeeded) + Colors.Reset }
  if (single.startsWith('sol_flag_')) { return Colors.Red + single.slice(9) + Colors.Reset }
  if (single.startsWith('sol_inv_')) { return Colors.Red + single.slice(8) + Colors.Reset }
  if (single.startsWith('inv_')) { return Colors.Magenta + single.slice(4) + Colors.Reset }
  if (single.startsWith('prop_')) { return Colors.Cyan + single.slice(5) + Colors.Reset }
  if (single.startsWith('flag_')) { return Colors.Green + single.slice(5) + Colors.Reset }
  if (single.startsWith('char_')) { return Colors.Yellow + AddBrackets(single.slice(5), isParenthesisNeeded) + Colors.Reset } else if (single.startsWith('use') || single.startsWith('toggle') || single.startsWith('grab')) { return Colors.Yellow + single + Colors.Reset }

  return single
}