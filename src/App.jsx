import { useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";

const WAVE_NAME = "[금토일웨이브]";
const API_BASE = "https://wave-crwaler-api.vercel.app";
const CRAWL_API_URL = `${API_BASE}/crawl?url=`;

export default function App() {
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [manualWaveNumber, setManualWaveNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentWaveNumber, setCurrentWaveNumber] = useState("");

  const canCopyTitle =
    (!!currentWaveNumber && currentWaveNumber.trim().length > 0) ||
    (!link.trim() && manualWaveNumber.trim().length > 0);

  const isAnon = name.trim() === "ㅇㅇ";

  const copyTextSafely = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }

      document.body.removeChild(textarea);
      return ok;
    }
  };

  const normalizeFlow = (flow) => {
    let cleaned = (flow || "").trim();

    // 이미 깨진 A - -> B 복원
    cleaned = cleaned.replace(/\s*-\s*->\s*/g, " -> ");

    // 단독 > 만 -> 로 변환 (이미 있는 -> 는 건드리지 않음)
    cleaned = cleaned.replace(/(?<!-)\s*>\s*/g, " -> ");

    cleaned = cleaned.replace(/\s*->\s*/g, " -> ");
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    if (cleaned && !cleaned.endsWith("->")) {
      cleaned += " ->";
    } else if (cleaned && !cleaned.endsWith(" ->")) {
      cleaned = cleaned.replace(/->$/g, " ->");
    }

    return cleaned;
  };

  const handleGenerate = async () => {
    try {
      if (!name.trim()) {
        alert("닉네임을 입력해주세요.");
        return;
      }

      if (name.trim() === "ㅇㅇ" && !code.trim()) {
        alert("ㅇㅇ 반고닉은 식별코드를 입력해야 합니다.");
        return;
      }

      if (!link.trim() && !manualWaveNumber.trim()) {
        alert("첫 주자는 웨이브 번호를 입력해야 합니다.");
        return;
      }

      if (link.trim() && manualWaveNumber.trim()) {
        alert("이전 주자 링크가 있으면 웨이브 번호를 입력하면 안 됩니다.");
        return;
      }

      setLoading(true);

      const template = await fetch(
        `${import.meta.env.BASE_URL}template.txt`
      ).then((r) => r.text());

      let resolvedWaveNumber = "";
      let prevFlow = "";

      // =========================
      // 이전 글 링크가 있는 경우: 크롤링만 사용
      // =========================
      if (link.trim()) {
        const res = await fetch(CRAWL_API_URL + encodeURIComponent(link.trim()));
        const data = await res.json();

        if (data.error) {
          alert("크롤링 실패: " + data.error);
          return;
        }

        if (!data.waveNumber) {
          alert("웨이브 번호를 찾지 못했습니다.");
          return;
        }

        resolvedWaveNumber = String(data.waveNumber).trim();
        prevFlow = normalizeFlow(data.flowLine || "");
        setCurrentWaveNumber(resolvedWaveNumber);
      } else {
        // =========================
        // 첫 주자
        // =========================
        resolvedWaveNumber = manualWaveNumber.trim();
        setCurrentWaveNumber(resolvedWaveNumber);
      }

      const waveNumberText = `웨이브 ${resolvedWaveNumber}`;

      let waveFlowchartText = "";

      if (!link.trim()) {
        if (name.trim() === "ㅇㅇ") {
          waveFlowchartText = `ㅇㅇ(${code.trim()}) ->`;
        } else {
          waveFlowchartText = `${name.trim()} ->`;
        }
      } else {
        const base = prevFlow ? prevFlow + " " : "";

        if (name.trim() === "ㅇㅇ") {
          waveFlowchartText = `${base}ㅇㅇ(${code.trim()}) ->`;
        } else {
          waveFlowchartText = `${base}${name.trim()} ->`;
        }

        waveFlowchartText = waveFlowchartText.replace(/\s+/g, " ").trim();
      }

      const filled = template
        .replaceAll("waveNumberPlaceholder", waveNumberText)
        .replaceAll("waveNamePlaceholder", WAVE_NAME)
        .replaceAll("waveFlowchartPlaceholder", waveFlowchartText);

      setResult(filled);

      // =========================
      // DB 저장은 부가 기능
      // 템플릿 생성 성공 후 현재 상태를 저장만 함
      // =========================
      try {
        await fetch(`${API_BASE}/state/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            waveName: WAVE_NAME,
            waveNumber: Number(resolvedWaveNumber),
            flowText: waveFlowchartText,
            lastPostUrl: link.trim() || "",
          }),
        });
      } catch (saveError) {
        console.error("상태 저장 실패:", saveError);
      }

      try {
        await navigator.clipboard.writeText(filled);
        alert("클립보드에 복사되었습니다! 꼭 이벤트 탭에 작성해주세요 :D");
      } catch (clipboardError) {
        alert(
          "자동 복사에 실패했습니다.\niOS/사파리 유저는 본문 복사 버튼을 눌러주세요."
        );
        console.error(clipboardError);
      }
    } catch (e) {
      alert("오류 발생: " + (e?.message || String(e)));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTitle = async () => {
    const waveNum =
      (link.trim() ? currentWaveNumber : manualWaveNumber.trim()) ||
      currentWaveNumber;

    if (!waveNum) {
      alert("먼저 템플릿을 생성하거나 첫 주자 웨이브 번호를 입력해주세요.");
      return;
    }

    const title = `${WAVE_NAME} 웨이브 ${waveNum}`;
    const ok = await copyTextSafely(title);

    if (ok) {
      alert("제목이 클립보드에 복사되었습니다!");
    } else {
      alert("제목 복사에 실패했습니다. 직접 선택 후 복사해주세요.");
    }
  };

  const handleCopyBody = async () => {
    if (!result.trim()) {
      alert("먼저 템플릿을 생성해주세요.");
      return;
    }

    const ok = await copyTextSafely(result);

    if (ok) {
      alert("본문이 클립보드에 복사되었습니다!");
    } else {
      alert("본문 복사에 실패했습니다. 직접 선택 후 복사해주세요.");
    }
  };

  return (
    <div className="container">
      <h1>웨이브 템플릿 생성기</h1>

      <input
        type="text"
        placeholder="이전 주자 글 링크(첫 주자일 경우 비워두기)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />

      <input
        type="text"
        placeholder="본인 닉네임(띄어쓰기 없이)"
        value={name}
        onChange={(e) => {
          const next = e.target.value;
          setName(next);

          if (next.trim() !== "ㅇㅇ") {
            setCode("");
          }
        }}
      />

      <input
        type="text"
        placeholder="본인 식별코드 (ㅇㅇ반고닉인 경우에만 입력)"
        value={code}
        disabled={!isAnon}
        onChange={(e) => setCode(e.target.value)}
      />

      <input
        type="number"
        placeholder="첫 주자용 웨이브 번호"
        value={manualWaveNumber}
        disabled={!!link.trim()}
        onChange={(e) => setManualWaveNumber(e.target.value)}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "생성 중..." : "템플릿 생성"}
      </button>

      <button onClick={handleCopyTitle} disabled={loading || !canCopyTitle}>
        제목 복사
      </button>

      <button onClick={handleCopyBody} disabled={loading || !result.trim()}>
        본문 복사
      </button>

      <Link to="/board" style={{ textDecoration: "none" }}>
        <button type="button">현황판 보기</button>
      </Link>

      <pre className="result">{result}</pre>
    </div>
  );
}