package com.medicalinventory.backend.repository;
import com.medicalinventory.backend.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByItemName(String itemName);
    

}
