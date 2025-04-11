package com.example.controller;

import com.example.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @PostMapping
    public String chat(@RequestBody String message) {
        return chatService.chat(message);
    }

    @PostMapping("/clear")
    public void clearHistory() {
        chatService.clearHistory();
    }
} 