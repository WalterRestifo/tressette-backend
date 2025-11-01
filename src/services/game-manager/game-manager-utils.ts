import { DeckSingleCardDto } from 'src/models/dtos/deckSingleCard.dto';
import { CardSuitEnum } from 'src/models/enums';
import { Player } from 'src/models/player.model';

export const determineWinnerCard = (
  firstPlayedCard: DeckSingleCardDto,
  secondPlayedCard: DeckSingleCardDto,
  leadingSuit: CardSuitEnum,
) => {
  if (secondPlayedCard.suit !== leadingSuit) {
    return firstPlayedCard;
  } else if (firstPlayedCard.gameValue > secondPlayedCard.gameValue) {
    return firstPlayedCard;
  } else return secondPlayedCard;
};

export const removeCardFromHand = (player: Player) => {
  const indexOfTheCard = player.hand.findIndex(
    (cardOfHand) => cardOfHand.data.id === player.inThisTrickPlayedCard!.id,
  );
  player.hand.splice(indexOfTheCard, 1);
};
