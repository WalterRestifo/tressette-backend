import { Test, TestingModule } from '@nestjs/testing';
import { GameManagerService } from './game-manager.service';
import { PlayerDto } from '../../../models/dtos/player.dto';
import {
  CardPointValueEnum,
  CardSuitEnum,
  PlayerEnum,
} from '../../../models/enums';
import { DeckSingleCardDto } from '../../../models/dtos/deckSingleCard.dto';

describe('GameManagerService', () => {
  let service: GameManagerService;

  const mockCard: DeckSingleCardDto = {
    gameValue: 7,
    numberValue: 1,
    pointValue: CardPointValueEnum.Full,
    suit: CardSuitEnum.Coins,
    id: 1,
  };

  const mockCard2: DeckSingleCardDto = {
    gameValue: 3,
    numberValue: 7,
    pointValue: CardPointValueEnum.None,
    suit: CardSuitEnum.Coins,
    id: 7,
  };

  const mockPlayer1: PlayerDto = {
    hand: [mockCard, mockCard2],
    name: PlayerEnum.Player1,
    isOwnTurn: true,
    fromOpponentPlayerLastDrawnCard: undefined,
    points: 0,
    inThisTrickPlayedCard: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameManagerService],
    }).compile();

    service = module.get<GameManagerService>(GameManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should play a new card properly', () => {
    const expected = {
      ...mockPlayer1,
      hand: [mockCard2],
      inThisTrickPlayedCard: mockCard,
    };

    service.player1 = mockPlayer1;

    service.playCard(mockCard, mockPlayer1);

    expect(service.player1).toEqual(expected);
  });

  it('should update turn', () => {
    // at the beginning, it is the turn of player 1
    service.updateTurn();

    expect(service.player1.isOwnTurn).toBe(false);
    expect(service.player2.isOwnTurn).toBe(true);
  });

  it('should get current player', () => {
    service.player1 = mockPlayer1;
    expect(service.getCurrentPlayer()).toEqual(mockPlayer1);
  });

  it('should end and start a new game', () => {
    expect(service.$gameEnded.value).toBe(false);
    service.endGame();
    expect(service.$gameEnded.value).toBe(true);

    service.startNewGame();
    expect(service.$gameEnded.value).toBe(false);
  });

  it('should play the round correctly', () => {
    const acePointsBeforeMath = 3;

    const mockPlayer2: PlayerDto = {
      hand: [mockCard, mockCard2],
      name: PlayerEnum.Player2,
      isOwnTurn: true,
      fromOpponentPlayerLastDrawnCard: undefined,
      points: 0,
      inThisTrickPlayedCard: mockCard2,
    };

    service.player1 = {
      ...mockPlayer1,
      inThisTrickPlayedCard: mockCard,
    };
    service.player2 = mockPlayer2;
    service.leadingSuit = CardSuitEnum.Coins;

    service.playRound();

    expect(service.player1.points).toBe(acePointsBeforeMath);
  });
});
