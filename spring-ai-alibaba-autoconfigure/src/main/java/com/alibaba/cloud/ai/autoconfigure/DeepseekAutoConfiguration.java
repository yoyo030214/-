package com.alibaba.cloud.ai.autoconfigure;

import com.alibaba.cloud.ai.deepseek.DeepseekChatModel;
import com.alibaba.cloud.ai.deepseek.DeepseekChatOptions;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@AutoConfiguration
@ConditionalOnProperty(prefix = "spring.ai.deepseek", name = "api-key")
@EnableConfigurationProperties(DeepseekAutoConfiguration.DeepseekProperties.class)
public class DeepseekAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public DeepseekChatOptions deepseekChatOptions(DeepseekProperties properties) {
        return new DeepseekChatOptions(properties.getApiKey());
    }

    @Bean
    @ConditionalOnMissingBean
    public DeepseekChatModel deepseekChatModel(DeepseekChatOptions options) {
        return new DeepseekChatModel(options);
    }

    @ConfigurationProperties(prefix = "spring.ai.deepseek")
    public static class DeepseekProperties {
        private String apiKey;
        private String model = "deepseek-chat";
        private double temperature = 0.7;
        private int maxTokens = 2000;
        private String baseUrl = "https://api.deepseek.com/v1/chat/completions";

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
} 