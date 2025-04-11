package com.alibaba.cloud.ai.deepseek;

import org.springframework.util.Assert;

public class DeepseekChatOptions {
    private String apiKey;
    private String model = "deepseek-chat";
    private double temperature = 0.7;
    private int maxTokens = 2000;
    private String baseUrl = "https://api.deepseek.com/v1/chat/completions";

    public DeepseekChatOptions(String apiKey) {
        Assert.hasText(apiKey, "API Key must not be empty");
        this.apiKey = apiKey;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }
} 