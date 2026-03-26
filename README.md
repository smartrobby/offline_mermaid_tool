# Offline Mermaid Tool

로컬 브라우저에서 동작하는 Mermaid 다이어그램 툴입니다.

## 기능
- Mermaid 코드 편집 + 실시간 렌더링
- Sample diagram 빠른 로드 (flowchart, sequence, class, state, ER)
- Flowchart 전용 Visual Builder
  - 블럭(노드) 추가
  - 드래그 이동
  - 노드 간 화살표 연결(라벨 지원)
  - 노드 더블클릭으로 이름 수정
  - 우클릭으로 노드 삭제
- SVG 다운로드
- 외부 API 없이 로컬 라이브러리(`vendor/mermaid.min.js`) 사용

## 실행
아래 중 하나로 실행하세요.

```bash
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

또는 `index.html`을 직접 열어도 동작합니다.

## 사용 팁
1. 왼쪽에서 Diagram Type과 Sample을 선택합니다.
2. Flowchart 모드에서는 우측 Builder에서 블럭을 배치하고 연결합니다.
3. `Connect: On` 상태에서 출발 노드 클릭 → 도착 노드 클릭으로 연결합니다.
4. 상단 `Render`로 렌더링을 갱신하고, `Download SVG`로 저장합니다.
