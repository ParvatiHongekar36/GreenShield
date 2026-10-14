package com.example.greenshield.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    // sms.provider=log    -> only prints the SMS in the terminal (default, for testing)
    // sms.provider=twilio -> sends a real SMS through Twilio
    @Value("${sms.provider:log}")
    private String provider;

    @Value("${twilio.sid:}")
    private String sid;

    @Value("${twilio.token:}")
    private String token;

    @Value("${twilio.from:}")
    private String from;

    // Twilio trial accounts can only send predefined templates (for example sms_account_alerts).
    // Leave this empty after you upgrade, to send your own message text.
    @Value("${twilio.template:}")
    private String template;

    private final RestTemplate restTemplate = new RestTemplate();

    /** phone10 = 10-digit Indian mobile number. Returns true if the SMS was sent (or logged). */
    public boolean send(String phone10, String message) {
        String to = "+91" + phone10;

        boolean twilioReady = "twilio".equalsIgnoreCase(provider)
                && !sid.isBlank() && !token.isBlank() && !from.isBlank();

        if (!twilioReady) {
            log.info("[SMS not really sent - test mode] To {}: {}", mask(to), message);
            return true;
        }

        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json";

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(sid, token);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            // On a trial account the body must be a predefined template name
            String body = template.isBlank() ? message : template;

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("To", to);
            form.add("From", from);
            form.add("Body", body);

            restTemplate.postForEntity(url, new HttpEntity<>(form, headers), String.class);
            log.info("SMS sent to {}", mask(to));
            return true;
        } catch (Exception e) {
            log.error("SMS failed for {}: {}", mask(to), e.getMessage());
            return false;
        }
    }

    private String mask(String number) {
        return number.length() > 4 ? "******" + number.substring(number.length() - 4) : number;
    }
}