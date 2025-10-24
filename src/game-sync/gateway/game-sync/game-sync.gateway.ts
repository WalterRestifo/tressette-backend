import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { DeckSingleCard } from 'src/models/deck-single-card.model';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200/',
  },
})
export class GameSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  handleConnection() {
    console.log('connection to gateway made');
  }

  handleDisconnect() {
    console.log('connection to gateway closed');
  }

  @SubscribeMessage('playedCard')
  handlePlayCard(
    @MessageBody() card: DeckSingleCard,
    @ConnectedSocket() client: Socket,
  ): void {
    client.emit('newCardPlayed', card);
  }
}
