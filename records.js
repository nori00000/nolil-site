// ============================================================
// 홈 "회원 활동 기록" — records/records.json 렌더
// 계약: { records: [{ date, title, crop?, summary?, image?, url? }] }
// 원칙: 실패·타임아웃·비JSON·스키마 불일치·0건에는 아무것도 건드리지 않는다.
//       index.html에 이미 들어 있는 빈 상태 카드가 그대로 남는다 = 빈 화면 금지.
//       서버 문자열은 textContent로만 넣는다(innerHTML 금지).
// ============================================================
(() => {
	"use strict";

	const list = document.querySelector('[data-testid="records-list"]');
	if (!list) return;

	const ENDPOINT = "records/records.json";
	const MAX_CARDS = 6;
	const TIMEOUT_MS = 3000;
	const IMAGE_PREFIX = "images/records/";

	const when = new Intl.DateTimeFormat("ko-KR", {
		timeZone: "Asia/Seoul",
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

	// 이미지는 레포 안 images/records/ 아래만 허용한다(외부 origin·경로 탈출 금지).
	const safeImage = (value) => {
		const raw = text(value);
		if (!raw || !raw.startsWith(IMAGE_PREFIX) || raw.includes("..")) return null;
		return raw;
	};

	// 계약을 벗어난 항목은 그 기록만 버린다. 전부 버려지면 빈 상태 카드가 남는다.
	const normalize = (raw) => {
		if (!raw || typeof raw !== "object") return null;
		const title = text(raw.title);
		const dateText = text(raw.date);
		const date = dateText ? new Date(dateText) : null;
		if (!title || !date || Number.isNaN(date.getTime())) return null;
		return {
			title,
			date,
			crop: text(raw.crop),
			summary: text(raw.summary),
			image: safeImage(raw.image),
			url: safeUrl(raw.url),
		};
	};

	const buildCard = (record) => {
		const card = el(record.url ? "a" : "div", "week-card");
		if (record.url) {
			card.href = record.url;
			card.target = "_blank";
			card.rel = "noopener";
		}
		if (record.image) {
			const img = el("img", "outcome-thumb");
			img.src = record.image;
			img.alt = record.title + " 회차의 활동 기록 사진";
			img.loading = "lazy";
			img.decoding = "async";
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
		if (record.url) card.appendChild(el("span", "next", "기록 보기 →"));
		return card;
	};

	const render = (data) => {
		if (!data || typeof data !== "object" || !Array.isArray(data.records)) return; // 스키마 불일치 → 빈 상태 유지
		const records = data.records
			.map(normalize)
			.filter(Boolean)
			.sort((a, b) => b.date - a.date)
			.slice(0, MAX_CARDS);
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
