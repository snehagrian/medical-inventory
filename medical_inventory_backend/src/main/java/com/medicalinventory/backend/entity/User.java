package com.medicalinventory.backend.entity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;


    private String role;

    @Column(name = "created_at")
    private String createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null || createdAt.isBlank()) {
            createdAt = LocalDateTime.now().toString();
        }
    }
    
}
