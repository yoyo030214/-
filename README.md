# Deepseek API 客户端工具

这是一套用于与Deepseek API交互的Python客户端工具，包括命令行工具和图形界面工具。

## 功能特点

- 单轮对话和多轮对话支持
- 会话管理（创建、获取历史、清除）
- 多种交互方式（命令行、交互式命令行、图形界面）
- 简单易用的API封装
- 高级功能：批量处理、保存会话历史、格式转换

## 依赖项

请确保已安装以下Python包：

```bash
pip install requests
```

如果要使用图形界面客户端，无需额外安装包，因为tkinter已包含在Python标准库中。

## 客户端库使用方法

### 1. Python API 客户端

`deepseek_client.py` 提供了一个简单的Python客户端库，可以在您的代码中导入使用：

```python
from deepseek_client import DeepseekClient

# 创建客户端实例
client = DeepseekClient(base_url="http://localhost:8080")

# 简单对话
response = client.chat_simple("你好，请介绍一下自己")
print(response)

# 创建会话
conversation_id = client.create_conversation()

# 在会话中发送消息
response = client.chat_with_conversation(conversation_id, "你好")
print(response)

# 获取会话历史
history = client.get_conversation_history(conversation_id)
for message in history:
    print(f"{message['role']}: {message['content']}")

# 清除会话
client.clear_conversation(conversation_id)
```

### 2. 命令行工具

`deepseek_cli.py` 提供了命令行界面，可以直接在终端中使用：

```bash
# 获取帮助
python deepseek_cli.py --help

# 发送单轮消息
python deepseek_cli.py chat "你好，请介绍一下自己"

# 创建新会话
python deepseek_cli.py create

# 在特定会话中发送消息
python deepseek_cli.py conv-chat 会话ID "你能帮我解决一个问题吗？"

# 查看会话历史
python deepseek_cli.py history 会话ID

# 清除会话历史
python deepseek_cli.py clear 会话ID

# 交互模式（推荐）
python deepseek_cli.py interactive
```

在交互模式中，可以使用以下特殊命令：
- `退出`: 结束会话并退出程序
- `清除`: 清除当前会话历史
- `历史`: 显示当前会话历史

### 3. 图形界面工具

`deepseek_gui.py` 提供了一个简单的图形界面客户端：

```bash
python deepseek_gui.py
```

图形界面功能：
- 设置服务器地址并连接
- 显示当前会话ID
- 清除会话历史
- 发送消息和查看回复
- 显示系统状态

### 4. 高级工具

`deepseek_utils.py` 提供了更高级的功能，适用于批量处理和数据分析：

```bash
# 获取帮助
python deepseek_utils.py --help

# 批量处理消息
python deepseek_utils.py batch 输入文件.txt 输出结果.json --workers 10

# 保存会话历史为不同格式
python deepseek_utils.py save 会话ID 会话记录.json
python deepseek_utils.py save 会话ID 会话记录.md --format markdown
python deepseek_utils.py save 会话ID 会话记录.txt --format text

# 批量生成内容
python deepseek_utils.py generate 提示列表.txt 输出目录 --format markdown

# 将文本文件转换为Markdown并应用AI分析
python deepseek_utils.py convert 原始文本.txt 格式化文档.md
```

批量处理功能详解：
- **batch**: 从文件中读取多条消息，并行处理后保存结果
- **save**: 将会话历史以JSON、Markdown或纯文本格式保存
- **generate**: 从文件读取多个提示，生成内容并保存到指定目录
- **convert**: 将普通文本文件转换为格式化的Markdown文档

## 服务器配置

默认情况下，客户端工具会连接到 `http://localhost:8080`。如果您的Deepseek API服务部署在其他地址，请使用相应参数进行设置：

- Python客户端：`client = DeepseekClient(base_url="http://your-server:port")`
- 命令行工具：`python deepseek_cli.py --host "http://your-server:port" command`
- 图形界面：在顶部输入框中设置服务器地址，然后点击"连接服务器"
- 高级工具：`python deepseek_utils.py --host "http://your-server:port" command`

## 开发说明

这些工具基于Java Spring Boot后端的Deepseek服务API。API支持以下端点：

- `/api/chat/simple`: 简单单轮对话
- `/api/chat/conversation`: 基于会话ID的多轮对话
- `/api/chat/messages`: 自定义消息列表对话
- `/api/conversation/create`: 创建新会话
- `/api/conversation/history`: 获取会话历史
- `/api/conversation/clear`: 清除会话历史

## 许可证

MIT 