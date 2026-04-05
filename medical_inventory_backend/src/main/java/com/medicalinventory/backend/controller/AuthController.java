package com.medicalinventory.backend.controller;

import com.medicalinventory.backend.dto.AuthResponse;
import com.medicalinventory.backend.dto.AuthRequest;
import com.medicalinventory.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request.username(), request.password());
    }

    @PostMapping({"/register", "/signup"})
    public String register(@Valid @RequestBody AuthRequest request) {
        return authService.register(request.username(), request.password());
    }
}
