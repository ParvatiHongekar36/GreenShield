package com.example.greenshield.service;

import com.example.greenshield.controller.WeatherController;
import com.example.greenshield.model.User;
import com.example.greenshield.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Map;

@Service
public class DailyAlertService {

    private static final Logger log = LoggerFactory.getLogger(DailyAlertService.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final UserRepository userRepository;
    private final WeatherController weatherController;
    private final PredictionService predictionService;
    private final SmsService smsService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DailyAlertService(UserRepository userRepository,
                             WeatherController weatherController,
                             PredictionService predictionService,
                             SmsService smsService,
                             EmailService emailService) {
        this.userRepository = userRepository;
        this.weatherController = weatherController;
        this.predictionService = predictionService;
        this.smsService = smsService;
        this.emailService = emailService;
    }

    // Runs every day at 8:00 AM India time
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Kolkata")
    public void sendDailyAlerts() {
        int sent = runAlerts(false);
        log.info("Daily alerts finished. Users alerted: {}", sent);
    }

    /**
     * Checks the risk for every user who has a saved location and sends an email (and SMS)
     * if any risk is Medium or High. force=true ignores the "already sent today" check.
     */
    public int runAlerts(boolean force) {
        LocalDate today = LocalDate.now(IST);
        int sent = 0;

        for (User user : userRepository.findAll()) {
            if (user.getLatitude() == null || user.getLongitude() == null) continue;
            if (!force && today.equals(user.getLastAlertDate())) continue;

            try {
                Map<String, Object> w = weatherController.getWeather(user.getLatitude(), user.getLongitude());

                String flaskResponse = predictionService.getPrediction(
                        num(w, "temperature"), num(w, "humidity"), num(w, "rainfall"),
                        num(w, "aqi"), num(w, "windSpeed"), null);

                JsonNode r = objectMapper.readTree(flaskResponse);
                String flood = r.path("floodRisk").asText("Low");
                String fire = r.path("wildfireRisk").asText("Low");
                String cyclone = r.path("cycloneRisk").asText("Low");

                boolean anyHigh = isLevel(flood, "High") || isLevel(fire, "High") || isLevel(cyclone, "High");
                boolean anyMedium = isLevel(flood, "Medium") || isLevel(fire, "Medium") || isLevel(cyclone, "Medium");

                // All risks are Low: no alert today
                if (!anyHigh && !anyMedium) continue;

                String where = (user.getPlace() == null || user.getPlace().isBlank()) ? "your area" : user.getPlace();

                String subject = "GreenShield " + (anyHigh ? "HIGH RISK alert" : "risk alert") + " for " + where;
                String emailText = buildEmail(user, where, flood, fire, cyclone, w, anyHigh);

                String smsText = "GreenShield " + (anyHigh ? "HIGH RISK alert" : "alert") + " for " + where
                        + ": Flood " + flood + ", Wildfire " + fire + ", Cyclone " + cyclone
                        + ". Open the app for safe zones. Stay safe.";

                boolean emailOk = emailService.send(user.getEmail(), subject, emailText);
                boolean smsOk = smsService.send(user.getPhone(), smsText);

                if (emailOk || smsOk) {
                    user.setLastAlertDate(today);
                    userRepository.save(user);
                    sent++;
                }
            } catch (Exception e) {
                log.warn("Could not alert user {}: {}", user.getId(), e.getMessage());
            }
        }
        return sent;
    }

    private String buildEmail(User user, String where, String flood, String fire, String cyclone,
                              Map<String, Object> w, boolean anyHigh) {
        String advice = anyHigh
                ? "At least one risk is HIGH. Stay alert, follow official warnings, and keep emergency contacts "
                  + "and supplies ready. Open GreenShield to see nearby safe zones."
                : "Some risks are Medium. Stay alert and check GreenShield for updates during the day.";

        return "Hello " + user.getName() + ",\n\n"
                + "GreenShield risk update for " + where + ":\n\n"
                + "  Flood risk:    " + flood + "\n"
                + "  Wildfire risk: " + fire + "\n"
                + "  Cyclone risk:  " + cyclone + "\n\n"
                + "Current weather: temperature " + fmt(num(w, "temperature")) + " C, humidity "
                + fmt(num(w, "humidity")) + " %, rainfall " + fmt(num(w, "rainfall")) + " mm, AQI "
                + fmt(num(w, "aqi")) + ", wind " + fmt(num(w, "windSpeed")) + " km/h.\n\n"
                + advice + "\n\n"
                + "Stay safe,\nGreenShield";
    }

    private String fmt(double value) {
        return String.format(Locale.US, "%.1f", value);
    }

    private double num(Map<String, Object> map, String key) {
        return ((Number) map.get(key)).doubleValue();
    }

    private boolean isLevel(String value, String level) {
        return level.equalsIgnoreCase(value);
    }
}