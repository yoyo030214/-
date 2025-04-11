package com.alibaba.cloud.ai.deepseek;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;

import static org.assertj.core.api.Assertions.assertThat;

public class DeepseekChatModelTests {

    private static final String API_KEY = "sk-f4efbd893ee1477cb2fafa54c86ed858";

    @Test
    void testChatCompletion() {
        // 创建配置
        DeepseekChatOptions options = new DeepseekChatOptions(API_KEY);
        
        // 创建聊天模型
        DeepseekChatModel chatModel = new DeepseekChatModel(options);
        
        // 创建提示
        String promptText = "你好，请介绍一下你自己";
        Prompt prompt = new Prompt(promptText);
        
        // 调用API
        ChatResponse response = chatModel.call(prompt);
        
        // 验证响应
        assertThat(response).isNotNull();
        assertThat(response.getGeneration()).isNotNull();
        assertThat(response.getGeneration().getContent()).isNotEmpty();
        
        // 打印响应内容
        System.out.println("AI回复: " + response.getGeneration().getContent());
    }
} 