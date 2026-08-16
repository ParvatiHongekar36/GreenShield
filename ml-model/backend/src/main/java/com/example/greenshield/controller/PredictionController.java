package com.example.greenshield.controller;

import com.example.greenshield.service.PredictionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping("/api/prediction")
    public String prediction() {
        return predictionService.getPrediction();
    }
}