package com.example.greenshield.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PredictionService {

    private final RestTemplate restTemplate = new RestTemplate();

    public String getPrediction() {

        String url = "http://localhost:5000/predict";

        String requestBody = """
                {
                    "temperature": 28,
                    "humidity": 65,
                    "rainfall": 12,
                    "aqi": 42
                }
                """;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        return restTemplate.postForObject(
                url,
                request,
                String.class
        );
    }
}