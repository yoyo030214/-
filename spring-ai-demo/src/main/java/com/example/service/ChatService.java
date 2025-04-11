package com.example.service;

import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {
    private final ChatClient chatClient;
    private final List<Message> conversationHistory;

    public ChatService(ChatClient chatClient) {
        this.chatClient = chatClient;
        this.conversationHistory = new ArrayList<>();
    }

    public String chat(String message) {
        // 添加用户消息到历史记录
        conversationHistory.add(new UserMessage(message));

        // 创建提示
        Prompt prompt = new Prompt(conversationHistory);

        // 获取AI响应
        String response = chatClient.call(prompt).getResult().getOutput().getContent();

        // 添加AI响应到历史记录
        conversationHistory.add(new AssistantMessage(response));

        return response;
    }

    public void clearHistory() {
        conversationHistory.clear();
    }
} 