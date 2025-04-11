package com.example.deepseek.service;

import com.example.deepseek.config.DeepseekProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeepseekService {
    private final DeepseekProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    // 存储对话历史
    private final Map<String, List<Map<String, String>>> conversationHistory = new HashMap<>();

    /**
     * 发送聊天请求
     */
    public String chat(String message) {
        return chat(message, null);
    }

    /**
     * 发送带上下文的聊天请求
     */
    public String chat(String message, String conversationId) {
        try {
            List<Map<String, String>> messages = new ArrayList<>();
            
            // 如果有会话ID，添加历史消息
            if (conversationId != null) {
                messages.addAll(conversationHistory.getOrDefault(conversationId, new ArrayList<>()));
            }
            
            // 添加新消息
            messages.add(Map.of("role", "user", "content", message));
            
            // 构建请求体
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", properties.getModel());
            requestBody.put("temperature", properties.getTemperature());
            requestBody.put("max_tokens", properties.getMaxTokens());

            // 构建消息数组
            var messagesArray = requestBody.putArray("messages");
            for (Map<String, String> msg : messages) {
                var messageObj = messagesArray.addObject();
                messageObj.put("role", msg.get("role"));
                messageObj.put("content", msg.get("content"));
            }

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(properties.getApiKey());

            // 发送请求
            String url = properties.getBaseUrl() + "/chat/completions";
            HttpEntity<String> request = new HttpEntity<>(requestBody.toString(), headers);
            
            JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
            
            // 解析响应
            if (response != null && response.has("choices") && response.get("choices").size() > 0) {
                String aiResponse = response.get("choices").get(0).get("message").get("content").asText();
                
                // 保存对话历史
                if (conversationId != null) {
                    messages.add(Map.of("role", "assistant", "content", aiResponse));
                    conversationHistory.put(conversationId, messages);
                }
                
                return aiResponse;
            }
            
            throw new RuntimeException("Invalid response from Deepseek API");
        } catch (Exception e) {
            log.error("Error calling Deepseek API", e);
            throw new RuntimeException("Failed to get response from Deepseek API", e);
        }
    }

    /**
     * 发送多轮对话请求
     */
    public String chat(List<Map<String, String>> messages) {
        try {
            // 构建请求体
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", properties.getModel());
            requestBody.put("temperature", properties.getTemperature());
            requestBody.put("max_tokens", properties.getMaxTokens());

            // 构建消息数组
            var messagesArray = requestBody.putArray("messages");
            for (Map<String, String> message : messages) {
                var messageObj = messagesArray.addObject();
                messageObj.put("role", message.get("role"));
                messageObj.put("content", message.get("content"));
            }

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(properties.getApiKey());

            // 发送请求
            String url = properties.getBaseUrl() + "/chat/completions";
            HttpEntity<String> request = new HttpEntity<>(requestBody.toString(), headers);
            
            JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
            
            // 解析响应
            if (response != null && response.has("choices") && response.get("choices").size() > 0) {
                return response.get("choices").get(0).get("message").get("content").asText();
            }
            
            throw new RuntimeException("Invalid response from Deepseek API");
        } catch (Exception e) {
            log.error("Error calling Deepseek API", e);
            throw new RuntimeException("Failed to get response from Deepseek API", e);
        }
    }

    /**
     * 创建新的对话
     */
    public String createConversation() {
        String conversationId = UUID.randomUUID().toString();
        conversationHistory.put(conversationId, new ArrayList<>());
        return conversationId;
    }

    /**
     * 获取对话历史
     */
    public List<Map<String, String>> getConversationHistory(String conversationId) {
        return conversationHistory.getOrDefault(conversationId, new ArrayList<>());
    }

    /**
     * 清除对话历史
     */
    public void clearConversation(String conversationId) {
        conversationHistory.remove(conversationId);
    }
} 