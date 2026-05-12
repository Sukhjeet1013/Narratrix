from functools import lru_cache

from sentence_transformers import SentenceTransformer


@lru_cache(maxsize=1)
def _get_embedding_model():
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def generate_embedding(text: str) -> list[float] | None:
    if not text:
        return None

    trimmed_text = text.strip()
    if not trimmed_text:
        return None

    try:
        embedding = _get_embedding_model().encode(trimmed_text, show_progress_bar=False)
        if hasattr(embedding, "tolist"):
            return embedding.tolist()
        return list(embedding)
    except Exception:
        return None
