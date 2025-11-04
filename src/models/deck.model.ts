import { CardPointValueEnum, CardSuitEnum } from './enums';
import { cardGameValueMap, cardPointValueMap } from './constants';
import { DeckSingleCardDto } from './dtos/deckSingleCard.dto';

export class DeckClass {
  deck: DeckSingleCardDto[] = [];

  initialiseDeck() {
    const suits = Object.values(CardSuitEnum);
    let idValue = 0;
    suits.map((suit) => {
      for (let cardNumber = 1; cardNumber <= 10; cardNumber++) {
        this.deck.push({
          gameValue: cardGameValueMap.get(cardNumber) as number,
          numberValue: cardNumber,
          pointValue: cardPointValueMap.get(cardNumber) as CardPointValueEnum,
          suit: suit,
          id: idValue,
        });
        idValue++;
      }
    });
  }

  shuffleDeck() {
    let currentIndex = this.deck.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [this.deck[currentIndex], this.deck[randomIndex]] = [
        this.deck[randomIndex],
        this.deck[currentIndex],
      ];
    }
  }

  /**
   * Take a new card from deck, if the deck is not yet empty.
   * @returns DeckSingleCardDto | undefined
   */
  takeNewCardFromDeck() {
    if (this.deck.length > 0) return this.deck.splice(0, 1)[0];
    else return undefined;
  }
}
