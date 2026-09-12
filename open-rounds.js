// ============================================================
// 홈 "지금 열린 회차" — 운영 앱 공개 모임 JSON 렌더
// 계약: GET {publicMeetingsUrl} → { generated_at, meetings: [...] }
// 원칙: 실패·타임아웃·비JSON·스키마 불일치에는 아무것도 건드리지 않는다.
//       index.html에 이미 들어 있는 폴백 카드(앱 링크)가 그대로 남는다 = 빈 화면 금지.
//       서버 문자열은 textContent로만 넣는다(innerHTML 금지).
// ============================================================
(() => {
	"use strict";

	const list = document.querySelector('[data-testid="open-rounds-list"]');
	if (!list) return;
	const filter = document.querySelector('[data-testid="round-filter"]');

	const C = window.NOLIL_CONFIG || {};
	const appUrl = C.meetingsUrl || "https://app.playworkgrow.club/meetings";
	const endpoint = C.publicMeetingsUrl;

	// 폴백 카드의 링크도 config.js가 기준이다.
	const fallbackLink = list.querySelector("a");
	if (fallbackLink) fallbackLink.href = appUrl;
	if (!endpoint) return;

	const MAX_CARDS = 6;
	const TIMEOUT_MS = 3000;
	const FILTER_MIN_CARDS = 4; // 카드가 이만큼 쌓여야 시간대 칩이 의미 있다.
	const SLOT_LABELS = { morning: "출근 전", evening: "퇴근 후", weekend: "주말", day: "낮" };
	const STATUSES = new Set(["open", "full"]);

	// 카드 링크는 운영 앱 origin만 허용한다(계약 밖 도메인은 카드에서 제외).
	const allowedOrigin = (() => {
		try {
			return new URL(appUrl).origin;
		} catch {
			return null;
		}
	})();

	const when = new Intl.DateTimeFormat("ko-KR", {
		timeZone: "Asia/Seoul",
		month: "long",
		day: "numeric",
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
	});

	const el = (tag, className, text) => {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text != null) node.textContent = text;
		return node;
	};

	const safeUrl = (value) => {
		if (typeof value !== "string" || !value || !allowedOrigin) return null;
		try {
			const url = new URL(value);
			if (url.protocol !== "https:" || url.origin !== allowedOrigin) return null;
			return url.href;
		} catch {
			return null;
		}
	};

	const count = (value) => Number.isInteger(value) && value >= 0;

	// 문자열 아닌 타입(숫자·객체 등)은 그 필드만 버린다 — 카드는 살린다.
	const text = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);

	const priceLabel = (price) => {
		if (price === 0) return "무료";
		return price.toLocaleString("ko-KR") + "원";
	};

	const seatLabel = (meeting) => (meeting.status === "full" ? "마감" : "남은 자리 " + meeting.remaining + "석");

	// 계약을 벗어난 항목은 그 카드만 버린다. 전부 버려지면 폴백이 남는다.
	const normalize = (raw) => {
		if (!raw || typeof raw !== "object") return null;
		const url = safeUrl(raw.url);
		const title = typeof raw.title === "string" ? raw.title.trim() : "";
		const startsAt = typeof raw.starts_at === "string" ? new Date(raw.starts_at) : null;
		if (!url || !title || !startsAt || Number.isNaN(startsAt.getTime())) return null;
		if (!count(raw.price) || !count(raw.remaining)) return null;
		if (!STATUSES.has(raw.status)) return null;
		if (!Object.prototype.hasOwnProperty.call(SLOT_LABELS, raw.slot)) return null;
		const crop = text(raw.crop);
		return {
			url,
			title,
			startsAt,
			price: raw.price,
			remaining: raw.remaining,
			status: raw.status,
			slot: raw.slot,
			slotLabel: SLOT_LABELS[raw.slot],
			// 계약 v1.1: crop이 있어야 배지를 단다. crop_outcome은 crop 뒤에만 붙는다.
			cropLabel: crop ? "작물: " + crop + (text(raw.crop_outcome) ? " → " + text(raw.crop_outcome) : "") : null,
		};
	};

	const buildCard = (meeting) => {
		const card = el("a", "week-card");
		card.href = meeting.url;
		card.target = "_blank";
		card.rel = "noopener";
		card.dataset.slot = meeting.slot;
		const badges = el("div", "card-badges");
		const slot = el("small", null, meeting.slotLabel);
		slot.setAttribute("data-testid", "round-slot");
		badges.appendChild(slot);
		if (meeting.cropLabel) {
			const crop = el("small", null, meeting.cropLabel);
			crop.setAttribute("data-testid", "round-crop");
			badges.appendChild(crop);
		}
		card.appendChild(badges);
		card.appendChild(el("strong", null, meeting.title));
		card.appendChild(el("span", null, when.format(meeting.startsAt)));
		card.appendChild(el("span", null, priceLabel(meeting.price) + " · " + seatLabel(meeting)));
		card.appendChild(el("span", "next", "신청하기 →"));
		return card;
	};

	const buildEmptyCard = () => {
		const card = el("a", "week-card");
		card.href = appUrl;
		card.target = "_blank";
		card.rel = "noopener";
		card.appendChild(el("small", null, "열린 회차"));
		card.appendChild(el("strong", null, "지금 열린 회차가 없습니다"));
		card.appendChild(el("span", null, "다음 회차가 열리면 운영 앱에 먼저 올라옵니다."));
		card.appendChild(el("span", "next", "앱에서 열린 모임 보기 →"));
		return card;
	};

	const replaceWith = (nodes) => {
		const fragment = document.createDocumentFragment();
		nodes.forEach((node) => fragment.appendChild(node));
		list.textContent = "";
		list.appendChild(fragment);
	};

	// 칩은 카드를 DOM에서 지우지 않고 hidden만 토글한다.
	const applyFilter = (slot) => {
		list.querySelectorAll(".week-card").forEach((card) => {
			card.hidden = slot !== "all" && card.dataset.slot !== slot;
		});
	};

	const enableFilter = (cardCount) => {
		if (!filter) return;
		const buttons = Array.from(filter.querySelectorAll("button[data-slot]"));
		if (cardCount < FILTER_MIN_CARDS || buttons.length === 0) return;
		filter.hidden = false;
		buttons.forEach((button) => {
			button.addEventListener("click", () => {
				buttons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
				applyFilter(button.dataset.slot);
			});
		});
	};

	const render = (data) => {
		if (!data || typeof data !== "object" || !Array.isArray(data.meetings)) return; // 스키마 불일치 → 폴백 유지
		if (data.meetings.length === 0) {
			replaceWith([buildEmptyCard()]);
			return;
		}
		const meetings = data.meetings.map(normalize).filter(Boolean).slice(0, MAX_CARDS);
		if (meetings.length === 0) return; // 전부 스키마 불일치 → 폴백 유지
		replaceWith(meetings.map(buildCard));
		enableFilter(meetings.length);
	};

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	fetch(endpoint, {
		signal: controller.signal,
		credentials: "omit",
		headers: { Accept: "application/json" },
	})
		.then((res) => {
			if (!res.ok) throw new Error("bad status");
			const type = res.headers.get("content-type") || "";
			if (!type.includes("json")) throw new Error("not json");
			return res.json();
		})
		.then(render)
		.catch(() => {
			/* 실패·타임아웃·비JSON → 폴백 카드 유지 */
		})
		.finally(() => clearTimeout(timer));
})();
