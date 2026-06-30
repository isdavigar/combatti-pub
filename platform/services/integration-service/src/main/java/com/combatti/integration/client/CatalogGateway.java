package com.combatti.integration.client;

import java.util.List;

public interface CatalogGateway {

    List<ProductView> listProducts(String tenantId);
}
