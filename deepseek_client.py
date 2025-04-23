import requests
import json
import uuid

class DeepseekClient:
    def __init__(self, base_url="http://localhost:8080"):
        """初始化Deepseek客户端
        
        Args:
            base_url: API服务器地址，默认为本地开发服务器
        """
        self.base_url = base_url
        self.session = requests.Session()
        
    def create_conversation(self):
        """创建新的对话会话
        
        Returns:
            str: 会话ID
        """
        response = self.session.post(f"{self.base_url}/api/conversation/create")
        if response.status_code == 200:
            return response.text.strip('"')  # 去掉JSON字符串的引号
        else:
            raise Exception(f"创建会话失败: {response.text}")
    
    def chat_simple(self, message):
        """发送单条消息并获取回复
        
        Args:
            message: 用户消息
            
        Returns:
            str: AI回复内容
        """
        response = self.session.post(
            f"{self.base_url}/api/chat/simple",
            params={"message": message}
        )
        if response.status_code == 200:
            return response.text.strip('"')  # 去掉JSON字符串的引号
        else:
            raise Exception(f"聊天请求失败: {response.text}")
    
    def chat_with_conversation(self, conversation_id, message):
        """发送带有会话上下文的消息
        
        Args:
            conversation_id: 会话ID
            message: 用户消息
            
        Returns:
            str: AI回复内容
        """
        response = self.session.post(
            f"{self.base_url}/api/chat/conversation",
            params={
                "conversationId": conversation_id,
                "message": message
            }
        )
        if response.status_code == 200:
            return response.text.strip('"')  # 去掉JSON字符串的引号
        else:
            raise Exception(f"会话聊天请求失败: {response.text}")
    
    def chat_multi_turn(self, messages):
        """处理多轮对话
        
        Args:
            messages: 消息列表，每条消息是包含role和content的字典
            
        Returns:
            str: AI回复内容
        """
        response = self.session.post(
            f"{self.base_url}/api/chat/messages",
            json=messages
        )
        if response.status_code == 200:
            return response.text.strip('"')  # 去掉JSON字符串的引号
        else:
            raise Exception(f"多轮对话请求失败: {response.text}")
    
    def get_conversation_history(self, conversation_id):
        """获取会话历史
        
        Args:
            conversation_id: 会话ID
            
        Returns:
            list: 会话历史记录
        """
        response = self.session.get(
            f"{self.base_url}/api/conversation/history",
            params={"conversationId": conversation_id}
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"获取会话历史失败: {response.text}")
    
    def clear_conversation(self, conversation_id):
        """清除会话历史
        
        Args:
            conversation_id: 会话ID
        """
        response = self.session.delete(
            f"{self.base_url}/api/conversation/clear",
            params={"conversationId": conversation_id}
        )
        if response.status_code != 200:
            raise Exception(f"清除会话历史失败: {response.text}")


# 使用示例
if __name__ == "__main__":
    client = DeepseekClient()
    
    # 简单的单轮对话
    print("单轮对话示例:")
    response = client.chat_simple("你好，请介绍一下自己")
    print(f"AI: {response}\n")
    
    # 创建会话并进行多轮对话
    print("多轮对话示例:")
    conversation_id = client.create_conversation()
    print(f"创建会话，ID: {conversation_id}")
    
    # 第一轮对话
    response1 = client.chat_with_conversation(conversation_id, "你好，请介绍一下自己")
    print(f"用户: 你好，请介绍一下自己")
    print(f"AI: {response1}\n")
    
    # 第二轮对话，AI会记住上下文
    response2 = client.chat_with_conversation(conversation_id, "你能写一首诗吗？")
    print(f"用户: 你能写一首诗吗？")
    print(f"AI: {response2}\n")
    
    # 获取会话历史
    history = client.get_conversation_history(conversation_id)
    print("会话历史:")
    for message in history:
        print(f"{message['role']}: {message['content']}")
    
    # 清除会话
    client.clear_conversation(conversation_id)
    print("\n会话已清除") 