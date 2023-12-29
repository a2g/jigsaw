import { SingleFile } from '../../../src/puzzle/SingleFile';
import { expect, describe, test } from '@jest/globals';
import { PileOfPieces } from '../../../src/puzzle/PileOfPieces';
 
 
describe('SingleBigSwitch', () => {
  test('SingleBigSwitch', async () => {
    console.log(__dirname);
     const isGoalRetrieval = true;
    const file = new SingleFile(
      __dirname + '/../../../practice-world/',
      '03_access_thru_fireplace_goal.jsonc'
    );
    const pile = new PileOfPieces(null);
    await file.copyPiecesToContainer(isGoalRetrieval, pile);
    const size = pile.Size();
    expect(size).toBe(3);
    //expect(happenings).not.toEqual(null);
    //if (happenings != null) {
    //  expect(1).not.toEqual(happenings.array.length);
    //}
  });
});
