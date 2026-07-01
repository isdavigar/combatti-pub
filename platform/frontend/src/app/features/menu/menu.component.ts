import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { CatalogService, Category, Product } from '../../core/catalog.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  template: `
    <div class="section-header mb-3">
      <div>
        <h2 class="section-title"><i class="fa-solid fa-utensils"></i> Menú / Catálogo</h2>
        <p class="section-subtitle">{{ products().length }} productos · {{ categories().length }} categorías</p>
      </div>
    </div>

    @if (loading()) {
      <div class="glass-card" style="min-height:200px;display:grid;place-items:center"><span class="text-muted">Cargando catálogo…</span></div>
    } @else if (error()) {
      <div class="alert-banner mb-3"><i class="fa-solid fa-circle-exclamation"></i> {{ error() }}</div>
    } @else {
      <!-- Category chips -->
      <nav class="category-filters mb-3">
        <button class="category-chip" [class.active]="selectedCategoryId() === null" (click)="selectCategory(null)">Todas</button>
        @for (cat of categories(); track cat.id) {
          <button class="category-chip" [class.active]="selectedCategoryId() === cat.id" (click)="selectCategory(cat.id)">{{ cat.name }}</button>
        }
      </nav>

      <!-- Products grid -->
      <div class="products-grid">
        @for (product of visibleProducts(); track product.id) {
          <div class="product-card">
            <div class="product-avatar">{{ product.name.charAt(0) }}</div>
            <h4 class="product-title">{{ product.name }}</h4>
            <p class="product-meta">{{ product.categoryName }}</p>
            <div class="product-price">{{ formatPrice(product.price) }}</div>
            @if (product.description) { <p class="product-desc">{{ product.description }}</p> }
          </div>
        } @empty {
          <p class="text-muted">No hay productos en esta categoría.</p>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .mb-3 { margin-bottom: 1rem; }
    .text-muted { color: var(--muted); }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .alert-banner { background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3); color: #dc2626; border-radius: 14px; padding: .75rem 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .category-filters { display: flex; flex-wrap: wrap; gap: 8px; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .product-avatar {
      width: 100%; height: 140px; display: flex; align-items: center; justify-content: center;
      border-radius: 18px; font-size: 48px; font-weight: 800; color: var(--muted);
      border: 1px solid rgba(0,0,0,.05); background: rgba(148,163,184,.06);
    }
    .product-price { color: var(--primary); font-weight: 800; font-size: 1.1rem; }
    .product-desc { color: var(--muted); font-size: .85rem; margin: 4px 0 0; }
  `],
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

  ngOnInit(): void { this.loadCatalog(); }
  selectCategory(categoryId: number | null): void { this.selectedCategoryId.set(categoryId); }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }

  private loadCatalog(): void {
    this.loading.set(true); this.error.set(null);
    this.catalog.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.catalog.getProducts().subscribe({
          next: (products) => { this.products.set(products); this.loading.set(false); },
          error: () => { this.error.set('No se pudieron cargar los productos.'); this.loading.set(false); },
        });
      },
      error: () => { this.error.set('No se pudo cargar el catálogo.'); this.loading.set(false); },
    });
  }
}
