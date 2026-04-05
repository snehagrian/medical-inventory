package com.medicalinventory.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventory_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false)
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
    private String expiryDate;

    private String status;

    @Column(name = "created_at")
    private String createdAt;
}