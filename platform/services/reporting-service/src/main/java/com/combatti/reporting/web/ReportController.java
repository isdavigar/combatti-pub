package com.combatti.reporting.web;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.reporting.service.ReportService;
import com.combatti.reporting.web.dto.CategorySalesDto;
import com.combatti.reporting.web.dto.SalesReportDto;
import com.combatti.reporting.web.dto.TopProductDto;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAuthority('reports.read')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    public SalesReportDto sales(@AuthenticationPrincipal AuthenticatedUser user,
                                @RequestParam(value = "from", required = false)
                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                @RequestParam(value = "to", required = false)
                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.salesReport(TenantSupport.tenantOf(user), from, to);
    }

    @GetMapping("/top-products")
    public List<TopProductDto> topProducts(@AuthenticationPrincipal AuthenticatedUser user,
                                           @RequestParam(value = "from", required = false)
                                           @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam(value = "to", required = false)
                                           @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                           @RequestParam(value = "limit", required = false, defaultValue = "10") int limit) {
        return reportService.topProducts(TenantSupport.tenantOf(user), from, to, limit);
    }

    @GetMapping("/by-category")
    public List<CategorySalesDto> byCategory(@AuthenticationPrincipal AuthenticatedUser user,
                                             @RequestParam(value = "from", required = false)
                                             @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                             @RequestParam(value = "to", required = false)
                                             @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.salesByCategory(TenantSupport.tenantOf(user), from, to);
    }
}
