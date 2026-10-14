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

@CrossOrigin(origins = {"http://localhost:3001", "https://localhost:3001"})
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
        java.util.Collections.reverse(all);
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
                weatherRequest.getAqi(),
                weatherRequest.getWindSpeed(),
                weatherRequest.getElevation()
        );

        var responseNode = objectMapper.readTree(flaskResponse);
        String floodRisk = responseNode.get("floodRisk").asText();
        String wildfireRisk = responseNode.get("wildfireRisk").asText();

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
        private double windSpeed;
        private Double elevation;
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

        public double getWindSpeed() { return windSpeed; }
        public void setWindSpeed(double windSpeed) { this.windSpeed = windSpeed; }

        public Double getElevation() { return elevation; }
        public void setElevation(Double elevation) { this.elevation = elevation; }

        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }

        public double getLon() { return lon; }
        public void setLon(double lon) { this.lon = lon; }
    }
}