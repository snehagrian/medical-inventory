package com.medicalinventory.backend.service;

import com.medicalinventory.backend.entity.InventoryItem;
import com.medicalinventory.backend.repository.InventoryItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InventoryItemService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    // ADD ITEM
    public InventoryItem addItem(InventoryItem item) {
        return inventoryItemRepository.save(item);
    }

    // GET ALL ITEMS
    public List<InventoryItem> getAllItems() {
        return inventoryItemRepository.findAll();
    }

    // GET ITEM BY ID
    public InventoryItem getItemById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));
    }

    // UPDATE ITEM
    public InventoryItem updateItem(Long id, InventoryItem updatedItem) {

        InventoryItem existingItem = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        existingItem.setItemName(updatedItem.getItemName());
        existingItem.setCategory(updatedItem.getCategory());
        existingItem.setQuantity(updatedItem.getQuantity());
        existingItem.setReorderLevel(updatedItem.getReorderLevel());
        existingItem.setUnitPrice(updatedItem.getUnitPrice());
        existingItem.setSupplierName(updatedItem.getSupplierName());
        existingItem.setExpiryDate(updatedItem.getExpiryDate());
        existingItem.setStatus(updatedItem.getStatus());

        return inventoryItemRepository.save(existingItem);
    }

    // DELETE ITEM
    public void deleteItem(Long id) {
        if (!inventoryItemRepository.existsById(id)) {
            throw new RuntimeException("Item not found");
        }
        inventoryItemRepository.deleteById(id);
    }

    // LOW STOCK ITEMS
    public List<InventoryItem> getLowStockItems() {
        return inventoryItemRepository.findAll()
                .stream()
                .filter(item -> item.getQuantity() < item.getReorderLevel())
                .toList();
    }
}