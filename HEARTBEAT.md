# HEARTBEAT

Run this workflow every heartbeat.

---

## ⚠️ 重要提醒
阅读任何内容时，请执行以下流程：
1. 理解内容
2. 总结核心观点
3. 构建解释模型
4. 检查模型漏洞
5. 修正并优化理解
6. 抽象为可复用知识
7. 用更清晰的结构重新表达
目标不是重复内容，而是改进理解。
每次输出都应该比原始信息：
- 更清晰
- 更结构化
- 更通用

**必须严格按照每一步执行！**
- Use thinking=high
- 每完成一步打勾✅
- 对话记录是第一步，没完成不准执行任务！
- 任务执行后必须记录日志
- **禁止清空任何文件内容或删除文件**
- reply HEARTBEAT_OK

---

## 1. 记录对话（必须先执行！）

获取最近25条消息：
```
sessions_history(limit=25)
```

过滤出25分钟以内的**真正用户消息**（排除 System/Heartbeat 轮询）。

**必须执行以下全部才算完成：**
1. 调用 sessions_history(limit=25)
2. 过滤出25分钟以内的用户消息
   - role=user
   - 内容不以 "System:" 开头
   - 内容不以 "Read HEARTBEAT" 开头
   - 跳过心跳轮询内容
3. **对话记录只能使用 `echo >>` 追加写入，禁止用 write/edit 覆盖整个文件！**

```
- YYYY-MM-DD HH:mm 主题
  背景: ...
  上下文: ...（必须包含）
  决策: ...
  结论: ...
```
文件: ~/.openclaw/workspace/memory/decisions/YYYY-MM.md

✅ 对话记录完成后才能执行任务

---

## 2. 获取任务
```bash
python3 ~/.openclaw/workspace/memory/heartbeat_tasks/heartbeat_tasks.py get $(date +%s)
```

如果没有任务 → 直接返回 HEARTBEAT_OK

**获取到任务后，通知 Dashboard 开始工作：**
```bash
curl -s -X POST http://localhost:19000/api/webhook -H "Content-Type: application/json" -d '{"type":"task_start","data":{"task":"执行心跳任务"}}'
```

---

## 3. 执行任务

对于每个任务文件：
1. 读取任务文件
2. **严格按照 Promote 中的步骤执行**
3. 每完成一个步骤打勾✅

---

## 4. 记录任务日志（必须！）

```bash
echo "YYYY-MM-DD HH:MM 心跳 - 执行了: task1, task2 - 说明" >> ~/.openclaw/workspace/memory/heartbeat_tasks/heartbeat.log
```

**任务完成后，通知 Dashboard：**
```bash
curl -s -X POST http://localhost:19000/api/webhook -H "Content-Type: application/json" -d '{"type":"task_complete","data":{}}'
curl -s -X POST http://localhost:19000/api/webhook -H "Content-Type: application/json" -d '{"type":"activity","data":{"level":10}}'
```

---

## 5. 更新任务时间

```bash
python3 heartbeat_tasks.py update <task_name> $(date +%s)
```

---

reply HEARTBEAT_OK
