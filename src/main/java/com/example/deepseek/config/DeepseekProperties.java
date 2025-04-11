package com.example.deepseek.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "deepseek")
public class DeepseekProperties {
    /**
     * Deepseek API 密钥
     */
    private String apiKey = "sk-f4efbd893ee1477cb2fafa54c86ed858";

    /**
     * API 基础URL
     */
    private String baseUrl = "https://api.deepseek.com/v1";

    /**
     * 默认模型
     */
    private String model = "deepseek-chat";

    /**
     * 温度参数
     */
    private double temperature = 0.7;

    /**
     * 最大token数
     */
    private int maxTokens = 2000;
} 