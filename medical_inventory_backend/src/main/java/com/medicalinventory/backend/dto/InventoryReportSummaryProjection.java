package com.medicalinventory.backend.dto;

public interface InventoryReportSummaryProjection {
    Long getTotalItems();
    Long getLowStockItems();
    Long getAvailableItems();
    Long getCategoriesCount();
    Double getTotalInventoryValue();
    Long getOutOfStockItems();
}
