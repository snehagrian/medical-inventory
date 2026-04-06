package com.medicalinventory.backend.dto;

import java.util.List;

public record InventoryItemPageResponse(
        List<InventoryItemResponse> items,
        long totalElements,
        int totalPages,
        int page,
        int size,
        List<String> availableCategories,
        List<String> availableStatuses
) {
}
