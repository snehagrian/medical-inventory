package com.medicalinventory.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InventoryItemRequest(
        @NotBlank(message = "Item name is required")
        String itemName,

        @NotBlank(message = "Category is required")
        String category,

        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity must be zero or greater")
        Integer quantity,

        @NotNull(message = "Reorder level is required")
        @Min(value = 0, message = "Reorder level must be zero or greater")
        Integer reorderLevel,

        @NotNull(message = "Unit price is required")
        @Min(value = 0, message = "Unit price must be zero or greater")
        Double unitPrice,

        @NotBlank(message = "Supplier name is required")
        String supplierName,

        @NotBlank(message = "Expiry date is required")
        String expiryDate,

        @NotBlank(message = "Status is required")
        String status
) {}
