package com.example.greenshield.controller;

import com.example.greenshield.service.WeatherService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3001")
@RestController
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/api/weather")
    public Map<String, Object> getWeather(
            @RequestParam double lat,
            @RequestParam double lon) {

        Map<String, Object> rawData = weatherService.getWeather(lat, lon);

        Map<String, Object> main = (Map<String, Object>) rawData.get("main");
        double temperature = ((Number) main.get("temp")).doubleValue();
        double humidity = ((Number) main.get("humidity")).doubleValue();

        double rainfall = 0.0;
        if (rawData.containsKey("rain")) {
            Map<String, Object> rain = (Map<String, Object>) rawData.get("rain");
            if (rain.containsKey("1h")) {
                rainfall = ((Number) rain.get("1h")).doubleValue();
            }
        }

     Map<String, Object> airData = weatherService.getAirQuality(lat, lon);
        List<Map<String, Object>> airList = (List<Map<String, Object>>) airData.get("list");
        Map<String, Object> airMain = (Map<String, Object>) airList.get(0).get("main");
        int owmCategory = ((Number) airMain.get("aqi")).intValue();

        double aqi = convertOwmAqiToScale(owmCategory);

        return Map.of(
                "temperature", temperature,
                "humidity", humidity,
                "rainfall", rainfall,
                "aqi", aqi
        );
    }

    private double convertOwmAqiToScale(int owmCategory) {
        switch (owmCategory) {
            case 1: return 25;
            case 2: return 75;
            case 3: return 150;
            case 4: return 250;
            case 5: return 350;
            default: return 100;
        }
    }
}