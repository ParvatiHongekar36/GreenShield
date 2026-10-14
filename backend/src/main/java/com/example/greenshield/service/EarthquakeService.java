package com.example.greenshield.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class EarthquakeService {

    private final Map<String, String> stateZoneMap = new HashMap<>();

    public EarthquakeService() {
        // Based on Bureau of Indian Standards (IS 1893) Seismic Zoning Map of India
        // Zone V - Very High Risk
        stateZoneMap.put("jammu and kashmir", "V");
        stateZoneMap.put("himachal pradesh", "V");
        stateZoneMap.put("uttarakhand", "V");
        stateZoneMap.put("bihar", "V");
        stateZoneMap.put("assam", "V");
        stateZoneMap.put("manipur", "V");
        stateZoneMap.put("nagaland", "V");
        stateZoneMap.put("gujarat", "V");

        // Zone IV - High Risk
        stateZoneMap.put("delhi", "IV");
        stateZoneMap.put("sikkim", "IV");
        stateZoneMap.put("west bengal", "IV");
        stateZoneMap.put("punjab", "IV");
        stateZoneMap.put("haryana", "IV");
        stateZoneMap.put("uttar pradesh", "IV");
        stateZoneMap.put("maharashtra", "IV");

        // Zone III - Moderate Risk
        stateZoneMap.put("rajasthan", "III");
        stateZoneMap.put("kerala", "III");
        stateZoneMap.put("goa", "III");
        stateZoneMap.put("jharkhand", "III");
        stateZoneMap.put("chhattisgarh", "III");
        stateZoneMap.put("madhya pradesh", "III");
        stateZoneMap.put("tamil nadu", "III");

        // Zone II - Low Risk
        stateZoneMap.put("karnataka", "II");
        stateZoneMap.put("andhra pradesh", "II");
        stateZoneMap.put("telangana", "II");
        stateZoneMap.put("odisha", "II");
    }

    public String getRiskLevel(String state) {
        if (state == null) {
            return "Unknown";
        }

        String zone = stateZoneMap.getOrDefault(state.toLowerCase().trim(), "III");

        switch (zone) {
            case "V":
                return "High";
            case "IV":
                return "Medium";
            case "III":
                return "Medium";
            case "II":
                return "Low";
            default:
                return "Unknown";
        }
    }

    public String getZone(String state) {
        if (state == null) {
            return "Unknown";
        }
        return stateZoneMap.getOrDefault(state.toLowerCase().trim(), "III (default)");
    }
}
