// ============================================================
// 홈 "회원 활동 기록" — records/records.json 렌더
// 계약: { records: [{ meeting_id, date, title, crop?, summary?, image?, url? }] }
// 원칙: 실패·타임아웃·비JSON·스키마 불일치·0건에는 아무것도 건드리지 않는다.
//       index.html에 이미 들어 있는 빈 상태 카드가 그대로 남는다 = 빈 화면 금지.
//       서버 문자열은 textContent로만 넣는다(innerHTML 금지).
//       meeting_id는 필수 — 원천 회차가 없는 기록은 존재할 수 없다(1원천 1카드의 구조적 게이트).
// ============================================================
(() => {
	"use strict";

	const list = document.querySelector('[data-testid="records-list"]');
	if (!list) return;

	const ENDPOINT = "records/records.json";
	const MAX_CARDS = 6;
	const TIMEOUT_MS = 3000;
	const IMAGE_PREFIX = "/images/records/";
	const MEETING_URL_BASE = "https://app.playworkgrow.club/meetings/";
	const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

	// date는 날짜만 있는 값이므로 표기도 UTC로 고정한다(방문자 시간대가 날짜를 밀지 못하게).
	const when = new Intl.DateTimeFormat("ko-KR", {
		timeZone: "UTC",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const el = (tag, className, text) => {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text != null) node.textContent = text;
		return node;
	};

	const text = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);

	// 링크는 http(s)만 통과시킨다(javascript: 등 차단). 상대 경로는 현재 문서 기준으로 해석한다.
	const safeUrl = (value) => {
		const raw = text(value);
		if (!raw) return null;
		try {
			const url = new URL(raw, document.baseURI);
			if (url.protocol !== "https:" && url.protocol !== "http:") return null;
			return url.href;
		} catch {
			return null;
		}
	};

	// 이미지는 정규화된 경로가 같은 origin의 /images/records/ 아래일 때만 허용한다.
	// 문자열 접두사 검사와 달리 %2e%2e 같은 인코딩 우회도 URL 정규화 단계에서 걸러진다.
	const safeImage = (value) => {
		const raw = text(value);
		if (!raw) return null;
		try {
			const url = new URL(raw, document.baseURI);
			if (url.origin !== location.origin || !url.pathname.startsWith(IMAGE_PREFIX)) return null;
			return url.href;
		} catch {
			return null;
		}
	};

	// "YYYY-MM-DD"만 받고, 실제로 존재하는 날짜인지까지 확인한다(2026-02-30 같은 값 차단).
	const safeDate = (value) => {
		const raw = text(value);
		if (!raw || !DATE_ONLY.test(raw)) return null;
		const [year, month, day] = raw.split("-").map(Number);
		const date = new Date(Date.UTC(year, month - 1, day));
		if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
		return date;
	};

	const meetingId = (value) => (Number.isInteger(value) && value > 0 ? value : null);

	// 계약을 벗어난 항목은 그 기록만 버린다. 전부 버려지면 빈 상태 카드가 남는다.
	const normalize = (raw) => {
		if (!raw || typeof raw !== "object") return null;
		const title = text(raw.title);
		const date = safeDate(raw.date);
		const id = meetingId(raw.meeting_id);
		if (!title || !date || !id) return null; // 원천 회차(meeting_id) 없는 기록은 싣지 않는다
		return {
			id,
			title,
			date,
			crop: text(raw.crop),
			summary: text(raw.summary),
			image: safeImage(raw.image),
			url: safeUrl(raw.url) || MEETING_URL_BASE + id,
		};
	};

	const buildCard = (record) => {
		const card = el("a", "week-card");
		card.href = record.url;
		card.target = "_blank";
		card.rel = "noopener";
		if (record.image) {
			const img = el("img", "outcome-thumb");
			img.src = record.image;
			img.alt = record.title + " 회차의 활동 기록 사진";
			img.loading = "lazy";
			img.decoding = "async";
			// 깨진 사진은 빈 자리로 남기지 않고 카드에서 뺀다.
			img.addEventListener("error", () => img.remove());
			card.appendChild(img);
		}
		const badges = el("div", "card-badges");
		const date = el("small", null, when.format(record.date));
		date.setAttribute("data-testid", "record-date");
		badges.appendChild(date);
		if (record.crop) {
			const crop = el("small", null, "작물: " + record.crop);
			crop.setAttribute("data-testid", "record-crop");
			badges.appendChild(crop);
		}
		card.appendChild(badges);
		card.appendChild(el("strong", null, record.title));
		if (record.summary) card.appendChild(el("span", null, record.summary));
		card.appendChild(el("span", "next", "기록 보기 →"));
		return card;
	};

	// 1원천 1카드: 같은 회차가 여러 번 오면 최신 date 한 건만 남긴다.
	const dedupe = (records) => {
		const seen = new Set();
		return records.filter((record) => {
			if (seen.has(record.id)) return false;
			seen.add(record.id);
			return true;
		});
	};

	const render = (data) => {
		if (!data || typeof data !== "object" || !Array.isArray(data.records)) return; // 스키마 불일치 → 빈 상태 유지
		const records = dedupe(
			data.records
				.map(normalize)
				.filter(Boolean)
				.sort((a, b) => b.date - a.date),
		).slice(0, MAX_CARDS);
		if (records.length === 0) return; // 0건·전부 스키마 불일치 → 빈 상태 유지
		const fragment = document.createDocumentFragment();
		records.forEach((record) => fragment.appendChild(buildCard(record)));
		list.textContent = "";
		list.appendChild(fragment);
	};

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	fetch(ENDPOINT, {
		signal: controller.signal,
		credentials: "omit",
		headers: { Accept: "application/json" },
	})
		.then((res) => {
			if (!res.ok) throw new Error("bad status");
			return res.json();
		})
		.then(render)
		.catch(() => {
			/* 실패·타임아웃·비JSON → 빈 상태 카드 유지 */
		})
		.finally(() => clearTimeout(timer));
})();
