import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogService, Category, Product } from '../../core/catalog.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <a routerLink="/" class="back">← Volver</a>
      <span class="brand">Menú</span>
      <span class="count">{{ products().length }} productos · {{ categories().length }} categorías</span>
    </header>

    <main class="content">
      @if (loading()) {
        <p class="muted">Cargando catálogo…</p>
      } @else if (error()) {
        <div class="alert">{{ error() }}</div>
      } @else {
        <nav class="filters">
          <button
            type="button"
            class="chip"
            [class.active]="selectedCategoryId() === null"
            (click)="selectCategory(null)"
          >
            Todas
          </button>
          @for (cat of categories(); track cat.id) {
            <button
              type="button"
              class="chip"
              [class.active]="selectedCategoryId() === cat.id"
              (click)="selectCategory(cat.id)"
            >
              {{ cat.name }}
            </button>
          }
        </nav>

        <div class="grid">
          @for (product of visibleProducts(); track product.id) {
            <article class="product">
              <div class="product-head">
                <h3>{{ product.name }}</h3>
                <span class="price">{{ formatPrice(product.price) }}</span>
              </div>
              <span class="cat">{{ product.categoryName }}</span>
              @if (product.description) {
                <p class="desc">{{ product.description }}</p>
              }
            </article>
          } @empty {
            <p class="muted">No hay productos en esta categoría.</p>
          }
        </div>
      }
    </main>
  `,
  styles: [
    `
      .topbar {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.9rem 1.5rem;
        background: var(--cf-surface);
        border-bottom: 1px solid rgba(0, 0, 0, 0.3);
      }
      .back {
        color: var(--cf-text);
        text-decoration: none;
        opacity: 0.85;
      }
      .brand {
        color: var(--cf-accent);
        font-weight: 700;
        font-size: 1.1rem;
      }
      .count {
        margin-left: auto;
        opacity: 0.7;
        font-size: 0.85rem;
      }
      .content {
        max-width: 1000px;
        margin: 0 auto;
        padding: 1.5rem;
      }
      .muted {
        opacity: 0.75;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
      .chip {
        background: rgba(200, 134, 43, 0.12);
        border: 1px solid rgba(200, 134, 43, 0.5);
        color: var(--cf-text);
        border-radius: 999px;
        padding: 0.35rem 0.85rem;
        font-size: 0.85rem;
        cursor: pointer;
      }
      .chip.active {
        background: var(--cf-accent);
        color: #1a120b;
        font-weight: 600;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
      }
      .product {
        background: var(--cf-surface);
        border-radius: 12px;
        padding: 1rem 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .product-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
      }
      .product-head h3 {
        margin: 0;
        font-size: 1rem;
      }
      .price {
        color: var(--cf-accent);
        font-weight: 700;
        white-space: nowrap;
      }
      .cat {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        opacity: 0.6;
      }
      .desc {
        margin: 0.25rem 0 0;
        font-size: 0.85rem;
        opacity: 0.8;
      }
      .alert {
        background: rgba(224, 122, 95, 0.15);
        border: 1px solid var(--cf-error);
        color: var(--cf-error);
        padding: 0.8rem 1rem;
        border-radius: 8px;
      }
    `,
  ],
})
export class MenuComponent implements OnInit {
  private readonly catalog = inject(CatalogService);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly selectedCategoryId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly visibleProducts = computed(() => {
    const categoryId = this.selectedCategoryId();
    const all = this.products();
    return categoryId === null ? all : all.filter((p) => p.categoryId === categoryId);
  });

  ngOnInit(): void {
    this.loadCatalog();
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private loadCatalog(): void {
    this.loading.set(true);
    this.error.set(null);

    this.catalog.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.catalog.getProducts().subscribe({
          next: (products) => {
            this.products.set(products);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('No se pudieron cargar los productos.');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo.');
        this.loading.set(false);
      },
    });
  }
}
