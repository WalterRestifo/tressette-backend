import { CardPointValueEnum } from './enums';

export const cardGameValueMap = new Map([
  [1, 7],
  [2, 8],
  [3, 9],
  [4, 0],
  [5, 1],
  [6, 2],
  [7, 3],
  [8, 4],
  [9, 5],
  [10, 6],
]);

/* The cardGameValueMap links the value of the card with the in game power value (3 is the most powerful card and 4 the weakest one) 
{
  Ace = 7,
  Two = 8,
  Three = 9,
  Four = 0,
  Five = 1,
  Six = 2,
  Seven = 3,
  Knave = 4,
  Knight = 5,
  King = 6,
} */

export const cardPointValueMap = new Map([
  [1, CardPointValueEnum.Full],
  [2, CardPointValueEnum.Third],
  [3, CardPointValueEnum.Third],
  [4, CardPointValueEnum.None],
  [5, CardPointValueEnum.None],
  [6, CardPointValueEnum.None],
  [7, CardPointValueEnum.None],
  [8, CardPointValueEnum.Third],
  [9, CardPointValueEnum.Third],
  [10, CardPointValueEnum.Third],
]);
