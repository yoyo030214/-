#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import time
import argparse
import concurrent.futures
from deepseek_client import DeepseekClient

class DeepseekUtils:
    def __init__(self, base_url="http://localhost:8080"):
        """初始化工具类
        
        Args:
            base_url: API服务器地址
        """
        self.client = DeepseekClient(base_url=base_url)
    
    def batch_process(self, input_file, output_file, max_workers=5, with_conversation=False):
        """批量处理输入文件中的消息
        
        Args:
            input_file: 输入文件路径，每行一个消息
            output_file: 输出文件路径，保存AI回复
            max_workers: 最大并发数
            with_conversation: 是否为每个消息创建独立会话
        """
        # 读取输入文件
        with open(input_file, 'r', encoding='utf-8') as f:
            messages = [line.strip() for line in f if line.strip()]
        
        total = len(messages)
        print(f"共加载了 {total} 条消息")
        
        # 处理结果
        results = []
        
        # 创建会话ID（如果使用会话模式）
        conversation_id = None
        if with_conversation:
            conversation_id = self.client.create_conversation()
            print(f"已创建会话，ID: {conversation_id}")
        
        # 定义处理单个消息的函数
        def process_message(message):
            try:
                if with_conversation:
                    response = self.client.chat_with_conversation(conversation_id, message)
                else:
                    response = self.client.chat_simple(message)
                return {"message": message, "response": response, "status": "success"}
            except Exception as e:
                return {"message": message, "error": str(e), "status": "error"}
        
        # 使用线程池并发处理消息
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_msg = {executor.submit(process_message, msg): msg for msg in messages}
            
            completed = 0
            for future in concurrent.futures.as_completed(future_to_msg):
                completed += 1
                result = future.result()
                results.append(result)
                
                # 打印进度
                print(f"进度: {completed}/{total} ({completed/total*100:.1f}%)", end="\r")
        
        end_time = time.time()
        print(f"\n处理完成，耗时 {end_time - start_time:.2f} 秒")
        
        # 统计成功和失败次数
        success_count = sum(1 for r in results if r["status"] == "success")
        error_count = sum(1 for r in results if r["status"] == "error")
        print(f"成功: {success_count}, 失败: {error_count}")
        
        # 保存结果到输出文件
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"结果已保存到 {output_file}")
    
    def save_conversation(self, conversation_id, output_file, format_type="json"):
        """保存会话历史到文件
        
        Args:
            conversation_id: 会话ID
            output_file: 输出文件路径
            format_type: 输出格式，支持 'json', 'markdown', 'text'
        """
        # 获取会话历史
        history = self.client.get_conversation_history(conversation_id)
        
        if not history:
            print(f"会话 {conversation_id} 没有历史记录")
            return
        
        # 根据格式类型保存文件
        if format_type == "json":
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, ensure_ascii=False, indent=2)
        
        elif format_type == "markdown":
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"# 会话记录 - {conversation_id}\n\n")
                for msg in history:
                    role = "用户" if msg["role"] == "user" else "AI"
                    f.write(f"## {role}\n\n{msg['content']}\n\n")
        
        elif format_type == "text":
            with open(output_file, 'w', encoding='utf-8') as f:
                for msg in history:
                    role = "用户:" if msg["role"] == "user" else "AI:"
                    f.write(f"{role} {msg['content']}\n\n")
        
        else:
            raise ValueError(f"不支持的输出格式: {format_type}")
        
        print(f"会话历史已保存到 {output_file}")
    
    def generate_completions(self, prompts_file, output_dir, format_type="json"):
        """根据提示文件生成AI完成内容并保存到目录
        
        Args:
            prompts_file: 包含提示的文件，每行一个提示
            output_dir: 输出目录
            format_type: 输出格式
        """
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 读取提示文件
        with open(prompts_file, 'r', encoding='utf-8') as f:
            prompts = [line.strip() for line in f if line.strip()]
        
        for i, prompt in enumerate(prompts):
            try:
                print(f"处理提示 {i+1}/{len(prompts)}: {prompt[:50]}...")
                
                # 创建新会话
                conversation_id = self.client.create_conversation()
                
                # 发送提示获取回复
                response = self.client.chat_with_conversation(conversation_id, prompt)
                
                # 保存结果
                filename = f"completion_{i+1}.{format_type.lower()}"
                output_file = os.path.join(output_dir, filename)
                
                if format_type == "json":
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump({
                            "prompt": prompt,
                            "completion": response
                        }, f, ensure_ascii=False, indent=2)
                
                elif format_type in ["text", "txt"]:
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(f"提示:\n{prompt}\n\n回复:\n{response}")
                
                elif format_type == "markdown":
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(f"# 提示与回复\n\n## 提示\n\n{prompt}\n\n## 回复\n\n{response}")
                
                print(f"  已保存到 {output_file}")
                
            except Exception as e:
                print(f"  处理失败: {str(e)}")
    
    def convert_file_to_markdown(self, input_file, output_file, system_prompt=None):
        """将文本文件转换为Markdown格式并应用AI分析
        
        Args:
            input_file: 输入文件路径
            output_file: 输出文件路径
            system_prompt: 系统提示，指导AI如何处理内容
        """
        # 读取输入文件
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 创建新会话
        conversation_id = self.client.create_conversation()
        
        # 构建提示
        if not system_prompt:
            system_prompt = "请将以下内容转换为格式化的Markdown文档，添加适当的标题、列表、代码块等。保持原始信息完整，同时提高可读性。"
        
        prompt = f"{system_prompt}\n\n```\n{content}\n```"
        
        # 发送请求
        print("正在处理内容并转换为Markdown...")
        response = self.client.chat_with_conversation(conversation_id, prompt)
        
        # 保存结果
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(response)
        
        print(f"已将内容转换为Markdown并保存到 {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Deepseek API 实用工具")
    parser.add_argument("--host", default="http://localhost:8080", help="API服务器地址")
    
    subparsers = parser.add_subparsers(dest="command", help="命令")
    
    # 批量处理命令
    batch_parser = subparsers.add_parser("batch", help="批量处理消息")
    batch_parser.add_argument("input", help="输入文件路径")
    batch_parser.add_argument("output", help="输出文件路径")
    batch_parser.add_argument("--workers", type=int, default=5, help="最大并发数")
    batch_parser.add_argument("--with-conversation", action="store_true", help="使用会话模式")
    
    # 保存会话命令
    save_parser = subparsers.add_parser("save", help="保存会话历史")
    save_parser.add_argument("conversation_id", help="会话ID")
    save_parser.add_argument("output", help="输出文件路径")
    save_parser.add_argument("--format", choices=["json", "markdown", "text"], default="json", help="输出格式")
    
    # 生成完成内容命令
    generate_parser = subparsers.add_parser("generate", help="生成AI完成内容")
    generate_parser.add_argument("prompts", help="提示文件路径")
    generate_parser.add_argument("output_dir", help="输出目录")
    generate_parser.add_argument("--format", choices=["json", "text", "markdown"], default="json", help="输出格式")
    
    # 转换文本到Markdown
    convert_parser = subparsers.add_parser("convert", help="将文本文件转换为Markdown并应用AI分析")
    convert_parser.add_argument("input", help="输入文件路径")
    convert_parser.add_argument("output", help="输出文件路径")
    convert_parser.add_argument("--prompt", help="自定义系统提示")
    
    args = parser.parse_args()
    utils = DeepseekUtils(base_url=args.host)
    
    if args.command == "batch":
        utils.batch_process(args.input, args.output, args.workers, args.with_conversation)
    
    elif args.command == "save":
        utils.save_conversation(args.conversation_id, args.output, args.format)
    
    elif args.command == "generate":
        utils.generate_completions(args.prompts, args.output_dir, args.format)
    
    elif args.command == "convert":
        utils.convert_file_to_markdown(args.input, args.output, args.prompt)
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 