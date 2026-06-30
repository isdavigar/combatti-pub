package com.combatti.catalog.web;

import com.combatti.catalog.service.CatalogService;
import com.combatti.catalog.web.dto.ProductDto;
import com.combatti.catalog.web.dto.ProductRequest;
import com.combatti.common.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/products")
public class ProductController {

    private final CatalogService catalogService;

    public ProductController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('catalog.read')")
    public List<ProductDto> list(@AuthenticationPrincipal AuthenticatedUser user,
                                 @RequestParam(value = "categoryId", required = false) Long categoryId) {
        return catalogService.listProducts(TenantSupport.tenantOf(user), categoryId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('catalog.read')")
    public ProductDto get(@AuthenticationPrincipal AuthenticatedUser user,
                          @PathVariable Long id) {
        return catalogService.getProduct(TenantSupport.tenantOf(user), id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('catalog.write')")
    public ResponseEntity<ProductDto> create(@AuthenticationPrincipal AuthenticatedUser user,
                                             @Valid @RequestBody ProductRequest request) {
        ProductDto created = catalogService.createProduct(TenantSupport.tenantOf(user), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('catalog.write')")
    public ProductDto update(@AuthenticationPrincipal AuthenticatedUser user,
                             @PathVariable Long id,
                             @Valid @RequestBody ProductRequest request) {
        return catalogService.updateProduct(TenantSupport.tenantOf(user), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('catalog.write')")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user,
                                       @PathVariable Long id) {
        catalogService.deleteProduct(TenantSupport.tenantOf(user), id);
        return ResponseEntity.noContent().build();
    }
}
