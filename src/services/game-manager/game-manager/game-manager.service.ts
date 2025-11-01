import { BehaviorSubject, filter } from 'rxjs';
import { Player } from 'src/models/player.model';
import { DeckClass } from 'src/models/deck.model';
import { determineWinnerCard, removeCardFromHand } from '../game-manager-utils';
import { CardSuitEnum, PlayerEnum } from 'src/models/enums';
import { DeckSingleCardDto } from 'src/models/dtos/deckSingleCard.dto';
import { PlayerDto } from 'src/models/dtos/player.dto';

export class GameManagerService {
  readonly sessionId: string;
  private deckClassInstance = new DeckClass();
  player1 = new Player(PlayerEnum.Player1);
  player2 = new Player(PlayerEnum.Player2);
  winner: Player | undefined = undefined;
  /**
   * The cards that are in the middle. They are 40 before giving the cards to the players and 20 on the first trick. After every trick every player takes 1 card from the deck until the deck has no cards.
   */
  deck = this.deckClassInstance.deck;
  private $playedCardCount = new BehaviorSubject(0);

  /**
   * The suit that must be followed in the current trick. This is the suit of the card played by the leading player.
   */
  $leadingSuit = new BehaviorSubject<CardSuitEnum | undefined>(undefined);
  /**
   * The player that won the last trick. If the game just begun, it is player 1.
   */
  private leadingPlayer: Player = this.player1;
  $gameEnded = new BehaviorSubject(false);
  /**
   * The ace has normally 1 point and the other cards with point have 1/3 point value.
   */
  private normalizationFactor = 3;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.initialiseGame();
    this.$playedCardCount
      .pipe(filter((count) => count === 2))
      .subscribe(() => void this.playRound());
  }

  initialiseGame() {
    this.deckClassInstance.initialiseDeck();
    this.deckClassInstance.shuffleDeck();
    this.initialiseFirstRound();
  }

  initialiseFirstRound() {
    this.dealInitialCards();
    // The first player always begin the first round
    this.player1.$isOwnTurn.next(true);
    this.leadingPlayer = this.player1;
  }

  private dealInitialCards() {
    const cardsForPlayer1 = this.deck.splice(0, 10);
    const cardsForPlayer2 = this.deck.splice(0, 10);

    this.player1.hand = cardsForPlayer1;
    this.player2.hand = cardsForPlayer2;
  }

  private async playRound() {
    this.$playedCardCount.next(0);
    let winnerCard;
    if (this.leadingPlayer === this.player1) {
      winnerCard = determineWinnerCard(
        this.player1.inThisTrickPlayedCard!,
        this.player2.inThisTrickPlayedCard!,
        this.$leadingSuit.value!,
      );
    } else {
      winnerCard = determineWinnerCard(
        this.player2.inThisTrickPlayedCard!,
        this.player1.inThisTrickPlayedCard!,
        this.$leadingSuit.value!,
      );
    }

    //wait 2 seconds, so that the players can see what cards were played, before the new trick begins
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const cardTrickPoints =
      this.player1.inThisTrickPlayedCard!.pointValue +
      this.player2.inThisTrickPlayedCard!.pointValue;

    // the winner of the last trick gains bonus points
    const lastTrickPoints = this.player1.hand.length === 0 ? 3 : 0;

    const trickPoints = cardTrickPoints + lastTrickPoints;

    if (this.player1.inThisTrickPlayedCard === winnerCard) {
      this.player1.points += trickPoints;
      this.leadingPlayer = this.player1;
      // if player1 wins the trick, it plays first in the next trick
      this.player1.$isOwnTurn.next(true);
      this.player2.$isOwnTurn.next(false);
    } else {
      this.player2.points += trickPoints;
      this.leadingPlayer = this.player2;
      // if player2 wins the trick, it plays first in the next trick
      this.player1.$isOwnTurn.next(false);
      this.player2.$isOwnTurn.next(true);
    }

    // reset everything for the new trick
    this.resetTrick();

    const newCard1 = this.deckClassInstance.takeNewCardFromDeck();
    const newCard2 = this.deckClassInstance.takeNewCardFromDeck();
    if (newCard1) this.player1.hand.push(newCard1);
    if (newCard2) this.player2.hand.push(newCard2);

    // when the players don't have any more card in the hand, the game is over
    if (this.player1.hand.length === 0) this.endGame();
  }

  playCard(card: DeckSingleCardDto, player: PlayerDto) {
    // If it is the first played card in the trick, the card suit becomes the leading suit
    if (this.$playedCardCount.value === 0) this.$leadingSuit.next(card.suit);
    if (player.name === this.player1.name) {
      this.player1.inThisTrickPlayedCard = card;
      removeCardFromHand(this.player1);
    } else {
      this.player2.inThisTrickPlayedCard = card;
      removeCardFromHand(this.player2);
    }
    this.$playedCardCount.next(this.$playedCardCount.value + 1);
  }

  updateTurn() {
    this.player1.$isOwnTurn.next(!this.player1.$isOwnTurn.value);
    this.player2.$isOwnTurn.next(!this.player2.$isOwnTurn.value);
  }

  getCurrentPlayer() {
    if (this.player1.$isOwnTurn.value) return this.player1;
    else return this.player2;
  }

  resetTrick() {
    this.player1.inThisTrickPlayedCard = undefined;
    this.player2.inThisTrickPlayedCard = undefined;
    this.$leadingSuit.next(undefined);
  }

  endGame = () => {
    if (this.player1.points > this.player2.points) {
      this.winner = this.player1;
    } else if (this.player1.points < this.player2.points) {
      this.winner = this.player2;
    } else this.winner = undefined;
    this.$gameEnded.next(true);
  };

  startNewGame = () => {
    this.resetTrick();
    this.player1.points = 0;
    this.player2.points = 0;
    this.player1.$isOwnTurn.next(true);
    this.player2.$isOwnTurn.next(false);
    this.deckClassInstance = new DeckClass();
    this.deck = this.deckClassInstance.deck;
    this.initialiseGame();
    this.$gameEnded.next(false);
  };

  normalizePoints = (points: number) => {
    return points / this.normalizationFactor;
  };
}
