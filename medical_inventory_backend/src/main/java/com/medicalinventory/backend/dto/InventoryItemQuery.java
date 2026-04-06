package com.medicalinventory.backend.dto;

public record InventoryItemQuery(
        int page,
        int size,
        String search,
        String category,
        String status,
        String dateFrom,
        String dateTo,
        String sortField,
        String sortDirection,
        boolean all
) {
}
