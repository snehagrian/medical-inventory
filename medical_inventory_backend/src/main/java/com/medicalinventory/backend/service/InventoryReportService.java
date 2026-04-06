package com.medicalinventory.backend.service;

import com.medicalinventory.backend.dto.InventoryItemQuery;
import com.medicalinventory.backend.dto.InventoryReportBreakdown;
import com.medicalinventory.backend.dto.InventoryReportSummaryProjection;
import com.medicalinventory.backend.dto.InventoryReportSummaryResponse;
import com.medicalinventory.backend.repository.InventoryItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class InventoryReportService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    public InventoryReportSummaryResponse getInventoryReportSummary(InventoryItemQuery query) {
        String search = normalizeFilter(query.search());
        String category = normalizeFilter(query.category());
        String status = normalizeFilter(query.status());
        LocalDate dateFrom = parseFilterDate(query.dateFrom(), "dateFrom");
        LocalDate dateTo = parseFilterDate(query.dateTo(), "dateTo");

        InventoryReportSummaryProjection summary = inventoryItemRepository.getInventoryReportSummary(
                search,
                category,
                status,
                dateFrom,
                dateTo
        );
        List<InventoryReportBreakdown> quantityByCategory = inventoryItemRepository.getInventoryQuantityByCategory(
                search,
                category,
                status,
                dateFrom,
                dateTo
        );

        long totalItems = numberOrZero(summary.getTotalItems());
        long lowStockItems = numberOrZero(summary.getLowStockItems());
        long availableItems = numberOrZero(summary.getAvailableItems());
        long categoriesCount = numberOrZero(summary.getCategoriesCount());
        double totalInventoryValue = doubleOrZero(summary.getTotalInventoryValue());
        long outOfStockItems = numberOrZero(summary.getOutOfStockItems());
        long inStockItems = Math.max(0, totalItems - lowStockItems - outOfStockItems);

        List<InventoryReportBreakdown> stockHealth = List.of(
                new InventoryReportBreakdown("In Stock", inStockItems),
                new InventoryReportBreakdown("Low Stock", lowStockItems),
                new InventoryReportBreakdown("Out Of Stock", outOfStockItems)
        );

        return new InventoryReportSummaryResponse(
                totalItems,
                lowStockItems,
                availableItems,
                categoriesCount,
                totalInventoryValue,
                quantityByCategory,
                stockHealth
        );
    }

    private String normalizeFilter(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        if (trimmedValue.isEmpty() || "ALL".equalsIgnoreCase(trimmedValue)) {
            return null;
        }

        return trimmedValue;
    }

    private LocalDate parseFilterDate(String value, String parameterName) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, parameterName + " must use yyyy-MM-dd");
        }
    }

    private long numberOrZero(Number value) {
        return value == null ? 0 : value.longValue();
    }

    private double doubleOrZero(Double value) {
        return value == null ? 0 : value;
    }
}
