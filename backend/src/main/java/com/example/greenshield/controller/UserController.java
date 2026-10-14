package com.example.greenshield.controller;

import com.example.greenshield.model.User;
import com.example.greenshield.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin(origins = {"http://localhost:3001", "https://localhost:3001"})
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public static class LocationRequest {
        public double lat;
        public double lon;
        public String place;
    }

    // Saves the user's latest location, used by the daily alert
    @PutMapping("/{id}/location")
    public ResponseEntity<?> saveLocation(@PathVariable Long id, @RequestBody LocationRequest req) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        user.setLatitude(req.lat);
        user.setLongitude(req.lon);
        user.setPlace(req.place);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "saved"));
    }
}