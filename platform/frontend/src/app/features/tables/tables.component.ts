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
    <!-- Toolbar -->
    <div class="table-mode-toolbar mb-3">
      <div class="d-flex align-items-center gap-2">
        <h5 class="section-title"><i class="fa-solid fa-chair"></i> Salón</h5>
        <span class="badge-soft">{{ tables().length }} mesas</span>
      </div>
      <div class="table-mode-actions">
        @if (canEdit()) {
          <button
            class="btn btn-pill"
            [class.btn-success]="editMode()"
            [class.btn-primary-soft]="!editMode()"
            (click)="toggleEdit()"
          >
            <i [class]="editMode() ? 'fa-solid fa-check' : 'fa-solid fa-arrows-up-down-left-right'"></i>
            {{ editMode() ? 'Listo' : 'Editar plano' }}
          </button>
        }
        <a routerLink="/orders/new" class="btn btn-success btn-pill">
          <i class="fa-solid fa-plus"></i> Nuevo pedido
        </a>
      </div>
    </div>

    @if (error()) {
      <div class="alert-banner mb-3">
        <i class="fa-solid fa-circle-exclamation"></i> {{ error() }}
      </div>
    }

    @if (editMode()) {
      <p class="edit-hint mb-3">
        <i class="fa-solid fa-info-circle"></i>
        Modo edición: arrastra las mesas para reubicarlas. Se guarda automáticamente.
      </p>
    }

    @if (loading()) {
      <div class="tables-floor" style="min-height:400px;display:grid;place-items:center;">
        <span class="text-muted">Cargando salón…</span>
      </div>
    } @else {
      <div class="tables-floor">
        <div class="tables-canvas" [style.min-width.px]="board().w" [style.min-height.px]="board().h">
          @for (t of tables(); track t.id) {
            <div
              class="table-node"
              [class.editable]="editMode()"
              [class.dragging]="dragId === t.id"
              [style.left.px]="t.posX"
              [style.top.px]="t.posY"
              [style.width.px]="t.size"
              [style.height.px]="t.size"
              (click)="onClick(t)"
              (pointerdown)="onPointerDown(t, $event)"
              (pointermove)="onPointerMove(t, $event)"
              (pointerup)="onPointerUp(t, $event)"
            >
              <div
                class="table-card"
                [class.status-available]="!t.occupied"
                [class.status-occupied]="t.occupied"
              >
                <div class="table-card-body">
                  <h5>{{ t.name }}</h5>
                  <div class="table-card-meta">
                    <span class="d-flex align-items-center gap-1">
                      <span class="status-dot" [class.status-available]="!t.occupied" [class.status-occupied]="t.occupied"></span>
                      {{ t.occupied ? 'Ocupada' : 'Libre' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .mb-3 { margin-bottom: 1rem; }
    .d-flex { display: flex; }
    .align-items-center { align-items: center; }
    .gap-2 { gap: 8px; }

    .table-mode-toolbar {
      display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
      border: 1px solid var(--border); border-radius: 18px; padding: 12px 16px; background: rgba(148,163,184,.08);
    }
    .table-mode-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .alert-banner {
      background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3);
      color: #dc2626; border-radius: 14px; padding: .75rem 1rem; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }
    .edit-hint {
      color: var(--muted); font-size: .88rem; display: flex; align-items: center; gap: 6px;
    }
    .text-muted { color: var(--muted); }

    .tables-floor {
      position: relative; width: 100%; min-height: 820px; overflow: auto;
      border: 1px solid rgba(var(--primary-rgb),.22); border-radius: 24px;
      background:
        radial-gradient(circle at 24px 24px, rgba(var(--primary-rgb),.16) 0 2px, transparent 3px),
        linear-gradient(rgba(148,163,184,.10) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,.10) 1px, transparent 1px),
        linear-gradient(135deg, rgba(var(--primary-rgb),.045), rgba(37,99,235,.04));
      background-size: 68px 68px, 34px 34px, 34px 34px, auto;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.45), var(--shadow);
      padding: 0;
    }
    .tables-canvas { position: relative; min-width: 1180px; min-height: 980px; margin: 0 auto; }

    .table-node {
      position: absolute; width: 118px; height: 118px; touch-action: auto; overflow: visible;
      transition: left .16s ease, top .16s ease, width .16s ease, height .16s ease;
    }
    .table-node.editable { touch-action: pan-y; cursor: grab; }
    .table-node.dragging { z-index: 50; transition: none; }
    .table-node.dragging .table-card { transform: scale(1.02); cursor: grabbing; box-shadow: 0 22px 48px rgba(15,23,42,.22); }

    .table-card {
      width: 100%; height: 100%; padding: 12px 10px 10px 14px; border-radius: 8px;
      display: flex; flex-direction: column; justify-content: space-between;
      background: var(--card); border: 1px solid rgba(226,232,240,.88);
      box-shadow: 0 16px 34px rgba(15,23,42,.09); position: relative; overflow: visible;
      cursor: pointer; transition: transform .18s ease, box-shadow .18s ease;
    }
    .table-card:hover { background: var(--primary); border-color: var(--primary); color: #fff; }
    .table-card:hover h5, .table-card:hover .table-card-meta { color: #fff; }

    .table-card::before {
      content: ''; position: absolute; left: 0; top: 10px; bottom: 10px;
      width: 12px; border-radius: 0 7px 7px 0; background: var(--primary); z-index: 1;
    }
    .table-card:hover::before { background: rgba(255,255,255,.30); }
    .table-card.status-occupied::before { background: #dc0041; }

    .table-card-body { min-width: 0; padding-left: 12px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .table-card-body h5 { font-size: .9rem; margin: 0; color: #334155; font-weight: 800; }
    .table-card-meta { font-size: .72rem; color: var(--muted); }

    .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .status-dot.status-available { background: var(--primary); }
    .status-dot.status-occupied { background: var(--danger); }
  `],
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

  dragId: number | null = null;
  private startX = 0;
  private startY = 0;
  private origX = 0;
  private origY = 0;
  private moved = false;

  readonly board = computed(() => {
    let w = 1180;
    let h = 980;
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

  toggleEdit(): void {
    this.editMode.set(!this.editMode());
  }

  onClick(t: RestaurantTable): void {
    if (this.editMode() || this.moved) return;
    if (t.kind === 'Mesa' || t.kind === 'Especial') {
      void this.router.navigate(['/orders/new'], { queryParams: { tableId: t.id } });
    } else {
      void this.router.navigate(['/orders/new']);
    }
  }

  onPointerDown(t: RestaurantTable, event: PointerEvent): void {
    if (!this.editMode()) return;
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
    if (this.dragId !== t.id) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.moved = true;
    const nx = Math.max(0, Math.round(this.origX + dx));
    const ny = Math.max(0, Math.round(this.origY + dy));
    this.tables.set(this.tables().map((x) => (x.id === t.id ? { ...x, posX: nx, posY: ny } : x)));
  }

  onPointerUp(t: RestaurantTable, event: PointerEvent): void {
    if (this.dragId !== t.id) return;
    this.dragId = null;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    if (!this.moved) return;
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
