package com.example.greenshield.controller;

import com.example.greenshield.model.User;
import com.example.greenshield.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin(origins = {"http://localhost:3001", "https://localhost:3001", "https://green-shield-eight.vercel.app"})
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ---------- Request bodies ----------
    public static class RegisterRequest {
        public String name;
        public String email;
        public String phone;
        public String password;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    // ---------- Register ----------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (isBlank(req.name) || isBlank(req.email) || isBlank(req.phone) || isBlank(req.password)) {
            return error(HttpStatus.BAD_REQUEST, "Fill in your name, email, phone number and password.");
        }

        String email = req.email.trim().toLowerCase();
        String phone = req.phone.trim();

        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return error(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }
        if (!phone.matches("^[6-9]\\d{9}$")) {
            return error(HttpStatus.BAD_REQUEST, "Enter a 10-digit Indian mobile number.");
        }
        if (req.password.length() < 6) {
            return error(HttpStatus.BAD_REQUEST, "Use a password with at least 6 characters.");
        }
        if (userRepository.existsByEmail(email)) {
            return error(HttpStatus.CONFLICT, "This email is already registered. Log in instead.");
        }

        User user = new User();
        user.setName(req.name.trim());
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(encoder.encode(req.password));
        userRepository.save(user);

        return ResponseEntity.ok(toResponse(user));
    }

    // ---------- Login ----------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (isBlank(req.email) || isBlank(req.password)) {
            return error(HttpStatus.BAD_REQUEST, "Enter your email and password.");
        }

        User user = userRepository.findByEmail(req.email.trim().toLowerCase()).orElse(null);
        if (user == null || !encoder.matches(req.password, user.getPasswordHash())) {
            return error(HttpStatus.UNAUTHORIZED, "Email or password is wrong.");
        }

        return ResponseEntity.ok(toResponse(user));
    }

    // ---------- Helpers ----------
    private Map<String, Object> toResponse(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone()
        );
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}