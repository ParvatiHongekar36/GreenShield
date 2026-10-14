package com.example.greenshield.controller;

import com.example.greenshield.model.User;
import com.example.greenshield.repository.UserRepository;
import com.example.greenshield.service.DailyAlertService;
import com.example.greenshield.service.EmailService;
import com.example.greenshield.service.SmsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// For testing only. Delete this file before you submit or deploy the project.
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final DailyAlertService dailyAlertService;
    private final SmsService smsService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public AlertController(DailyAlertService dailyAlertService,
                           SmsService smsService,
                           EmailService emailService,
                           UserRepository userRepository) {
        this.dailyAlertService = dailyAlertService;
        this.smsService = smsService;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    // Runs the daily alert now instead of waiting until 8 AM
    @PostMapping("/run-now")
    public Map<String, Object> runNow(@RequestParam(defaultValue = "true") boolean force) {
        int sent = dailyAlertService.runAlerts(force);
        return Map.of("alertsSent", sent);
    }

    // Sends a test SMS to one user
    @PostMapping("/test-sms/{userId}")
    public ResponseEntity<?> testSms(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        boolean ok = smsService.send(user.getPhone(), "GreenShield test: your SMS alerts are working.");
        return ResponseEntity.ok(Map.of("sent", ok));
    }

    // Sends a test email to one user
    @PostMapping("/test-email/{userId}")
    public ResponseEntity<?> testEmail(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        boolean ok = emailService.send(
                user.getEmail(),
                "GreenShield test email",
                "Hello " + user.getName() + ",\n\nThis is a test alert from GreenShield. "
                        + "Your email alerts are working.\n\nStay safe,\nGreenShield");
        return ResponseEntity.ok(Map.of("sent", ok));
    }
}