<!-- Travel Research Agent：支持自然语言旅行规划 + 图片识别地点 + Web Research + 实时 Agent Trace + 流式行程生成 + 地图/来源引用。 -->

通用 Research Engine → Travel Domain → 前端产品层。

# 架构

```
┌──────────────────────────────────────────────┐
│                  Product Layer               │
│              Travel Research UI              │
│  对话 / 图片上传 / 行程卡片 / 来源 / 地图     │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│                  Domain Layer                 │
│              Travel Research Agent            │
│                                               │
│  旅行需求理解 / 地点识别 / 行程规划 / 预算         │
│  酒店 / 景点 / 餐厅 / 交通 / 天气                │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│                 Research Engine              │
│              通用 AI Research Agent           │
│                                              │
│  Plan → Search → Read → Extract → Verify     │
│             → Synthesize → Cite              │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│                   Tool Layer                 │
│                                              │
│ Web Search / Fetch / Vision / Maps / Weather │
│ Calculator / Database / Vector Search        │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│                Infrastructure                │
│                                              │
│ LLM / PostgreSQL / Redis / Queue / Logging   │
│ Object Storage / Observability               │
└──────────────────────────────────────────────┘
```

## Travel Product Layer

应用层

```
Streaming Agent Event
```

## Travel Domain Layer 旅行规划引擎

目录
```
ai-research-agent/
├── apps/
│   ├── web/                         # Next.js / React 前端
│   ├── api/                         # FastAPI / Node API
│   ├── research-agent/              # Research Agent 应用入口
│   └── travel-agent/                # Travel Research Agent
│
├── libs/
│   ├── agent/
│   │   ├── core/                    # Agent 核心抽象
│   │   ├── runtime/                 # Agent Runtime / Loop
│   │   ├── state/                   # Agent 状态机
│   │   └── registry/                # Agent / Tool Registry
│   │
│   ├── research/
│   │   ├── planner/                 # Research Planner
│   │   ├── researcher/              # Research 执行器
│   │   ├── writer/                  # Report Writer
│   │   ├── critic/                  # Critic
│   │   ├── citation/                # Citation
│   │   └── memory/                  # Research Memory
│   │
│   ├── llm/
│   │   ├── client/                  # LLM Client
│   │   ├── prompts/                 # Prompt
│   │   ├── structured-output/       # Structured Output
│   │   └── embeddings/              # Embedding
│   │
│   ├── tools/
│   │   ├── web-search/              # Web Search
│   │   ├── webpage/                 # 网页抓取
│   │   ├── image-search/            # 图片搜索
│   │   ├── maps/                    # 地图
│   │   └── tool-core/               # Tool 抽象
│   │
│   ├── knowledge/
│   │   ├── vector-store/            # 向量数据库
│   │   ├── document/                # 文档处理
│   │   ├── chunking/                # Chunk
│   │   └── retrieval/               # RAG / Retrieval
│   │
│   ├── data/
│   │   ├── database/                # DB
│   │   ├── repositories/            # Repository
│   │   └── migrations/              # Migration
│   │
│   ├── schemas/
│   │   ├── research-plan/
│   │   ├── sub-question/
│   │   ├── source-item/
│   │   ├── report-section/
│   │   └── citation/
│   │
│   └── shared/
│       ├── types/
│       ├── constants/
│       ├── utils/
│       ├── logger/
│       └── config/
│
├── prompts/
│   ├── planner/
│   ├── researcher/
│   ├── writer/
│   └── critic/
│
├── docs/
│   ├── architecture/
│   ├── agent/
│   ├── prompts/
│   └── api/
│
├── tests/
│   ├── evals/                       # Agent Evaluation
│   ├── integration/
│   └── fixtures/
│
├── nx.json
├── package.json
├── tsconfig.base.json
├── pyproject.toml
└── README.md
```

## Research Engine 通用搜索引擎

```
Research Task
     ↓
Research Plan
     ↓
Research Steps
     ↓
Tool Execution
     ↓
Evidence
     ↓
Verification
     ↓
Final Answer
```

```
ResearchAgent
├── TaskAnalyzer
├── Planner(分析用户问题，制定研究计划)
├── Executor
├── SearchManager
├── EvidenceCollector
├── EvidenceVerifier
├── Synthesizer
└── CitationManager
```

## Tool Layer 通用工具层

Tool Layer 提供能力，Domain Layer 决定什么时候使用能力。

```
tools/
├── web_search
├── web_fetch
├── image_understanding
├── calculator
├── database_search
├── vector_search
└── ...
```

## 图像识别

```
          图片
            ↓
       Vision / OCR
            ↓
    Location Candidates
            ↓
    Research Engine 验证
            ↓
     Location Evidence
            ↓
         最终结果
```

# 技术栈

```
Frontend
├── Next.js
├── React
├── TypeScript
├── Tailwind
└── Zustand / useReducer

Streaming
└── SSE / ReadableStream

Backend
├── FastAPI
└── Python

Agent
├── OpenAI Responses API
├── Agent Orchestrator
├── Web Search
├── Vision
└── Tool Calling

Data
├── PostgreSQL
├── Redis
└── Vector DB（需要 RAG 时再加）

External
├── Maps / Places
├── Weather
├── Search
└── Image / Vision
```

# 目录
Python + FastAPI + React/Next.js


```
ai-research-agent/
│
├── apps/
│   │
│   ├── api/
│   │   └── main.py
│   │
│   └── web/
│       └── Next.js
│
├── packages/
│   │
│   ├── research/
│   │   ├── agent.py
│   │   ├── planner.py
│   │   ├── executor.py
│   │   ├── verifier.py
│   │   ├── synthesizer.py
│   │   └── citation.py
│   │
│   ├── tools/
│   │   ├── web_search.py
│   │   ├── web_fetch.py
│   │   ├── vision.py
│   │   ├── calculator.py
│   │   └── maps.py
│   │
│   ├── llm/
│   │   ├── client.py
│   │   └── models.py
│   │
│   └── shared/
│       ├── schemas.py
│       └── types.py
│
├── domains/
│   │
│   └── travel/
│       ├── agent.py
│       ├── planner.py
│       ├── prompts/
│       ├── schemas/
│       └── workflows/
│
├── infrastructure/
│   ├── postgres/
│   ├── redis/
│   ├── storage/
│   └── observability/
│
└── tests/
```