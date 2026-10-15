package com.example.greenshield.controller;

import com.example.greenshield.service.WeatherService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = {"http://localhost:3001", "https://localhost:3001", "https://YOUR-VERCEL-URL.vercel.app"})
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
            } else if (rain.containsKey("3h")) {
                // 3h value — normalize to per-hour equivalent
                rainfall = ((Number) rain.get("3h")).doubleValue() / 3.0;
            }
        }
        // If no current rain, fetch today's accumulated rainfall from forecast
        if (rainfall == 0.0) {
            rainfall = getTodayAccumulatedRainfall(lat, lon);
        }

        Map<String, Object> wind = (Map<String, Object>) rawData.get("wind");
        double windSpeed = 0.0;
        if (wind != null && wind.containsKey("speed")) {
            // OpenWeatherMap returns wind in m/s — convert to km/h
            windSpeed = Math.round(((Number) wind.get("speed")).doubleValue() * 3.6 * 10.0) / 10.0;
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
                "aqi", aqi,
                "windSpeed", windSpeed
        );
    }

    /**
     * Sums rainfall from today's 3-hour forecast slots to get accumulated daily rainfall.
     */
    @SuppressWarnings("unchecked")
    private double getTodayAccumulatedRainfall(double lat, double lon) {
        try {
            Map<String, Object> forecastData = weatherService.getForecast(lat, lon);
            if (forecastData == null) return 0.0;
            List<Map<String, Object>> forecastList = (List<Map<String, Object>>) forecastData.get("list");
            if (forecastList == null) return 0.0;

            double total = 0.0;
            String today = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date());
            for (Map<String, Object> slot : forecastList) {
                String dt_txt = (String) slot.get("dt_txt");
                if (dt_txt != null && dt_txt.startsWith(today)) {
                    if (slot.containsKey("rain")) {
                        Map<String, Object> rain = (Map<String, Object>) slot.get("rain");
                        if (rain.containsKey("3h")) {
                            total += ((Number) rain.get("3h")).doubleValue();
                        }
                    }
                }
            }
            return Math.round(total * 10.0) / 10.0;
        } catch (Exception e) {
            return 0.0;
        }
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