package com.medicalinventory.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicalinventory.backend.entity.InventoryItem;
import com.medicalinventory.backend.repository.UserRepository;
import com.medicalinventory.backend.service.InventoryItemService;
import com.medicalinventory.backend.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InventoryItemController.class)
@AutoConfigureMockMvc(addFilters = false)
class InventoryItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryItemService inventoryItemService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getAllItems_returnsItems() throws Exception {
        InventoryItem item = new InventoryItem(1L, "Pedicle Screw 6.5mm", "Fixation", 40, 10, 1250.0, "MedSuppliers", "2026-12-31", "Available", "2026-04-04");
        when(inventoryItemService.getAllItems()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].itemName").value("Pedicle Screw 6.5mm"));
    }

    @Test
    void getLowStockItems_returnsFilteredItems() throws Exception {
        InventoryItem item = new InventoryItem(2L, "Interbody Cage Small", "Fusion", 2, 3, 1800.0, "Fusion Supplies", "2026-10-10", "Low Stock", "2026-04-04");
        when(inventoryItemService.getLowStockItems()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/items/low-stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemName").value("Interbody Cage Small"));
    }

    @Test
    void addItem_createsItem() throws Exception {
        InventoryItem request = new InventoryItem(null, "Test Medicine", "Medicine", 10, 5, 100.0, "Supplier", "2026-12-31", "Available", "2026-04-04");
        InventoryItem saved = new InventoryItem(6L, "Test Medicine", "Medicine", 10, 5, 100.0, "Supplier", "2026-12-31", "Available", "2026-04-04");
        when(inventoryItemService.addItem(any(InventoryItem.class))).thenReturn(saved);

        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(6))
                .andExpect(jsonPath("$.itemName").value("Test Medicine"));

        verify(inventoryItemService).addItem(any(InventoryItem.class));
    }

    @Test
    void updateItem_updatesItem() throws Exception {
        InventoryItem request = new InventoryItem(null, "Updated Item", "Updated Category", 20, 8, 250.0, "Updated Supplier", "2027-01-01", "Updated Status", "2026-04-04");
        InventoryItem updated = new InventoryItem(1L, "Updated Item", "Updated Category", 20, 8, 250.0, "Updated Supplier", "2027-01-01", "Updated Status", "2026-04-04");
        when(inventoryItemService.updateItem(eq(1L), any(InventoryItem.class))).thenReturn(updated);

        mockMvc.perform(put("/api/items/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemName").value("Updated Item"));

        verify(inventoryItemService).updateItem(eq(1L), any(InventoryItem.class));
    }

    @Test
    void deleteItem_returnsSuccessMessage() throws Exception {
        mockMvc.perform(delete("/api/items/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Item deleted successfully"));

        verify(inventoryItemService).deleteItem(1L);
    }
}
