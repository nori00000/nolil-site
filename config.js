// ============================================================
// 놀일 예약 페이지 — 설정
// 여기만 고치면 됩니다. index.html은 건드리지 마세요.
// ============================================================

window.NOLIL_CONFIG = {
	// ---------- ① 연락처 (지금 바로 채우세요) ----------
	phone: "010-2295-7100", // 전화 문의
	kakaoUrl: "", // 카카오톡 채널/오픈채팅 링크. 없으면 빈칸 → 버튼 숨겨짐
	kakaoId: "mrleesangmin",
	telegramUrl: "https://t.me/playworkgrow_bot",
	instagramUrl: "https://instagram.com/nolil.growfarm",
	daangnUrl: "", // 당근마켓 프로필/글 링크. 없으면 빈칸 → 버튼 숨겨짐
	meetingsUrl: "https://app.playworkgrow.club/meetings",
	freeMeetingsUrl: "https://app.playworkgrow.club/meetings?price=free",
	// 수리수리공방 회원 설문. 회차가 바뀌면 여기 slug만 고치면 됩니다.
	// 비우면 index.html에 하드코딩된 기본 링크가 그대로 쓰입니다.
	repairSurveyUrl: "https://app.playworkgrow.club/s/repair-2026-08",
	meetingPollsUrl: "https://app.playworkgrow.club/host/meeting_polls",
	consultUrl: "https://app.playworkgrow.club/meetings",
	leadFormUrl: "letter/",
	visitorChat: {
		enabled: true,
		scriptUrl: "https://app.playworkgrow.club/visitor-chat.js",
		chatUrl: "https://app.playworkgrow.club/chat",
		label: "문의",
	},

	// ---------- ② 위치 ----------
	// 당근마켓은 동네 기반이라 지역은 밝히는 게 낫습니다.
	areaLabel: "경기도 고양시 일산서구 대화동",
	address: "경기도 고양시 일산서구 대화동 1667-4",
	parkingNote: "농장 안에 주차하실 수 있습니다.",

	// ---------- ③ 예약 백엔드 (Supabase) ----------
	// 비워두면 → 예약 폼 대신 전화/카톡 버튼이 나옵니다. 일정표는 그대로 보입니다.
	// 채우면  → 실제 예약(날짜·잔여석·마감)이 작동합니다.
	//
	// Supabase 대시보드 → Project Settings → API 에서 복사:
	//   supabaseUrl     = Project URL
	//   supabaseAnonKey = anon / public key  ← 공개돼도 되는 키입니다. service_role 키는 절대 넣지 마세요.
	supabaseUrl: "",
	supabaseAnonKey: "",

	// ---------- ④ 측정기 ----------
	// 홍보를 쏜 뒤 "몇 명이 왔고 어디서 왔는지"를 보려면 필요합니다.
	// 발급값이 있어도 방문자가 동의하기 전에는 분석 스크립트를 로드하지 않습니다.
	// 값을 이곳에서 관리하면 config.js를 쓰는 페이지에 같은 정책이 적용됩니다.
	//
	//  ga4          Google Analytics 4 측정 ID.  형식: G-XXXXXXXXXX
	//               analytics.google.com → 관리(톱니) → 데이터 스트림 → 웹 → 측정 ID
	//  naverVerify  네이버 서치어드바이저 소유확인 코드 (meta 태그의 content 값만 복사)
	//               searchadvisor.naver.com → 사이트 등록 → HTML 태그 방식
	//  naverWcs     네이버 애널리틱스 인증키
	//               analytics.naver.com → 사이트 등록 후 발급
	//
	// enabled는 운영 스위치이며, 방문자 동의 상태와 동시에 확인될 때만 분석 도구가 로드됩니다.
	analytics: {
		enabled: true,
		ga4: "G-RQBVMTZLN5",
		clarity: "y5v1ct4nun",
		naverVerify: "39ad44e87fb5281b7a3fed3e76f5d54efb1519a7",
		naverWcs: "",
	},
};

// ---------- 측정기 로더 ----------
// 값이 비면 아무것도 붙지 않습니다(fail-closed). ID를 채우는 순간 켜집니다.
// 각 페이지의 HTML은 건드릴 필요가 없습니다.
(() => {
	const CONSENT_KEY = "nolil_analytics_consent";
	const a = (window.NOLIL_CONFIG && window.NOLIL_CONFIG.analytics) || {};
	const hasVisitorConsent = () => {
		try {
			return window.localStorage.getItem(CONSENT_KEY) === "granted";
		} catch {
			return false;
		}
	};
	const isAnalyticsEnabled = () => a.enabled === true && hasVisitorConsent();
	let loaded = false;

	// 네이버 서치어드바이저 소유확인 — 검색 노출의 전제
	if (a.naverVerify && !document.querySelector('meta[name="naver-site-verification"]')) {
		const m = document.createElement("meta");
		m.name = "naver-site-verification";
		m.content = a.naverVerify;
		document.head.appendChild(m);
	}

	const loadAnalytics = () => {
		if (loaded || !isAnalyticsEnabled()) return false;
		loaded = true;

		if (a.ga4) {
			const s = document.createElement("script");
			s.async = true;
			s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(a.ga4);
			document.head.appendChild(s);
			window.dataLayer = window.dataLayer || [];
			window.gtag = function () {
				window.dataLayer.push(arguments);
			};
			window.gtag("js", new Date());
			window.gtag("config", a.ga4, { send_page_view: false });
			window.gtag("event", "page_view", {
				page_path: window.location.pathname,
				page_location: window.location.origin + window.location.pathname,
			});
		}

		if (a.clarity) {
			window.clarity = window.clarity || function () {
				(window.clarity.q = window.clarity.q || []).push(arguments);
			};
			const s = document.createElement("script");
			s.async = true;
			s.src = "https://www.clarity.ms/tag/" + encodeURIComponent(a.clarity);
			document.head.appendChild(s);
		}

		// 네이버 애널리틱스 — 네이버 유기검색 유입 판정용(결정 #40)
		if (a.naverWcs) {
			const s = document.createElement("script");
			s.src = "https://wcs.naver.net/wcslog.js";
			s.onload = () => {
				window.wcs_add = window.wcs_add || {};
				window.wcs_add.wa = a.naverWcs;
				if (typeof window.wcs_do === "function") window.wcs_do();
			};
			document.head.appendChild(s);
		}

		return true;
	};

	window.NOLIL_ANALYTICS = {
		consentKey: CONSENT_KEY,
		hasConsent: hasVisitorConsent,
		isEnabled: isAnalyticsEnabled,
		load: loadAnalytics,
	};
	loadAnalytics();
})();

// ---------- 방문자 챗 위젯 로더 ----------
// visitorChat.enabled=false 로 바꾸면 config.js를 로드하는 페이지에서 즉시 꺼집니다.
// (config.js 없는 페이지 — group.html 등 — 에는 위젯이 원래 안 뜹니다.)
(() => {
	const chat = window.NOLIL_CONFIG && window.NOLIL_CONFIG.visitorChat;
	if (!chat || !chat.enabled || !chat.scriptUrl) return;
	if (document.getElementById("nolilVisitorChatLoader")) return;
	const s = document.createElement("script");
	s.id = "nolilVisitorChatLoader";
	s.src = chat.scriptUrl;
	s.defer = true;
	if (chat.chatUrl) s.dataset.chatUrl = chat.chatUrl;
	if (chat.label) s.dataset.label = chat.label;
	document.head.appendChild(s);
})();
