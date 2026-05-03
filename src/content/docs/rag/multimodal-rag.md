---
title: Multimodal RAG
description: "Multimodal RAG (2025–2026) — retrieving images, PDFs, tables, and audio alongside text. Vision encoders, document AI, late fusion, fragment-level selection, and production patterns."
sidebar:
  order: 19
---

> **Current as of May 2026.**

## What Is Multimodal RAG?

Standard RAG retrieves text chunks. **Multimodal RAG** retrieves and reasons over text, images, tables, charts, PDFs, and audio — whatever modality is most relevant to the query.

```
STANDARD RAG                         MULTIMODAL RAG
────────────────────────             ────────────────────────────────────
Documents (text only)                Documents, PDFs, images, tables, audio
       │                                        │
       ▼                                        ▼
 Text embeddings                      Modality-specific encoders:
       │                              ┌─────────────────────────────────┐
       ▼                              │  Text  → BERT/E5 encoder        │
  Vector search                       │  Image → CLIP / SigLIP encoder  │
       │                              │  Table → TableEncoder / TAPAS   │
       ▼                              │  PDF   → Document AI layout     │
  Text chunks → LLM                   └──────────────┬──────────────────┘
                                                      │
                                               Unified index
                                                      │
                                               Mixed retrieval
                                                      │
                                      ┌───────────────▼──────────────────┐
                                      │  MULTIMODAL LLM (vision-capable) │
                                      │  Claude / GPT-4V / Gemini        │
                                      └──────────────────────────────────┘
```

---

## Why Multimodal RAG Matters

Real-world enterprise documents are rarely pure text:
- **Financial reports:** charts, tables, images
- **Technical manuals:** diagrams, schematics, step-by-step photos
- **Medical records:** X-rays, lab result tables, scanned PDFs
- **Legal contracts:** scanned handwritten notes, signatures, stamps

A text-only RAG misses ~40–60% of information in typical enterprise document sets.

---

## Architecture Patterns

### Pattern 1: Extract-Then-Embed

Parse all modalities to text first, then use standard text RAG:

```
PDF / Image
     │
     ▼ OCR / Caption model (extract text)
Text representation
     │
     ▼ Standard text embedding
Vector index
     │
     ▼ Standard RAG
```

**Pros:** Simple, no multimodal LLM required.  
**Cons:** Lossy — spatial layout, color, and visual structure are lost.

```python
from anthropic import Anthropic
import base64

client = Anthropic()

def image_to_text_caption(image_bytes: bytes) -> str:
    """Convert an image to a text description using Claude."""
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": b64}},
                {"type": "text", "text": "Describe this image in detail for search indexing. Include all text, data, and visual elements."}
            ]
        }]
    )
    return response.content[0].text
```

### Pattern 2: Native Multimodal Embedding

Use a joint vision-language encoder to embed images and text into the same vector space:

```
Text query: "quarterly revenue chart"
     │
     ▼ Text encoder (CLIP text tower)
 [0.12, -0.45, 0.78, ...]    ← text vector
     
Image: [revenue chart.png]
     │
     ▼ Image encoder (CLIP image tower)
 [0.14, -0.42, 0.76, ...]    ← image vector (similar → high cosine sim)
     
Cosine similarity(text_vec, img_vec) = 0.87  → Retrieved!
```

```python
from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image

model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")

# Embed an image
image = Image.open("revenue_chart.png")
image_inputs = processor(images=image, return_tensors="pt")
with torch.no_grad():
    image_embedding = model.get_image_features(**image_inputs)
    image_embedding = image_embedding / image_embedding.norm(dim=-1, keepdim=True)

# Embed a text query
text_inputs = processor(text=["quarterly revenue chart"], return_tensors="pt", padding=True)
with torch.no_grad():
    text_embedding = model.get_text_features(**text_inputs)
    text_embedding = text_embedding / text_embedding.norm(dim=-1, keepdim=True)

similarity = (text_embedding @ image_embedding.T).item()
print(f"Similarity: {similarity:.3f}")
```

### Pattern 3: Late Multimodal Fusion (2025)

Retrieve modality-specifically in parallel, then fuse before the LLM:

```
         User Query
              │
    ┌─────────┼──────────┐
    ▼         ▼          ▼
Text        Image      Table
Retrieval  Retrieval  Retrieval
    │         │          │
    └─────────┼──────────┘
              │ Late Fusion
              ▼
    ┌──────────────────────┐
    │   Multimodal Context │
    │   (text + images +   │
    │    tables as input)  │
    └──────────┬───────────┘
               │
               ▼
    Vision-capable LLM
    (Claude / GPT-4o)
```

```python
from anthropic import Anthropic
import base64

client = Anthropic()

def multimodal_rag_answer(query: str, text_chunks: list, image_bytes_list: list) -> str:
    """Late-fusion multimodal RAG with Claude."""
    content = []
    
    # Add text context
    if text_chunks:
        content.append({
            "type": "text",
            "text": f"Text context:\n" + "\n---\n".join(text_chunks)
        })
    
    # Add image context (inline)
    for img_bytes in image_bytes_list:
        b64 = base64.standard_b64encode(img_bytes).decode("utf-8")
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": b64}
        })
    
    # Add the query last
    content.append({"type": "text", "text": f"\nQuestion: {query}"})
    
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        messages=[{"role": "user", "content": content}]
    )
    return response.content[0].text
```

---

## Document AI for PDFs

Production PDF parsing for RAG uses layout-aware models:

| Tool | Approach | Best for |
|---|---|---|
| **Unstructured.io** | OCR + layout detection | Mixed scanned/digital PDFs |
| **PyMuPDF (fitz)** | Direct PDF parsing | Digital-native PDFs |
| **Document AI (Google)** | ML layout detection | Forms, invoices, tables |
| **Azure Document Intelligence** | Enterprise PDF/forms | Production scale |
| **LlamaParse** | LLM-powered parsing | Complex layouts, tables |

```python
# Using unstructured for PDF → chunks
from unstructured.partition.pdf import partition_pdf

elements = partition_pdf(
    filename="annual_report.pdf",
    strategy="hi_res",          # use high-resolution OCR
    infer_table_structure=True,  # extract tables as HTML
    extract_images_in_pdf=True,  # save images for CLIP embedding
)

# Elements include: Title, NarrativeText, Table, Image references
text_elements = [e for e in elements if hasattr(e, "text")]
table_elements = [e for e in elements if e.category == "Table"]
```

---

## Evaluation for Multimodal RAG

Standard RAGAS metrics extend to multimodal with additional checks:

| Metric | Multimodal Extension |
|---|---|
| Faithfulness | Is visual evidence grounded in the retrieved images? |
| Answer Relevancy | Does the answer address the visual + text query? |
| Context Precision | Were the right images and text chunks retrieved? |
| Visual Hallucination | Does the answer describe things not in the images? |

```python
# Simple visual hallucination check
def check_visual_hallucination(answer: str, image_caption: str, llm) -> float:
    """Score whether the answer claims things not visible in the image."""
    prompt = f"""
    Image description: {image_caption}
    Answer: {answer}
    
    Score (0-1): what fraction of visual claims in the answer
    are NOT supported by the image description? (0=fully grounded, 1=all hallucinated)
    Output only a number.
    """
    return float(llm.invoke(prompt).content.strip())
```

---

## Quick Decision Guide

```
What do your documents contain?
         │
         ├─► Text only? ──────────────────────────────► Standard RAG (no multimodal needed)
         │
         ├─► PDFs with text + tables? ──────────────► Unstructured.io + table-aware chunking
         │
         ├─► Images + text (mixed)? ────────────────► CLIP embedding + late fusion
         │
         ├─► Scanned PDFs (image-based)? ───────────► OCR → caption → text RAG
         │                                           OR PyMuPDF + vision LLM captioning
         │
         └─► Everything (images, tables, audio)? ───► Full multimodal pipeline
                                                       CLIP + Document AI + Whisper
```
