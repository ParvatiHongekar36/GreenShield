package com.example.greenshield.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    // The Gmail address used to send alerts (comes from the MAIL_USER setting)
    @Value("${spring.mail.username:}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /** Sends a plain-text email. Returns true if it was sent (or only printed in test mode). */
    public boolean send(String to, String subject, String text) {
        if (from == null || from.isBlank()) {
            log.info("[Email not really sent - MAIL_USER is not set] To {}: {} | {}", to, subject, text);
            return true;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Email sent to {}", to);
            return true;
        } catch (Exception e) {
            log.error("Email failed for {}: {}", to, e.getMessage());
            return false;
        }
    }
}