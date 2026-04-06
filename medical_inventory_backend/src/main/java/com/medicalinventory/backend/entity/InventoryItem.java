package com.medicalinventory.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "inventory_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false, unique = true)
    private String itemName;

    private String category;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "reorder_level", nullable = false)
    private int reorderLevel;

    @Column(name = "unit_price", nullable = false)
    private double unitPrice;

    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        }
    }
}
