package com.medicalinventory.backend.service;

import java.util.Optional;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.medicalinventory.backend.dto.AuthResponse;
import com.medicalinventory.backend.entity.User;
import com.medicalinventory.backend.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public String register(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return "Username and password are required";
        }

        if (userRepository.existsByUsername(username)) {
            return "Username already exists";
        }

        User newUser = new User();
        newUser.setUsername(username);
        String hashedPassword = passwordEncoder.encode(password);
        newUser.setPassword(hashedPassword);
        newUser.setRole("USER");
        newUser.setCreatedAt(LocalDateTime.now().toString());
        userRepository.save(newUser);

        return "Registration Successful";
    }

    public AuthResponse login(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return new AuthResponse("Username and password are required", null);
        }

        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (passwordEncoder.matches(password, user.getPassword())) {
                String token = jwtService.generateToken(user.getUsername(), user.getRole());
                return new AuthResponse("Login Successful", token);
            } else {
                return new AuthResponse("Invalid Password", null);
            }
        } else {
            return new AuthResponse("User Not Found", null);
        }
    }
}