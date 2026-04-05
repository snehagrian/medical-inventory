package com.medicalinventory.backend.controller;

import com.medicalinventory.backend.dto.AuthResponse;
import com.medicalinventory.backend.dto.AuthRequest;
import com.medicalinventory.backend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://localhost:4200",
        "http://localhost:5173"
})

@Validated

public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthResponse loginJson(@Valid @RequestBody AuthRequest request) {
        return authService.login(request.username(), request.password());
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AuthResponse login(
            @RequestParam @NotBlank(message = "Username is required") String username,
            @RequestParam @NotBlank(message = "Password is required") String password
    ) {
        return authService.login(username, password);
    }

    @PostMapping(value = {"/register", "/signup"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public String registerJson(@Valid @RequestBody AuthRequest request) {
        return authService.register(request.username(), request.password());
    }

    @PostMapping(value = {"/register", "/signup"}, consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String register(
            @RequestParam @NotBlank(message = "Username is required") String username,
            @RequestParam @NotBlank(message = "Password is required") String password
    ) {
        return authService.register(username, password);
    }


    
}
