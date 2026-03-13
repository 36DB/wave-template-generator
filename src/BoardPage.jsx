import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const DEFAULT_WAVE_NAME = "[금토일웨이브]";
const API_BASE = "https://wave-crwaler-api.vercel.app";

export default function BoardPage() {
  const [waveName, setWaveName] = useState(DEFAULT_WAVE_NAME);
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleGoBoard = () => {
    navigate("/");
  };

  const fetchBoard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/state/board?waveName=${encodeURIComponent(waveName)}`
      );
      const data = await res.json();

      if (!res.ok || data.error) {
        setSummaries([]);
        setError(data.error || "현황판 조회 실패");
        return;
      }

      setSummaries(data.summaries || []);
    } catch (err) {
      setSummaries([]);
      setError(err?.message || "요청 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const canonName = (s) => String(s || "").replace(/\s+/g, "").trim();

  return (
    <div className="container">
      <h1>웨이브 현황판</h1>

      <input
        type="text"
        value={waveName}
        onChange={(e) => setWaveName(e.target.value)}
        placeholder="웨이브 이름"
      />

      <button onClick={fetchBoard} disabled={loading}>
        {loading ? "불러오는 중..." : "새로고침"}
      </button>

      <button onClick={handleGoBoard}>
        생성기로 돌아가기
      </button>

      {error ? <pre className="result">{error}</pre> : null}

      {summaries.length === 0 && !loading && !error ? (
        <pre className="result">표시할 현황이 없습니다.</pre>
      ) : null}

      {summaries.map((summary) => {
        const chain = summary.final_chain || [];
        const infoMap = summary.post_info_by_canon || {};

        return (
          <div key={summary.wave} className="result" style={{ marginBottom: "16px" }}>
            <h2 style={{ marginTop: 0 }}>Wave {summary.wave}</h2>

            {chain.length === 0 ? (
              <div>데이터 없음</div>
            ) : (
              <ol style={{ paddingLeft: "20px", margin: 0 }}>
                {chain.length >= 2 &&
                  chain.slice(0, -1).map((from, idx) => {
                    const to = chain[idx + 1];
                    const info = infoMap[canonName(from)];
                    const postUrl = info?.url || "";
                    const writerId = info?.writer_id || "";
                    const gallogUrl = writerId
                      ? `https://gallog.dcinside.com/${writerId}`
                      : "";

                    return (
                      <li key={`${summary.wave}-${idx}`} style={{ marginBottom: "12px" }}>
                        <div>
                          {from} → {to}
                          {idx === 0 ? " (시작)" : ""}
                        </div>
                        <div style={{ marginLeft: "12px" }}>
                          {postUrl ? (
                            <a
                              href={postUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ marginRight: "8px" }}
                            >
                              모집글(링크)
                            </a>
                          ) : (
                            <span style={{ marginRight: "8px", color: "#bbb" }}>
                              모집글(정보없음)
                            </span>
                          )}

                          {gallogUrl ? (
                            <a href={gallogUrl} target="_blank" rel="noreferrer">
                              갤로그(링크)
                            </a>
                          ) : (
                            <span style={{ color: "#bbb" }}>갤로그(정보없음)</span>
                          )}
                        </div>
                      </li>
                    );
                  })}

                {chain.length >= 1 && (() => {
                  const last = chain[chain.length - 1];
                  const info = infoMap[canonName(last)];
                  const postUrl = info?.url || "";
                  const writerId = info?.writer_id || "";
                  const gallogUrl = writerId
                    ? `https://gallog.dcinside.com/${writerId}`
                    : "";

                  return (
                    <li>
                      <div>{last} → END</div>
                      <div style={{ marginLeft: "12px" }}>
                        {postUrl ? (
                          <a
                            href={postUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginRight: "8px" }}
                          >
                            모집글(링크)
                          </a>
                        ) : (
                          <span style={{ marginRight: "8px", color: "#bbb" }}>
                            모집글(정보없음)
                          </span>
                        )}

                        {gallogUrl ? (
                          <a href={gallogUrl} target="_blank" rel="noreferrer">
                            갤로그(링크)
                          </a>
                        ) : (
                          <span style={{ color: "#bbb" }}>갤로그(정보없음)</span>
                        )}
                      </div>
                    </li>
                  );
                })()}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}