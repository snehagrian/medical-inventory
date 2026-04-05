package com.medicalinventory.backend.service;

import com.medicalinventory.backend.entity.InventoryItem;
import com.medicalinventory.backend.repository.InventoryItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryItemServiceTest {

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @InjectMocks
    private InventoryItemService inventoryItemService;

    private InventoryItem sampleItem;

    @BeforeEach
    void setUp() {
        sampleItem = new InventoryItem(
                1L,
                "Pedicle Screw 6.5mm",
                "Fixation",
                40,
                10,
                1250.0,
                "MedSuppliers",
                "2026-12-31",
                "Available",
                "2026-04-04"
        );
    }

    @Test
    void getAllItems_returnsItemsFromRepository() {
        when(inventoryItemRepository.findAll()).thenReturn(List.of(sampleItem));

        List<InventoryItem> result = inventoryItemService.getAllItems();

        assertEquals(1, result.size());
        assertEquals("Pedicle Screw 6.5mm", result.get(0).getItemName());
        verify(inventoryItemRepository, times(1)).findAll();
    }

    @Test
    void addItem_savesItem() {
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(sampleItem);

        InventoryItem result = inventoryItemService.addItem(sampleItem);

        assertEquals("Pedicle Screw 6.5mm", result.getItemName());
        verify(inventoryItemRepository, times(1)).save(sampleItem);
    }

    @Test
    void updateItem_updatesExistingItem() {
        InventoryItem existingItem = new InventoryItem(
                1L,
                "Old Item",
                "Old Category",
                5,
                3,
                100.0,
                "Old Supplier",
                "2025-01-01",
                "Old Status",
                "2026-01-01"
        );

        InventoryItem updatedItem = new InventoryItem(
                null,
                "Updated Item",
                "Updated Category",
                20,
                8,
                250.0,
                "Updated Supplier",
                "2027-01-01",
                "Updated Status",
                "2026-04-04"
        );

        when(inventoryItemRepository.findById(1L)).thenReturn(Optional.of(existingItem));
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InventoryItem result = inventoryItemService.updateItem(1L, updatedItem);

        assertEquals("Updated Item", result.getItemName());
        assertEquals(20, result.getQuantity());
        assertEquals(8, result.getReorderLevel());
        verify(inventoryItemRepository, times(1)).findById(1L);
        verify(inventoryItemRepository, times(1)).save(existingItem);
    }

    @Test
    void deleteItem_deletesWhenItemExists() {
        when(inventoryItemRepository.existsById(1L)).thenReturn(true);
        doNothing().when(inventoryItemRepository).deleteById(1L);

        inventoryItemService.deleteItem(1L);

        verify(inventoryItemRepository, times(1)).existsById(1L);
        verify(inventoryItemRepository, times(1)).deleteById(1L);
    }

    @Test
    void getLowStockItems_returnsOnlyLowStockItems() {
        InventoryItem lowStockItem = new InventoryItem(
                2L,
                "Interbody Cage Small",
                "Fusion",
                2,
                3,
                1800.0,
                "Fusion Supplies",
                "2026-10-10",
                "Low Stock",
                "2026-04-04"
        );

        when(inventoryItemRepository.findAll()).thenReturn(List.of(sampleItem, lowStockItem));

        List<InventoryItem> result = inventoryItemService.getLowStockItems();

        assertEquals(1, result.size());
        assertEquals("Interbody Cage Small", result.get(0).getItemName());
    }

    @Test
    void getItemById_throwsWhenMissing() {
        when(inventoryItemRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> inventoryItemService.getItemById(99L));

        assertEquals("Item not found", exception.getMessage());
    }
}
