package com.medicalinventory.backend.dto;

import java.util.List;

public record InventoryReportSummaryResponse(
        long totalItems,
        long lowStockItems,
        long availableItems,
        long categoriesCount,
        double totalInventoryValue,
        List<InventoryReportBreakdown> quantityByCategory,
        List<InventoryReportBreakdown> stockHealth
) {
}
