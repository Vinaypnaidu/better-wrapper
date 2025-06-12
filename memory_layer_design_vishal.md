## Memory Layer Design Document

This document outlines the memory layer architecture for the AI companion app, covering:

1. A summary table of all memory elements.
2. Detailed design for each element: schema, storage tiers, framework integration, workflows, update cadence.
3. Implementation plan: mapping to project directory, services, repositories, models, and external dependencies.

---

### 1. Memory Elements Summary

| Element | What (schema) | Why (use cases) | Layer & Storage | Update Trigger & Mechanism |
| ------- | ------------- | --------------- | --------------- | -------------------------- |
|         |               |                 |                 |                            |

|   |
| - |

| **1. Basic Personal Info**    | name, date\_of\_birth, gender, email, phone, timezone, locale                                                                                                | Personalization; form autofill; salutations           | Semantic: Redis Hash + DynamoDB backup                      | Onboarding or user edits → Redis write + async DynamoDB write                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **2. Advanced Personal Info** | occupation; food/sport/hobby prefs; languages; travel styles; other map                                                                                      | Tailored recommendations; rapport                     | Semantic: Redis Hash + Pinecone embeddings + DynamoDB       | Explicit edits or NL inference → Redis + embed → Pinecone + DynamoDB                         |
| **3. Goals & Milestones**     | goal\_id, title, description, category, target\_date, status, priority, parent, progress[]                                                                   | Progress tracking; reminders; weekly digests          | Hybrid: Redis Hash + ZSET + Pinecone + DynamoDB             | User adds/updates goal → Redis + ZSET + embed + DynamoDB                                     |
| **4. To-Do Items**            | todo\_id, text, due\_date, category, ticket\_size, status, priority, parent\_goal, tags, notes[]                                                             | Agenda management; deadline reminders; prioritization | Hybrid: Redis Hash + ZSET + Pinecone + DynamoDB             | User NL or UI actions → Redis + ZSET + embed + DynamoDB                                      |
| **5. Important Events**       | event\_id, calendar\_id, summary, description, start/end, location, attendees, recurrence, last\_modified                                                    | Calendar context; scheduling; conversational context  | Hybrid: Redis ZSET + Hash + DynamoDB; optional Pinecone     | Google Watch or hourly poll → upsert in Redis + DynamoDB                                     |
| **6. Current State Profile**  | education, skills[], mood, focus\_areas[], pain\_points[], recent\_wins[], recent\_losses[], last\_updated                                                   | Journaling grounding; dynamic context                 | Working: RedisJSON + DynamoDB; optional FileMemory          | Post-journal summarizer or explicit edit → RedisJSON + DynamoDB                              |
| **7. Response Feedback**      | Episodic entries: feedback\_id, interaction\_id, rating, tags, comments, timestamp; Semantic summary: positives[], negatives[], suggestions[], last\_updated | Adaptive style; quality improvement; self-reflection  | Episodic: DynamoDB + optional Pinecone; Semantic: RedisJSON | On feedback → DynamoDB + optional RedisJSON append; nightly summarization → RedisJSON update |

---

### 2. Detailed Design per Element

#### 1. Basic Personal Info

- **Schema**: `{ user_id, name, date_of_birth, gender, email, phone, timezone, locale }`
- **Storage**:
  - **Redis Hash** `user:{id}:profile` for sub-ms reads.
  - **DynamoDB** JSON document as the source-of-truth.
- **Framework**:
  - LangChain `KeyValueMemory` with custom Redis adapter.
- **Workflow**:
  - Onboarding or `PATCH /user/profile` → write-through to Redis + async to DynamoDB.
  - On each turn, `load_memory_variables` fetches the Hash and injects into the system prompt.
- **Updates**: on-demand only; no periodic jobs.

#### 2. Advanced Personal Info

- **Schema**: flexible document with `attributes` map and `schema_version`.
- **Storage**:
  - **Redis Hash** for canonical fields.
  - **Pinecone** for embeddings of preference strings.
  - **DynamoDB** for full document.
- **Framework**:
  - LangChain `RedisMemory` + `VectorStoreMemory`.
  - Embedding model: `text-embedding-ada-002`.
- **Workflow**:
  - Explicit NL edits or inferred preferences → Redis + embed → Pinecone + DynamoDB.
  - Runtime: KV fetch + `similarity_search` → prompt injection.
- **Updates**: on-demand; immediate embed upsert.

#### 3. Goals & Milestones

- **Schema**: goal documents with `progress[]` array.
- **Storage**:
  - **Redis Hash** + ZSET (`user:{id}:goals` by target\_date/priority).
  - **Pinecone** for title+description embeddings.
  - **DynamoDB** for full history.
- **Framework**:
  - LangChain `RedisMemory` + `VectorStoreMemory` + summarization chain.
- **Workflow**:
  - User adds/updates → Redis + ZSET + embed → DynamoDB.
  - On-turn: load active goals + semantic fetch → prompt.
  - Nightly summarizer condenses old progress.
- **Updates**: on-demand + periodic summary jobs.

#### 4. To-Do Items

- **Schema**: to-do docs with `tags[]` and `notes[]`.
- **Storage**:
  - **Redis Hash** + ZSET (`user:{id}:todos` by due\_date/priority).
  - **Pinecone** for semantic grouping.
  - **DynamoDB** for full docs.
- **Framework**:
  - LangChain `RedisMemory` + `VectorStoreMemory`.
- **Workflow**:
  - NL/UX creation & updates → Redis + ZSET + embed → DynamoDB.
  - On-turn: fetch pending + semantic hits → prompt.
  - Daily digest job aggregates due/overdue.
- **Updates**: on-demand + daily digest.

#### 5. Important Events

- **Schema**: Google event-like docs.
- **Storage**:
  - **Redis ZSET** + Hash (`user:{id}:events`, `event:{id}`).
  - **DynamoDB** for infinite history.
  - **Optional Pinecone** for semantic search.
- **Framework**:
  - Custom LangChain `CalendarMemory`.
- **Workflow**:
  - OAuth2 sign-in → store refresh token.
  - Google Watch & fallback hourly poll → upsert to Redis + DynamoDB.
  - On-turn: ZRANGE & HMGET → inject upcoming events.
- **Updates**: near real-time + hourly sync; eviction of past events.

#### 6. Current State Profile

- **Schema**: small JSON with mood, skills, focus, wins, losses.
- **Storage**:
  - **RedisJSON** for field-level reads/writes.
  - **DynamoDB** backup.
  - **Optional FileMemory** for MVP.
- **Framework**:
  - Custom LangChain `RedisJSONMemory`.
- **Workflow**:
  - Post-journal or nightly summarizer → JSON.SET in RedisJSON + backup.
  - On-turn: JSON.GET → prompt.
- **Updates**: immediate on edit; post-journal or scheduled summarizer.

#### 7. Response Feedback

- **Schema**:
  - **Episodic** entries in DynamoDB; **Semantic** summary JSON in RedisJSON.
- **Storage**:
  - **DynamoDB** for raw feedback.
  - **RedisJSON** for summary.
  - **Optional Pinecone** for comment embeddings.
- **Framework**:
  - LangChain `EpisodicFeedbackMemory` + `SemanticFeedbackMemory`.
- **Workflow**:
  - On user rating → write raw to DynamoDB, optional immediate summary append to RedisJSON, embed to Pinecone.
  - Nightly summarization job → refresh RedisJSON blob.
  - On-turn: inject summary under “Recent Feedback.”
- **Updates**: on-demand + nightly summarizer.

---

### 3. Implementation Plan & Directory Mapping

To integrate this memory layer into the existing project structure, use the following organization:

```
backend/app/
├── core/
│   ├── config.py           # Redis, Pinecone, DynamoDB settings & clients
│   └── memory_registry.py  # factory to instantiate LangChain memories
├── db/
│   ├── redis_client.py     # Redis and RedisJSON helpers
│   ├── dynamo_client.py    # DynamoDB helpers
│   └── pinecone_client.py  # Pinecone index initialization
├── models/
│   ├── memory_schemas.py   # Pydantic models for each element (BasicInfo, Preferences, Goal, ToDo, Event, StateProfile, Feedback)
│   └── __init__.py
├── repositories/
│   ├── basic_info.py       # CRUD w/ Redis + DynamoDB
│   ├── preferences.py      # CRUD + embed upsert
│   ├── goals.py            # CRUD + sorted set management
│   ├── todos.py            # CRUD + sorted set management
│   ├── events.py           # Google sync + upsert
│   ├── state_profile.py    # JSON.SET/GET
│   └── feedback.py         # write raw and summary updates
├── services/
│   ├── memory/             # LangChain custom memory classes
│   │   ├── basic_info_memory.py
│   │   ├── preferences_memory.py
│   │   ├── goals_memory.py
│   │   ├── todos_memory.py
│   │   ├── calendar_memory.py
│   │   ├── state_profile_memory.py
│   │   └── feedback_memory.py
│   ├── summarizers/        # Chains for nightly summarization of goals, state, feedback
│   │   ├── goal_summarizer.py
│   │   ├── state_summarizer.py
│   │   └── feedback_summarizer.py
│   └── auth/               # Google OAuth2 flow handlers
│       ├── google_oauth.py
│       └── token_manager.py
└── api/
    ├── profile.py          # endpoints for basic & advanced info
    ├── goals.py            # endpoints for goal CRUD
    ├── todos.py            # endpoints for to-do CRUD
    ├── events.py           # Google calendar sync webhook & manual additions
    ├── state.py            # journaling endpoints
    └── feedback.py         # rating & comments endpoint
```

**Dependencies**:

- `redis-py` + `redisjson` module
- `boto3` for DynamoDB
- `pinecone-client`
- `langchain`
- `google-auth` & `google-api-python-client`
- `pydantic`, `fastapi`

**Local development**:

- Use Docker Compose to spin up Redis and a DynamoDB Local instance.
- Optional Pinecone emulator or mock for tests.

---

With this plan, each memory element has clear code ownership, isolated services, and a unified registry to plug into your LLM chains. You can iteratively implement and test each memory type, then compose them in your chat “memory chain.”

Let me know if you’d like any revisions or deeper examples for any section!

