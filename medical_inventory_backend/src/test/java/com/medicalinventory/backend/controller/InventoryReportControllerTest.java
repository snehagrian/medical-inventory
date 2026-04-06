package com.medicalinventory.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medicalinventory.backend.dto.InventoryItemPageResponse;
import com.medicalinventory.backend.dto.InventoryItemQuery;
import com.medicalinventory.backend.dto.InventoryItemResponse;
import com.medicalinventory.backend.dto.InventoryReportBreakdown;
import com.medicalinventory.backend.dto.InventoryReportSummaryResponse;
import com.medicalinventory.backend.repository.UserRepository;
import com.medicalinventory.backend.service.InventoryItemService;
import com.medicalinventory.backend.service.InventoryReportService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InventoryReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class InventoryReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryItemService inventoryItemService;

    @MockBean
    private InventoryReportService inventoryReportService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getInventoryReport_returnsItems() throws Exception {
        InventoryItemResponse item = new InventoryItemResponse(
                1L, "Pedicle Screw 6.5mm", "Fixation", 40, 10, 1250.0,
                "MedSuppliers", "2026-12-31", "Available", "2026-04-04"
        );
        InventoryItemPageResponse response = new InventoryItemPageResponse(
                List.of(item), 1, 1, 0, 10, List.of("Fixation"), List.of("Available")
        );
        when(inventoryItemService.getAllItems(any(InventoryItemQuery.class))).thenReturn(response);

        mockMvc.perform(get("/api/reports/inventory"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.items[0].itemName").value("Pedicle Screw 6.5mm"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getInventoryReportSummary_returnsAggregates() throws Exception {
        InventoryReportSummaryResponse response = new InventoryReportSummaryResponse(
                12,
                3,
                8,
                4,
                24500.0,
                List.of(
                        new InventoryReportBreakdown("Fixation", 40),
                        new InventoryReportBreakdown("Fusion", 12)
                ),
                List.of(
                        new InventoryReportBreakdown("In Stock", 7),
                        new InventoryReportBreakdown("Low Stock", 3),
                        new InventoryReportBreakdown("Out Of Stock", 2)
                )
        );
        when(inventoryReportService.getInventoryReportSummary(any(InventoryItemQuery.class))).thenReturn(response);

        mockMvc.perform(get("/api/reports/inventory/summary"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalItems").value(12))
                .andExpect(jsonPath("$.quantityByCategory[0].label").value("Fixation"))
                .andExpect(jsonPath("$.stockHealth[2].label").value("Out Of Stock"));
    }
}
