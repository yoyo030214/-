package com.example.deepseek.script;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class DocumentAnalyzer {
    public void analyzeDocument(String filePath) {
        try (FileInputStream fis = new FileInputStream(filePath);
             XWPFDocument document = new XWPFDocument(fis)) {
            
            // 输出基本信息
            System.out.println("文档基本信息：");
            System.out.println("文件路径：" + filePath);
            System.out.println("段落数量：" + document.getParagraphs().size());
            System.out.println("\n");
            
            // 输出文本内容
            System.out.println("文档内容：");
            StringBuilder content = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                for (XWPFRun run : paragraph.getRuns()) {
                    content.append(run.getText(0));
                }
                content.append("\n");
            }
            System.out.println(content.toString());
            System.out.println("\n");
            
            // 分块处理
            List<String> chunks = splitIntoChunks(content.toString(), 1000);
            System.out.println("文档分块（每块约1000字）：");
            chunks.forEach(chunk -> {
                System.out.println("-------------------");
                System.out.println(chunk);
                System.out.println("-------------------\n");
            });
            
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private List<String> splitIntoChunks(String text, int chunkSize) {
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

    public static void main(String[] args) {
        DocumentAnalyzer analyzer = new DocumentAnalyzer();
        analyzer.analyzeDocument("C:\\Users\\Administrator\\Desktop\\工作区\\路演文稿.docx");
        analyzer.analyzeDocument("C:\\Users\\Administrator\\Desktop\\工作区\\问题.docx");
    }
} 