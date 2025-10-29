import { CardPointValueEnum, CardSuitEnum } from '../enums';

export type DeckSingleCardDto = {
  gameValue: number;
  numberValue: number;
  pointValue: CardPointValueEnum;
  suit: CardSuitEnum;
  id: number;
};
