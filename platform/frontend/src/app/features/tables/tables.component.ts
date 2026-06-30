import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { OrdersService, RestaurantTable } from '../../core/orders.service';
import { RealtimeService } from '../../core/realtime.service';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Salón</span>
      <div class="spacer"></div>
      @if (canEdit()) {
        <button type="button" class="mode" [class.active]="editMode()" (click)="toggleEdit()">
          {{ editMode() ? 'Listo' : 'Editar plano' }}
        </button>
      }
      <a routerLink="/orders/new" class="new">+ Pedido</a>
    </header>

    <main class="content">
      @if (error()) { <div class="alert">{{ error() }}</div> }
      @if (editMode()) {
        <p class="hint">Modo edición: arrastra las mesas para reubicarlas. Se guarda automáticamente.</p>
      }

      @if (loading()) {
        <p class="muted">Cargando salón…</p>
      } @else {
        <div class="board-scroll">
          <div class="board" [style.width.px]="board().w" [style.height.px]="board().h">
            @for (t of tables(); track t.id) {
              <div
                class="table"
                [class.channel]="isChannel(t)"
                [class.caja]="t.kind === 'Caja'"
                [class.occupied]="t.occupied"
                [class.editing]="editMode()"
                [style.left.px]="t.posX"
                [style.top.px]="t.posY"
                [style.width.px]="t.size"
                [style.height.px]="t.size"
                (click)="onClick(t)"
                (pointerdown)="onPointerDown(t, $event)"
                (pointermove)="onPointerMove(t, $event)"
                (pointerup)="onPointerUp(t, $event)"
              >
                @if (t.icon) { <i [class]="t.icon"></i> }
                <span class="name">{{ t.name }}</span>
                <span class="st">{{ t.occupied ? 'Ocupada' : 'Libre' }}</span>
              </div>
            }
          </div>
        </div>
      }
    </main>
  `,
  styles: [
    `
      .topbar { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1.5rem; background: var(--cf-surface); border-bottom: 1px solid rgba(0,0,0,0.3); }
      .back { color: var(--cf-text); text-decoration: none; opacity: 0.85; }
      .brand { color: var(--cf-accent); font-weight: 700; font-size: 1.1rem; }
      .spacer { flex: 1; }
      .mode { background: transparent; border: 1px solid var(--cf-accent); color: var(--cf-accent); padding: 0.4rem 0.9rem; border-radius: 8px; cursor: pointer; }
      .mode.active { background: var(--cf-accent); color: #1a120b; font-weight: 700; }
      .new { color: #1a120b; background: var(--cf-accent); padding: 0.45rem 0.9rem; border-radius: 8px; text-decoration: none; font-weight: 600; }
      .content { padding: 1.25rem; }
      .muted { opacity: 0.75; }
      .hint { opacity: 0.8; font-size: 0.88rem; margin: 0 0 0.8rem; }
      .board-scroll { overflow: auto; max-width: 100%; border-radius: 12px; background: rgba(0,0,0,0.18); }
      .board { position: relative; min-width: 100%; }
      .table {
        position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 0.15rem; border-radius: 14px; border: 3px solid #2e7d32; background: var(--cf-surface);
        color: var(--cf-text); cursor: pointer; text-align: center; padding: 0.3rem; box-sizing: border-box;
        user-select: none; touch-action: none; overflow: hidden;
      }
      .table.occupied { border-color: var(--cf-error); }
      .table.editing { cursor: grab; outline: 2px dashed rgba(200,134,43,0.5); }
      .table i { font-size: 1.4rem; color: var(--cf-accent); }
      .table .name { font-weight: 700; font-size: 0.8rem; line-height: 1; }
      .table .st { font-size: 0.68rem; opacity: 0.8; }
      .table.occupied .st { color: var(--cf-error); }
      .table.channel { border-color: #2196f3; }
      .table.caja { border-color: #c8862b; }
      .alert { background: rgba(224,122,95,0.15); border: 1px solid var(--cf-error); color: var(--cf-error); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    `,
  ],
})
export class TablesComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);
  private readonly realtime = inject(RealtimeService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tables = signal<RestaurantTable[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editMode = signal(false);

  private dragId: number | null = null;
  private startX = 0;
  private startY = 0;
  private origX = 0;
  private origY = 0;
  private moved = false;

  readonly board = computed(() => {
    let w = 600;
    let h = 360;
    for (const t of this.tables()) {
      w = Math.max(w, t.posX + t.size + 40);
      h = Math.max(h, t.posY + t.size + 40);
    }
    return { w, h };
  });

  canEdit(): boolean {
    return this.auth.hasPermission('pos.tables');
  }

  ngOnInit(): void {
    this.reload();
    this.realtime.connect();
    this.realtime.orderEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.dragId === null) {
          this.reload();
        }
      });
  }

  private reload(): void {
    this.ordersService.getTables().subscribe({
      next: (tables) => {
        this.tables.set(tables);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el salón.');
        this.loading.set(false);
      },
    });
  }

  isChannel(t: RestaurantTable): boolean {
    return t.kind !== 'Mesa' && t.kind !== 'Especial' && t.kind !== 'Caja';
  }

  toggleEdit(): void {
    this.editMode.set(!this.editMode());
  }

  onClick(t: RestaurantTable): void {
    if (this.editMode() || this.moved) {
      return;
    }
    if (t.kind === 'Mesa' || t.kind === 'Especial') {
      void this.router.navigate(['/orders/new'], { queryParams: { tableId: t.id } });
    } else {
      void this.router.navigate(['/orders/new']);
    }
  }

  onPointerDown(t: RestaurantTable, event: PointerEvent): void {
    if (!this.editMode()) {
      return;
    }
    this.dragId = t.id;
    this.moved = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.origX = t.posX;
    this.origY = t.posY;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  onPointerMove(t: RestaurantTable, event: PointerEvent): void {
    if (this.dragId !== t.id) {
      return;
    }
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      this.moved = true;
    }
    const nx = Math.max(0, Math.round(this.origX + dx));
    const ny = Math.max(0, Math.round(this.origY + dy));
    this.tables.set(this.tables().map((x) => (x.id === t.id ? { ...x, posX: nx, posY: ny } : x)));
  }

  onPointerUp(t: RestaurantTable, event: PointerEvent): void {
    if (this.dragId !== t.id) {
      return;
    }
    this.dragId = null;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    if (!this.moved) {
      return;
    }
    const table = this.tables().find((x) => x.id === t.id);
    if (table) {
      this.ordersService.updateTable(table).subscribe({
        next: () => undefined,
        error: () => {
          this.error.set('No se pudo guardar la posición.');
          this.reload();
        },
      });
    }
    setTimeout(() => (this.moved = false), 0);
  }
}
