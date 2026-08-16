package com.example.greenshield.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PredictionService {

    private final RestTemplate restTemplate = new RestTemplate();

    public String getPrediction(double temperature, double humidity, double rainfall, double aqi) {

        String url = "http://localhost:5000/predict";

        String requestBody = String.format("""
                {
                    "temperature": %.2f,
                    "humidity": %.2f,
                    "rainfall": %.2f,
                    "aqi": %.2f
                }
                """, temperature, humidity, rainfall, aqi);

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