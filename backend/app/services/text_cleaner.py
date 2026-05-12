import html
import unicodedata

from bs4 import BeautifulSoup

INVALID_PLACEHOLDER_VALUES = {"undefined", "null", "none"}
BROKEN_ENCODING_MAP = {
    "â€™": "'",
    "â€˜": "'",
    "â€œ": "'",
    "â€": "'",
    "â€“": "-",
    "â€”": "--",
    "Â": "",
    "Æ": "'",
    "æ": "'",
    "�": "'",
}


def fix_encoding_issues(value: str) -> str:
    if not value:
        return value

    cleaned = value

    for _ in range(2):
        if any(token in cleaned for token in BROKEN_ENCODING_MAP):
            for broken, fixed in BROKEN_ENCODING_MAP.items():
                cleaned = cleaned.replace(broken, fixed)

        if "Ã" in cleaned or "â" in cleaned:
            try:
                cleaned = cleaned.encode("latin-1").decode("utf-8")
            except (UnicodeEncodeError, UnicodeDecodeError):
                pass

    if "\ufffd" in cleaned:
        try:
            cleaned = cleaned.replace("\ufffd", "'")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass

    return cleaned


def clean_text(value: str | None) -> str | None:
    if not value:
        return None

    value = html.unescape(value)
    value = fix_encoding_issues(value)
    text = BeautifulSoup(value, "html.parser").get_text(" ", strip=True)
    text = unicodedata.normalize("NFKC", text)
    text = " ".join(text.split())

    if not text:
        return None

    if text.strip().lower() in INVALID_PLACEHOLDER_VALUES:
        return None

    return text
