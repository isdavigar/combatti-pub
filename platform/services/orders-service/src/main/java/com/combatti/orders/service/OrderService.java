package com.combatti.orders.service;

import com.combatti.orders.domain.Order;
import com.combatti.orders.domain.OrderChannel;
import com.combatti.orders.domain.OrderItem;
import com.combatti.orders.domain.OrderStatus;
import com.combatti.orders.domain.OrderType;
import com.combatti.orders.domain.RestaurantTable;
import com.combatti.orders.realtime.OrderEventsPublisher;
import com.combatti.orders.repository.OrderRepository;
import com.combatti.orders.repository.RestaurantTableRepository;
import com.combatti.orders.web.dto.CreateOrderRequest;
import com.combatti.orders.web.dto.OrderDto;
import com.combatti.orders.web.dto.OrderItemDto;
import com.combatti.orders.web.dto.OrderItemRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {

    /** Estados que la vista de cocina (KDS) muestra. */
    private static final List<OrderStatus> KITCHEN_STATUSES = List.of(
            OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.SENT);

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final OrderEventsPublisher eventsPublisher;

    public OrderService(OrderRepository orderRepository,
                        RestaurantTableRepository tableRepository,
                        OrderEventsPublisher eventsPublisher) {
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.eventsPublisher = eventsPublisher;
    }

    @Transactional(readOnly = true)
    public List<OrderDto> listOrders(String tenantId) {
        return orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderDto> listKitchenOrders(String tenantId) {
        return orderRepository.findByTenantIdAndStatusInOrderByCreatedAtAsc(tenantId, KITCHEN_STATUSES)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderDto getOrder(String tenantId, Long id) {
        return orderRepository.findByTenantIdAndId(tenantId, id)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Pedido no encontrado: " + id));
    }

    @Transactional
    public OrderDto createOrder(String tenantId, CreateOrderRequest request) {
        Order order = new Order(
                tenantId,
                request.type(),
                request.channel() != null ? request.channel() : OrderChannel.LOCAL);

        if (request.type() == OrderType.DINE_IN) {
            if (request.tableId() == null) {
                throw new BadRequestException("Un pedido en mesa requiere una mesa (tableId)");
            }
            RestaurantTable table = tableRepository.findByTenantIdAndId(tenantId, request.tableId())
                    .orElseThrow(() -> new NotFoundException("Mesa no encontrada: " + request.tableId()));
            order.setTable(table);
        }

        order.setCustomerName(request.customerName());
        order.setCustomerPhone(request.customerPhone());
        order.setCustomerAddress(request.customerAddress());
        order.setNotes(request.notes());

        for (OrderItemRequest itemRequest : request.items()) {
            order.addItem(new OrderItem(
                    itemRequest.productId(),
                    itemRequest.productName().trim(),
                    itemRequest.unitPrice(),
                    itemRequest.quantity(),
                    itemRequest.notes()
            ));
        }

        OrderDto dto = toDto(orderRepository.save(order));
        eventsPublisher.publish(OrderEventsPublisher.CREATED, dto);
        return dto;
    }

    @Transactional
    public OrderDto updateStatus(String tenantId, Long id, OrderStatus newStatus) {
        Order order = orderRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Pedido no encontrado: " + id));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("No se puede cambiar el estado de un pedido cancelado");
        }
        order.setStatus(newStatus);
        OrderDto dto = toDto(order);
        eventsPublisher.publish(OrderEventsPublisher.UPDATED, dto);
        return dto;
    }

    @Transactional
    public OrderDto cancelOrder(String tenantId, Long id) {
        Order order = orderRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Pedido no encontrado: " + id));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new BadRequestException("No se puede cancelar un pedido ya cobrado");
        }
        order.setStatus(OrderStatus.CANCELLED);
        OrderDto dto = toDto(order);
        eventsPublisher.publish(OrderEventsPublisher.CANCELLED, dto);
        return dto;
    }

    private OrderDto toDto(Order order) {
        List<OrderItemDto> items = order.getItems().stream()
                .map(item -> new OrderItemDto(
                        item.getId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        item.getNotes(),
                        item.getLineTotal()
                ))
                .toList();

        RestaurantTable table = order.getTable();
        return new OrderDto(
                order.getId(),
                order.getType(),
                order.getChannel(),
                order.getStatus(),
                table != null ? table.getId() : null,
                table != null ? table.getName() : null,
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getCustomerAddress(),
                order.getNotes(),
                order.getSubtotal(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                items
        );
    }
}
