export const SETUP_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Velocity Lead Dashboard — Setup Required</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin:0; min-height:100vh; display:grid; place-items:center; background:#07111f; color:#e9f2fb; }
    main { width:min(560px, calc(100% - 40px)); padding:36px; border:1px solid #233247; border-radius:22px; background:#0d1a2b; box-shadow:0 26px 90px #0008; }
    .mark { width:46px; height:46px; display:grid; place-items:center; border-radius:14px; background:#ff8a1f; color:#08111e; font-weight:900; }
    h1 { margin:22px 0 10px; font-size:30px; letter-spacing:-.04em; }
    p { color:#aebdd0; line-height:1.65; }
    code { display:block; padding:14px 16px; border-radius:12px; background:#07111f; color:#ffd2a8; overflow:auto; }
  </style>
</head>
<body>
  <main>
    <div class="mark">V</div>
    <h1>Secure access needs one setting</h1>
    <p>The dashboard fails closed until a password is configured. Add the secret below, then reload. This prevents lead names, phone numbers, and emails from being exposed.</p>
    <code>npx wrangler secret put DASHBOARD_PASSWORD</code>
  </main>
</body>
</html>`;

export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>Velocity Lead Dashboard</title>
  <style>
    :root {
      --bg:#07111f;
      --bg-2:#091625;
      --panel:#0e1c2d;
      --panel-2:#122238;
      --panel-3:#172a43;
      --border:#21354e;
      --border-soft:#192a3f;
      --text:#eef5fb;
      --muted:#91a4bb;
      --muted-2:#657b95;
      --orange:#ff8a1f;
      --orange-2:#ffad5e;
      --cyan:#39c6d8;
      --green:#49cf93;
      --yellow:#f1c75b;
      --red:#ff6f72;
      --violet:#9d8cff;
      --shadow:0 20px 70px rgba(0,0,0,.28);
      --radius:18px;
      font-family:Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color-scheme:dark;
    }
    * { box-sizing:border-box; }
    html { background:var(--bg); }
    body { margin:0; min-width:320px; background:
      radial-gradient(circle at 12% -10%, rgba(255,138,31,.14), transparent 31rem),
      radial-gradient(circle at 90% 12%, rgba(57,198,216,.08), transparent 34rem),
      var(--bg); color:var(--text); }
    button, input, select { font:inherit; }
    button { color:inherit; }
    button:focus-visible, input:focus-visible, select:focus-visible { outline:3px solid rgba(57,198,216,.35); outline-offset:2px; }
    .shell { width:min(1500px, calc(100% - 40px)); margin:0 auto; padding-bottom:54px; }
    .topbar { min-height:76px; display:flex; align-items:center; justify-content:space-between; gap:18px; border-bottom:1px solid rgba(46,70,96,.48); }
    .brand { display:flex; align-items:center; gap:12px; min-width:0; }
    .brand-mark { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; color:#08111e; background:linear-gradient(145deg, var(--orange-2), var(--orange)); font-weight:950; box-shadow:0 8px 28px rgba(255,138,31,.28); }
    .brand-name { font-weight:780; letter-spacing:-.02em; white-space:nowrap; }
    .brand-sub { color:var(--muted-2); font-size:12px; margin-top:2px; }
    .top-actions { display:flex; align-items:center; gap:9px; }
    .status-pill { display:flex; align-items:center; gap:8px; padding:8px 11px; border:1px solid var(--border); background:rgba(10,24,40,.72); border-radius:999px; color:var(--muted); font-size:12px; }
    .status-dot { width:7px; height:7px; border-radius:50%; background:var(--muted-2); box-shadow:0 0 0 4px rgba(101,123,149,.12); }
    .status-pill.live .status-dot { background:var(--green); box-shadow:0 0 0 4px rgba(73,207,147,.12); }
    .status-pill.demo .status-dot { background:var(--yellow); box-shadow:0 0 0 4px rgba(241,199,91,.12); }
    .btn { min-height:38px; padding:0 14px; border-radius:11px; border:1px solid var(--border); background:var(--panel); cursor:pointer; transition:transform .15s ease, border-color .15s ease, background .15s ease; display:inline-flex; align-items:center; justify-content:center; gap:8px; }
    .btn:hover { transform:translateY(-1px); border-color:#385473; background:var(--panel-2); }
    .btn.primary { background:var(--orange); border-color:var(--orange); color:#09121f; font-weight:800; }
    .btn.primary:hover { background:#ff9a3d; }
    .btn.icon { width:38px; padding:0; }
    .btn.subtle { background:transparent; }
    .hero { padding:52px 0 28px; display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:end; gap:28px; }
    .eyebrow { text-transform:uppercase; letter-spacing:.16em; color:var(--orange-2); font-size:11px; font-weight:850; }
    h1 { margin:10px 0 8px; font-size:clamp(34px, 4.5vw, 64px); line-height:.99; letter-spacing:-.055em; max-width:820px; }
    .hero-copy { margin:0; color:var(--muted); max-width:690px; line-height:1.65; font-size:15px; }
    .range-panel { padding:12px; border:1px solid var(--border); background:rgba(14,28,45,.78); backdrop-filter:blur(14px); border-radius:16px; box-shadow:var(--shadow); }
    .preset-row { display:flex; gap:6px; margin-bottom:10px; }
    .preset { border:0; background:transparent; color:var(--muted); padding:7px 10px; border-radius:8px; cursor:pointer; font-size:12px; }
    .preset.active { color:var(--text); background:var(--panel-3); box-shadow:inset 0 0 0 1px var(--border); }
    .date-row { display:flex; align-items:center; gap:7px; }
    .date-input { color:var(--text); background:#091726; border:1px solid var(--border); border-radius:9px; padding:8px 9px; width:134px; font-size:12px; }
    .date-sep { color:var(--muted-2); }
    .banner-stack { display:grid; gap:8px; margin:0 0 18px; }
    .banner { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; padding:12px 14px; border:1px solid rgba(241,199,91,.25); border-radius:12px; background:rgba(241,199,91,.075); color:#e5d7a7; font-size:13px; }
    .banner.error { border-color:rgba(255,111,114,.3); background:rgba(255,111,114,.08); color:#ffc4c5; }
    .banner.info { border-color:rgba(57,198,216,.22); background:rgba(57,198,216,.065); color:#b8e8ee; }
    .banner button { color:inherit; background:none; border:0; cursor:pointer; font-weight:800; }
    .kpis { display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:12px; margin-bottom:12px; }
    .kpi { position:relative; min-height:132px; padding:18px; border:1px solid var(--border-soft); border-radius:var(--radius); background:linear-gradient(150deg, rgba(20,38,61,.95), rgba(10,24,40,.94)); overflow:hidden; }
    .kpi::after { content:""; position:absolute; width:80px; height:80px; border-radius:50%; right:-28px; top:-30px; background:var(--kpi-glow, rgba(255,138,31,.12)); filter:blur(2px); }
    .kpi-label { color:var(--muted); font-size:12px; display:flex; justify-content:space-between; gap:10px; }
    .kpi-value { margin-top:17px; font-size:32px; line-height:1; font-weight:800; letter-spacing:-.045em; }
    .kpi-note { color:var(--muted-2); margin-top:10px; font-size:11px; }
    .segment-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
    .segment-card { position:relative; overflow:hidden; padding:20px; border:1px solid var(--border-soft); border-radius:var(--radius); background:linear-gradient(145deg, rgba(16,31,50,.98), rgba(9,23,39,.96)); }
    .segment-card::after { content:""; position:absolute; width:170px; height:170px; right:-68px; top:-92px; border-radius:50%; background:var(--segment-glow); filter:blur(6px); }
    .segment-card.roofing { --segment-accent:var(--orange); --segment-glow:rgba(255,138,31,.16); }
    .segment-card.solar { --segment-accent:var(--cyan); --segment-glow:rgba(57,198,216,.14); }
    .segment-head { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:14px; }
    .segment-name { display:flex; align-items:center; gap:9px; font-size:15px; font-weight:800; }
    .segment-name::before { content:""; width:9px; height:9px; border-radius:3px; background:var(--segment-accent); box-shadow:0 0 18px var(--segment-accent); }
    .segment-rate { color:var(--segment-accent); font-size:24px; font-weight:850; letter-spacing:-.04em; }
    .segment-stats { position:relative; z-index:1; display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:18px; }
    .segment-stat { padding:12px; border:1px solid var(--border-soft); border-radius:12px; background:rgba(6,17,30,.46); }
    .segment-stat strong { display:block; font-size:22px; letter-spacing:-.035em; }
    .segment-stat span { display:block; color:var(--muted-2); font-size:10px; margin-top:5px; }
    .main-grid { display:grid; grid-template-columns:minmax(0, 1.65fr) minmax(320px, .85fr); gap:12px; margin-bottom:12px; }
    .panel { border:1px solid var(--border-soft); border-radius:var(--radius); background:linear-gradient(150deg, rgba(16,31,50,.97), rgba(10,24,40,.96)); box-shadow:0 15px 50px rgba(0,0,0,.14); min-width:0; }
    .panel-head { min-height:66px; padding:16px 18px 12px; display:flex; justify-content:space-between; align-items:flex-start; gap:18px; }
    .panel-title { margin:0; font-size:15px; letter-spacing:-.02em; }
    .panel-sub { color:var(--muted-2); font-size:11px; margin-top:5px; }
    .legend-inline { display:flex; align-items:center; gap:13px; color:var(--muted); font-size:11px; }
    .legend-inline span { display:flex; align-items:center; gap:6px; }
    .legend-dot { width:7px; height:7px; border-radius:2px; background:var(--cyan); }
    .legend-dot.orange { background:var(--orange); }
    .trend { height:245px; padding:14px 18px 20px; display:flex; align-items:flex-end; gap:5px; overflow:hidden; }
    .day-group { min-width:5px; flex:1; height:100%; display:flex; align-items:flex-end; justify-content:center; gap:2px; position:relative; border-bottom:1px solid var(--border); }
    .day-leads { width:44%; min-height:2px; border-radius:4px 4px 1px 1px; background:linear-gradient(180deg, rgba(57,198,216,.82), rgba(57,198,216,.26)); transition:height .25s ease; }
    .day-appts { width:44%; min-height:2px; border-radius:3px 3px 0 0; background:var(--orange); box-shadow:0 0 14px rgba(255,138,31,.28); transition:height .25s ease; }
    .day-label { position:absolute; bottom:-18px; left:50%; transform:translateX(-50%); font-size:9px; color:var(--muted-2); white-space:nowrap; }
    .schedule-body { display:grid; grid-template-columns:150px 1fr; align-items:center; gap:12px; padding:18px; }
    .donut { width:136px; height:136px; border-radius:50%; display:grid; place-items:center; position:relative; background:conic-gradient(var(--border) 0 100%); }
    .donut::after { content:""; position:absolute; inset:17px; background:var(--panel); border-radius:50%; box-shadow:inset 0 0 0 1px var(--border-soft); }
    .donut-center { z-index:1; text-align:center; }
    .donut-value { font-size:27px; font-weight:800; letter-spacing:-.04em; }
    .donut-label { font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:var(--muted-2); }
    .status-list { display:grid; gap:9px; }
    .status-row { display:grid; grid-template-columns:8px 1fr auto; align-items:center; gap:8px; font-size:11px; color:var(--muted); }
    .status-swatch { width:7px; height:7px; border-radius:2px; }
    .status-count { color:var(--text); font-variant-numeric:tabular-nums; }
    .filters { padding:12px; margin-bottom:12px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .search { position:relative; flex:1 1 260px; }
    .control { width:100%; min-height:40px; border:1px solid var(--border); border-radius:10px; background:#0a1828; color:var(--text); padding:0 12px; font-size:12px; }
    .search .control { padding-left:36px; }
    .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted-2); }
    select.control { width:auto; min-width:155px; cursor:pointer; }
    .spacer { flex:1; }
    .count-chip { color:var(--muted); font-size:11px; white-space:nowrap; }
    .breakdown-grid { display:grid; grid-template-columns:minmax(0, 1.45fr) minmax(300px, .75fr); gap:12px; margin-bottom:12px; }
    .service-table { width:100%; border-collapse:collapse; }
    .service-table th { color:var(--muted-2); font-size:10px; text-transform:uppercase; letter-spacing:.08em; text-align:right; padding:8px 14px 11px; border-bottom:1px solid var(--border-soft); }
    .service-table th:first-child, .service-table td:first-child { text-align:left; padding-left:18px; }
    .service-table td { padding:13px 14px; border-bottom:1px solid rgba(33,53,78,.55); font-size:12px; text-align:right; font-variant-numeric:tabular-nums; }
    .service-table tr:last-child td { border-bottom:0; }
    .service-name { min-width:150px; }
    .service-name strong { display:block; font-size:12px; }
    .mini-bar { height:3px; margin-top:7px; border-radius:999px; background:#20364f; overflow:hidden; }
    .mini-bar span { height:100%; display:block; border-radius:inherit; background:linear-gradient(90deg, var(--orange), var(--orange-2)); }
    .rate { color:var(--green); font-weight:750; }
    .source-list { padding:8px 18px 19px; display:grid; gap:15px; }
    .source-item-head { display:flex; justify-content:space-between; gap:12px; font-size:11px; }
    .source-item-head span:first-child { color:var(--muted); }
    .source-item-head strong { font-variant-numeric:tabular-nums; }
    .source-bar { height:6px; background:#1b3149; border-radius:999px; margin-top:7px; overflow:hidden; }
    .source-bar span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg, var(--cyan), #78dce8); }
    .table-panel { overflow:hidden; margin-bottom:12px; }
    .table-wrap { overflow:auto; }
    .lead-table { width:100%; border-collapse:collapse; min-width:1050px; }
    .lead-table th { position:sticky; top:0; background:#0c1a2b; z-index:1; padding:10px 14px; text-align:left; color:var(--muted-2); font-size:10px; letter-spacing:.08em; text-transform:uppercase; border-top:1px solid var(--border-soft); border-bottom:1px solid var(--border-soft); }
    .lead-table td { padding:13px 14px; border-bottom:1px solid rgba(33,53,78,.55); font-size:11px; color:var(--muted); vertical-align:middle; }
    .lead-table tr:hover td { background:rgba(35,55,79,.22); }
    .lead-main { color:var(--text); font-weight:720; font-size:12px; }
    .lead-contact { font-size:10px; color:var(--muted-2); margin-top:4px; }
    .badge { display:inline-flex; align-items:center; min-height:24px; padding:0 9px; border-radius:999px; background:#182d45; color:#c7d5e4; border:1px solid #29445f; white-space:nowrap; font-size:10px; }
    .badge.status-scheduled, .badge.status-rescheduled { background:rgba(57,198,216,.09); color:#aee8ef; border-color:rgba(57,198,216,.25); }
    .badge.status-completed { background:rgba(73,207,147,.09); color:#b7efd3; border-color:rgba(73,207,147,.23); }
    .badge.status-canceled, .badge.status-no-show { background:rgba(255,111,114,.08); color:#ffc2c3; border-color:rgba(255,111,114,.22); }
    .badge.status-not-scheduled { background:rgba(101,123,149,.08); color:#9fb0c2; border-color:rgba(101,123,149,.18); }
    .badge.status-other-review { background:rgba(241,199,91,.08); color:#ebd999; border-color:rgba(241,199,91,.22); }
    .duplicate-tag { color:var(--orange-2); font-size:10px; margin-top:5px; }
    .appointment-main { color:#dbe7f2; }
    .appointment-sub { font-size:10px; color:var(--muted-2); margin-top:4px; }
    .table-footer { min-height:58px; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px; }
    .pagination { display:flex; align-items:center; gap:7px; }
    .pagination .btn { min-height:32px; padding:0 10px; font-size:11px; }
    .audit-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .quality-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:9px; padding:10px 18px 18px; }
    .quality-card { padding:14px; border:1px solid var(--border-soft); border-radius:12px; background:rgba(7,18,31,.45); }
    .quality-value { font-size:24px; font-weight:800; letter-spacing:-.04em; }
    .quality-label { color:var(--muted); font-size:10px; margin-top:6px; line-height:1.4; }
    .duplicate-list { max-height:260px; overflow:auto; padding:5px 18px 18px; }
    .duplicate-item { padding:12px 0; border-bottom:1px solid var(--border-soft); }
    .duplicate-item:last-child { border-bottom:0; }
    .duplicate-head { display:flex; justify-content:space-between; gap:12px; font-size:11px; }
    .duplicate-head strong { color:var(--text); }
    .duplicate-copy { margin-top:5px; color:var(--muted-2); font-size:10px; line-height:1.45; }
    .empty { padding:32px 18px; text-align:center; color:var(--muted); font-size:12px; }
    .loading { position:fixed; inset:0; z-index:50; display:none; place-items:center; background:rgba(4,11,20,.65); backdrop-filter:blur(4px); }
    .loading.active { display:grid; }
    .loader-card { width:min(350px, calc(100% - 40px)); padding:24px; border:1px solid var(--border); border-radius:16px; background:var(--panel); box-shadow:var(--shadow); text-align:center; }
    .spinner { width:28px; height:28px; margin:0 auto 14px; border:3px solid #2a405a; border-top-color:var(--orange); border-radius:50%; animation:spin .75s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .loader-title { font-size:14px; font-weight:750; }
    .loader-sub { color:var(--muted); font-size:11px; margin-top:6px; }
    dialog { width:min(720px, calc(100% - 30px)); max-height:calc(100vh - 40px); padding:0; border:1px solid var(--border); border-radius:20px; background:var(--panel); color:var(--text); box-shadow:0 40px 120px #000a; }
    dialog::backdrop { background:rgba(3,9,17,.78); backdrop-filter:blur(5px); }
    .modal-head { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; padding:22px 24px 17px; border-bottom:1px solid var(--border-soft); }
    .modal-head h2 { margin:0; font-size:20px; letter-spacing:-.03em; }
    .modal-head p { color:var(--muted); margin:6px 0 0; font-size:11px; line-height:1.5; }
    .modal-body { padding:20px 24px; overflow:auto; }
    .settings-section + .settings-section { margin-top:24px; padding-top:22px; border-top:1px solid var(--border-soft); }
    .settings-title { font-size:12px; font-weight:780; margin-bottom:5px; }
    .settings-copy { color:var(--muted-2); font-size:10px; line-height:1.55; margin-bottom:14px; }
    .field-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .field { display:grid; gap:6px; }
    .field label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:.07em; }
    .field input, .field select { min-height:41px; width:100%; padding:0 11px; border:1px solid var(--border); border-radius:10px; background:#081625; color:var(--text); font-size:12px; }
    .rule-box { padding:14px; border:1px solid rgba(255,138,31,.22); background:rgba(255,138,31,.06); border-radius:12px; color:#dbbd9f; font-size:11px; line-height:1.6; }
    .scope-list { display:flex; flex-wrap:wrap; gap:7px; }
    .scope { padding:6px 8px; border:1px solid var(--border); border-radius:8px; background:#081625; color:var(--muted); font-size:9px; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; }
    .modal-foot { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:15px 24px; border-top:1px solid var(--border-soft); }
    .modal-foot small { color:var(--muted-2); }
    .modal-actions { display:flex; gap:8px; }
    .footer { display:flex; justify-content:space-between; gap:18px; color:var(--muted-2); font-size:10px; padding:20px 2px 0; }
    .privacy .personal { filter:blur(5px); user-select:none; }
    .skeleton { animation:pulse 1.4s ease-in-out infinite; background:linear-gradient(90deg, #12243a, #1a3048, #12243a); background-size:200% 100%; color:transparent !important; border-radius:6px; }
    @keyframes pulse { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
    @media (max-width:1100px) {
      .kpis { grid-template-columns:repeat(3, 1fr); }
      .main-grid, .breakdown-grid { grid-template-columns:1fr; }
      .schedule-body { grid-template-columns:160px 1fr; }
    }
    @media (max-width:760px) {
      .shell { width:min(100% - 24px, 1500px); }
      .brand-sub, .status-pill span:last-child { display:none; }
      .hero { grid-template-columns:1fr; padding-top:36px; }
      .range-panel { width:100%; }
      .date-row { flex-wrap:wrap; }
      .date-input { flex:1; min-width:120px; }
      .kpis { grid-template-columns:1fr 1fr; }
      .segment-grid { grid-template-columns:1fr; }
      .kpi { min-height:116px; }
      .schedule-body { grid-template-columns:1fr; justify-items:center; }
      .status-list { width:100%; }
      .field-grid, .audit-grid { grid-template-columns:1fr; }
      .quality-grid { grid-template-columns:1fr; }
      .footer { flex-direction:column; }
    }
    @media (max-width:480px) {
      .top-actions .btn span { display:none; }
      h1 { font-size:39px; }
      .kpis { grid-template-columns:1fr; }
      .preset-row { overflow:auto; }
      .filters { align-items:stretch; }
      select.control { width:100%; }
      .modal-foot { align-items:flex-start; flex-direction:column; }
    }
  </style>
</head>
<body>
  <div class="shell" id="shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">V</div>
        <div>
          <div class="brand-name">Velocity Lead Intelligence</div>
          <div class="brand-sub">HubSpot pipeline clarity</div>
        </div>
      </div>
      <div class="top-actions">
        <div class="status-pill" id="connection-pill"><span class="status-dot"></span><span>Connecting</span></div>
        <button class="btn subtle" id="privacy-btn" type="button" title="Mask names and contact details"><span>◉</span><span>Privacy</span></button>
        <button class="btn" id="settings-btn" type="button"><span>⚙</span><span>Configure</span></button>
      </div>
    </header>

    <main>
      <section class="hero">
        <div>
          <div class="eyebrow">Lead performance</div>
          <h1>Every new lead, one clear answer.</h1>
          <p class="hero-copy">See which services are driving demand, what actually became an appointment, and the clean count after duplicate contacts are removed.</p>
        </div>
        <div class="range-panel" aria-label="Report date range">
          <div class="preset-row">
            <button class="preset" data-days="7" type="button">7 days</button>
            <button class="preset active" data-days="21" type="button">3 weeks</button>
            <button class="preset" data-days="30" type="button">30 days</button>
            <button class="preset" data-days="90" type="button">90 days</button>
          </div>
          <div class="date-row">
            <input class="date-input" id="start-date" type="date" aria-label="Start date">
            <span class="date-sep">→</span>
            <input class="date-input" id="end-date" type="date" aria-label="End date">
            <button class="btn primary" id="refresh-btn" type="button">Refresh</button>
          </div>
        </div>
      </section>

      <div class="banner-stack" id="banners"></div>

      <section class="kpis" id="kpis" aria-label="Lead summary">
        <article class="kpi"><div class="kpi-label">Unique new leads</div><div class="kpi-value skeleton">000</div><div class="kpi-note">After history-wide duplicate removal</div></article>
        <article class="kpi"><div class="kpi-label">Booked from new leads</div><div class="kpi-value skeleton">000</div><div class="kpi-note">Selected lead cohort that reached Appointment Set</div></article>
        <article class="kpi"><div class="kpi-label">New-lead booking rate</div><div class="kpi-value skeleton">00%</div><div class="kpi-note">Booked cohort leads ÷ unique new leads</div></article>
        <article class="kpi"><div class="kpi-label">Total booked in range</div><div class="kpi-value skeleton">000</div><div class="kpi-note">All Appointment Set stage changes</div></article>
        <article class="kpi"><div class="kpi-label">Appointments occurring</div><div class="kpi-value skeleton">000</div><div class="kpi-note">Based on actual appointment date</div></article>
        <article class="kpi"><div class="kpi-label">Duplicates removed</div><div class="kpi-value skeleton">000</div><div class="kpi-note">Oldest contact retained</div></article>
      </section>

      <section class="segment-grid" id="segment-cards" aria-label="Roofing and solar performance">
        <article class="segment-card roofing"><div class="segment-head"><div class="segment-name">Roofing</div><div class="segment-rate skeleton">00%</div></div><div class="segment-stats"><div class="segment-stat"><strong class="skeleton">000</strong><span>Unique leads</span></div><div class="segment-stat"><strong class="skeleton">000</strong><span>Booked leads</span></div><div class="segment-stat"><strong class="skeleton">000</strong><span>Total booked in range</span></div></div></article>
        <article class="segment-card solar"><div class="segment-head"><div class="segment-name">Solar</div><div class="segment-rate skeleton">00%</div></div><div class="segment-stats"><div class="segment-stat"><strong class="skeleton">000</strong><span>Unique leads</span></div><div class="segment-stat"><strong class="skeleton">000</strong><span>Booked leads</span></div><div class="segment-stat"><strong class="skeleton">000</strong><span>Total booked in range</span></div></div></article>
      </section>

      <section class="main-grid">
        <article class="panel">
          <div class="panel-head">
            <div><h2 class="panel-title">New leads and appointments booked</h2><div class="panel-sub" id="trend-sub">Leads by original create date; bookings by the Appointment Set stage-change date</div></div>
            <div class="legend-inline"><span><i class="legend-dot"></i>Leads</span><span><i class="legend-dot orange"></i>Booked</span></div>
          </div>
          <div class="trend" id="trend"><div class="empty">Loading trend…</div></div>
        </article>
        <article class="panel">
          <div class="panel-head">
            <div><h2 class="panel-title">Appointments occurring in range</h2><div class="panel-sub">Outcomes grouped by actual appointment date, separate from booking date</div></div>
          </div>
          <div class="schedule-body">
            <div class="donut" id="donut"><div class="donut-center"><div class="donut-value" id="donut-value">—</div><div class="donut-label">appointments</div></div></div>
            <div class="status-list" id="status-list"></div>
          </div>
        </article>
      </section>

      <section class="panel filters" aria-label="Report filters">
        <div class="search"><span class="search-icon">⌕</span><input class="control" id="search" type="search" placeholder="Search name, email, phone, service…"></div>
        <select class="control" id="segment-filter" aria-label="Filter by business line"><option value="">Roofing + Solar</option><option value="Roofing">Roofing only</option><option value="Solar">Solar only</option><option value="Unclassified">Unclassified</option></select>
        <select class="control" id="status-filter" aria-label="Filter by scheduling status"><option value="">All scheduling outcomes</option></select>
        <select class="control" id="source-filter" aria-label="Filter by lead source"><option value="">All sources</option></select>
        <span class="count-chip" id="filtered-count">—</span>
        <button class="btn" id="export-btn" type="button">Export CSV</button>
      </section>

      <section class="breakdown-grid">
        <article class="panel">
          <div class="panel-head">
            <div><h2 class="panel-title">Roofing vs. solar</h2><div class="panel-sub">Combined-service leads appear in both business lines; overall totals remain deduplicated</div></div>
          </div>
          <div class="table-wrap" id="service-breakdown"></div>
        </article>
        <article class="panel">
          <div class="panel-head">
            <div><h2 class="panel-title">Lead source mix</h2><div class="panel-sub">Where new contacts originated</div></div>
          </div>
          <div class="source-list" id="source-breakdown"></div>
        </article>
      </section>

      <section class="panel table-panel">
        <div class="panel-head">
          <div><h2 class="panel-title">Deduplicated new-lead detail</h2><div class="panel-sub">Original contacts created in range; appointment totals may also include older leads</div></div>
          <div class="panel-sub" id="updated-at">Not refreshed yet</div>
        </div>
        <div class="table-wrap">
          <table class="lead-table">
            <thead><tr><th>Lead</th><th>Service</th><th>Booked</th><th>Scheduling</th><th>Appointment</th><th>Source</th><th>Owner</th><th>Created</th></tr></thead>
            <tbody id="lead-rows"></tbody>
          </table>
        </div>
        <div class="table-footer"><span class="count-chip" id="page-label">—</span><div class="pagination"><button class="btn" id="prev-page" type="button">Previous</button><button class="btn" id="next-page" type="button">Next</button></div></div>
      </section>

      <section class="audit-grid">
        <article class="panel">
          <div class="panel-head"><div><h2 class="panel-title">Data quality</h2><div class="panel-sub">Gaps that can distort reporting or follow-up</div></div></div>
          <div class="quality-grid" id="quality-grid"></div>
        </article>
        <article class="panel">
          <div class="panel-head"><div><h2 class="panel-title">Duplicate audit</h2><div class="panel-sub">Exactly which HubSpot records were suppressed</div></div></div>
          <div class="duplicate-list" id="duplicate-list"></div>
        </article>
      </section>
    </main>

    <footer class="footer"><span>Read-only dashboard. No HubSpot contacts are changed.</span><span id="range-label">Default range: past 3 weeks</span></footer>
  </div>

  <div class="loading" id="loading" role="status" aria-live="polite">
    <div class="loader-card"><div class="spinner"></div><div class="loader-title">Building the clean lead report</div><div class="loader-sub">Pulling HubSpot contacts, lifecycle-stage history, appointments, and duplicate groups…</div></div>
  </div>

  <dialog id="settings-dialog">
    <form method="dialog" id="settings-form">
      <div class="modal-head">
        <div><h2>HubSpot data mapping</h2><p>Map your account’s internal contact properties. Your choices save with this dashboard on Cloudflare; the access token is never sent to this page.</p></div>
        <button class="btn icon subtle" value="cancel" aria-label="Close settings" type="submit">×</button>
      </div>
      <div class="modal-body">
        <section class="settings-section">
          <div class="settings-title">Scheduling source</div>
          <div class="settings-copy">Auto mode considers associated HubSpot appointments, meetings, and mapped contact fields, then uses the strongest available scheduling record.</div>
          <div class="field-grid">
            <div class="field"><label for="schedule-source">Use scheduling data from</label><select id="schedule-source"><option value="auto">Auto: all available sources</option><option value="properties">Mapped contact properties only</option><option value="meetings">Associated meetings</option><option value="appointments">Associated appointments</option></select></div>
            <div class="field"><label for="dedupe-by">Duplicate match</label><select id="dedupe-by"><option value="email_phone">Same email OR full phone</option><option value="email">Same email only</option><option value="phone">Same full phone only</option></select></div>
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-title">Contact property mapping</div>
          <div class="settings-copy">Choose from the suggestions or enter a HubSpot property’s internal name manually. Lifecycle-stage history is read automatically to find when each contact entered Appointment Set; no booking-date mapping is needed.</div>
          <datalist id="property-options"></datalist>
          <div class="field-grid">
            <div class="field"><label for="map-service">Service</label><input id="map-service" list="property-options" placeholder="e.g. service_interest"></div>
            <div class="field"><label for="map-status">Appointment status</label><input id="map-status" list="property-options" placeholder="e.g. appointment_status"></div>
            <div class="field"><label for="map-date">Appointment date / time</label><input id="map-date" list="property-options" placeholder="e.g. appointment_date"></div>
            <div class="field"><label for="map-type">Appointment type</label><input id="map-type" list="property-options" placeholder="e.g. appointment_type"></div>
            <div class="field"><label for="map-source">Lead source</label><input id="map-source" list="property-options" placeholder="hs_analytics_source"></div>
            <div class="field"><label for="map-subsource">Lead source detail</label><input id="map-subsource" list="property-options" placeholder="hs_analytics_source_data_1"></div>
            <div class="field"><label for="map-owner">Contact owner</label><input id="map-owner" list="property-options" placeholder="hubspot_owner_id"></div>
          </div>
        </section>

        <section class="settings-section">
          <div class="settings-title">Duplicate decision rule</div>
          <div class="rule-box"><strong>Before the selected start date is applied:</strong> exclude Offline Sources / Ahoy-Connection and LEADer-source contacts, then group matching contacts across HubSpot history through the selected end date and retain the oldest create date. The retained row combines lifecycle-stage history and the most recently updated nonblank service and appointment details from every duplicate.</div>
        </section>

        <section class="settings-section">
          <div class="settings-title">Private-app read permissions</div>
          <div class="settings-copy">The first three support contacts, property discovery, and owner names. Appointments is optional when you use that object.</div>
          <div class="scope-list"><span class="scope">crm.objects.contacts.read</span><span class="scope">crm.schemas.contacts.read</span><span class="scope">crm.objects.owners.read</span><span class="scope">crm.objects.appointments.read</span></div>
        </section>
      </div>
      <div class="modal-foot"><small id="settings-connection">Checking HubSpot connection…</small><div class="modal-actions"><button class="btn" value="cancel" type="submit">Cancel</button><button class="btn primary" id="save-settings" value="default" type="button">Apply & refresh</button></div></div>
    </form>
  </dialog>

  <script>
    (function () {
      "use strict";

      var STATUS_ORDER = ["Scheduled", "Rescheduled", "Completed", "Canceled", "No-show", "Other / review", "Not scheduled"];
      var STATUS_COLORS = {
        "Scheduled":"#39c6d8", "Rescheduled":"#9d8cff", "Completed":"#49cf93",
        "Canceled":"#ff6f72", "No-show":"#f1c75b", "Other / review":"#ffad5e", "Not scheduled":"#405772"
      };
      var STORAGE_KEY = "velocity-lead-dashboard-settings-v2";
      var PAGE_SIZE = 25;
      var state = {
        bootstrap:null,
        report:null,
        settings:{
          scheduleSource:"auto",
          dedupeBy:"email_phone",
          mapping:{ service:"appointment_set_as", appointmentStatus:"appointment_status", appointmentDate:"appointment_date__time", appointmentType:"appointment_type_2", leadSource:"hs_analytics_source", leadSubsource:"hs_analytics_source_data_1", owner:"hubspot_owner_id" }
        },
        filters:{ search:"", segment:"", status:"", source:"" },
        page:1,
        privacy:false,
        preset:21,
        hasSavedSettings:false
      };

      var $ = function (selector) { return document.querySelector(selector); };
      var $$ = function (selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); };
      var escapeHtml = function (value) {
        return String(value === null || value === undefined ? "" : value)
          .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
      };
      var clamp = function (number, min, max) { return Math.min(max, Math.max(min, number)); };
      var percent = function (value) { return Math.round((Number(value) || 0) * 100) + "%"; };
      var compact = new Intl.NumberFormat("en-US", { notation:"compact", maximumFractionDigits:1 });
      var number = new Intl.NumberFormat("en-US");
      var dateShort = new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric" });
      var dateTime = new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" });

      function loadSavedSettings() {
        try {
          var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
          if (saved && saved.mapping) {
            state.settings = {
              scheduleSource:saved.scheduleSource || "auto",
              dedupeBy:saved.dedupeBy || "email_phone",
              mapping:Object.assign({}, state.settings.mapping, saved.mapping)
            };
            state.hasSavedSettings = true;
          }
        } catch (_) {}
      }

      function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
      }

      function dateInputValue(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, "0");
        var day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
      }

      function localDateKey(value) {
        var date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : dateInputValue(date);
      }

      function setPreset(days) {
        state.preset = days;
        var end = new Date();
        var start = new Date();
        start.setDate(start.getDate() - (days - 1));
        $("#start-date").value = dateInputValue(start);
        $("#end-date").value = dateInputValue(end);
        $$(".preset").forEach(function (button) { button.classList.toggle("active", Number(button.dataset.days) === days); });
      }

      function selectedRange() {
        var startValue = $("#start-date").value;
        var endValue = $("#end-date").value;
        var start = new Date(startValue + "T00:00:00");
        var endInclusive = new Date(endValue + "T00:00:00");
        var endExclusive = new Date(endInclusive);
        endExclusive.setDate(endExclusive.getDate() + 1);
        if (!startValue || !endValue || Number.isNaN(start.getTime()) || Number.isNaN(endInclusive.getTime()) || start > endInclusive) {
          throw new Error("Choose a valid date range.");
        }
        return { start:start.toISOString(), end:endExclusive.toISOString(), startLabel:start, endLabel:endInclusive };
      }

      async function requestJson(path, options) {
        var controller = new AbortController();
        var timeout = setTimeout(function () { controller.abort(); }, 90000);
        try {
          var response = await fetch(path, Object.assign({
            headers:{ "Content-Type":"application/json" },
            signal:controller.signal
          }, options || {}));
          var payload = {};
          try { payload = await response.json(); } catch (_) {}
          if (!response.ok) throw new Error(payload.error || "The request could not be completed.");
          return payload;
        } catch (error) {
          if (error && error.name === "AbortError") throw new Error("HubSpot took too long to respond. Try Refresh again.");
          throw error;
        } finally {
          clearTimeout(timeout);
        }
      }

      function setLoading(active) {
        $("#loading").classList.toggle("active", Boolean(active));
      }

      function showError(message) {
        $("#banners").innerHTML = '<div class="banner error"><span>' + escapeHtml(message) + '</span><button type="button" onclick="this.parentElement.remove()">Dismiss</button></div>';
      }

      function populatePropertyOptions() {
        var properties = (state.bootstrap && state.bootstrap.properties) || [];
        $("#property-options").innerHTML = properties.map(function (property) {
          return '<option value="' + escapeHtml(property.name) + '">' + escapeHtml(property.label || property.name) + '</option>';
        }).join("");
      }

      function mergeRecommendedMapping() {
        var recommended = (state.bootstrap && state.bootstrap.recommendedMapping) || {};
        if (!state.hasSavedSettings) state.settings.mapping = Object.assign({}, state.settings.mapping, recommended);
      }

      function applyStoredSettings(saved) {
        if (!saved || !saved.mapping) return;
        state.settings = {
          scheduleSource:saved.scheduleSource || "auto",
          dedupeBy:saved.dedupeBy || "email_phone",
          mapping:Object.assign({}, state.settings.mapping, saved.mapping)
        };
        state.hasSavedSettings = true;
        saveSettings();
      }

      function fillSettingsForm() {
        $("#schedule-source").value = state.settings.scheduleSource;
        $("#dedupe-by").value = state.settings.dedupeBy;
        $("#map-service").value = state.settings.mapping.service || "";
        $("#map-status").value = state.settings.mapping.appointmentStatus || "";
        $("#map-date").value = state.settings.mapping.appointmentDate || "";
        $("#map-type").value = state.settings.mapping.appointmentType || "";
        $("#map-source").value = state.settings.mapping.leadSource || "";
        $("#map-subsource").value = state.settings.mapping.leadSubsource || "";
        $("#map-owner").value = state.settings.mapping.owner || "";
        var connected = state.bootstrap && state.bootstrap.connected;
        var cloudSaved = state.bootstrap && state.bootstrap.settingsPersistenceConfigured;
        $("#settings-connection").textContent = connected
          ? "HubSpot connected · " + (cloudSaved ? "settings save on Cloudflare" : "browser-only settings")
          : "Demo mode · HubSpot token not configured";
      }

      function readSettingsForm() {
        state.settings = {
          scheduleSource:$("#schedule-source").value,
          dedupeBy:$("#dedupe-by").value,
          mapping:{
            service:$("#map-service").value.trim(),
            appointmentStatus:$("#map-status").value.trim(),
            appointmentDate:$("#map-date").value.trim(),
            appointmentType:$("#map-type").value.trim(),
            leadSource:$("#map-source").value.trim(),
            leadSubsource:$("#map-subsource").value.trim(),
            owner:$("#map-owner").value.trim()
          }
        };
        state.hasSavedSettings = true;
        saveSettings();
      }

      async function saveSettingsToCloudflare() {
        if (!state.bootstrap || !state.bootstrap.settingsPersistenceConfigured) return false;
        await requestJson("/api/settings", { method:"PUT", body:JSON.stringify(state.settings) });
        return true;
      }

      async function bootstrap() {
        state.bootstrap = await requestJson("/api/bootstrap");
        var hadLocalSettings = state.hasSavedSettings;
        applyStoredSettings(state.bootstrap.savedSettings);
        mergeRecommendedMapping();
        if (state.bootstrap.settingsPersistenceConfigured && !state.bootstrap.savedSettings && hadLocalSettings) {
          try { await saveSettingsToCloudflare(); } catch (_) {}
        }
        populatePropertyOptions();
        fillSettingsForm();
        var pill = $("#connection-pill");
        pill.classList.remove("live", "demo");
        pill.classList.add(state.bootstrap.connected ? "live" : "demo");
        pill.lastElementChild.textContent = state.bootstrap.connected ? "HubSpot live" : "Demo data";
      }

      async function loadReport() {
        setLoading(true);
        try {
          var range = selectedRange();
          var body = {
            start:range.start,
            end:range.end,
            mapping:state.settings.mapping,
            scheduleSource:state.settings.scheduleSource,
            dedupeBy:state.settings.dedupeBy
          };
          var path = state.bootstrap && state.bootstrap.connected ? "/api/report" : "/api/demo";
          state.report = await requestJson(path, { method:"POST", body:JSON.stringify(body) });
          state.page = 1;
          state.filters = { search:"", segment:"", status:"", source:"" };
          $("#search").value = "";
          $("#segment-filter").value = "";
          renderAll();
        } catch (error) {
          showError(error.message);
        } finally {
          setLoading(false);
        }
      }

      function rowSegments(row) {
        if (Array.isArray(row.serviceSegments)) return row.serviceSegments;
        var service = String(row.service || "").toLowerCase();
        var segments = [];
        if (/roof|shingle|storm|insurance/.test(service)) segments.push("Roofing");
        if (/solar|photovoltaic|\\bpv\\b/.test(service)) segments.push("Solar");
        return segments;
      }

      function sourceForRow(row) {
        return row.leadSource || "Unknown source";
      }

      function filterReportRows(rows) {
        var query = state.filters.search.toLowerCase();
        return (rows || []).filter(function (row) {
          var segments = rowSegments(row);
          var segmentMatch = !state.filters.segment
            || (state.filters.segment === "Unclassified" ? !segments.length : segments.indexOf(state.filters.segment) >= 0);
          var haystack = [row.name,row.email,row.phone,row.service,row.leadSource,row.owner,row.rawScheduleStatus].join(" ").toLowerCase();
          return (!query || haystack.indexOf(query) >= 0)
            && segmentMatch
            && (!state.filters.status || row.scheduleCategory === state.filters.status)
            && (!state.filters.source || sourceForRow(row) === state.filters.source);
        });
      }

      function filteredRows() {
        return state.report ? filterReportRows(state.report.rows) : [];
      }

      function filteredAppointmentRows() {
        return state.report ? filterReportRows(state.report.appointmentRows || []) : [];
      }

      function filteredBookingRows() {
        return state.report ? filterReportRows(state.report.bookingRows || []) : [];
      }

      function aggregate(rows, appointmentRows, bookingRows) {
        var statusCounts = {};
        var services = {};
        var sources = {};
        STATUS_ORDER.forEach(function (status) { statusCounts[status] = 0; });
        rows.forEach(function (row) {
          var source = sourceForRow(row);
          sources[source] = (sources[source] || 0) + 1;
          if (!services[row.service]) services[row.service] = { service:row.service, leads:0, bookedFromNewLeads:0, appointmentSet:0, scheduled:0, completed:0, canceledNoShow:0, notScheduled:0 };
          var service = services[row.service];
          service.leads += 1;
          if (row.bookedEver) service.bookedFromNewLeads += 1;
          if (row.everScheduled) service.appointmentSet += 1;
          if (row.scheduleCategory === "Scheduled" || row.scheduleCategory === "Rescheduled") service.scheduled += 1;
          if (row.scheduleCategory === "Completed") service.completed += 1;
          if (row.scheduleCategory === "Canceled" || row.scheduleCategory === "No-show") service.canceledNoShow += 1;
          if (!row.everScheduled) service.notScheduled += 1;
        });
        appointmentRows.forEach(function (row) {
          statusCounts[row.scheduleCategory] = (statusCounts[row.scheduleCategory] || 0) + 1;
        });
        return {
          total:rows.length,
          bookedFromNewLeads:rows.filter(function (row) { return row.bookedEver; }).length,
          totalBookedInRange:bookingRows.length,
          newLeadsEverScheduled:rows.filter(function (row) { return row.everScheduled; }).length,
          appointmentsInRange:appointmentRows.length,
          activeScheduled:appointmentRows.filter(function (row) { return row.scheduleCategory === "Scheduled" || row.scheduleCategory === "Rescheduled"; }).length,
          statuses:STATUS_ORDER.map(function (label) { return { label:label, count:statusCounts[label] || 0 }; }),
          services:Object.keys(services).map(function (key) { var item=services[key]; item.bookingRate=item.leads ? item.bookedFromNewLeads/item.leads : 0; return item; }).sort(function (a,b) { return b.leads-a.leads || a.service.localeCompare(b.service); }),
          segments:["Roofing","Solar"].map(function (segment) {
            var segmentRows = rows.filter(function (row) { return rowSegments(row).indexOf(segment) >= 0; });
            var segmentAppointments = appointmentRows.filter(function (row) { return rowSegments(row).indexOf(segment) >= 0; });
            var segmentBookings = bookingRows.filter(function (row) { return rowSegments(row).indexOf(segment) >= 0; });
            var bookedFromNewLeads = segmentRows.filter(function (row) { return row.bookedEver; }).length;
            return {
              segment:segment,
              leads:segmentRows.length,
              bookedFromNewLeads:bookedFromNewLeads,
              totalBookedInRange:segmentBookings.length,
              bookingRate:segmentRows.length ? bookedFromNewLeads / segmentRows.length : 0,
              appointmentsInRange:segmentAppointments.length,
              activeScheduled:segmentAppointments.filter(function (row) { return row.scheduleCategory === "Scheduled" || row.scheduleCategory === "Rescheduled"; }).length,
              completed:segmentAppointments.filter(function (row) { return row.scheduleCategory === "Completed"; }).length
            };
          }),
          sources:Object.keys(sources).map(function (label) { return { label:label, count:sources[label] }; }).sort(function (a,b) { return b.count-a.count; })
        };
      }

      function renderBanners() {
        var messages = [];
        ((state.bootstrap && state.bootstrap.warnings) || []).forEach(function (message) { messages.push({ type:"info", message:message }); });
        ((state.report && state.report.warnings) || []).forEach(function (message) { messages.push({ type:state.report.mode === "demo" ? "" : "info", message:message }); });
        if (state.bootstrap && state.bootstrap.connected && !state.settings.mapping.service) {
          messages.push({ type:"", message:"Map the HubSpot service property to unlock the service breakdown." });
        }
        $("#banners").innerHTML = messages.map(function (item) {
          return '<div class="banner ' + item.type + '"><span>' + escapeHtml(item.message) + '</span><button type="button" onclick="this.parentElement.remove()">Dismiss</button></div>';
        }).join("");
      }

      function renderKpis(rows, metrics) {
        var duplicateCount = state.report ? state.report.summary.duplicatesRemoved : 0;
        var historyAvailable = !state.report || state.report.summary.bookingHistoryAvailable !== false;
        var bookingCount = historyAvailable ? number.format(metrics.bookedFromNewLeads) : "—";
        var bookingRate = historyAvailable ? percent(metrics.total ? metrics.bookedFromNewLeads / metrics.total : 0) : "—";
        var totalBooked = historyAvailable ? number.format(metrics.totalBookedInRange) : "—";
        var cards = [
          { label:"Unique new leads", value:number.format(metrics.total), note:rows.length === state.report.rows.length ? "After history-wide duplicate removal" : "Matches current filters", glow:"rgba(57,198,216,.13)" },
          { label:"Booked from new leads", value:bookingCount, note:"Created in range and ever entered Appointment Set", glow:"rgba(73,207,147,.13)" },
          { label:"New-lead booking rate", value:bookingRate, note:"Booked cohort leads ÷ unique new leads", glow:"rgba(57,198,216,.13)" },
          { label:"Total booked in range", value:totalBooked, note:"Appointment Set changes from any create date", glow:"rgba(255,138,31,.14)" },
          { label:"Appointments occurring", value:number.format(metrics.appointmentsInRange), note:"Based on actual appointment date", glow:"rgba(157,140,255,.13)" },
          { label:"Duplicates removed", value:number.format(duplicateCount), note:number.format(state.report.summary.duplicateGroups) + " duplicate groups overall", glow:"rgba(241,199,91,.12)" }
        ];
        $("#kpis").innerHTML = cards.map(function (card) {
          return '<article class="kpi" style="--kpi-glow:' + card.glow + '"><div class="kpi-label"><span>' + escapeHtml(card.label) + '</span></div><div class="kpi-value">' + escapeHtml(card.value) + '</div><div class="kpi-note">' + escapeHtml(card.note) + '</div></article>';
        }).join("");
      }

      function renderSegmentCards(segments) {
        $("#segment-cards").innerHTML = segments.map(function (item) {
          var className = item.segment.toLowerCase();
          return '<article class="segment-card ' + className + '"><div class="segment-head"><div class="segment-name">' + escapeHtml(item.segment) + '</div><div class="segment-rate">' + percent(item.bookingRate) + '</div></div><div class="segment-stats"><div class="segment-stat"><strong>' + number.format(item.leads) + '</strong><span>Unique leads</span></div><div class="segment-stat"><strong>' + number.format(item.bookedFromNewLeads) + '</strong><span>Booked leads</span></div><div class="segment-stat"><strong>' + number.format(item.totalBookedInRange) + '</strong><span>Total booked in range</span></div></div></article>';
        }).join("");
      }

      function trendData(rows, bookingRows) {
        var start = new Date($("#start-date").value + "T00:00:00");
        var end = new Date($("#end-date").value + "T00:00:00");
        var map = {};
        rows.forEach(function (row) {
          var key = localDateKey(row.createdAt);
          if (!key) return;
          if (!map[key]) map[key] = { leads:0, booked:0 };
          map[key].leads += 1;
        });
        bookingRows.forEach(function (row) {
          var key = localDateKey(row.bookingDate);
          if (!key) return;
          if (!map[key]) map[key] = { leads:0, booked:0 };
          map[key].booked += 1;
        });
        var output = [];
        var cursor = new Date(start);
        while (cursor <= end && output.length < 367) {
          var key = dateInputValue(cursor);
          output.push({ date:new Date(cursor), leads:(map[key] || {}).leads || 0, booked:(map[key] || {}).booked || 0 });
          cursor.setDate(cursor.getDate() + 1);
        }
        return output;
      }

      function renderTrend(rows, bookingRows) {
        var data = trendData(rows, bookingRows);
        if (!data.length) { $("#trend").innerHTML = '<div class="empty">No dates in this range.</div>'; return; }
        var max = Math.max.apply(null, data.map(function (item) { return Math.max(item.leads, item.booked); }).concat([1]));
        var labelEvery = Math.max(1, Math.ceil(data.length / 7));
        $("#trend").innerHTML = data.map(function (item, index) {
          var leadHeight = item.leads ? clamp((item.leads / max) * 100, 4, 100) : 1;
          var appointmentHeight = item.booked ? clamp((item.booked / max) * 100, 4, 100) : 1;
          var title = dateTime.format(item.date) + ": " + item.leads + " leads, " + item.booked + " booked";
          var label = index % labelEvery === 0 || index === data.length - 1 ? '<span class="day-label">' + escapeHtml(dateShort.format(item.date)) + '</span>' : "";
          return '<div class="day-group" title="' + escapeHtml(title) + '"><div class="day-leads" style="height:' + leadHeight + '%"></div><div class="day-appts" style="height:' + appointmentHeight + '%"></div>' + label + '</div>';
        }).join("");
        $("#trend-sub").textContent = number.format(rows.length) + " unique leads · " + number.format(bookingRows.length) + " total bookings from all contact create dates";
      }

      function renderSchedule(metrics) {
        var total = Math.max(metrics.appointmentsInRange, 1);
        var cursor = 0;
        var segments = [];
        metrics.statuses.forEach(function (item) {
          if (!item.count) return;
          var start = cursor;
          cursor += (item.count / total) * 100;
          segments.push(STATUS_COLORS[item.label] + " " + start.toFixed(2) + "% " + cursor.toFixed(2) + "%");
        });
        $("#donut").style.background = segments.length ? "conic-gradient(" + segments.join(",") + ")" : "var(--border)";
        $("#donut-value").textContent = number.format(metrics.appointmentsInRange);
        $("#status-list").innerHTML = metrics.statuses.map(function (item) {
          return '<div class="status-row"><span class="status-swatch" style="background:' + STATUS_COLORS[item.label] + '"></span><span>' + escapeHtml(item.label) + '</span><span class="status-count">' + number.format(item.count) + '</span></div>';
        }).join("");
      }

      function renderServices(segments) {
        if (!segments.length) { $("#service-breakdown").innerHTML = '<div class="empty">No Roofing or Solar data matches the current filters.</div>'; return; }
        var max = Math.max.apply(null, segments.map(function (item) { return item.leads; }).concat([1]));
        $("#service-breakdown").innerHTML = '<table class="service-table"><thead><tr><th>Business line</th><th>Leads</th><th>Booked leads</th><th>Total booked</th><th>Appts. occurring</th><th>Active</th><th>Rate</th></tr></thead><tbody>' + segments.map(function (item) {
          return '<tr><td class="service-name"><strong>' + escapeHtml(item.segment) + '</strong><div class="mini-bar"><span style="width:' + clamp(item.leads / max * 100, item.leads ? 2 : 0, 100) + '%"></span></div></td><td>' + number.format(item.leads) + '</td><td>' + number.format(item.bookedFromNewLeads) + '</td><td>' + number.format(item.totalBookedInRange) + '</td><td>' + number.format(item.appointmentsInRange) + '</td><td>' + number.format(item.activeScheduled) + '</td><td class="rate">' + percent(item.bookingRate) + '</td></tr>';
        }).join("") + '</tbody></table>';
      }

      function renderSources(sources) {
        if (!sources.length) { $("#source-breakdown").innerHTML = '<div class="empty">No source data matches the current filters.</div>'; return; }
        var max = Math.max.apply(null, sources.map(function (item) { return item.count; }));
        $("#source-breakdown").innerHTML = sources.slice(0,8).map(function (item) {
          return '<div class="source-item"><div class="source-item-head"><span>' + escapeHtml(item.label) + '</span><strong>' + number.format(item.count) + '</strong></div><div class="source-bar"><span style="width:' + clamp(item.count/max*100,2,100) + '%"></span></div></div>';
        }).join("");
      }

      function statusClass(status) {
        return "status-" + status.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
      }

      function maskedName(name) {
        return name.split(/\\s+/).filter(Boolean).map(function (part) { return part.charAt(0) + "."; }).join(" ");
      }

      function displayContact(row) {
        if (state.privacy) return { name:maskedName(row.name), email:row.email ? "••••@••••" : "", phone:row.phone ? "(•••) •••-••••" : "" };
        return { name:row.name, email:row.email, phone:row.phone };
      }

      function renderRows(rows) {
        var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        state.page = clamp(state.page, 1, totalPages);
        var start = (state.page - 1) * PAGE_SIZE;
        var pageRows = rows.slice(start, start + PAGE_SIZE);
        if (!pageRows.length) {
          $("#lead-rows").innerHTML = '<tr><td colspan="8"><div class="empty">No leads match the current filters.</div></td></tr>';
        } else {
          $("#lead-rows").innerHTML = pageRows.map(function (row) {
            var contact = displayContact(row);
            var contactLine = [contact.email, contact.phone].filter(Boolean).map(escapeHtml).join(" · ") || "No contact method";
            var duplicate = row.duplicateCount ? '<div class="duplicate-tag">' + row.duplicateCount + ' duplicate record' + (row.duplicateCount === 1 ? '' : 's') + ' suppressed</div>' : "";
            var appointmentMain = row.appointmentDate ? dateTime.format(new Date(row.appointmentDate)) : (row.rawScheduleStatus || "No appointment date");
            var appointmentSub = [row.appointmentType, row.scheduleSource].filter(Boolean).join(" · ");
            var bookedMain = row.bookedEver && row.lastBookedAt ? dateTime.format(new Date(row.lastBookedAt)) : "Not booked";
            var bookedSub = row.bookedEver ? "Entered Lifecycle stage: Appointment Set" : "No Appointment Set history";
            var segmentLabel = rowSegments(row).join(" + ") || "Unclassified";
            return '<tr><td><div class="lead-main personal">' + escapeHtml(contact.name) + '</div><div class="lead-contact personal">' + contactLine + '</div>' + duplicate + '</td><td><span class="badge">' + escapeHtml(segmentLabel) + '</span><div class="appointment-sub">' + escapeHtml(row.service) + '</div></td><td><div class="appointment-main">' + escapeHtml(bookedMain) + '</div><div class="appointment-sub">' + escapeHtml(bookedSub) + '</div></td><td><span class="badge ' + statusClass(row.scheduleCategory) + '">' + escapeHtml(row.scheduleCategory) + '</span><div class="appointment-sub">' + escapeHtml(row.rawScheduleStatus || "") + '</div></td><td><div class="appointment-main">' + escapeHtml(appointmentMain) + '</div><div class="appointment-sub">' + escapeHtml(appointmentSub) + '</div></td><td><div>' + escapeHtml(sourceForRow(row)) + '</div><div class="appointment-sub">' + escapeHtml(row.leadSubsource || "") + '</div></td><td>' + escapeHtml(row.owner) + '</td><td>' + escapeHtml(row.createdAt ? dateShort.format(new Date(row.createdAt)) : "—") + '</td></tr>';
          }).join("");
        }
        var first = rows.length ? start + 1 : 0;
        var last = Math.min(start + PAGE_SIZE, rows.length);
        $("#page-label").textContent = number.format(first) + "–" + number.format(last) + " of " + number.format(rows.length);
        $("#prev-page").disabled = state.page <= 1;
        $("#next-page").disabled = state.page >= totalPages;
      }

      function renderQuality(rows) {
        var quality = [
          { value:rows.filter(function (row) { return !row.email && !row.phone; }).length, label:"No email or phone" },
          { value:rows.filter(function (row) { return !rowSegments(row).length; }).length, label:"Not classified as Roofing or Solar" },
          { value:rows.filter(function (row) { return row.scheduleCategory === "Other / review"; }).length, label:"Scheduling status needs review" }
        ];
        $("#quality-grid").innerHTML = quality.map(function (item) { return '<div class="quality-card"><div class="quality-value">' + number.format(item.value) + '</div><div class="quality-label">' + escapeHtml(item.label) + '</div></div>'; }).join("");
      }

      function renderDuplicates() {
        var groups = (state.report && state.report.duplicateAudit) || [];
        if (!groups.length) { $("#duplicate-list").innerHTML = '<div class="empty">No duplicate contacts were found in this period.</div>'; return; }
        $("#duplicate-list").innerHTML = groups.map(function (group) {
          var name = state.privacy ? maskedName(group.keptName) : group.keptName;
          return '<div class="duplicate-item"><div class="duplicate-head"><strong class="personal">' + escapeHtml(name) + '</strong><span>' + group.removedIds.length + ' removed</span></div><div class="duplicate-copy">Kept HubSpot ID ' + escapeHtml(group.keptId) + '; suppressed ' + escapeHtml(group.removedIds.join(", ")) + '. ' + escapeHtml(group.reason) + '</div></div>';
        }).join("");
      }

      function setFilterOptions(rows) {
        function options(id, values, firstLabel) {
          var current = $(id).value;
          var unique = Array.from(new Set(values)).filter(Boolean).sort();
          $(id).innerHTML = '<option value="">' + escapeHtml(firstLabel) + '</option>' + unique.map(function (value) { return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'; }).join("");
          if (unique.indexOf(current) >= 0) $(id).value = current;
        }
        options("#status-filter", STATUS_ORDER, "All scheduling outcomes");
        options("#source-filter", rows.map(sourceForRow), "All sources");
      }

      function renderMeta(rows) {
        $("#filtered-count").textContent = number.format(rows.length) + " lead" + (rows.length === 1 ? "" : "s");
        $("#updated-at").textContent = state.report ? "Updated " + dateTime.format(new Date(state.report.generatedAt)) : "Not refreshed";
        var range = selectedRange();
        $("#range-label").textContent = dateShort.format(range.startLabel) + " – " + dateShort.format(range.endLabel) + " · Created date";
      }

      function renderFiltered() {
        if (!state.report) return;
        var rows = filteredRows();
        var appointmentRows = filteredAppointmentRows();
        var bookingRows = filteredBookingRows();
        var metrics = aggregate(rows, appointmentRows, bookingRows);
        renderKpis(rows, metrics);
        renderSegmentCards(metrics.segments);
        renderTrend(rows, bookingRows);
        renderSchedule(metrics);
        renderServices(metrics.segments);
        renderSources(metrics.sources);
        renderRows(rows);
        renderQuality(rows);
        renderMeta(rows);
      }

      function renderAll() {
        renderBanners();
        setFilterOptions(state.report.rows.concat(state.report.appointmentRows || [], state.report.bookingRows || []));
        renderDuplicates();
        renderFiltered();
      }

      function csvCell(value) {
        var text = String(value === null || value === undefined ? "" : value);
        return '"' + text.replace(/"/g,'""') + '"';
      }

      function exportCsv() {
        var rows = filteredRows();
        var header = ["HubSpot ID","Name","Email","Phone","Business line","Raw service","Lifecycle appointment booked","First booked","Latest booked","Scheduling outcome","Raw scheduling status","Appointment date","Appointment type","Scheduling source","Lead source","Lead source detail","Owner","Created","Duplicates suppressed"];
        var lines = [header.map(csvCell).join(",")];
        rows.forEach(function (row) {
          var contact = displayContact(row);
          lines.push([row.id,contact.name,contact.email,contact.phone,rowSegments(row).join(" + ") || "Unclassified",row.service,row.bookedEver ? "Yes" : "No",row.firstBookedAt,row.lastBookedAt,row.scheduleCategory,row.rawScheduleStatus,row.appointmentDate,row.appointmentType,row.scheduleSource,sourceForRow(row),row.leadSubsource,row.owner,row.createdAt,row.duplicateCount].map(csvCell).join(","));
        });
        var blob = new Blob(["\ufeff" + lines.join("\\r\\n")], { type:"text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "velocity-leads-" + $("#start-date").value + "-to-" + $("#end-date").value + (state.privacy ? "-masked" : "") + ".csv";
        link.click();
        URL.revokeObjectURL(url);
      }

      function bindEvents() {
        $$(".preset").forEach(function (button) {
          button.addEventListener("click", function () { setPreset(Number(button.dataset.days)); loadReport(); });
        });
        $("#refresh-btn").addEventListener("click", loadReport);
        $("#settings-btn").addEventListener("click", function () { fillSettingsForm(); $("#settings-dialog").showModal(); });
        $("#save-settings").addEventListener("click", async function () {
          readSettingsForm();
          $("#settings-dialog").close();
          var saveError = null;
          try { await saveSettingsToCloudflare(); } catch (error) { saveError = error; }
          await loadReport();
          if (saveError) showError("The mapping is saved in this browser, but Cloudflare could not save it: " + saveError.message);
        });
        $("#privacy-btn").addEventListener("click", function () {
          state.privacy = !state.privacy;
          $("#shell").classList.toggle("privacy", state.privacy);
          $("#privacy-btn").classList.toggle("primary", state.privacy);
          renderRows(filteredRows());
          renderDuplicates();
        });
        $("#search").addEventListener("input", function (event) { state.filters.search=event.target.value; state.page=1; renderFiltered(); });
        $("#segment-filter").addEventListener("change", function (event) {
          state.filters.segment = event.target.value;
          state.filters.source = "";
          $("#source-filter").value = "";
          state.page = 1;
          setFilterOptions(filteredRows().concat(filteredAppointmentRows(), filteredBookingRows()));
          renderFiltered();
        });
        $("#status-filter").addEventListener("change", function (event) { state.filters.status=event.target.value; state.page=1; renderFiltered(); });
        $("#source-filter").addEventListener("change", function (event) { state.filters.source=event.target.value; state.page=1; renderFiltered(); });
        $("#prev-page").addEventListener("click", function () { state.page-=1; renderRows(filteredRows()); });
        $("#next-page").addEventListener("click", function () { state.page+=1; renderRows(filteredRows()); });
        $("#export-btn").addEventListener("click", exportCsv);
        $("#start-date").addEventListener("change", function () { state.preset=0; $$(".preset").forEach(function (button) { button.classList.remove("active"); }); });
        $("#end-date").addEventListener("change", function () { state.preset=0; $$(".preset").forEach(function (button) { button.classList.remove("active"); }); });
      }

      async function init() {
        loadSavedSettings();
        setPreset(21);
        bindEvents();
        try {
          await bootstrap();
          await loadReport();
        } catch (error) {
          setLoading(false);
          showError(error.message);
          $("#connection-pill").lastElementChild.textContent = "Connection issue";
        }
      }

      init();
    })();
  </script>
</body>
</html>`;
