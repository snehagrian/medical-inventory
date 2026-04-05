package com.medicalinventory.backend;

import com.medicalinventory.backend.repository.InventoryItemRepository;
import com.medicalinventory.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=" +
                "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
                "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration"
})
class BackendApplicationTests {

	@MockBean
	private UserRepository userRepository;

	@MockBean
	private InventoryItemRepository inventoryItemRepository;

	@Test
	void contextLoads() {
	}
}
