import { useState } from "react";
import "./App.css";

const WAVE_NAME = "[기습웨이브]";
const API_URL = "https://wave-crwaler-api.onrender.com/crawl?url=";

export default function App() {
  const [link, setLink] = useState("");
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

      // 첫 주자면 웨이브 번호 필수
      if (!link.trim() && !manualWaveNumber.trim()) {
        alert("첫 주자는 웨이브 번호를 입력해야 합니다.");
        return;
      }

      // 이전 글 링크 있으면 수동 웨이브 번호 금지
      if (link.trim() && manualWaveNumber.trim()) {
        alert("이전 주자 링크가 있으면 웨이브 번호를 입력하면 안 됩니다.");
        return;
      }

      setLoading(true);

      const template = await fetch(
        `${import.meta.env.BASE_URL}template.txt`
      ).then((r) => r.text());

      // ===== 이전 글에서 가져올 값 =====
      let prevWaveNumber = "";
      let prevFlow = "";

      if (link.trim()) {
        const res = await fetch(API_URL + encodeURIComponent(link.trim()));
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
        prevFlow = (data.flowLine || "").trim();

        //흐름도 정리: '- ->' 같은 깨짐을 '->'로 복원
        prevFlow = prevFlow.replace(/\s*-\s*->\s*/g, " -> ");
        prevFlow = prevFlow.replace(/\s+/g, " ").trim();

        //마지막에 화살표가 없으면 붙여서 이어붙이기 편하게
        if (prevFlow && !prevFlow.endsWith("->")) {
          prevFlow += " ->";
        } else if (prevFlow && !prevFlow.endsWith(" ->")) {
          prevFlow = prevFlow.replace(/->$/g, " ->");
        }

        //제목 복사용 웨이브 번호 업데이트
        setCurrentWaveNumber(prevWaveNumber);
      } else {
        //첫 주자: 입력한 웨이브 번호를 제목 복사용으로도 저장
        setCurrentWaveNumber(manualWaveNumber.trim());
      }

      // ===== 웨이브 번호 텍스트 (템플릿용) =====
      const waveNumberText = link.trim()
        ? `웨이브 ${prevWaveNumber}`
        : `웨이브 ${manualWaveNumber.trim()}`;

      // ===== 흐름도 마지막에 본인 추가 =====
      let waveFlowchartText = "";

      if (!link.trim()) {
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
    const waveNum =
      (link.trim() ? currentWaveNumber : manualWaveNumber.trim()) ||
      currentWaveNumber;

    if (!waveNum) {
      alert("먼저 템플릿을 생성하거나(크롤링) 첫 주자 웨이브 번호를 입력해주세요.");
      return;
    }

    const title = `${WAVE_NAME} 웨이브 ${waveNum}`;
    await navigator.clipboard.writeText(title);
    alert("제목이 클립보드에 복사되었습니다!");
  };

  // 버튼 활성화 조건
  const canCopyTitle =
    (!!currentWaveNumber && currentWaveNumber.trim().length > 0) ||
    (!link.trim() && manualWaveNumber.trim().length > 0);

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
        placeholder="첫 주자용 웨이브 번호"
        value={manualWaveNumber}
        disabled={!!link.trim()}
        onChange={(e) => setManualWaveNumber(e.target.value)}
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