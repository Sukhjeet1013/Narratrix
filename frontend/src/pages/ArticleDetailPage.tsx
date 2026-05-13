import { useEffect, useState } from "react";
import { ArrowLeft, Link2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { fetchArticle } from "../api/articles";
import type { Article } from "../types/api";

export function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let ok = true;
    setLoading(true);
    setErr(null);
    fetchArticle(Number(id))
      .then((a) => {
        if (ok) setArticle(a);
      })
      .catch((e) => {
        if (ok) setErr(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => {
        if (ok) setLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [id]);

  if (loading) {
    return <div className="glass-panel p-12 text-center text-text-muted">Loading article…</div>;
  }

  if (err || !article) {
    return (
      <div className="glass-panel p-8 text-red-300">
        {err || "Not found"}{" "}
        <Link className="text-orange-400 underline" to="/">
          Home
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-main"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <div className="glass-panel p-6">
        <p className="text-xs uppercase tracking-widest text-text-muted">{article.source}</p>
        <h1 className="mt-2 text-2xl font-semibold text-text-main">{article.title}</h1>
        {article.summary ? <p className="mt-4 text-sm leading-relaxed text-text-muted">{article.summary}</p> : null}
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"
        >
          <Link2 className="h-4 w-4" />
          Open original
        </a>
      </div>
      {article.similar_articles?.length ? (
        <section className="glass-panel p-6">
          <h2 className="text-sm font-semibold text-text-main">Semantically similar</h2>
          <ul className="mt-4 space-y-3">
            {article.similar_articles.map((s) => (
              <li key={s.article_id}>
                <Link
                  to={`/articles/${s.article_id}`}
                  className="font-medium text-text-main hover:text-orange-300"
                >
                  {s.title}
                </Link>
                <p className="text-xs text-text-muted">
                  {s.source} · score {(s.similarity_score ?? 0).toFixed(3)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
