import { CardPointValueEnum, CardSuitEnum } from './enums';

export type DeckSingleCardType = {
  gameValue: number;
  numberValue: number;
  pointValue: CardPointValueEnum;
  suit: CardSuitEnum;
  id: number;
};

export class DeckSingleCard {
  constructor(public data: DeckSingleCardType) {}
}
