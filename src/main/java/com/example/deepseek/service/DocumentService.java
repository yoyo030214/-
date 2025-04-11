package com.example.deepseek.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class DocumentService {
    private final Tika tika = new Tika();

    /**
     * 处理文档并提取文本内容
     */
    public String extractText(MultipartFile file) throws IOException, TikaException {
        return tika.parseToString(file.getInputStream());
    }

    /**
     * 将文本分割成块
     */
    public List<String> splitIntoChunks(String text, int chunkSize) {
        List<String> chunks = new ArrayList<>();
        String[] sentences = text.split("[.。!！?？]");
        
        StringBuilder currentChunk = new StringBuilder();
        for (String sentence : sentences) {
            sentence = sentence.trim();
            if (sentence.isEmpty()) continue;
            
            if (currentChunk.length() + sentence.length() > chunkSize) {
                if (currentChunk.length() > 0) {
                    chunks.add(currentChunk.toString().trim());
                    currentChunk = new StringBuilder();
                }
            }
            
            currentChunk.append(sentence).append("。");
        }
        
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }
        
        return chunks;
    }

    /**
     * 生成文本摘要
     */
    public String generateSummary(String text, DeepseekService deepseekService) {
        if (text == null || text.trim().isEmpty()) {
            return "";
        }
        String prompt = String.format("请对以下文本生成一个简短的摘要，要求：\n" +
                "1. 保持客观准确\n" +
                "2. 突出主要内容\n" +
                "3. 控制在300字以内\n\n" +
                "文本内容：\n%s", text);
        try {
            return deepseekService.chat(prompt);
        } catch (Exception e) {
            log.error("生成文本摘要时发生错误", e);
            return "无法生成摘要";
        }
    }

    /**
     * 提取关键点
     */
    public List<String> extractKeyPoints(String text, DeepseekService deepseekService) {
        if (text == null || text.trim().isEmpty()) {
            return new ArrayList<>();
        }
        String prompt = String.format("请从以下文本中提取5-10个关键信息点，要求：\n" +
                "1. 每个关键点用单独一行表示\n" +
                "2. 每个关键点应该简洁明了\n" +
                "3. 按重要性排序\n" +
                "4. 不要带序号\n\n" +
                "文本内容：\n%s", text);
        try {
            String response = deepseekService.chat(prompt);
            return List.of(response.split("\n"));
        } catch (Exception e) {
            log.error("提取关键点时发生错误", e);
            return new ArrayList<>();
        }
    }
} 