package com.example.greenshield.controller;

import com.example.greenshield.service.EarthquakeService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin(origins = {"http://localhost:3001", "https://localhost:3001", "https://YOUR-VERCEL-URL.vercel.app"})
@RestController
public class EarthquakeController {

    private final EarthquakeService earthquakeService;

    public EarthquakeController(EarthquakeService earthquakeService) {
        this.earthquakeService = earthquakeService;
    }

    @GetMapping("/api/earthquake-risk")
    public Map<String, String> getEarthquakeRisk(@RequestParam String state) {
        String riskLevel = earthquakeService.getRiskLevel(state);
        String zone = earthquakeService.getZone(state);

        return Map.of(
                "riskLevel", riskLevel,
                "seismicZone", zone
        );
    }
}