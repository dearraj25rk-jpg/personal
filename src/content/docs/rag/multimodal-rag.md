---
title: Multimodal RAG
description: Complete May 2026 guide to multimodal RAG — ColPali visual document retrieval, ColQwen2, vision-language embedding models (CLIP, SigLIP 2, Jina CLIP v2, Nomic Embed Vision), PDF-native retrieval with image patches, VLM generation (Claude, GPT-4o, Gemini), table extraction, and production deployment patterns.
sidebar:
  order: 14
---

Most enterprise knowledge lives inside PDFs. Financial reports pack revenue charts alongside prose. Slide decks deliver half their meaning in diagrams. Scientific papers annotate claims with figures. Standard text RAG silently discards all of that visual information — multimodal RAG keeps it.

This guide covers the full multimodal RAG stack: why it exists, how ColPali's late-interaction architecture works, every major vision-language embedding model, end-to-end Python implementations, VLM generation with Claude / GPT-4o / Gemini, table extraction, hybrid text+image retrieval, production sizing, and a decision guide for when to use (and when to skip) multimodal retrieval.

---

## Section 1: Why Multimodal RAG?

### The Problem with Text-Only RAG on Rich Documents

Standard RAG pipelines treat every document as a sequence of characters. The pipeline is:

```
PDF
 │
 ▼  PDF parser / OCR
Text (lossy extraction)
 │
 ▼  Chunker
Text chunks (256–512 tokens)
 │
 ▼  Text embedding model
Vectors in vector store
 │
 ▼  Query → nearest-neighbor search
Relevant text chunks
 │
 ▼  LLM reads text → answers
```

This works well when documents are digital-native text. It breaks down in practice because:

- **Tables**: OCR flattens 2-D column alignment into a 1-D stream of tokens. A revenue table becomes noise like `"2023 Q1 Q2 Q3 4.2M 5.1M 6.8M"` — the column headers and their relationship to values are destroyed.
- **Charts and graphs**: A bar chart comparing five product lines becomes `"Figure 3: Revenue by product"` at best, nothing at worst. The actual data distribution encoded visually is gone.
- **Diagrams and infographics**: Architecture diagrams, process flows, org charts — all invisible to text extractors.
- **Scanned or rotated documents**: OCR accuracy degrades sharply at angles above 5 degrees; handwriting is rarely OCR-able with high fidelity.
- **Mathematical notation**: Inline equations survive sometimes; display equations, chemical structures, circuit diagrams — rarely.

Studies of enterprise document corpora consistently find that 30–60% of the information in business documents (annual reports, investor decks, research papers) is encoded in non-textual visual elements.

### The Multimodal RAG Alternative

Multimodal RAG sidesteps OCR entirely by treating documents as images:

```
PDF
 │
 ▼  Render each page as an image (e.g. 448×448 pixels)
Page images
 │
 ▼  Vision-language model encodes each page into patch vectors
Patch vectors in vector store (multi-vector per page)
 │
 ▼  Query → VLM encodes query text → MaxSim search
Relevant page images
 │
 ▼  VLM reads the image → understands charts, tables, diagrams
Answer grounded in visual content
```

Comparing the two pipelines side by side:

```
TEXT RAG                              MULTIMODAL RAG
─────────────────────────────────     ─────────────────────────────────
PDF                                   PDF
 │                                     │
 │ OCR / pdfminer                      │ PyMuPDF fitz.Page.get_pixmap()
 ▼                                     ▼
Raw text (lossy)                      Page image (lossless)
 │                                     │
 │ chunk(text, size=512)               │ VLM encode → patch vectors
 ▼                                     ▼
Text chunks                           1024–2048 patch vectors / page
 │                                     │
 │ text_embed(chunk)                   │ MaxSim late-interaction scoring
 ▼                                     ▼
Single vector / chunk                 Ranked page list
 │                                     │
 │ LLM reads text                      │ VLM reads page image directly
 ▼                                     ▼
Answer (misses charts/tables)         Answer (sees charts, tables, diagrams)
```

The tradeoff is cost: rendering pages and running a VLM backbone at indexing time is 10-50× slower than text embedding. For document corpora where visual elements matter, the quality gain is worth it.

---

## Section 2: ColPali Architecture

### The Foundational Paper

**ColPali: Efficient Document Retrieval with Vision Language Models**
Faysse et al., 2024 — [arxiv.org/abs/2407.01449](https://arxiv.org/abs/2407.01449)

The central insight of ColPali: stop fighting with OCR. Instead of extracting text from document pages and embedding that text, take a picture of each page and embed the picture using a Vision-Language Model.

The key innovation is applying **ColBERT's late-interaction scoring** (originally designed for text token matching) to image patches. This lets retrieval remain interpretable and spatially aware: a query about "Q3 revenue" will literally match patches in the quadrant of the page containing the relevant chart.

### Architecture Walkthrough

**Backbone: PaliGemma 3B**

PaliGemma is Google's 3-billion-parameter vision-language model. It consists of:
- A SigLIP vision encoder that converts images into patch embeddings
- A Gemma language model that processes both visual and text tokens

ColPali adds a lightweight linear projection head on top of PaliGemma to map patch embeddings into a 128-dimensional retrieval space — the same dimensionality used by ColBERT.

**Document encoding:**

```
PDF page
    │
    ▼  Render at 448×448 pixels
Page image (448 × 448 × 3 RGB)
    │
    ▼  SigLIP patch tokenizer (32×32 pixel patches)
1024 image patches
    │
    ▼  PaliGemma vision encoder
1024 patch embeddings (hidden_dim = 2048)
    │
    ▼  Linear projection head
1024 patch vectors (128 dims each, L2 normalized)
```

**Query encoding:**

```
Query text: "What was the revenue growth in Q3?"
    │
    ▼  PaliGemma tokenizer
Token sequence
    │
    ▼  PaliGemma language model (text tower)
Token embeddings
    │
    ▼  Linear projection head
Query token vectors (128 dims each, L2 normalized)
```

**MaxSim Scoring:**

The score between a query `q` (set of query token vectors) and a document page `d` (set of patch vectors) is:

```
Score(q, d) = Σ_i  max_j ( q_i · d_j )
```

For each query token `i`, find the patch `j` that is most similar to it, then sum those maximum similarities across all query tokens.

This means:
- The word "revenue" in the query will find the patch containing "Revenue" or a chart axis label
- The word "growth" will find the patch containing an upward trend arrow
- The word "Q3" will find the patch containing the Q3 column header

The spatial locality is preserved because patches carry information about their position in the image — a "Q3 revenue" query naturally focuses on the relevant quadrant of an annual report page.

**Patch grid visualization:**

```
Document page (16×16 patch grid shown, actual is 32×32)
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │ ← header patches
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │Q3│  │  │chart area: bars at 4.2, 5.1, 6.8   │ ← chart patches
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │  │  │text body: "Our Q3 results exceeded..." │ ← text patches
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘

MaxSim: query token "Q3" → max similarity over all patches → hits chart patches
MaxSim: query token "revenue" → max similarity → hits chart label + text patches
MaxSim: query token "growth" → max similarity → hits trend line patch
Score = sum of all per-token max similarities
```

### ColPali v2 — ColQwen2 (2025)

In 2025, the ColPali team released **ColQwen2**, upgrading the VLM backbone from PaliGemma 3B to **Qwen2-VL 2B**.

Key improvements:
- **Resolution**: 2048 patches per page (vs 1024) — captures finer detail in dense tables and small-font text
- **Backbone quality**: Qwen2-VL has a stronger vision encoder, especially on documents with mixed languages
- **Benchmarks**: +25% on DocVQA, +18% on InfoVQA vs ColPali v1
- **HuggingFace**: `vidore/colqwen2-v1.0`
- **Memory**: ~8GB VRAM at inference (vs ~6GB for ColPali v1)
- **License**: Apache 2.0

ColQwen2 is the recommended default for new projects as of May 2026.

---

## Section 3: Vision-Language Embedding Models

### Model Comparison Table

| Model | Backbone | Patches/page | Dims | License | Best for |
|---|---|---|---|---|---|
| ColPali v1.3 (PaliGemma) | PaliGemma 3B | 1024 | 128 | Apache 2.0 | Document retrieval, proven |
| ColQwen2 v1.0 | Qwen2-VL 2B | 2048 | 128 | Apache 2.0 | High-res documents, best quality |
| Jina CLIP v2 | EVA-02 + JinaBERT | N/A | 1024 | Apache 2.0 | Image+text pair search |
| OpenCLIP ViT-L/14 | ViT-Large | N/A | 768 | MIT | General image search |
| SigLIP 2 (Google) | ViT-So400M | N/A | 1152 | Apache 2.0 | Image classification + search |
| Nomic Embed Vision v1.5 | nomic-bert | N/A | 768 | Apache 2.0 | Compatible with Nomic text embed |

**ColPali / ColQwen2** use multi-vector (patch-level) late interaction — they return many vectors per page. All other models in the table use **single-vector** (global image embedding) — they return one vector per image.

Single-vector models are faster and simpler to index (standard ANN search), but they lose spatial specificity. Late-interaction models are slower but dramatically better for document QA where the answer is in a specific region of the page.

### Loading and Using Each Model

#### ColQwen2 (Recommended)

```python
from colpali_engine.models import ColQwen2, ColQwen2Processor
import torch
from PIL import Image

# Load model
model = ColQwen2.from_pretrained(
    "vidore/colqwen2-v1.0",
    torch_dtype=torch.bfloat16,
    device_map="cuda",
)
processor = ColQwen2Processor.from_pretrained("vidore/colqwen2-v1.0")

# Encode document pages (images)
images = [Image.open("page_001.jpg"), Image.open("page_002.jpg")]
batch_doc = processor.process_images(images).to(model.device)

with torch.no_grad():
    doc_embeddings = model(**batch_doc)  # shape: (n_pages, n_patches, 128)

# Encode query
queries = ["What was the revenue growth in Q3?"]
batch_query = processor.process_queries(queries).to(model.device)

with torch.no_grad():
    query_embeddings = model(**batch_query)  # shape: (n_queries, n_tokens, 128)

# MaxSim scoring (CPU for small sets)
scores = processor.score_multi_vector(query_embeddings, doc_embeddings)
# scores shape: (n_queries, n_pages)
best_page = scores[0].argmax().item()
print(f"Most relevant page: {best_page}")
```

#### Jina CLIP v2

```python
import torch
from transformers import AutoModel
from PIL import Image

model = AutoModel.from_pretrained(
    "jinaai/jina-clip-v2",
    trust_remote_code=True,
    torch_dtype=torch.float16,
).cuda()

# Encode images
images = [Image.open("chart.png")]
image_embeddings = model.encode_image(images, normalize=True)
# shape: (n_images, 1024)

# Encode text
texts = ["revenue growth Q3"]
text_embeddings = model.encode_text(texts, normalize=True)
# shape: (n_texts, 1024)

# Dot product similarity
similarity = (text_embeddings @ image_embeddings.T)
print(f"Similarity: {similarity[0, 0]:.4f}")
```

#### OpenCLIP ViT-L/14

```python
import open_clip
import torch
from PIL import Image

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-L-14",
    pretrained="openai",
)
tokenizer = open_clip.get_tokenizer("ViT-L-14")
model = model.cuda().eval()

# Encode image
image = preprocess(Image.open("chart.png")).unsqueeze(0).cuda()
with torch.no_grad():
    image_features = model.encode_image(image)
    image_features /= image_features.norm(dim=-1, keepdim=True)
# shape: (1, 768)

# Encode text
text = tokenizer(["revenue growth Q3"]).cuda()
with torch.no_grad():
    text_features = model.encode_text(text)
    text_features /= text_features.norm(dim=-1, keepdim=True)
# shape: (1, 768)

similarity = (text_features @ image_features.T).item()
print(f"Similarity: {similarity:.4f}")
```

#### SigLIP 2

```python
from transformers import AutoProcessor, AutoModel
import torch
from PIL import Image

processor = AutoProcessor.from_pretrained("google/siglip-so400m-patch14-384")
model = AutoModel.from_pretrained(
    "google/siglip-so400m-patch14-384",
    torch_dtype=torch.float16,
).cuda()

image = Image.open("chart.png")
inputs = processor(
    text=["revenue growth Q3"],
    images=[image],
    return_tensors="pt",
    padding=True,
).to("cuda")

with torch.no_grad():
    outputs = model(**inputs)
    # SigLIP 2 outputs logits directly
    logits = outputs.logits_per_image
    # For embeddings:
    image_embeds = outputs.image_embeds  # (1, 1152)
    text_embeds = outputs.text_embeds    # (1, 1152)

similarity = torch.nn.functional.cosine_similarity(
    text_embeds, image_embeds
).item()
print(f"Similarity: {similarity:.4f}")
```

#### Nomic Embed Vision v1.5

```python
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
from PIL import Image
import torchvision.transforms as transforms

# Nomic Embed Vision shares embedding space with nomic-embed-text
# so text and image embeddings are directly comparable
model = AutoModel.from_pretrained(
    "nomic-ai/nomic-embed-vision-v1.5",
    trust_remote_code=True,
).cuda()

processor = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

image = processor(Image.open("chart.png")).unsqueeze(0).cuda()
with torch.no_grad():
    image_embeds = model.encode_image(image)
    image_embeds = F.normalize(image_embeds, dim=-1)
# shape: (1, 768)

# Compatible with nomic-embed-text embeddings — cross-modal search works directly
```

---

## Section 4: End-to-End ColPali Pipeline

### Option A: High-Level with byaldi

`byaldi` is the simplest ColPali wrapper — a few lines to index and query:

```python
# pip install byaldi anthropic
from byaldi import RAGMultiModalModel
from anthropic import Anthropic
import base64

# ── 1. Index a directory of PDFs ────────────────────────────────────────────
rag = RAGMultiModalModel.from_pretrained("vidore/colqwen2-v1.0")
rag.index(
    input_path="./documents",       # directory with PDFs
    index_name="my_index",
    store_collection_with_index=True,  # stores page JPEG images alongside vectors
    overwrite=True,
)

# ── 2. Search ────────────────────────────────────────────────────────────────
results = rag.search("What was the revenue growth in Q3?", k=3)
# Each result has: result.doc_id, result.page_num, result.score, result.base64

# ── 3. Generate answer with Claude ──────────────────────────────────────────
client = Anthropic()

def generate_answer(query: str, page_images_b64: list[str]) -> str:
    """Pass retrieved page images to Claude for answer generation."""
    content = []
    for img_b64 in page_images_b64:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": img_b64,
            },
        })
    content.append({"type": "text", "text": query})

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        system=(
            "You are a document analyst. The user has retrieved pages from a "
            "document corpus that are relevant to their question. Answer the "
            "question using only the information visible in the provided page "
            "images. Cite which page (image position) your answer comes from."
        ),
        messages=[{"role": "user", "content": content}],
    )
    return response.content[0].text

answer = generate_answer(
    query="What was the revenue growth in Q3?",
    page_images_b64=[r.base64 for r in results],
)
print(answer)
```

### Option B: Low-Level with PyMuPDF + ColQwen2 + Qdrant

For production use you want full control over rendering, storage, and search. Here is a complete pipeline:

```python
# pip install pymupdf colpali-engine qdrant-client anthropic torch pillow

import fitz  # PyMuPDF
import torch
import io
import base64
from pathlib import Path
from PIL import Image
from colpali_engine.models import ColQwen2, ColQwen2Processor
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    NamedVector,
    SearchRequest,
)
from anthropic import Anthropic

# ── Configuration ─────────────────────────────────────────────────────────
COLLECTION_NAME = "document_pages"
PATCH_DIM = 128
N_PATCHES = 2048  # ColQwen2
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ── Load ColQwen2 ─────────────────────────────────────────────────────────
print("Loading ColQwen2...")
model = ColQwen2.from_pretrained(
    "vidore/colqwen2-v1.0",
    torch_dtype=torch.bfloat16,
    device_map=DEVICE,
)
processor = ColQwen2Processor.from_pretrained("vidore/colqwen2-v1.0")
model.eval()

# ── Qdrant setup ─────────────────────────────────────────────────────────
qdrant = QdrantClient(":memory:")  # or QdrantClient("localhost", port=6333)

# Qdrant multi-vector collection: one named vector per patch
# For ColQwen2 we store all patch vectors under a single multivector field
qdrant.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config={
        "patches": VectorParams(
            size=PATCH_DIM,
            distance=Distance.COSINE,
            multivector_config={"comparator": "max_sim"},  # ColBERT MaxSim
        )
    },
)


def render_pdf_pages(pdf_path: str, dpi: int = 150) -> list[Image.Image]:
    """Render all pages of a PDF as PIL Images."""
    doc = fitz.open(pdf_path)
    pages = []
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    for page in doc:
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        pages.append(img)
    doc.close()
    return pages


def encode_pages(images: list[Image.Image], batch_size: int = 4) -> torch.Tensor:
    """Encode page images to patch vectors using ColQwen2."""
    all_embeddings = []
    for i in range(0, len(images), batch_size):
        batch = images[i : i + batch_size]
        inputs = processor.process_images(batch).to(DEVICE)
        with torch.no_grad():
            embeddings = model(**inputs)  # (batch, n_patches, 128)
        all_embeddings.append(embeddings.cpu().float())
    return torch.cat(all_embeddings, dim=0)


def image_to_base64(image: Image.Image, quality: int = 85) -> str:
    """Convert PIL Image to base64 JPEG string."""
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality)
    return base64.b64encode(buffer.getvalue()).decode()


def index_pdfs(pdf_dir: str) -> dict[int, dict]:
    """Index all PDFs in a directory. Returns page_id -> metadata map."""
    pdf_paths = list(Path(pdf_dir).glob("*.pdf"))
    page_metadata: dict[int, dict] = {}
    point_id = 0

    for pdf_path in pdf_paths:
        print(f"Processing {pdf_path.name}...")
        pages = render_pdf_pages(str(pdf_path))
        embeddings = encode_pages(pages)

        points = []
        for page_idx, (page_img, page_emb) in enumerate(zip(pages, embeddings)):
            # page_emb shape: (n_patches, 128)
            patch_list = page_emb.tolist()  # list of n_patches vectors

            point = PointStruct(
                id=point_id,
                vector={"patches": patch_list},
                payload={
                    "pdf_name": pdf_path.name,
                    "page_num": page_idx,
                    "image_b64": image_to_base64(page_img),
                },
            )
            points.append(point)
            page_metadata[point_id] = {
                "pdf": pdf_path.name,
                "page": page_idx,
            }
            point_id += 1

        qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
        print(f"  Indexed {len(pages)} pages from {pdf_path.name}")

    return page_metadata


def encode_query(query_text: str) -> list[list[float]]:
    """Encode a text query to a list of token vectors."""
    inputs = processor.process_queries([query_text]).to(DEVICE)
    with torch.no_grad():
        embeddings = model(**inputs)  # (1, n_tokens, 128)
    return embeddings[0].cpu().float().tolist()


def search(query: str, k: int = 3) -> list[dict]:
    """Search for the top-k most relevant pages."""
    query_vectors = encode_query(query)

    results = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vectors,
        using="patches",
        limit=k,
        with_payload=True,
    )

    return [
        {
            "score": r.score,
            "pdf": r.payload["pdf_name"],
            "page": r.payload["page_num"],
            "image_b64": r.payload["image_b64"],
        }
        for r in results.points
    ]


# ── Generation ────────────────────────────────────────────────────────────
anthropic_client = Anthropic()

def answer_question(query: str, k: int = 3) -> str:
    """Full RAG pipeline: retrieve pages → generate answer with Claude."""
    retrieved = search(query, k=k)

    content = []
    for i, page in enumerate(retrieved):
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": page["image_b64"],
            },
        })
        content.append({
            "type": "text",
            "text": f"[Page {i+1}: {page['pdf']}, page {page['page']+1}, score {page['score']:.3f}]",
        })

    content.append({
        "type": "text",
        "text": f"Question: {query}\n\nAnswer using the document pages shown above.",
    })

    response = anthropic_client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        messages=[{"role": "user", "content": content}],
    )
    return response.content[0].text


# ── Run ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    index_pdfs("./documents")
    answer = answer_question("What was the revenue growth in Q3?")
    print(answer)
```

---

## Section 5: VLM Generation Layer

Once you have retrieved the most relevant page images, you need a Vision-Language Model to read those images and generate a grounded answer. Here are implementations for each major VLM.

### Claude (Anthropic SDK)

```python
from anthropic import Anthropic
import base64
from pathlib import Path

client = Anthropic()

def claude_answer_from_pages(
    query: str,
    page_images_b64: list[str],
    model: str = "claude-opus-4-7",
) -> str:
    """Generate an answer from retrieved page images using Claude."""
    content = []
    for i, img_b64 in enumerate(page_images_b64):
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": img_b64,
            },
        })
        content.append({"type": "text", "text": f"Document page {i + 1}:"})

    content.append({"type": "text", "text": f"\nQuestion: {query}"})

    response = client.messages.create(
        model=model,
        max_tokens=2048,
        system=(
            "You are a precise document analyst. Answer questions using only "
            "information visible in the provided document page images. When "
            "referencing data from charts or tables, quote the values you see."
        ),
        messages=[{"role": "user", "content": content}],
    )
    return response.content[0].text
```

### GPT-4o (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI()

def gpt4o_answer_from_pages(
    query: str,
    page_images_b64: list[str],
) -> str:
    content = []
    for i, img_b64 in enumerate(page_images_b64):
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{img_b64}",
                "detail": "high",  # use high detail for document pages
            },
        })
    content.append({"type": "text", "text": f"Question: {query}"})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "Answer using only the provided document pages.",
            },
            {"role": "user", "content": content},
        ],
        max_tokens=2048,
    )
    return response.choices[0].message.content
```

### Gemini 2.0 Flash (Google SDK)

```python
import google.generativeai as genai
import base64
import io
from PIL import Image

genai.configure(api_key="YOUR_GOOGLE_API_KEY")
gemini = genai.GenerativeModel("gemini-2.0-flash")

def gemini_answer_from_pages(
    query: str,
    page_images_b64: list[str],
) -> str:
    parts = []
    for img_b64 in page_images_b64:
        img_bytes = base64.b64decode(img_b64)
        img = Image.open(io.BytesIO(img_bytes))
        parts.append(img)
    parts.append(f"Question: {query}")

    response = gemini.generate_content(parts)
    return response.text
```

### Table Extraction with Claude

When a query is specifically about tabular data, prompt Claude to extract the table as structured markdown:

```python
from anthropic import Anthropic
client = Anthropic()

def extract_table_from_page(image_b64: str) -> str:
    """Extract all tables from a document page as markdown."""
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Extract all tables visible in this document page. "
                            "Format each table as GitHub-flavored markdown with "
                            "proper column alignment. Preserve all numbers exactly. "
                            "If no table is present, respond with 'No table found.'"
                        ),
                    },
                ],
            }
        ],
    )
    return response.content[0].text


def answer_table_question(query: str, retrieved_pages: list[dict]) -> str:
    """Extract tables from pages and answer a quantitative question."""
    tables = []
    for page in retrieved_pages:
        table_md = extract_table_from_page(page["image_b64"])
        if "No table found" not in table_md:
            tables.append(
                f"### From {page['pdf']}, page {page['page'] + 1}\n{table_md}"
            )

    if not tables:
        # Fall back to visual QA
        return claude_answer_from_pages(query, [p["image_b64"] for p in retrieved_pages])

    combined = "\n\n".join(tables)
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"Here are the extracted tables:\n\n{combined}\n\nQuestion: {query}",
            }
        ],
    )
    return response.content[0].text
```

### Complete Generation Chain

```python
def full_rag_pipeline(query: str, k: int = 3) -> dict:
    """ColPali retrieval → top-k pages → Claude generation."""
    # 1. Retrieve
    retrieved = search(query, k=k)
    print(f"Retrieved {len(retrieved)} pages")
    for r in retrieved:
        print(f"  - {r['pdf']} page {r['page']+1} (score={r['score']:.3f})")

    # 2. Generate
    answer = claude_answer_from_pages(
        query=query,
        page_images_b64=[r["image_b64"] for r in retrieved],
    )

    return {
        "query": query,
        "answer": answer,
        "sources": [
            {"pdf": r["pdf"], "page": r["page"] + 1, "score": r["score"]}
            for r in retrieved
        ],
    }

result = full_rag_pipeline("What was Q3 revenue growth compared to Q2?")
print(result["answer"])
print("Sources:", result["sources"])
```

---

## Section 6: Table Extraction and TableTransformer

For workflows requiring structured table data (not just visual QA), Microsoft's **TableTransformer** provides object-detection-level table region detection and structure recognition.

### TableTransformer Pipeline

```python
# pip install transformers pillow torch torchvision

from transformers import (
    TableTransformerForObjectDetection,
    DetrImageProcessor,
)
import torch
from PIL import Image, ImageDraw
import io
import base64

# Two models: one detects table bounding boxes, one parses structure
table_detector = TableTransformerForObjectDetection.from_pretrained(
    "microsoft/table-transformer-detection"
)
structure_model = TableTransformerForObjectDetection.from_pretrained(
    "microsoft/table-transformer-structure-recognition"
)
processor = DetrImageProcessor.from_pretrained(
    "microsoft/table-transformer-detection"
)
table_detector.eval()
structure_model.eval()


def detect_tables(image: Image.Image, threshold: float = 0.8) -> list[dict]:
    """Detect table bounding boxes in a document page image."""
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = table_detector(**inputs)

    target_sizes = torch.tensor([image.size[::-1]])
    results = processor.post_process_object_detection(
        outputs, threshold=threshold, target_sizes=target_sizes
    )[0]

    tables = []
    for score, label, box in zip(
        results["scores"], results["labels"], results["boxes"]
    ):
        box = [int(v) for v in box.tolist()]
        tables.append({"score": score.item(), "box": box})
    return tables


def crop_table(image: Image.Image, box: list[int], padding: int = 10) -> Image.Image:
    """Crop a table region from a page image with optional padding."""
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - padding)
    y0 = max(0, y0 - padding)
    x1 = min(image.width, x1 + padding)
    y1 = min(image.height, y1 + padding)
    return image.crop((x0, y0, x1, y1))


def extract_tables_from_page(
    image: Image.Image,
    vlm_client,  # Anthropic client for markdown extraction
) -> list[str]:
    """Full pipeline: detect tables → crop → extract as markdown."""
    tables_detected = detect_tables(image)
    if not tables_detected:
        return []

    markdown_tables = []
    for t in tables_detected:
        # Crop the table region
        table_img = crop_table(image, t["box"])

        # Convert to base64 for VLM
        buf = io.BytesIO()
        table_img.save(buf, format="JPEG", quality=90)
        table_b64 = base64.b64encode(buf.getvalue()).decode()

        # Ask Claude to extract as markdown
        response = vlm_client.messages.create(
            model="claude-opus-4-7",
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": table_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": (
                                "This is a cropped table from a document. "
                                "Extract it as a complete GitHub-flavored markdown "
                                "table. Preserve all numbers, units, and headers exactly."
                            ),
                        },
                    ],
                }
            ],
        )
        markdown_tables.append(response.content[0].text)

    return markdown_tables


# Usage
from anthropic import Anthropic
client = Anthropic()

page_image = Image.open("annual_report_page_12.jpg")
tables = extract_tables_from_page(page_image, client)
for i, table in enumerate(tables):
    print(f"Table {i + 1}:\n{table}\n")
```

### Alternative: Direct VLM Table Extraction

For many use cases, skipping TableTransformer and passing the full page image to Claude is simpler and equally effective:

```python
# Simple and effective for most document types
def extract_all_tables_simple(image_b64: str, client: Anthropic) -> str:
    """Pass the full page to Claude — let the VLM find and extract all tables."""
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": image_b64},
                    },
                    {
                        "type": "text",
                        "text": (
                            "Find every table in this document page. "
                            "For each table: (1) give it a brief title, "
                            "(2) reproduce it as a markdown table with all values. "
                            "Separate multiple tables with '---'."
                        ),
                    },
                ],
            }
        ],
    )
    return response.content[0].text
```

Use **TableTransformer** when: you need precise bounding boxes for further processing, you're building a table database, or you want to run OCR only on detected table regions.

Use **direct VLM extraction** when: you just need the table contents as text for answering a question.

---

## Section 7: Hybrid Text + Image RAG

Not every document page is equally visual. Text-heavy pages (legal contracts, technical specifications) are better served by text retrieval. Figure-heavy pages (investor decks, research papers) are better served by image retrieval.

Optimal strategy: run both pipelines and merge with Reciprocal Rank Fusion (RRF).

### Architecture

```
User Query
    │
    ├──────────────────────────────────────────┐
    │                                          │
    ▼  Text pipeline                           ▼  Image pipeline
Extract text with PyMuPDF                 Render pages as images
    │                                          │
Chunk text (512 tokens)               ColQwen2 patch embeddings
    │                                          │
Text embedding (BGE, etc.)            Qdrant multi-vector index
    │                                          │
pgvector ANN search                    MaxSim search
    │                                          │
Top-10 text chunks                     Top-10 page images
    │                                          │
    └──────────────┬───────────────────────────┘
                   │
                   ▼ RRF Fusion
            Merged, deduplicated results
                   │
                   ▼ VLM Generation
                Claude reads image pages
                + text chunks as context
```

### Implementation

```python
# pip install pymupdf sentence-transformers qdrant-client colpali-engine
import fitz
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

# ── Text Retriever ─────────────────────────────────────────────────────────
text_model = SentenceTransformer("BAAI/bge-large-en-v1.5")
text_qdrant = QdrantClient(":memory:")
text_qdrant.create_collection(
    "text_chunks",
    vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
)

def index_text(pdf_path: str, chunk_size: int = 512, overlap: int = 64):
    """Extract and index text chunks from a PDF."""
    doc = fitz.open(pdf_path)
    points = []
    point_id = 0
    for page_num, page in enumerate(doc):
        text = page.get_text()
        if not text.strip():
            continue
        # Simple fixed-size chunking
        tokens = text.split()
        for i in range(0, len(tokens), chunk_size - overlap):
            chunk = " ".join(tokens[i : i + chunk_size])
            if len(chunk.split()) < 20:
                continue
            vec = text_model.encode(chunk, normalize_embeddings=True).tolist()
            points.append(PointStruct(
                id=point_id,
                vector=vec,
                payload={"text": chunk, "page": page_num, "pdf": pdf_path},
            ))
            point_id += 1
    text_qdrant.upsert("text_chunks", points)
    doc.close()

def text_search(query: str, k: int = 10) -> list[dict]:
    q_vec = text_model.encode(query, normalize_embeddings=True).tolist()
    results = text_qdrant.search("text_chunks", query_vector=q_vec, limit=k)
    return [
        {
            "type": "text",
            "score": r.score,
            "content": r.payload["text"],
            "page": r.payload["page"],
            "pdf": r.payload["pdf"],
            "id": f"text_{r.payload['pdf']}_{r.payload['page']}",
        }
        for r in results
    ]


# ── Image Retriever ────────────────────────────────────────────────────────
# (reuse search() from Section 4 — returns page images)

def image_search(query: str, k: int = 10) -> list[dict]:
    raw = search(query, k=k)  # from Section 4 implementation
    return [
        {
            "type": "image",
            "score": r["score"],
            "image_b64": r["image_b64"],
            "page": r["page"],
            "pdf": r["pdf"],
            "id": f"image_{r['pdf']}_{r['page']}",
        }
        for r in raw
    ]


# ── RRF Fusion ─────────────────────────────────────────────────────────────
def reciprocal_rank_fusion(
    *result_lists: list[dict],
    k: int = 60,
    top_n: int = 5,
) -> list[dict]:
    """
    Merge multiple ranked result lists using Reciprocal Rank Fusion.
    RRF score = Σ 1 / (k + rank_i) for each retriever i.
    """
    scores: dict[str, float] = {}
    item_map: dict[str, dict] = {}

    for results in result_lists:
        for rank, item in enumerate(results, start=1):
            item_id = item["id"]
            scores[item_id] = scores.get(item_id, 0.0) + 1.0 / (k + rank)
            # Prefer image item if same page found by both retrievers
            if item_id not in item_map or item["type"] == "image":
                item_map[item_id] = item

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [item_map[item_id] for item_id, _ in ranked[:top_n]]


# ── Hybrid Search + Generation ─────────────────────────────────────────────
def hybrid_rag(query: str, k: int = 10, top_n: int = 5) -> str:
    """
    Run text and image retrieval, fuse with RRF, generate with Claude.
    """
    text_results = text_search(query, k=k)
    image_results = image_search(query, k=k)

    fused = reciprocal_rank_fusion(text_results, image_results, top_n=top_n)

    # Build Claude content
    content = []
    for item in fused:
        if item["type"] == "image":
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": item["image_b64"],
                },
            })
        else:
            content.append({
                "type": "text",
                "text": f"[Text excerpt from {item['pdf']}, page {item['page']+1}]:\n{item['content']}",
            })

    content.append({"type": "text", "text": f"\nQuestion: {query}"})

    from anthropic import Anthropic
    client = Anthropic()
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2048,
        messages=[{"role": "user", "content": content}],
    )
    return response.content[0].text


answer = hybrid_rag("Explain the revenue trend shown in the Q3 charts.")
print(answer)
```

---

## Section 8: Benchmarks

ColPali and ColQwen2 are benchmarked on the **ViDoRe** (Visual Document Retrieval) benchmark suite, which covers real-world document types:

| Dataset | Type | ColPali v1.3 | ColQwen2 v1.0 | Standard RAG (text+OCR) |
|---|---|---|---|---|
| DocVQA | Chart/table question answering | 81.3% | 89.1% | 67.2% |
| InfoVQA | Infographic question answering | 68.4% | 76.2% | 41.3% |
| SlideVQA | Slide deck question answering | 61.1% | 68.9% | 38.7% |
| ArXivQA | Scientific figure QA | 55.2% | 63.8% | 44.1% |
| ChartQA | Chart reading & computation | 74.6% | 81.4% | 58.9% |
| AI2D | Diagram understanding | 63.7% | 71.5% | 37.2% |

**Key observations:**

- **InfoVQA gap is largest**: +35 points over text RAG. Infographics are almost entirely unreadable by OCR — multimodal RAG is transformative here.
- **SlideVQA gap is extreme**: +30 points. Slide decks rely on visual composition; text extraction yields only bullet fragments.
- **DocVQA**: +22 points. Even well-structured PDFs with tables see significant improvement.
- **ArXivQA**: +20 points. Scientific papers with embedded figures and equations benefit substantially.
- **ColQwen2 vs ColPali v1**: consistent +7–10 points across all datasets from the higher-resolution backbone.

**Retrieval vs generation:** The above numbers reflect end-to-end QA accuracy. Retrieval-only nDCG@5 on ViDoRe shows even larger gaps (ColPali v1: 81.3 vs BM25+OCR: 29.4 on InfoVQA).

---

## Section 9: Production Considerations

### Storage Planning

| Asset | Size per page | 1M pages | 10M pages |
|---|---|---|---|
| Page JPEG (quality=85) | ~200 KB | 200 GB | 2 TB |
| ColPali v1 patch vectors (float32) | 512 KB | 512 GB | 5 TB |
| ColQwen2 patch vectors (float32) | 1 MB | 1 TB | 10 TB |
| ColPali v1 patch vectors (int8 quantized) | 128 KB | 128 GB | 1.3 TB |
| ColQwen2 patch vectors (int8 quantized) | 256 KB | 256 GB | 2.6 TB |

**Recommendations:**
- Store page images in object storage (S3, GCS) — retrieve by page ID at query time
- Store only patch vectors in the vector DB — use payload references to image URLs
- Apply int8 quantization for patch vectors; ColBERT-style retrieval is robust to quantization noise

### GPU Requirements

| Task | Model | VRAM | Throughput |
|---|---|---|---|
| Document indexing | ColPali v1 (PaliGemma 3B) | 6 GB | ~10 pages/s on A10G |
| Document indexing | ColQwen2 (Qwen2-VL 2B) | 8 GB | ~6 pages/s on A10G |
| Query encoding only | ColPali v1 | ~1 GB | <100ms/query |
| Query encoding only | ColQwen2 | ~2 GB | <150ms/query |
| VLM generation | Claude / GPT-4o / Gemini | API (no local GPU) | depends on API |
| VLM generation (local) | LLaVA-1.6 34B | 24 GB | ~5 tok/s on A100 |

**Cost optimization:** Index documents offline with a GPU batch job. At query time, only the query encoder needs to run — this can be a small inference pod (~2 GB VRAM). VLM generation uses a managed API, so no inference GPU needed for generation.

### Optimization Techniques

#### PLAID (Approximate ColBERT Search)

The standard ColBERT MaxSim search compares every query token against every patch in every candidate page. PLAID (Performance-optimized Late Interaction Approximate Search) uses centroid-based approximation:

1. K-means cluster all patch vectors into C centroids (typically C = 65536)
2. For each query token, find the nearest centroid
3. Only evaluate full MaxSim for pages that contain patches near those centroids
4. Result: 4× faster search with <1% recall loss

Qdrant's `multivector_config` with `comparator: "max_sim"` implements this automatically. For Weaviate, use the ColBERT module.

#### Query Vector Caching

```python
import hashlib
from functools import lru_cache

@lru_cache(maxsize=10_000)
def cached_encode_query(query_text: str) -> tuple:
    """Cache query vectors — identical queries skip GPU inference."""
    vectors = encode_query(query_text)
    return tuple(tuple(v) for v in vectors)

def search_with_cache(query: str, k: int = 3) -> list[dict]:
    cached = cached_encode_query(query)
    query_vectors = [list(v) for v in cached]
    # ... rest of Qdrant search using query_vectors
```

#### Progressive Page Rendering

Rather than pre-rendering all pages at indexing time, render on demand during result fetching:

```python
def fetch_page_image(pdf_path: str, page_num: int, dpi: int = 150) -> str:
    """Render a single page on demand and return as base64."""
    doc = fitz.open(pdf_path)
    page = doc[page_num]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    doc.close()

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()
```

Store only `pdf_path` and `page_num` in the Qdrant payload (not the raw base64). Render on demand after retrieval. This saves ~80% of Qdrant payload storage.

#### Batch Indexing with Ray

For large document corpora (100k+ PDFs), parallelize with Ray:

```python
import ray

@ray.remote(num_gpus=1)
def index_pdf_worker(pdf_path: str) -> list[dict]:
    """Worker function: render + encode one PDF, return points."""
    pages = render_pdf_pages(pdf_path)
    embeddings = encode_pages(pages)
    # ... return point dicts for Qdrant upsert
    return points

# Launch parallel workers
futures = [index_pdf_worker.remote(p) for p in pdf_paths]
all_points = [pt for pts in ray.get(futures) for pt in pts]
qdrant.upsert(COLLECTION_NAME, all_points)
```

---

## Section 10: Decision Guide

### When to Use Multimodal RAG

Use multimodal RAG when:

- **≥20% of relevant information is in images, charts, or tables.** If your document corpus is financial reports, investor decks, research papers, or technical manuals with diagrams, multimodal RAG will meaningfully improve answer quality.
- **Documents are scanned PDFs.** If there is no text layer (or the text layer is corrupted), multimodal RAG is the only option. OCR on scanned docs introduces too much noise.
- **Complex table alignment matters.** Questions like "What was the gross margin in the Asia-Pacific segment in FY2024?" require understanding both the row (Asia-Pacific) and column (FY2024, gross margin) dimensions of a table — OCR-extracted text loses this.
- **Slide decks and infographic-heavy reports.** These documents communicate primarily through visual composition; text extraction yields only fragmented bullet points.
- **Scientific or technical papers with figures.** Claims in papers are often supported by figures; answering questions requires reading both the figure and the caption.

### When NOT to Use Multimodal RAG

Stick with text RAG when:

- **Documents are digital-native text.** Wikipedia articles, markdown files, news articles, legal contracts in machine-readable PDF — text embedding is faster, cheaper, and equally accurate.
- **Low latency is critical (<100ms end-to-end).** Image encoding adds 20–50ms per query (query encoder only), and VLM generation adds 1–5 seconds. Text-only RAG + a fast LLM can achieve <200ms total.
- **No GPU is available.** ColPali query encoding can run on CPU (~500ms/query on a modern CPU), but document indexing without GPU is impractically slow. If you can't allocate GPU for indexing, use text RAG.
- **Document corpus is very large (>10M pages) with tight cost constraints.** Patch vector storage and VLM generation costs are 10–50× higher than text RAG. Evaluate quality gains vs cost carefully.

### Decision Tree

```
Start: Do you have PDFs or other documents?
    │
    ▼
Are any documents scanned (no text layer)?
    ├── YES → Use Multimodal RAG (required, OCR won't help)
    └── NO
        │
        ▼
    Do documents contain charts, tables, diagrams,
    or infographics important for answering questions?
        ├── YES (≥20% visual content) → Use Multimodal RAG
        │       │
        │       ▼
        │   Are documents also text-heavy?
        │       ├── YES → Use Hybrid Text + Image RAG (Section 7)
        │       └── NO  → Use Image-only ColPali pipeline (Section 4)
        │
        └── NO (pure text documents)
                │
                ▼
            Do you need very fast retrieval (<50ms)?
                ├── YES → Use BM25 + text embedding hybrid RAG
                └── NO  → Use text embedding RAG (standard pipeline)
```

### Quick Cost Comparison

| Approach | Indexing cost (1M pages) | Query latency | Quality on visual docs |
|---|---|---|---|
| Text RAG (BM25 + embeddings) | Low (~$50 API) | 20–50ms | Poor–Fair |
| Text RAG + OCR (Tesseract) | Medium (~$200 CPU) | 30–70ms | Fair |
| ColPali v1 (GPU batch) | High (~$300 GPU-hours) | 100–300ms | Good |
| ColQwen2 (GPU batch) | High (~$500 GPU-hours) | 150–400ms | Excellent |
| Hybrid Text + Image RAG | Very High (both above) | 200–500ms | Best overall |

GPU-hours are approximate for A10G at $0.50/hour. API costs exclude VLM generation (Claude/GPT-4o), which is billed per token separately.

---

## Further Reading

- **ColPali paper**: [arxiv.org/abs/2407.01449](https://arxiv.org/abs/2407.01449) — the original architecture paper
- **byaldi library**: [github.com/AnswerDotAI/byaldi](https://github.com/AnswerDotAI/byaldi) — highest-level ColPali wrapper
- **colpali-engine**: [github.com/illuin-tech/colpali](https://github.com/illuin-tech/colpali) — lower-level ColPali implementation
- **ViDoRe benchmark**: [huggingface.co/vidore](https://huggingface.co/vidore) — models and benchmark datasets
- **Qdrant multi-vector docs**: [qdrant.tech/documentation/concepts/vectors/#multivectors](https://qdrant.tech/documentation/concepts/vectors/) — ColBERT MaxSim in Qdrant
- **TableTransformer**: [github.com/microsoft/table-transformer](https://github.com/microsoft/table-transformer) — table detection and structure recognition
- **Jina CLIP v2**: [huggingface.co/jinaai/jina-clip-v2](https://huggingface.co/jinaai/jina-clip-v2) — 1024-dim image+text embeddings
- **SigLIP 2**: [huggingface.co/google/siglip-so400m-patch14-384](https://huggingface.co/google/siglip-so400m-patch14-384) — Google's vision-language embedding model
