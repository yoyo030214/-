package com.alibaba.cloud.ai.deepseek;

import com.alibaba.cloud.ai.dashscope.chat.MessageFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.Generation;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.ModelResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.util.Assert;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DeepseekChatModel implements ChatClient {

    private final DeepseekChatOptions options;
    private final RestTemplate restTemplate;

    public DeepseekChatModel(DeepseekChatOptions options) {
        Assert.notNull(options, "DeepseekChatOptions must not be null");
        this.options = options;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        Assert.notNull(prompt, "Prompt must not be null");
        
        List<Map<String, String>> messages = prompt.getMessages().stream()
            .map(this::convertMessage)
            .collect(Collectors.toList());

        DeepseekRequest request = new DeepseekRequest(
            options.getModel(),
            messages,
            options.getTemperature(),
            options.getMaxTokens()
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(options.getApiKey());

        RequestEntity<DeepseekRequest> requestEntity = RequestEntity
            .post(URI.create(options.getBaseUrl()))
            .headers(headers)
            .body(request);

        ResponseEntity<DeepseekResponse> responseEntity = restTemplate.exchange(
            requestEntity,
            new ParameterizedTypeReference<DeepseekResponse>() {}
        );

        DeepseekResponse response = responseEntity.getBody();
        if (response == null || response.choices == null || response.choices.isEmpty()) {
            throw new RuntimeException("Empty response from Deepseek API");
        }

        String content = response.choices.get(0).message.content;
        return new ChatResponse(List.of(new Generation(content)));
    }

    private Map<String, String> convertMessage(Message message) {
        return Map.of(
            "role", message.getMessageType().toString().toLowerCase(),
            "content", message.getContent()
        );
    }

    private static class DeepseekRequest {
        private final String model;
        private final List<Map<String, String>> messages;
        private final double temperature;
        @JsonProperty("max_tokens")
        private final int maxTokens;

        public DeepseekRequest(String model, List<Map<String, String>> messages, double temperature, int maxTokens) {
            this.model = model;
            this.messages = messages;
            this.temperature = temperature;
            this.maxTokens = maxTokens;
        }

        public String getModel() {
            return model;
        }

        public List<Map<String, String>> getMessages() {
            return messages;
        }

        public double getTemperature() {
            return temperature;
        }

        public int getMaxTokens() {
            return maxTokens;
        }
    }

    private static class DeepseekResponse {
        private List<Choice> choices;

        public List<Choice> getChoices() {
            return choices;
        }

        public void setChoices(List<Choice> choices) {
            this.choices = choices;
        }
    }

    private static class Choice {
        private Message message;

        public Message getMessage() {
            return message;
        }

        public void setMessage(Message message) {
            this.message = message;
        }
    }

    private static class Message {
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
} 