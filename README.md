# [Chrome Extension] LLM-to-Notes

### INTRO
ChatGPT 및 Gemini와 나눈 대화 내역을 한 번의 클릭으로 개인 노션(Notion) 데이터베이스에 자동 백업하는 크롬 확장 프로그램입니다. AI와의 지식 탐색 과정을 체계적으로 자산화하기 위해 개발되었습니다.

---

### MAIN

#### **주요 기능**
* **One-Click Save**: 대화창 우측 하단의 버튼을 통해 전체 대화 세션을 노션으로 즉시 전송합니다.
* **Multi-Platform Support**: ChatGPT와 Gemini 인터페이스를 모두 지원합니다.
* **Automatic Metadata**: 대화 제목(Name), 출처(Source), 대화 원본 URL을 함께 저장하여 출처 관리가 용이합니다.

#### **설정 방법 (Getting Started)**
1. **Notion API 설정**: [Notion Developers](https://www.notion.so/my-integrations)에서 새 통합을 생성하고 `Internal Integration Token`을 발급받습니다.
2. **Database 준비**: 노션에 새 데이터베이스를 만들고, `Name`(제목), `Source`(텍스트), `URL`(URL) 속성을 추가합니다.
3. **연결 추가**: 노션 데이터베이스 페이지 설정에서 생성한 API 통합을 '연결 추가'합니다.
4. **확장 프로그램 설정**: 확장 프로그램 팝업창에 토큰과 데이터베이스 ID를 입력합니다.

#### **기술 스택 및 자동화**
* **Language**: JavaScript (Vanilla JS)
* **CI/CD**: GitHub Actions를 통한 자동 빌드 파이프라인 구축 (Push 시 아티팩트 자동 생성)
* **API**: Notion API (v2022-06-28)

---

### OUTRO
현재 버전은 전체 대화 세션을 새로운 페이지로 추가하는 방식을 채택하고 있습니다. 향후 업데이트를 통해 동일 URL에 대한 중복 확인 및 덮어쓰기(PATCH) 로직을 추가하여 데이터 정합성을 높일 계획입니다.

---

### 어휘 설명
* **LLM (Large Language Model)<sup>1</sup>**: 거대 언어 모델. 인간의 언어를 이해하고 생성하도록 훈련된 인공지능 시스템입니다.
* **Artifact (아티팩트)<sup>2</sup>**: 빌드 프로세스 결과로 생성된 파일로, 본 프로젝트에서는 설치 가능한 .zip 파일을 의미합니다.
* **UUID (Universally Unique Identifier)<sup>3</sup>**: 데이터베이스 ID 등에 사용되는 32자리의 고유 식별자입니다.