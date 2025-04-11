package com.example.deepseek.controller;

import com.example.deepseek.service.DeepseekService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final DeepseekService deepseekService;

    /**
     * 创建新的对话
     */
    @PostMapping("/conversation/new")
    public ResponseEntity<String> createConversation() {
        String conversationId = deepseekService.createConversation();
        return ResponseEntity.ok(conversationId);
    }

    /**
     * 发送单条消息
     */
    @PostMapping("/simple")
    public ResponseEntity<String> chatSimple(@RequestBody String message) {
        String response = deepseekService.chat(message);
        return ResponseEntity.ok(response);
    }

    /**
     * 发送带会话ID的消息
     */
    @PostMapping("/conversation/{conversationId}")
    public ResponseEntity<String> chatWithConversation(
            @PathVariable String conversationId,
            @RequestBody String message) {
        String response = deepseekService.chat(message, conversationId);
        return ResponseEntity.ok(response);
    }

    /**
     * 发送多轮对话
     */
    @PostMapping("/conversation")
    public ResponseEntity<String> chatConversation(@RequestBody List<Map<String, String>> messages) {
        String response = deepseekService.chat(messages);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取对话历史
     */
    @GetMapping("/conversation/{conversationId}/history")
    public ResponseEntity<List<Map<String, String>>> getConversationHistory(
            @PathVariable String conversationId) {
        List<Map<String, String>> history = deepseekService.getConversationHistory(conversationId);
        return ResponseEntity.ok(history);
    }

    /**
     * 清除对话历史
     */
    @DeleteMapping("/conversation/{conversationId}")
    public ResponseEntity<Void> clearConversation(@PathVariable String conversationId) {
        deepseekService.clearConversation(conversationId);
        return ResponseEntity.ok().build();
    }
} 