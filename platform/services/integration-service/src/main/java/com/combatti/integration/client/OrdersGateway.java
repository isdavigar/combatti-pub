package com.combatti.integration.client;

import com.combatti.integration.web.dto.ExternalOrderRequest;

public interface OrdersGateway {

    OrderView createOrder(String tenantId, ExternalOrderRequest request);

    OrderView getOrder(String tenantId, Long orderId);
}
