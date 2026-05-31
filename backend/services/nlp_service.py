import re
from collections import Counter

import pandas as pd
from textblob import TextBlob

from utils.column_detector import get_text_columns

try:
    import nltk
    from nltk.corpus import stopwords

    try:
        stopwords.words("english")
    except LookupError:
        nltk.download("stopwords", quiet=True)
        nltk.download("punkt", quiet=True)
        nltk.download("punkt_tab", quiet=True)

    STOP_WORDS = set(stopwords.words("english"))
except Exception:
    STOP_WORDS = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will", "would",
        "could", "should", "may", "might", "must", "shall", "can", "this",
        "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
    }


def _tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z]{3,}", str(text).lower())
    return [w for w in words if w not in STOP_WORDS]


def analyze_text_columns(df: pd.DataFrame) -> dict:
    text_cols = get_text_columns(df)
    if not text_cols:
        text_cols = [
            col
            for col in df.columns
            if df[col].dtype == object and df[col].dropna().astype(str).str.len().mean() > 15
        ]

    if not text_cols:
        return {
            "text_columns": [],
            "sentiment": {},
            "word_frequency": {},
            "keywords": {},
        }

    sentiment: dict = {}
    word_frequency: dict = {}
    keywords: dict = {}

    for col in text_cols:
        texts = df[col].dropna().astype(str).head(500)
        if texts.empty:
            continue

        polarities = []
        pos_count = neg_count = neu_count = 0

        for text in texts:
            blob = TextBlob(text)
            p = blob.sentiment.polarity
            polarities.append(p)
            if p > 0.1:
                pos_count += 1
            elif p < -0.1:
                neg_count += 1
            else:
                neu_count += 1

        sentiment[col] = {
            "avg_polarity": round(sum(polarities) / len(polarities), 4),
            "positive": pos_count,
            "negative": neg_count,
            "neutral": neu_count,
            "total_analyzed": len(polarities),
        }

        all_words: list[str] = []
        for text in texts:
            all_words.extend(_tokenize(text))

        counter = Counter(all_words)
        top_words = counter.most_common(20)
        word_frequency[col] = [{"word": w, "count": c} for w, c in top_words]
        keywords[col] = [w for w, _ in top_words[:10]]

    return {
        "text_columns": text_cols,
        "sentiment": sentiment,
        "word_frequency": word_frequency,
        "keywords": keywords,
    }
