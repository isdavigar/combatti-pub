package com.combatti.catalog.web;

import com.combatti.catalog.service.CatalogService;
import com.combatti.catalog.web.dto.CategoryDto;
import com.combatti.catalog.web.dto.CategoryRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/categories")
public class CategoryController {

    private final CatalogService catalogService;

    public CategoryController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('catalog.read')")
    public List<CategoryDto> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return catalogService.listCategories(TenantSupport.tenantOf(user));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('catalog.write')")
    public ResponseEntity<CategoryDto> create(@AuthenticationPrincipal AuthenticatedUser user,
                                              @Valid @RequestBody CategoryRequest request) {
        CategoryDto created = catalogService.createCategory(TenantSupport.tenantOf(user), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('catalog.write')")
    public CategoryDto update(@AuthenticationPrincipal AuthenticatedUser user,
                              @PathVariable Long id,
                              @Valid @RequestBody CategoryRequest request) {
        return catalogService.updateCategory(TenantSupport.tenantOf(user), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('catalog.write')")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user,
                                       @PathVariable Long id) {
        catalogService.deleteCategory(TenantSupport.tenantOf(user), id);
        return ResponseEntity.noContent().build();
    }
}
