# Changelog

## [0.2.0] - 2026-10-26

### Added

- **게시판 말머리(`category`) 필터 칩 바 (`board.json`)**: `posts.data.board.categories`를 기반으로 게시판 상단에 `전체` 및 말머리별 필터 칩을 렌더링하고 `?category=...` 쿼리 파라미터와 연동했습니다.
- **게시글 상세 하단 연속 탐색 목록 (`post.json`)**: 댓글 영역 아래에 동일 게시판의 최신 글 10개(`board_posts`)를 노출하고 현재 읽고 있는 글을 하이라이트하여 뒤로 가기 없이 연속 탐색할 수 있도록 개선했습니다.
- **게시글 삭제 및 댓글 인라인 수정·삭제 (`post.json`)**: 검증된 `DELETE /api/modules/sirsoft-board/boards/{slug}/posts/{id}` 및 `PUT` / `DELETE .../comments/{commentId}` 엔드포인트를 연결하여 작성자·관리자가 게시글과 댓글을 즉시 수정·삭제할 수 있게 했습니다.
- **글쓰기/수정 화면 내 이미지 업로더 통합 및 본문 원클릭 삽입 (`write.json`, `ImageUploader.tsx`, `HtmlContent.tsx`)**: `/photo` 페이지로 이탈하지 않고 글쓰기 화면 안에서 바로 이미지를 업로드하고 커서 위치에 `<img src="...">`를 원클릭 삽입(`targetTextareaSelector`)할 수 있도록 통합했으며, `<img>` 포함 게시글의 HTML 렌더링과 줄바꿈(`whitespace-pre-line`)을 함께 보존했습니다.
- **마이페이지 내 작성글 메타 확장 (`mypage.json`)**: 내 작성글 목록에 댓글 수 배지와 조회수를 표시하고 이미지 호스팅(`/photo`) 퀵 액션 버튼을 추가했습니다.

## [0.1.1] - 2026-10-24

### Fixed

- IIFE 번들 전역 변수명을 `CodingforEventusUser`로 변경하고 `components.json`의 `templateId`를 `codingfor-eventus_user`로 일치시켜 컴포넌트 번들 로드 오류를 수정했습니다.

## [0.1.0] - 2026-10-24

### Added

- `codingfor-eventus_user` 독립 사용자 템플릿 초기 릴리즈 (`v0.1.0`).
- `event-us.kr` 레이아웃의 핵심 장점을 이식한 2단 카테고리 헤더(`카테고리` 배지 + 가로 스크롤 칩 + `이미지 호스팅` 소프트 배지 버튼) 및 모바일 전용 풀폭 검색 바를 적용했습니다.
- 홈 갤러리 섹션에 `NEW!!` 소프트 배지와 부제 설명이 포함된 2단 섹션 헤더를 적용하고, 각 사진 카드를 `16:9` 썸네일 + `[분류 배지]` + 2줄 제목(`clamp-2`) + 좌우 분리 하단 메타(`justify-between`) 3단 구조로 개편했습니다.
- 홈 피드(최신 글 / 인기 글) 및 게시판 목록에 소프트 워시 분류 칩과 `NEW` 배지를 적용해 시인성을 높였습니다.
- 사이드바 회원 프로필 영역을 아바타 이니셜 배지와 정돈된 퀵 액션 리스트(`마이페이지`, `프로필·내 정보 관리`, `이미지 호스팅`)로 구성했습니다.
