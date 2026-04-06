package com.medicalinventory.backend.dto;

import com.medicalinventory.backend.entity.InventoryItem;

public record InventoryItemResponse(
        Long id,
        String itemName,
        String category,
        int quantity,
        int reorderLevel,
        double unitPrice,
        String supplierName,
        String expiryDate,
        String status,
        String createdAt
) {
    public static InventoryItemResponse from(InventoryItem item) {
        return new InventoryItemResponse(
                item.getId(),
                item.getItemName(),
                item.getCategory(),
                item.getQuantity(),
                item.getReorderLevel(),
                item.getUnitPrice(),
                item.getSupplierName(),
                item.getExpiryDate() == null ? null : item.getExpiryDate().toString(),
                item.getStatus(),
                item.getCreatedAt() == null ? null : item.getCreatedAt().toString()
        );
    }
}
