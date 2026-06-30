package com.combatti.catalog.service;

import com.combatti.catalog.domain.Category;
import com.combatti.catalog.domain.Product;
import com.combatti.catalog.repository.CategoryRepository;
import com.combatti.catalog.repository.ProductRepository;
import com.combatti.catalog.web.dto.CategoryDto;
import com.combatti.catalog.web.dto.CategoryRequest;
import com.combatti.catalog.web.dto.ProductDto;
import com.combatti.catalog.web.dto.ProductRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CatalogService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    // ----------------------- Categorías -----------------------

    @Transactional(readOnly = true)
    public List<CategoryDto> listCategories(String tenantId) {
        return categoryRepository.findByTenantIdOrderByDisplayOrderAscNameAsc(tenantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CategoryDto createCategory(String tenantId, CategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.existsByTenantIdAndName(tenantId, name)) {
            throw new DuplicateNameException("Ya existe una categoría con el nombre '" + name + "'");
        }
        Category category = new Category(
                tenantId,
                name,
                request.displayOrder() != null ? request.displayOrder() : 0
        );
        category.setActive(request.active() == null || request.active());
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(String tenantId, Long id, CategoryRequest request) {
        Category category = categoryRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Categoría no encontrada: " + id));

        String name = request.name().trim();
        categoryRepository.findByTenantIdAndName(tenantId, name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new DuplicateNameException("Ya existe una categoría con el nombre '" + name + "'");
                });

        category.setName(name);
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }
        if (request.active() != null) {
            category.setActive(request.active());
        }
        return toDto(category);
    }

    @Transactional
    public void deleteCategory(String tenantId, Long id) {
        Category category = categoryRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Categoría no encontrada: " + id));
        categoryRepository.delete(category);
    }

    // ----------------------- Productos -----------------------

    @Transactional(readOnly = true)
    public List<ProductDto> listProducts(String tenantId, Long categoryId) {
        List<Product> products = (categoryId != null)
                ? productRepository.findByTenantIdAndCategoryIdOrderByNameAsc(tenantId, categoryId)
                : productRepository.findByTenantIdOrderByNameAsc(tenantId);
        return products.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProductDto getProduct(String tenantId, Long id) {
        return productRepository.findByTenantIdAndId(tenantId, id)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));
    }

    @Transactional
    public ProductDto createProduct(String tenantId, ProductRequest request) {
        Category category = categoryRepository.findByTenantIdAndId(tenantId, request.categoryId())
                .orElseThrow(() -> new NotFoundException("Categoría no encontrada: " + request.categoryId()));

        Product product = new Product(
                tenantId,
                request.name().trim(),
                normalizeDescription(request.description()),
                request.price() != null ? request.price() : BigDecimal.ZERO,
                request.stockManaged() != null && request.stockManaged(),
                request.minStock() != null ? request.minStock() : 0,
                request.active() == null || request.active(),
                category
        );
        return toDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto updateProduct(String tenantId, Long id, ProductRequest request) {
        Product product = productRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));

        if (request.categoryId() != null
                && (product.getCategory() == null || !request.categoryId().equals(product.getCategory().getId()))) {
            Category category = categoryRepository.findByTenantIdAndId(tenantId, request.categoryId())
                    .orElseThrow(() -> new NotFoundException("Categoría no encontrada: " + request.categoryId()));
            product.setCategory(category);
        }

        product.setName(request.name().trim());
        product.setDescription(normalizeDescription(request.description()));
        if (request.price() != null) {
            product.setPrice(request.price());
        }
        if (request.stockManaged() != null) {
            product.setStockManaged(request.stockManaged());
        }
        if (request.minStock() != null) {
            product.setMinStock(request.minStock());
        }
        if (request.active() != null) {
            product.setActive(request.active());
        }
        return toDto(product);
    }

    @Transactional
    public void deleteProduct(String tenantId, Long id) {
        Product product = productRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + id));
        productRepository.delete(product);
    }

    // ----------------------- Mapeo -----------------------

    private CategoryDto toDto(Category category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDisplayOrder(),
                category.isActive()
        );
    }

    private ProductDto toDto(Product product) {
        Category category = product.getCategory();
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.isStockManaged(),
                product.getMinStock(),
                product.isActive(),
                category != null ? category.getId() : null,
                category != null ? category.getName() : null
        );
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmed = description.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
