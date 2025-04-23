#!/usr/bin/env python
# -*- coding: utf-8 -*-

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading
from deepseek_client import DeepseekClient

class DeepseekGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Deepseek AI 对话助手")
        self.root.geometry("800x600")
        self.root.minsize(600, 400)
        
        # 创建客户端
        self.client = DeepseekClient()
        self.conversation_id = None
        
        # 创建主框架
        self.main_frame = ttk.Frame(root)
        self.main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 创建顶部控件框架
        self.control_frame = ttk.Frame(self.main_frame)
        self.control_frame.pack(fill=tk.X, pady=(0, 10))
        
        # 主机地址输入
        ttk.Label(self.control_frame, text="服务器地址:").pack(side=tk.LEFT, padx=(0, 5))
        self.host_var = tk.StringVar(value="http://localhost:8080")
        self.host_entry = ttk.Entry(self.control_frame, textvariable=self.host_var, width=30)
        self.host_entry.pack(side=tk.LEFT, padx=(0, 10))
        
        # 连接按钮
        self.connect_btn = ttk.Button(self.control_frame, text="连接服务器", command=self.connect_server)
        self.connect_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # 会话ID显示
        ttk.Label(self.control_frame, text="会话ID:").pack(side=tk.LEFT, padx=(0, 5))
        self.conv_id_var = tk.StringVar(value="未创建")
        ttk.Label(self.control_frame, textvariable=self.conv_id_var).pack(side=tk.LEFT, padx=(0, 10))
        
        # 清除会话按钮
        self.clear_btn = ttk.Button(self.control_frame, text="清除会话", command=self.clear_conversation)
        self.clear_btn.pack(side=tk.LEFT)
        
        # 创建聊天记录文本框
        self.chat_frame = ttk.Frame(self.main_frame)
        self.chat_frame.pack(fill=tk.BOTH, expand=True)
        
        self.chat_display = scrolledtext.ScrolledText(self.chat_frame, wrap=tk.WORD, font=("TkDefaultFont", 11))
        self.chat_display.pack(fill=tk.BOTH, expand=True)
        self.chat_display.config(state=tk.DISABLED)
        
        # 创建输入框架
        self.input_frame = ttk.Frame(self.main_frame)
        self.input_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.message_input = scrolledtext.ScrolledText(self.input_frame, wrap=tk.WORD, height=3, font=("TkDefaultFont", 11))
        self.message_input.pack(fill=tk.X, expand=True, side=tk.LEFT)
        self.message_input.bind("<Return>", self.on_enter)
        self.message_input.bind("<Shift-Return>", self.on_shift_enter)
        
        self.send_btn = ttk.Button(self.input_frame, text="发送", command=self.send_message)
        self.send_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        # 状态栏
        self.status_var = tk.StringVar(value="准备就绪")
        self.status_bar = ttk.Label(self.root, textvariable=self.status_var, relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # 初始连接服务器并创建会话
        self.connect_server()
    
    def connect_server(self):
        """连接到服务器并创建新会话"""
        try:
            self.status_var.set("正在连接服务器...")
            self.root.update_idletasks()
            
            host = self.host_var.get()
            self.client = DeepseekClient(base_url=host)
            
            # 创建新会话
            self.conversation_id = self.client.create_conversation()
            self.conv_id_var.set(self.conversation_id)
            
            self.add_system_message(f"已连接到服务器 {host}")
            self.add_system_message(f"已创建新会话，ID: {self.conversation_id}")
            self.status_var.set("已连接")
        except Exception as e:
            self.status_var.set("连接失败")
            messagebox.showerror("连接错误", f"无法连接到服务器: {str(e)}")
    
    def clear_conversation(self):
        """清除当前会话历史"""
        if not self.conversation_id:
            messagebox.showinfo("提示", "当前没有活动会话")
            return
            
        try:
            self.client.clear_conversation(self.conversation_id)
            self.add_system_message("会话历史已清除")
        except Exception as e:
            messagebox.showerror("错误", f"清除会话失败: {str(e)}")
    
    def add_system_message(self, message):
        """添加系统消息到聊天框"""
        self.chat_display.config(state=tk.NORMAL)
        self.chat_display.insert(tk.END, f"系统: {message}\n\n")
        self.chat_display.see(tk.END)
        self.chat_display.config(state=tk.DISABLED)
    
    def add_message(self, role, content):
        """添加消息到聊天框"""
        self.chat_display.config(state=tk.NORMAL)
        
        prefix = "用户: " if role == "user" else "AI: "
        self.chat_display.insert(tk.END, f"{prefix}{content}\n\n")
        
        self.chat_display.see(tk.END)
        self.chat_display.config(state=tk.DISABLED)
    
    def on_enter(self, event):
        """按Enter键发送消息"""
        if not event.state & 0x1:  # 没有按下Shift键
            self.send_message()
            return "break"  # 阻止默认的换行行为
    
    def on_shift_enter(self, event):
        """按Shift+Enter键插入换行"""
        pass  # 允许默认行为（插入换行）
    
    def send_message(self):
        """发送消息到服务器"""
        message = self.message_input.get("1.0", tk.END).strip()
        if not message:
            return
            
        # 检查会话ID
        if not self.conversation_id:
            try:
                self.conversation_id = self.client.create_conversation()
                self.conv_id_var.set(self.conversation_id)
                self.add_system_message(f"已创建新会话，ID: {self.conversation_id}")
            except Exception as e:
                messagebox.showerror("错误", f"创建会话失败: {str(e)}")
                return
                
        # 显示用户消息
        self.add_message("user", message)
        
        # 清空输入框
        self.message_input.delete("1.0", tk.END)
        
        # 禁用发送按钮，防止重复发送
        self.send_btn.config(state=tk.DISABLED)
        self.status_var.set("正在等待AI回复...")
        
        # 在新线程中发送请求，避免UI卡顿
        threading.Thread(target=self.process_message, args=(message,), daemon=True).start()
    
    def process_message(self, message):
        """在后台线程处理消息发送和接收"""
        try:
            response = self.client.chat_with_conversation(self.conversation_id, message)
            
            # 在主线程中更新UI
            self.root.after(0, lambda: self.add_message("assistant", response))
            self.root.after(0, lambda: self.status_var.set("已接收回复"))
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("错误", f"发送消息失败: {str(e)}"))
            self.root.after(0, lambda: self.status_var.set("发送失败"))
        finally:
            # 重新启用发送按钮
            self.root.after(0, lambda: self.send_btn.config(state=tk.NORMAL))

def main():
    root = tk.Tk()
    app = DeepseekGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main() 