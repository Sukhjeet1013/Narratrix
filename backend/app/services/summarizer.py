from functools import lru_cache

from transformers import pipeline


@lru_cache(maxsize=1)
def _get_summarizer():
    return pipeline("summarization", model="facebook/bart-large-cnn", device=-1)


def generate_summary(text: str) -> str | None:
    if not text:
        return None

    trimmed_text = text.strip()
    if not trimmed_text:
        return None

    max_length_chars = 4000
    if len(trimmed_text) > max_length_chars:
        trimmed_text = trimmed_text[:max_length_chars]

    try:
        result = _get_summarizer()(trimmed_text, max_length=150, min_length=40, do_sample=False)
        return result[0]["summary_text"].strip()
    except Exception:
        return None
