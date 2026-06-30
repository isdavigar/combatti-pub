import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';

import { AuthService } from './auth.service';

/**
 * Cliente de tiempo real (STOMP sobre WebSocket). Se conecta al gateway en
 * /ws y emite en `orderEvents$` cada vez que cambia un pedido, para que las
 * pantallas (cocina, mesas) se actualicen en vivo.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthService);
  private client: Client | null = null;

  /** Emite (tick) ante cualquier evento de pedido. */
  readonly orderEvents$ = new Subject<void>();

  connect(): void {
    if (this.client && this.client.active) {
      return;
    }
    const token = this.auth.getToken();
    if (!token) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const brokerURL = `${protocol}://${window.location.host}/ws`;

    this.client = new Client({
      brokerURL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.client?.subscribe('/topic/orders', () => this.orderEvents$.next());
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    void this.client?.deactivate();
    this.client = null;
  }
}
