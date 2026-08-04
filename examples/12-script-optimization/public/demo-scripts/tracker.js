// 서드파티 스크립트 흉내: 로드된 순간을 전역 배열에 기록합니다.
window.__loadedScripts = window.__loadedScripts || [];
window.__loadedScripts.push({
  name: "tracker.js",
  at: Date.now(),
});
