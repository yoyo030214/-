#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import sys
from deepseek_client import DeepseekClient

def main():
    parser = argparse.ArgumentParser(description="Deepseek API 命令行工具")
    parser.add_argument("--host", default="http://localhost:8080", help="API服务器地址")
    
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # 简单对话命令
    chat_parser = subparsers.add_parser("chat", help="发送单条消息")
    chat_parser.add_argument("message", help="要发送的消息")
    
    # 创建会话命令
    create_parser = subparsers.add_parser("create", help="创建新会话")
    
    # 会话对话命令
    conv_chat_parser = subparsers.add_parser("conv-chat", help="在指定会话中发送消息")
    conv_chat_parser.add_argument("conversation_id", help="会话ID")
    conv_chat_parser.add_argument("message", help="要发送的消息")
    
    # 获取历史命令
    history_parser = subparsers.add_parser("history", help="获取会话历史")
    history_parser.add_argument("conversation_id", help="会话ID")
    
    # 清除会话命令
    clear_parser = subparsers.add_parser("clear", help="清除会话历史")
    clear_parser.add_argument("conversation_id", help="会话ID")
    
    # 交互模式
    interactive_parser = subparsers.add_parser("interactive", help="交互模式")
    
    args = parser.parse_args()
    client = DeepseekClient(base_url=args.host)
    
    if args.command == "chat":
        response = client.chat_simple(args.message)
        print(response)
    
    elif args.command == "create":
        conversation_id = client.create_conversation()
        print(f"会话ID: {conversation_id}")
    
    elif args.command == "conv-chat":
        response = client.chat_with_conversation(args.conversation_id, args.message)
        print(response)
    
    elif args.command == "history":
        history = client.get_conversation_history(args.conversation_id)
        for message in history:
            print(f"{message['role']}: {message['content']}")
    
    elif args.command == "clear":
        client.clear_conversation(args.conversation_id)
        print(f"会话 {args.conversation_id} 已清除")
    
    elif args.command == "interactive":
        # 创建新会话
        conversation_id = client.create_conversation()
        print(f"已创建新会话，ID: {conversation_id}")
        print("进入交互模式，输入'退出'结束会话，输入'清除'清除会话历史")
        
        while True:
            user_input = input("\n用户: ")
            
            if user_input.lower() == "退出":
                break
            elif user_input.lower() == "清除":
                client.clear_conversation(conversation_id)
                print("会话历史已清除")
                continue
            elif user_input.lower() == "历史":
                history = client.get_conversation_history(conversation_id)
                print("\n会话历史:")
                for msg in history:
                    print(f"{msg['role']}: {msg['content']}")
                continue
            
            response = client.chat_with_conversation(conversation_id, user_input)
            print(f"AI: {response}")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 