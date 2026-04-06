package com.medicalinventory.backend.service;

import com.medicalinventory.backend.dto.InventoryItemPageResponse;
import com.medicalinventory.backend.dto.InventoryItemQuery;
import com.medicalinventory.backend.dto.InventoryItemRequest;
import com.medicalinventory.backend.dto.InventoryItemResponse;
import com.medicalinventory.backend.entity.InventoryItem;
import com.medicalinventory.backend.repository.InventoryItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryItemServiceTest {
    private static final InventoryItemQuery DEFAULT_QUERY = new InventoryItemQuery(
            0, 10, null, null, null, null, null, null, null, false
    );

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @InjectMocks
    private InventoryItemService inventoryItemService;

    private InventoryItem sampleItem;
    private InventoryItemRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleItem = new InventoryItem(
                1L, "Pedicle Screw 6.5mm", "Fixation",
                40, 10, 1250.0, "MedSuppliers", LocalDate.parse("2026-12-31"), "Available", LocalDateTime.parse("2026-04-04T00:00:00")
        );
        sampleRequest = new InventoryItemRequest(
                "Pedicle Screw 6.5mm", "Fixation", 40, 10, 1250.0,
                "MedSuppliers", "2026-12-31", "Available"
        );
    }

    @Test
    void addItem_savesAndReturnsResponse() {
        when(inventoryItemRepository.existsByItemName("Pedicle Screw 6.5mm")).thenReturn(false);
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenReturn(sampleItem);

        InventoryItemResponse result = inventoryItemService.addItem(sampleRequest);

        assertEquals("Pedicle Screw 6.5mm", result.itemName());
        verify(inventoryItemRepository, times(1)).save(any(InventoryItem.class));
    }

    @Test
    void addItem_throws409_whenItemNameAlreadyExists() {
        when(inventoryItemRepository.existsByItemName("Pedicle Screw 6.5mm")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryItemService.addItem(sampleRequest));

        assertEquals(409, ex.getStatusCode().value());
    }

    @Test
    void updateItem_updatesExistingItem() {
        InventoryItem existing = new InventoryItem(
                1L, "Old Item", "Old Category", 5, 3, 100.0, "Old Supplier", LocalDate.parse("2025-01-01"), "Old Status", LocalDateTime.parse("2026-01-01T00:00:00")
        );
        InventoryItemRequest updateRequest = new InventoryItemRequest(
                "Updated Item", "Updated Category", 20, 8, 250.0,
                "Updated Supplier", "2027-01-01", "Updated Status"
        );

        when(inventoryItemRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(inventoryItemRepository.existsByItemNameAndIdNot("Updated Item", 1L)).thenReturn(false);
        when(inventoryItemRepository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryItemResponse result = inventoryItemService.updateItem(1L, updateRequest);

        assertEquals("Updated Item", result.itemName());
        assertEquals(20, result.quantity());
        verify(inventoryItemRepository).findById(1L);
        verify(inventoryItemRepository).save(existing);
    }

    @Test
    void updateItem_throwsNotFound_whenItemMissing() {
        when(inventoryItemRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryItemService.updateItem(99L, sampleRequest));

        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void updateItem_throws409_whenItemNameTakenByAnotherItem() {
        InventoryItem existing = new InventoryItem(
                1L, "Old Item", "Old Category", 5, 3, 100.0, "Old Supplier", LocalDate.parse("2025-01-01"), "Old Status", LocalDateTime.parse("2026-01-01T00:00:00")
        );
        when(inventoryItemRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(inventoryItemRepository.existsByItemNameAndIdNot("Pedicle Screw 6.5mm", 1L)).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryItemService.updateItem(1L, sampleRequest));

        assertEquals(409, ex.getStatusCode().value());
    }

    @Test
    void deleteItem_deletesWhenItemExists() {
        when(inventoryItemRepository.existsById(1L)).thenReturn(true);
        doNothing().when(inventoryItemRepository).deleteById(1L);

        inventoryItemService.deleteItem(1L);

        verify(inventoryItemRepository).existsById(1L);
        verify(inventoryItemRepository).deleteById(1L);
    }

    @Test
    void deleteItem_throwsNotFound_whenItemMissing() {
        when(inventoryItemRepository.existsById(99L)).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryItemService.deleteItem(99L));

        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void getAllItems_returnsPagedResponse() {
        when(inventoryItemRepository.findAll(org.mockito.ArgumentMatchers.<Specification<InventoryItem>>any(), any(Pageable.class))).thenReturn(
                new PageImpl<>(List.of(sampleItem))
        );
        when(inventoryItemRepository.findAll(org.mockito.ArgumentMatchers.<Specification<InventoryItem>>any(), any(Sort.class))).thenReturn(List.of(sampleItem));

        InventoryItemPageResponse result = inventoryItemService.getAllItems(DEFAULT_QUERY);

        assertEquals(1, result.items().size());
        assertEquals("Pedicle Screw 6.5mm", result.items().get(0).itemName());
        assertEquals(1, result.totalElements());
        assertEquals(1, result.totalPages());
    }

    @Test
    void getLowStockItems_returnsOnlyItemsBelowReorderLevel() {
        InventoryItem lowStockItem = new InventoryItem(
                2L, "Interbody Cage Small", "Fusion", 2, 3, 1800.0,
                "Fusion Supplies", LocalDate.parse("2026-10-10"), "Low Stock", LocalDateTime.parse("2026-04-04T00:00:00")
        );
        when(inventoryItemRepository.findAll(org.mockito.ArgumentMatchers.<Specification<InventoryItem>>any(), any(Pageable.class))).thenReturn(
                new PageImpl<>(List.of(lowStockItem))
        );
        when(inventoryItemRepository.findAll(org.mockito.ArgumentMatchers.<Specification<InventoryItem>>any(), any(Sort.class))).thenReturn(List.of(lowStockItem));

        InventoryItemPageResponse result = inventoryItemService.getLowStockItems(DEFAULT_QUERY);

        assertEquals(1, result.items().size());
        assertEquals("Interbody Cage Small", result.items().get(0).itemName());
    }

    @Test
    void addItem_throws400_whenExpiryDateIsInvalid() {
        InventoryItemRequest invalidRequest = new InventoryItemRequest(
                "Pedicle Screw 6.5mm", "Fixation", 40, 10, 1250.0,
                "MedSuppliers", "12/31/2026", "Available"
        );

        when(inventoryItemRepository.existsByItemName("Pedicle Screw 6.5mm")).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryItemService.addItem(invalidRequest));

        assertEquals(400, ex.getStatusCode().value());
    }

}
