package com.example.greenshield.controller;

import com.example.greenshield.model.Prediction;
import com.example.greenshield.repository.PredictionRepository;
import com.example.greenshield.service.PredictionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3001")
@RestController
public class PredictionController {

    private final PredictionService predictionService;
    private final PredictionRepository predictionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PredictionController(PredictionService predictionService,
                                 PredictionRepository predictionRepository) {
        this.predictionService = predictionService;
        this.predictionRepository = predictionRepository;
    }

    @GetMapping("/api/history")
    public List<Prediction> getHistory() {
        List<Prediction> all = predictionRepository.findAll();
        // Return most recent first
        java.util.Collections.reverse(all);
        // Limit to the last 10 for a clean dashboard view
        if (all.size() > 10) {
            return all.subList(0, 10);
        }
        return all;
    }

    @PostMapping("/api/prediction")
    public String prediction(@RequestBody WeatherRequest weatherRequest) throws Exception {

        String flaskResponse = predictionService.getPrediction(
                weatherRequest.getTemperature(),
                weatherRequest.getHumidity(),
                weatherRequest.getRainfall(),
                weatherRequest.getAqi()
        );

        // Parse Flask's JSON response to extract the risk levels
        var responseNode = objectMapper.readTree(flaskResponse);
        String floodRisk = responseNode.get("floodRisk").asText();
        String wildfireRisk = responseNode.get("wildfireRisk").asText();

        // Save this prediction to the database
        Prediction prediction = new Prediction();
        prediction.setLatitude(weatherRequest.getLat());
        prediction.setLongitude(weatherRequest.getLon());
        prediction.setTemperature(weatherRequest.getTemperature());
        prediction.setHumidity(weatherRequest.getHumidity());
        prediction.setRainfall(weatherRequest.getRainfall());
        prediction.setAqi(weatherRequest.getAqi());
        prediction.setFloodRisk(floodRisk);
        prediction.setWildfireRisk(wildfireRisk);

        predictionRepository.save(prediction);

        return flaskResponse;
    }

    public static class WeatherRequest {
        private double temperature;
        private double humidity;
        private double rainfall;
        private double aqi;
        private double lat;
        private double lon;

        public double getTemperature() { return temperature; }
        public void setTemperature(double temperature) { this.temperature = temperature; }

        public double getHumidity() { return humidity; }
        public void setHumidity(double humidity) { this.humidity = humidity; }

        public double getRainfall() { return rainfall; }
        public void setRainfall(double rainfall) { this.rainfall = rainfall; }

        public double getAqi() { return aqi; }
        public void setAqi(double aqi) { this.aqi = aqi; }

        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }

        public double getLon() { return lon; }
        public void setLon(double lon) { this.lon = lon; }
    }
}