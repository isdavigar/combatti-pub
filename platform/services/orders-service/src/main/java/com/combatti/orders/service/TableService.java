package com.combatti.orders.service;

import com.combatti.orders.domain.OrderStatus;
import com.combatti.orders.domain.RestaurantTable;
import com.combatti.orders.repository.OrderRepository;
import com.combatti.orders.repository.RestaurantTableRepository;
import com.combatti.orders.web.dto.TableDto;
import com.combatti.orders.web.dto.TableRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class TableService {

    /** Estados que mantienen una mesa "ocupada". */
    private static final List<OrderStatus> ACTIVE_STATUSES = List.of(
            OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.SENT, OrderStatus.DELIVERED);

    private final RestaurantTableRepository tableRepository;
    private final OrderRepository orderRepository;

    public TableService(RestaurantTableRepository tableRepository, OrderRepository orderRepository) {
        this.tableRepository = tableRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public List<TableDto> listTables(String tenantId) {
        Set<Long> occupied = Set.copyOf(orderRepository.findOccupiedTableIds(tenantId, ACTIVE_STATUSES));
        return tableRepository.findByTenantIdOrderBySortOrderAscNameAsc(tenantId)
                .stream()
                .map(table -> toDto(table, occupied.contains(table.getId())))
                .toList();
    }

    @Transactional
    public TableDto createTable(String tenantId, TableRequest request) {
        String name = request.name().trim();
        if (tableRepository.existsByTenantIdAndName(tenantId, name)) {
            throw new BadRequestException("Ya existe una mesa con el nombre '" + name + "'");
        }
        RestaurantTable table = new RestaurantTable(
                tenantId,
                name,
                request.kind() != null ? request.kind() : "Mesa",
                request.icon(),
                request.posX() != null ? request.posX() : 0,
                request.posY() != null ? request.posY() : 0,
                request.size() != null ? request.size() : 100,
                request.sortOrder() != null ? request.sortOrder() : 0
        );
        table.setActive(request.active() == null || request.active());
        return toDto(tableRepository.save(table), false);
    }

    @Transactional
    public TableDto updateTable(String tenantId, Long id, TableRequest request) {
        RestaurantTable table = tableRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Mesa no encontrada: " + id));

        table.setName(request.name().trim());
        if (request.kind() != null) {
            table.setKind(request.kind());
        }
        table.setIcon(request.icon());
        if (request.posX() != null) {
            table.setPosX(request.posX());
        }
        if (request.posY() != null) {
            table.setPosY(request.posY());
        }
        if (request.size() != null) {
            table.setSize(request.size());
        }
        if (request.sortOrder() != null) {
            table.setSortOrder(request.sortOrder());
        }
        if (request.active() != null) {
            table.setActive(request.active());
        }
        return toDto(table, false);
    }

    @Transactional
    public void deleteTable(String tenantId, Long id) {
        RestaurantTable table = tableRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Mesa no encontrada: " + id));
        tableRepository.delete(table);
    }

    private TableDto toDto(RestaurantTable table, boolean occupied) {
        return new TableDto(
                table.getId(),
                table.getName(),
                table.getKind(),
                table.getIcon(),
                table.getPosX(),
                table.getPosY(),
                table.getSize(),
                table.getSortOrder(),
                table.isActive(),
                occupied
        );
    }
}
