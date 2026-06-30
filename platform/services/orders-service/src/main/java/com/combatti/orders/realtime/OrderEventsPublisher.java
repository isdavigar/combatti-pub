package com.combatti.orders.realtime;

import com.combatti.orders.web.dto.OrderDto;
import com.combatti.orders.web.dto.OrderEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Publica eventos de pedidos en el broker STOMP (/topic/orders) para que las
 * pantallas conectadas (cocina, mesas) se actualicen en tiempo real.
 */
@Component
public class OrderEventsPublisher {

    public static final String CREATED = "ORDER_CREATED";
    public static final String UPDATED = "ORDER_UPDATED";
    public static final String CANCELLED = "ORDER_CANCELLED";

    private static final String TOPIC = "/topic/orders";

    private final SimpMessagingTemplate messagingTemplate;

    public OrderEventsPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(String type, OrderDto order) {
        messagingTemplate.convertAndSend(TOPIC, new OrderEvent(type, order));
    }
}
