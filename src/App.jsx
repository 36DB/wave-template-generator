import { useState } from "react";
import "./App.css";

const WAVE_NAME = "[금토일웨이브]";
const API_URL = "https://wave-crwaler-api.onrender.com/crawl?url=";
const API_URL2 = "https://wave-crwaler-api.vercel.app/crawl?url=";

// Fetch wrapper with timeout (default 2 minutes) for requests to the crawler API
async function fetchWithTimeout(resource, options = {}, timeout = 120000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Normalize flowchart text: unify arrows, collapse spaces, ensure trailing arrow
function normalizeFlow(flow) {
  if (!flow) return "";
  let f = String(flow);
  // Normalize arrow tokens and surrounding spaces
  f = f.replace(/\s*-\s*->\s*/g, " -> ");
  f = f.replace(/\s*->\s*/g, " -> ");
  // Collapse whitespace
  f = f.replace(/\s+/g, " ").trim();
  // Ensure single trailing ' ->'
  f = f.replace(/\s*->\s*$/g, " ->");
  if (f && !f.endsWith(" ->")) {
    f = f + " ->";
  }
  return f;
}

export default function App() {
  const [link, setLink] = useState("");
  const [manualRelayPath, setManualRelayPath] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [manualWaveNumber, setManualWaveNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentWaveNumber, setCurrentWaveNumber] = useState("");

  const handleGenerate = async () => {
    try {
      // ===== 기본 검증 =====
      if (!name.trim()) {
        alert("닉네임을 입력해주세요.");
        return;
      }

      // ㅇㅇ 반고닉은 식별코드 필수
      if (name.trim() === "ㅇㅇ" && !code.trim()) {
        alert("ㅇㅇ 반고닉은 식별코드를 입력해야 합니다.");
        return;
      }

      // 첫 주자면 웨이브 번호 필수 (이전 글 링크와 수동 릴레이가 모두 없을 때)
      if (!link.trim() && !manualRelayPath.trim() && !manualWaveNumber.trim()) {
        alert("첫 주자는 웨이브 번호를 입력하거나 수동 릴레이 경로를 붙여넣어야 합니다.");
        return;
      }

      // 이전 글 링크가 있으면 수동 웨이브 번호 금지 (수동 릴레이와는 공존 허용)
      if (link.trim() && manualWaveNumber.trim()) {
        alert("이전 주자 링크가 있으면 웨이브 번호를 입력하면 안 됩니다.");
        return;
      }

      setLoading(true);

      const template = await fetch(`${import.meta.env.BASE_URL}template.txt`).then((r) => r.text());

      // ===== 이전 글에서 가져올 값 =====
      let prevWaveNumber = "";
      let prevFlow = "";

      if (manualRelayPath.trim()) {
        // 수동 붙여넣기된 릴레이 경로 사용
        const manual = manualRelayPath.trim();
        prevFlow = normalizeFlow(manual);

        // 수동 웨이브 번호가 있으면 우선 사용
        if (manualWaveNumber.trim()) {
          prevWaveNumber = manualWaveNumber.trim();
        } else {
          // 붙여넣은 텍스트에서 가능한 숫자 모두 찾아 '마지막' 숫자를 최신 웨이브로 사용
          const numMatches = manual.match(/\d{1,6}/g);
          if (numMatches && numMatches.length > 0) {
            prevWaveNumber = String(numMatches[numMatches.length - 1]).trim();
          } else {
            // Fallback: '웨이브 123' 또는 'wave 123' 패턴
            const waveMatch = manual.match(/웨이브\s*(\d+)/i) || manual.match(/wave\s*(\d+)/i) || manual.match(/#?(\d{1,6})\b/);
            if (waveMatch) prevWaveNumber = String(waveMatch[1]).trim();
          }
        }

        // 제목 복사용 웨이브 번호 업데이트 (수동 웨이브 번호 우선)
        setCurrentWaveNumber(prevWaveNumber);
      } else if (link.trim()) {
        const res = await fetchWithTimeout(API_URL + encodeURIComponent(link.trim()), {}, 120000);
        const data = await res.json();

        if (data.error) {
          alert("크롤링 실패: " + data.error);
          return;
        }

        if (!data.waveNumber) {
          alert("웨이브 번호를 찾지 못했습니다.");
          return;
        }

        prevWaveNumber = String(data.waveNumber).trim();
        prevFlow = normalizeFlow(data.flowLine || "");

        //제목 복사용 웨이브 번호 업데이트
        setCurrentWaveNumber(prevWaveNumber);
      } else {
        //첫 주자: 입력한 웨이브 번호를 제목 복사용으로도 저장
        setCurrentWaveNumber(manualWaveNumber.trim());
      }

      // ===== 웨이브 번호 텍스트 (템플릿용) =====
      const waveNumberText = link.trim() || manualRelayPath.trim() ? `웨이브 ${prevWaveNumber}` : `웨이브 ${manualWaveNumber.trim()}`;

      // ===== 흐름도 마지막에 본인 추가 =====
      let waveFlowchartText = "";

      if (!(link.trim() || manualRelayPath.trim())) {
        if (name.trim() === "ㅇㅇ") {
          waveFlowchartText = `ㅇㅇ(${code.trim()}) ->`;
        } else if (code.trim()) {
          waveFlowchartText = `${name.trim()} -> ${code.trim()} ->`;
        } else {
          waveFlowchartText = `${name.trim()} ->`;
        }
      } else {
        const base = prevFlow ? prevFlow + " " : "";

        if (name.trim() === "ㅇㅇ") {
          waveFlowchartText = `${base}ㅇㅇ(${code.trim()}) ->`;
        } else if (code.trim()) {
          waveFlowchartText = `${base}${name.trim()} -> ${code.trim()} ->`;
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
      await navigator.clipboard.writeText(filled);
      alert("클립보드에 복사되었습니다! 꼭 이벤트 탭에 작성해주세요 :D");
    } catch (e) {
      alert("오류 발생: " + (e?.message || String(e)));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  //제목 복사 버튼 핸들러
  const handleCopyTitle = async () => {
    const waveNum = (currentWaveNumber && currentWaveNumber.trim()) || manualWaveNumber.trim();

    if (!waveNum) {
      alert("먼저 템플릿을 생성하거나(크롤링) 첫 주자 웨이브 번호를 입력해주세요.");
      return;
    }

    const title = `${WAVE_NAME} 웨이브 ${waveNum}`;
    await navigator.clipboard.writeText(title);
    alert("제목이 클립보드에 복사되었습니다!");
  };

  // 버튼 활성화 조건
  const canCopyTitle = !!((currentWaveNumber && currentWaveNumber.trim()) || manualWaveNumber.trim());

  //'ㅇㅇ'일 때만 식별코드 입력 활성화
  const isAnon = name.trim() === "ㅇㅇ";

  return (
    <div className="container">
      <h1>웨이브 템플릿 생성기</h1>

      <input
        type="text"
        placeholder="이전 주자 글 링크(첫 주자일 경우 비워두기)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        disabled={!!manualRelayPath.trim()}
      />

      <input
        type="text"
        placeholder="본인 닉네임(띄어쓰기 없이)"
        value={name}
        onChange={(e) => {
          const next = e.target.value;
          setName(next);

          //'ㅇㅇ'이 아니면 식별코드 입력 비활성 + 값도 비움
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
        placeholder="첫 주자용 웨이브 번호 (첫 주자일 때 입력 — 수동 릴레이와 함께 사용 가능)"
        value={manualWaveNumber}
        disabled={!!link.trim()}
        onChange={(e) => {
          const v = e.target.value;
          setManualWaveNumber(v);
          if (!link.trim()) setCurrentWaveNumber(v.trim());
        }}
      />

      <input
        type="text"
        placeholder="수동 릴레이 경로 붙여넣기 (이전 글 크롤링 대신; 필요 시 첫 주자용 번호 입력 가능)"
        value={manualRelayPath}
        onChange={(e) => {
          const v = e.target.value;
          setManualRelayPath(v);
          if (v.trim()) {
            setLink("");
          }
        }}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "생성 중..." : "템플릿 생성"}
      </button>

      {/* 제목 복사 버튼 */}
      <button onClick={handleCopyTitle} disabled={loading || !canCopyTitle}>
        제목 복사
      </button>

      <pre className="result">{result}</pre>
    </div>
  );
}
