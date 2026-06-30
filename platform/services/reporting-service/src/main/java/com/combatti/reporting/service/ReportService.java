package com.combatti.reporting.service;

import com.combatti.reporting.web.dto.CategorySalesDto;
import com.combatti.reporting.web.dto.MethodTotalDto;
import com.combatti.reporting.web.dto.SalesReportDto;
import com.combatti.reporting.web.dto.TopProductDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio de reportes de solo lectura. Agrega datos directamente desde los
 * esquemas {@code payments} y {@code orders} del mismo PostgreSQL.
 */
@Service
public class ReportService {

    private final JdbcTemplate jdbc;
    private final ZoneId zoneId = ZoneId.of("America/Bogota");

    public ReportService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public SalesReportDto salesReport(String tenantId, LocalDate from, LocalDate to) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now(zoneId);
        LocalDate effectiveTo = to != null ? to : effectiveFrom;

        Timestamp start = Timestamp.from(effectiveFrom.atStartOfDay(zoneId).toInstant());
        // Rango [start, endExclusive) cubriendo el día 'to' completo.
        Timestamp endExclusive = Timestamp.from(effectiveTo.plusDays(1).atStartOfDay(zoneId).toInstant());

        List<MethodTotalDto> byMethod = new ArrayList<>();
        jdbc.query(
                """
                SELECT method, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS cnt
                FROM payments.payments
                WHERE tenant_id = ? AND created_at >= ? AND created_at < ?
                GROUP BY method
                ORDER BY total DESC
                """,
                rs -> {
                    byMethod.add(new MethodTotalDto(
                            rs.getString("method"),
                            rs.getBigDecimal("total"),
                            rs.getLong("cnt")));
                },
                tenantId, start, endExclusive);

        BigDecimal total = byMethod.stream()
                .map(MethodTotalDto::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long transactions = byMethod.stream().mapToLong(MethodTotalDto::count).sum();
        BigDecimal averageTicket = transactions > 0
                ? total.divide(BigDecimal.valueOf(transactions), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new SalesReportDto(effectiveFrom, effectiveTo, total, transactions, averageTicket, byMethod);
    }

    public List<TopProductDto> topProducts(String tenantId, LocalDate from, LocalDate to, int limit) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now(zoneId);
        LocalDate effectiveTo = to != null ? to : effectiveFrom;

        Timestamp start = Timestamp.from(effectiveFrom.atStartOfDay(zoneId).toInstant());
        Timestamp endExclusive = Timestamp.from(effectiveTo.plusDays(1).atStartOfDay(zoneId).toInstant());
        int safeLimit = (limit > 0 && limit <= 100) ? limit : 10;

        List<TopProductDto> products = new ArrayList<>();
        jdbc.query(
                """
                SELECT oi.product_name AS name,
                       COALESCE(SUM(oi.quantity), 0) AS qty,
                       COALESCE(SUM(oi.line_total), 0) AS revenue
                FROM orders.order_items oi
                JOIN orders.orders o ON o.id = oi.order_id
                WHERE o.tenant_id = ? AND o.status = 'PAID'
                  AND o.created_at >= ? AND o.created_at < ?
                GROUP BY oi.product_name
                ORDER BY qty DESC
                LIMIT ?
                """,
                rs -> {
                    products.add(new TopProductDto(
                            rs.getString("name"),
                            rs.getLong("qty"),
                            rs.getBigDecimal("revenue")));
                },
                tenantId, start, endExclusive, safeLimit);

        return products;
    }

    public List<CategorySalesDto> salesByCategory(String tenantId, LocalDate from, LocalDate to) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now(zoneId);
        LocalDate effectiveTo = to != null ? to : effectiveFrom;

        Timestamp start = Timestamp.from(effectiveFrom.atStartOfDay(zoneId).toInstant());
        Timestamp endExclusive = Timestamp.from(effectiveTo.plusDays(1).atStartOfDay(zoneId).toInstant());

        List<CategorySalesDto> result = new ArrayList<>();
        jdbc.query(
                """
                SELECT c.name AS category,
                       COALESCE(SUM(oi.quantity), 0) AS qty,
                       COALESCE(SUM(oi.line_total), 0) AS revenue
                FROM orders.order_items oi
                JOIN orders.orders o ON o.id = oi.order_id
                JOIN catalog.products p ON p.tenant_id = o.tenant_id AND p.name = oi.product_name
                JOIN catalog.categories c ON c.id = p.category_id
                WHERE o.tenant_id = ? AND o.status = 'PAID'
                  AND o.created_at >= ? AND o.created_at < ?
                GROUP BY c.name
                ORDER BY revenue DESC
                """,
                rs -> {
                    result.add(new CategorySalesDto(
                            rs.getString("category"),
                            rs.getLong("qty"),
                            rs.getBigDecimal("revenue")));
                },
                tenantId, start, endExclusive);

        return result;
    }
}
