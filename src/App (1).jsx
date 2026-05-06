import { useState, useEffect, useRef } from "react";

const C = {
  blue:"#4780BD", blueDark:"#2d5a8e", blueDeep:"#1a3a5c",
  gold:"#E0A92C", navy:"#3B4758", navyDark:"#252e38",
  navyDeep:"#141920", white:"#f5f8ff", muted:"#8ba3bd", mutedDark:"#4a6070",
};

// ── In production this points to your deployed backend
// ── In development it points to localhost:3001
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ══════════════════════════════════════════════════════════════════════════
// SIGNING FACTORS (same as before)
// ══════════════════════════════════════════════════════════════════════════
const signingFactors = [
  { id:"age30",        category:"Age",               label:"Age 30 or over",                                           points:1 },
  { id:"age33",        category:"Age",               label:"Age 33 or over",                                           points:1, conditional:"age30" },
  { id:"age21",        category:"Age",               label:"Age 21 or under",                                          points:1 },
  { id:"acl",          category:"Surgical History",  label:"Previous ACL reconstruction",                              points:2 },
  { id:"majorsurgery", category:"Surgical History",  label:"Other major lower-limb surgery (meniscus, Achilles, hip)", points:1 },
  { id:"hamstring",    category:"Injury History",    label:"Previous hamstring injury",                                points:1 },
  { id:"recurrent",    category:"Injury History",    label:"2 or more significant injuries in the last 3 years",      points:1 },
  { id:"currentinjury",category:"Current Status",    label:"Currently injured or not fully fit",                       points:2 },
  { id:"tendinopathy", category:"Current Status",    label:"Active tendinopathy (Achilles or patellar, symptomatic)", points:1 },
  { id:"avail20",      category:"Recent Availability",label:"Played fewer than 20 games last season",                 points:1 },
  { id:"avail10",      category:"Recent Availability",label:"Played fewer than 10 games last season",                 points:1, conditional:"avail20" },
  { id:"highload",     category:"Load History",      label:"Played 50 or more games across all competitions last season",points:1 },
];
const SIGNING_MAX = 13;
const signingCategories = [...new Set(signingFactors.map(f=>f.category))];

const getSigningRisk = s => {
  if(s===0) return{label:"Minimal Risk", color:"#4ade80",printColor:"#15803d",bar:4};
  if(s<=2)  return{label:"Low Risk",     color:"#86efac",printColor:"#16a34a",bar:22};
  if(s<=4)  return{label:"Moderate Risk",color:C.gold,   printColor:"#b45309",bar:50};
  if(s<=6)  return{label:"High Risk",    color:"#fb923c",printColor:"#c2410c",bar:75};
  return         {label:"Very High Risk",color:"#f87171",printColor:"#dc2626",bar:100};
};
const getSigningRec = s => {
  if(s===0) return"Ideal profile. Sign with confidence.";
  if(s<=2)  return"Good profile. Standard pre-signing medical sufficient.";
  if(s<=4)  return"Proceed with caution. Enhanced medical due diligence required. Consider availability-linked contract incentives.";
  if(s<=6)  return"High risk. Only sign if talent clearly justifies it. Short contract, performance clauses, and independent medical essential.";
  return"Very high risk. Avoid unless exceptional. Minimise financial exposure — low base wage, high appearance bonuses only.";
};

// ══════════════════════════════════════════════════════════════════════════
// PLAYER SEARCH COMPONENT
// ══════════════════════════════════════════════════════════════════════════
function PlayerSearch({ onSelect }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch { setResults([]); }
      finally  { setLoading(false); }
    }, 400);
  }, [query]);

  return (
    <div style={{ position:"relative", marginBottom:20 }}>
      <label style={{ display:"block", fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.mutedDark, fontWeight:700, marginBottom:6 }}>
        Search Player (Transfermarkt)
      </label>
      <div style={{ position:"relative" }}>
        <input
          type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search any professional player globally…"
          style={{ width:"100%", boxSizing:"border-box", background:C.navyDark, border:`1px solid ${C.blue}`, borderRadius:8, padding:"11px 40px 11px 14px", color:C.white, fontSize:14, outline:"none", fontFamily:"inherit" }}
        />
        <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:loading?C.gold:C.mutedDark, fontSize:16 }}>
          {loading ? "⟳" : "🔍"}
        </div>
      </div>
      {open && results.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:C.navyDark, border:`1px solid ${C.blue}`, borderRadius:8, zIndex:100, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", marginTop:4, maxHeight:320, overflowY:"auto" }}>
          {results.map(r => (
            <div key={r.id} onClick={() => { onSelect(r); setOpen(false); setQuery(r.name); }}
              style={{ padding:"10px 14px", cursor:"pointer", borderBottom:`1px solid ${C.navy}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}
              onMouseEnter={e => e.currentTarget.style.background = C.blueDeep}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.white }}>{r.name}</div>
                <div style={{ fontSize:11, color:C.mutedDark }}>{r.position} · {r.club}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                {r.age && <div style={{ fontSize:12, color:C.muted }}>Age {r.age}</div>}
                {r.nationality && <div style={{ fontSize:11, color:C.mutedDark }}>{r.nationality}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, background:C.navyDark, border:`1px solid ${C.navy}`, borderRadius:8, padding:"14px", color:C.mutedDark, fontSize:13, marginTop:4 }}>
          No players found. Try a different name.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// AVAILABILITY GAUGE
// ══════════════════════════════════════════════════════════════════════════
function UnifiedRiskPanel({ signingRisk, availIndex, nadeemScore, seasonStats, avgInjuryDays, avgInjuryCount, longestAbsence }) {
  if (!signingRisk) return null;
  const { combinedRisk, nadeemRisk, availRisk, riskBand, riskColor, recommendation,
          predictedAvailPct, pctLow, pctHigh, gamesLow, gamesMid, gamesHigh, confidence, weights } = signingRisk;

  return (
    <div style={{ marginBottom:22 }}>
      {/* ── MAIN UNIFIED SCORE ─────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg,${C.navyDark},${C.blueDeep}44)`, border:`2px solid ${riskColor}66`, borderRadius:14, padding:"22px 24px", marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:16 }}>
          <div style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:C.gold, fontWeight:700 }}>
            ⚡ Nadeem Signing Risk Score
          </div>
          <div style={{ fontSize:10, color:C.mutedDark, background:C.navyDeep, borderRadius:5, padding:"3px 10px", border:`1px solid ${C.navy}` }}>
            Lower score = safer to sign · 0 = no risk · 100 = maximum risk
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"flex-start", gap:20, flexWrap:"wrap", marginBottom:16 }}>
          {/* Big number */}
          <div style={{ textAlign:"center", minWidth:110 }}>
            <div style={{ position:"relative", width:100, height:100, margin:"0 auto" }}>
              <svg viewBox="0 0 100 100" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke={C.navy} strokeWidth="9"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke={riskColor} strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 42 * combinedRisk / 100} ${2 * Math.PI * 42}`}
                  strokeLinecap="round"/>
              </svg>
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
                <div style={{ fontSize:26, fontWeight:800, color:riskColor, lineHeight:1 }}>{combinedRisk}</div>
                <div style={{ fontSize:9, color:C.mutedDark }}>/ 100</div>
              </div>
            </div>
            <div style={{ marginTop:8, display:"inline-block", background:riskColor+"20", border:`1px solid ${riskColor}50`, borderRadius:6, padding:"4px 12px", fontSize:12, fontWeight:700, color:riskColor }}>{riskBand}</div>
          </div>

          {/* Components */}
          <div style={{ flex:1, minWidth:180 }}>

            {/* How it's calculated — plain English */}
            <div style={{ background:C.navyDeep, borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:11, color:C.muted, lineHeight:1.6 }}>
              <span style={{ color:C.white, fontWeight:700 }}>How this score works: </span>
              The Nadeem Signing Risk Score combines two things — clinical risk ({weights.nadeem}%) and historical availability ({weights.availability}%).
              A score of <span style={{ color:"#4ade80", fontWeight:700 }}>0–20</span> means sign with confidence.
              <span style={{ color:"#fb923c", fontWeight:700 }}> 50+</span> means significant caution.
              <span style={{ color:"#f87171", fontWeight:700 }}> 65+</span> means avoid or protect financially.
            </div>

            {/* Nadeem Score contribution */}
            <div style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5 }}>
                <div>
                  <span style={{ color:C.muted, fontWeight:600 }}>Clinical Risk (Nadeem Score)</span>
                  <span style={{ color:C.mutedDark, marginLeft:8 }}>— surgical & injury history, age, fitness</span>
                </div>
                <span style={{ color:C.blue, fontWeight:700, flexShrink:0, marginLeft:8 }}>{nadeemScore}/13 pts</span>
              </div>
              <div style={{ height:7, background:C.navy, borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${nadeemRisk}%`, background:C.blue, borderRadius:4, transition:"width 0.4s" }}/>
              </div>
              <div style={{ fontSize:10, color:C.mutedDark, marginTop:3 }}>Contributes {nadeemRisk}% risk to combined score (weighted {weights.nadeem}%)</div>
            </div>

            {/* Availability Index contribution */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5 }}>
                <div>
                  <span style={{ color:C.muted, fontWeight:600 }}>Historical Availability</span>
                  <span style={{ color:C.mutedDark, marginLeft:8 }}>— actual games played, injury days, trend</span>
                </div>
                <span style={{ color:availIndex?.color || C.gold, fontWeight:700, flexShrink:0, marginLeft:8 }}>{availIndex?.score}/10 · {availIndex?.label}</span>
              </div>
              <div style={{ height:7, background:C.navy, borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${availRisk}%`, background:availIndex?.color || C.gold, borderRadius:4, transition:"width 0.4s" }}/>
              </div>
              <div style={{ fontSize:10, color:C.mutedDark, marginTop:3 }}>
                Index of {availIndex?.score}/10 ({availIndex?.label}) → contributes {availRisk}% risk (weighted {weights.availability}%)
                <span style={{ color:C.mutedDark }}> · Higher index = better availability history</span>
              </div>
            </div>

            {/* Recommendation */}
            <div style={{ background:C.navyDeep, border:`1px solid ${riskColor}33`, borderLeft:`3px solid ${riskColor}`, borderRadius:6, padding:"8px 12px", fontSize:11, color:C.muted, lineHeight:1.5 }}>
              <span style={{ color:C.white, fontWeight:700 }}>Recommendation: </span>{recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMNS: Availability Prediction + Availability Index ─── */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:12 }}>
        {/* Predicted availability */}
        <div style={{ flex:1, minWidth:200, background:C.navyDark, border:`1px solid ${riskColor}33`, borderRadius:10, padding:"16px 18px" }}>
          <div style={{ fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase", color:C.mutedDark, fontWeight:700, marginBottom:10 }}>🎯 Predicted Availability</div>
          <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:4 }}>
            <span style={{ fontSize:36, fontWeight:800, color:riskColor, lineHeight:1 }}>{predictedAvailPct}%</span>
            <span style={{ fontSize:13, color:C.mutedDark }}>({gamesMid} games)</span>
          </div>
          <div style={{ fontSize:11, color:C.mutedDark, marginBottom:10 }}>Range: {pctLow}–{pctHigh}% · {gamesLow}–{gamesHigh} games</div>
          <div style={{ position:"relative", height:8, background:C.navy, borderRadius:4, overflow:"visible", marginBottom:4 }}>
            <div style={{ position:"absolute", left:`${pctLow}%`, width:`${pctHigh-pctLow}%`, height:"100%", background:riskColor+"44", borderRadius:4 }}/>
            <div style={{ position:"absolute", left:`${predictedAvailPct}%`, transform:"translateX(-50%)", top:-3, width:14, height:14, background:riskColor, borderRadius:"50%", border:`2px solid ${C.navyDeep}` }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.mutedDark, marginTop:2 }}>
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
          <div style={{ fontSize:10, color:C.mutedDark, marginTop:8 }}>Confidence: {confidence}</div>
        </div>

        {/* Availability Index breakdown */}
        {availIndex && (
          <div style={{ flex:1, minWidth:200, background:C.navyDark, border:`1px solid ${availIndex.color}33`, borderRadius:10, padding:"16px 18px" }}>
            <div style={{ fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase", color:C.mutedDark, fontWeight:700, marginBottom:4 }}>📊 Availability Index</div>
            <div style={{ fontSize:9, color:C.mutedDark, marginBottom:10 }}>Higher = better availability history · 10 = perfect · 0 = very poor</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:10 }}>
              <span style={{ fontSize:36, fontWeight:800, color:availIndex.color, lineHeight:1 }}>{availIndex.score}</span>
              <span style={{ fontSize:13, color:C.mutedDark }}>/10 · {availIndex.label}</span>
            </div>
            {Object.entries(availIndex.breakdown || {}).map(([key, val]) => (
              <div key={key} style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5 }}>
                <span style={{ color:C.mutedDark, textTransform:"capitalize" }}>{key.replace(/([A-Z])/g," $1").trim()}</span>
                <span style={{ color:C.muted }}>{val.value}
                  <span style={{ color: val.deduction < 0 ? "#f87171" : val.deduction > 0 ? "#4ade80" : C.mutedDark, marginLeft:6, fontWeight:700 }}>
                    {val.deduction < 0 ? val.deduction : val.deduction > 0 ? `+${val.deduction}` : ""}
                  </span>
                </span>
              </div>
            ))}
            {avgInjuryDays !== undefined && (
              <div style={{ borderTop:`1px solid ${C.navy}`, paddingTop:8, marginTop:4, display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ fontSize:10, color:C.mutedDark }}>Avg injury days/season: <span style={{ color:C.muted, fontWeight:700 }}>{avgInjuryDays}</span></div>
                <div style={{ fontSize:10, color:C.mutedDark }}>Injuries/season: <span style={{ color:C.muted, fontWeight:700 }}>{avgInjuryCount}</span></div>
                <div style={{ fontSize:10, color:C.mutedDark }}>Longest absence: <span style={{ color:C.muted, fontWeight:700 }}>{longestAbsence}d</span></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SEASON HISTORY ─────────────────────────────────────────────── */}
      {seasonStats && seasonStats.length > 0 && (
        <div style={{ background:C.navyDark, border:`1px solid ${C.navy}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase", color:C.mutedDark, fontWeight:700, marginBottom:10 }}>Season-by-Season Availability</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {seasonStats.slice(0,5).map(s => {
              const pct = s.availPct || Math.min(100, Math.round((s.apps / 46) * 100));
              const col = pct >= 75 ? "#4ade80" : pct >= 55 ? C.gold : "#f87171";
              return (
                <div key={s.season} style={{ flex:1, minWidth:70, background:C.navyDeep, border:`1px solid ${C.navy}`, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:10, color:C.mutedDark, marginBottom:3 }}>{s.season}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:col, lineHeight:1 }}>{pct}%</div>
                  <div style={{ fontSize:10, color:C.mutedDark, marginBottom:4 }}>{s.apps} apps</div>
                  <div style={{ height:3, background:C.navy, borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:2 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DATA COMPLETENESS BADGE
// ══════════════════════════════════════════════════════════════════════════
function DataBadge({ completeness, source }) {
  const color = completeness >= 80 ? "#4ade80" : completeness >= 50 ? C.gold : "#f87171";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, background:C.navyDark, border:`1px solid ${C.navy}`, borderRadius:8, padding:"8px 14px", marginBottom:16, fontSize:11 }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
      <span style={{ color:C.muted }}>Data completeness: </span>
      <span style={{ color, fontWeight:700 }}>{completeness}%</span>
      <span style={{ color:C.mutedDark, marginLeft:4 }}>· Source: {source}</span>
      {completeness < 80 && <span style={{ color:C.mutedDark, marginLeft:4 }}>— verify flagged fields manually</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// INJURY HISTORY TABLE
// ══════════════════════════════════════════════════════════════════════════
function InjuryTable({ injuries }) {
  const [expanded, setExpanded] = useState(false);
  if (!injuries || injuries.length === 0) return (
    <div style={{ background:C.navyDark, border:`1px solid ${C.navy}`, borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:12, color:C.mutedDark }}>
      No injury history found in public records.
    </div>
  );

  const shown = expanded ? injuries : injuries.slice(0, 5);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:C.blue, fontWeight:700, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.navyDark}`, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ display:"inline-block", width:3, height:10, background:C.gold, borderRadius:2 }}/>
        Injury History ({injuries.length} records)
      </div>
      {shown.map((inj, i) => {
        const isHamstring = /hamstring/.test(inj.injury);
        const isACL       = /acl|cruciate/.test(inj.injury);
        const isSurgical  = /surgery|operati|meniscus|achilles/.test(inj.injury);
        const flagColor   = isACL ? "#f87171" : isHamstring ? "#fb923c" : isSurgical ? C.gold : C.mutedDark;
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background: i%2===0?C.navyDark:"transparent", borderRadius:6, marginBottom:2, fontSize:12 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:flagColor, flexShrink:0 }}/>
            <div style={{ width:60, color:C.mutedDark }}>{inj.season}</div>
            <div style={{ flex:1, color:C.muted, textTransform:"capitalize" }}>{inj.injury}</div>
            <div style={{ color:C.mutedDark, minWidth:60, textAlign:"right" }}>{inj.daysOut}d out</div>
          </div>
        );
      })}
      {injuries.length > 5 && (
        <button onClick={() => setExpanded(!expanded)} style={{ background:"none", border:`1px solid ${C.navy}`, borderRadius:6, padding:"5px 12px", color:C.mutedDark, fontSize:11, cursor:"pointer", fontFamily:"inherit", marginTop:6 }}>
          {expanded ? "Show less" : `Show all ${injuries.length} injuries`}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// AUTO-POPULATED SIGNING SCORE
// ══════════════════════════════════════════════════════════════════════════
function AutoSigningScore({ playerData, onClear }) {
  const { flags: autoFlags, nadeemScore: autoScore, signingRisk, availIndex, seasonStats, injuries, dataCompleteness, name, age, position, club, nationality, avgInjuryDays, avgInjuryCount, longestAbsence } = playerData;

  const [overrides, setOverrides] = useState({});
  const [evid, setEvid]           = useState({});
  const [notes, setNotes]         = useState("");
  const [summary, setSummary]     = useState(false);

  const now = () => new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" });

  // Merge auto flags with any manual overrides
  const flags = { ...autoFlags, ...overrides };

  const score = signingFactors.reduce((s, f) => {
    if (!(flags[f.id]) || (f.conditional && !flags[f.conditional])) return s;
    return s + f.points;
  }, 0);

  const risk   = getSigningRisk(score);
  const barPct = Math.round((score / SIGNING_MAX) * 100);

  const toggleOverride = (id) => {
    setOverrides(p => ({ ...p, [id]: !flags[id] }));
  };
  const toggleEvid = (id, e) => { e.stopPropagation(); setEvid(p => ({ ...p, [id]: !p[id] })); };

  if (summary) return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, justifyContent:"flex-end" }}>
        <button onClick={() => window.print()} style={{ background:C.blue, border:"none", borderRadius:8, padding:"10px 20px", color:C.white, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>🖨 Print / Save PDF</button>
        <button onClick={() => setSummary(false)} style={{ background:"none", border:`1px solid ${C.navy}`, borderRadius:8, padding:"10px 20px", color:C.mutedDark, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
      </div>
      {/* Print summary */}
      <div style={{ background:"#fff", color:"#111", padding:"32px 40px", fontFamily:"Arial,sans-serif", borderRadius:8 }}>
        <div style={{ borderBottom:"3px solid #4780BD", paddingBottom:16, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, color:"#4780BD", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:4 }}>Sheffield Wednesday FC · Performance Medicine</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#1E2A38" }}>Nadeem Score — Automated Signing Risk Assessment</div>
              <div style={{ fontSize:11, color:"#666" }}>Dr Taaha Nadeem · MBChB, MRCGP, PgDipSEM, MSc Sports Directorship (current)</div>
            </div>
            <div style={{ textAlign:"right", fontSize:11, color:"#666" }}>
              <div>Date: {now()}</div>
              <div>Data: Transfermarkt + Manual Review</div>
              <div>Confidential — Clinical Record</div>
            </div>
          </div>
        </div>
        {/* Player info */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {[["Player", name],["Age", age],["Position", position],["Club", club]].map(([l,v]) => (
            <div key={l} style={{ background:"#f8f9fa", borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#1E2A38" }}>{v || "—"}</div>
            </div>
          ))}
        </div>
        {/* Score + availability */}
        <div style={{ display:"flex", gap:16, marginBottom:20 }}>
          <div style={{ flex:1, textAlign:"center", border:`2px solid ${risk.printColor}`, borderRadius:10, padding:"16px" }}>
            <div style={{ fontSize:11, color:"#888", textTransform:"uppercase", marginBottom:4 }}>Nadeem Score</div>
            <div style={{ fontSize:48, fontWeight:800, color:risk.printColor, lineHeight:1 }}>{score}</div>
            <div style={{ fontSize:11, color:"#888" }}>/ {SIGNING_MAX}</div>
          </div>
          <div style={{ flex:1, textAlign:"center", border:`2px solid ${risk.printColor}`, background:risk.printColor+"10", borderRadius:10, padding:"16px" }}>
            <div style={{ fontSize:11, color:"#888", textTransform:"uppercase", marginBottom:4 }}>Risk Band</div>
            <div style={{ fontSize:24, fontWeight:800, color:risk.printColor }}>{risk.label}</div>
          </div>
          {signingRisk && (
            <div style={{ flex:1, textAlign:"center", border:`2px solid ${signingRisk.riskColor}`, background:signingRisk.riskColor+"10", borderRadius:10, padding:"16px" }}>
              <div style={{ fontSize:11, color:"#888", textTransform:"uppercase", marginBottom:4 }}>Signing Risk Score</div>
              <div style={{ fontSize:32, fontWeight:800, color:signingRisk.riskColor, lineHeight:1 }}>{signingRisk.combinedRisk}/100</div>
              <div style={{ fontSize:12, color:"#888" }}>{signingRisk.riskBand}</div>
              <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{signingRisk.predictedAvailPct}% availability · {signingRisk.gamesLow}–{signingRisk.gamesHigh} games</div>
            </div>
          )}
        </div>
        {/* Recommendation */}
        <div style={{ background:"#f0f7ff", border:"1px solid #4780BD", borderLeft:"4px solid #4780BD", borderRadius:8, padding:"12px 16px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#4780BD", textTransform:"uppercase", marginBottom:4 }}>Clinical Recommendation</div>
          <div style={{ fontSize:13, color:"#1E2A38", lineHeight:1.5 }}>{getSigningRec(score)}</div>
        </div>
        {/* Flagged factors */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"#dc2626", marginBottom:8, paddingBottom:6, borderBottom:"1px solid #eee" }}>
            Risk Factors Present
          </div>
          {signingFactors.filter(f => flags[f.id] && !(f.conditional && !flags[f.conditional])).map(f => (
            <div key={f.id} style={{ fontSize:12, color:"#1E2A38", marginBottom:4 }}>
              ✕ {f.label} <span style={{ color:"#dc2626", fontWeight:700 }}>+{f.points}pt{f.points>1?"s":""}</span>
              {overrides[f.id] !== undefined ? " (manually adjusted)" : " (from Transfermarkt)"}
            </div>
          ))}
        </div>
        {notes && (
          <div style={{ background:"#fffbeb", border:"1px solid #E0A92C", borderRadius:8, padding:"12px 16px", marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#b45309", textTransform:"uppercase", marginBottom:4 }}>Clinical Notes</div>
            <div style={{ fontSize:13, color:"#1E2A38" }}>{notes}</div>
          </div>
        )}
        <div style={{ fontSize:10, color:"#aaa", borderTop:"1px solid #eee", paddingTop:10, display:"flex", justifyContent:"space-between" }}>
          <span>Nadeem Score · Sheffield Wednesday FC · Performance Medicine · Est. 2025</span>
          <span>Automated data: Transfermarkt. Manual overrides noted. Verify against internal medical records.</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Player header */}
      <div style={{ background:`linear-gradient(135deg,${C.navyDark},${C.blueDeep}44)`, border:`1px solid ${C.blue}44`, borderRadius:12, padding:"16px 20px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase", color:C.gold, fontWeight:700, marginBottom:3 }}>Selected Player</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.white }}>{name}</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{position} · {club} · Age {age} · {nationality}</div>
        </div>
        <button onClick={onClear} style={{ background:"none", border:`1px solid ${C.navy}`, borderRadius:8, padding:"7px 16px", color:C.mutedDark, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
          ✕ Clear
        </button>
      </div>

      <DataBadge completeness={dataCompleteness} source="Transfermarkt" />

      {/* Unified Risk Panel */}
      <UnifiedRiskPanel signingRisk={signingRisk} availIndex={availIndex} nadeemScore={score} seasonStats={seasonStats} avgInjuryDays={avgInjuryDays} avgInjuryCount={avgInjuryCount} longestAbsence={longestAbsence} />

      {/* Score card */}
      <div style={{ background:`linear-gradient(135deg,${C.navyDark},#1c2d4088)`, border:`1px solid ${risk.color}44`, borderLeft:`4px solid ${risk.color}`, borderRadius:12, padding:"20px 22px", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.mutedDark, marginBottom:2, fontWeight:600 }}>Nadeem Score</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
              <span style={{ fontSize:56, fontWeight:800, color:risk.color, lineHeight:1 }}>{score}</span>
              <span style={{ color:C.mutedDark, fontSize:15 }}>/ {SIGNING_MAX}</span>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ display:"inline-block", background:risk.color+"20", border:`1px solid ${risk.color}50`, borderRadius:6, padding:"4px 12px", fontSize:12, fontWeight:700, color:risk.color, marginBottom:8 }}>{risk.label}</div>
            <div style={{ fontSize:12, color:C.muted, maxWidth:250, lineHeight:1.55, textAlign:"right" }}>{getSigningRec(score)}</div>
          </div>
        </div>
        <div style={{ height:4, background:C.navy, borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${barPct}%`, background:`linear-gradient(90deg,${risk.color}77,${risk.color})`, borderRadius:2, transition:"width 0.4s" }}/>
        </div>
      </div>

      {/* Factors — auto-populated, manually overridable */}
      <div style={{ background:C.navyDark, border:`1px solid ${C.gold}33`, borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:11, color:C.muted }}>
        <span style={{ color:C.gold, fontWeight:700 }}>Auto-populated from Transfermarkt. </span>
        Click any factor to override if your medical records differ. Overrides are noted in the summary.
      </div>

      {signingCategories.map(cat => (
        <div key={cat} style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:C.blue, fontWeight:700, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.navyDark}`, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ display:"inline-block", width:3, height:10, background:C.gold, borderRadius:2 }}/>{cat}
          </div>
          {signingFactors.filter(f => f.category === cat).map(f => {
            const disabled   = f.conditional && !flags[f.conditional];
            const checked    = !!flags[f.id] && !disabled;
            const isAuto     = autoFlags[f.id] !== undefined && overrides[f.id] === undefined;
            const isOverride = overrides[f.id] !== undefined;
            const open       = evid[f.id];
            return (
              <div key={f.id} style={{ marginBottom:5, opacity:disabled?0.28:1 }}>
                <div onClick={() => !disabled && toggleOverride(f.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 13px", background:checked?`${C.blueDeep}cc`:C.navyDark, border:`1px solid ${checked ? C.blue : C.navy}`, borderBottom:open?"none":undefined, borderRadius:open?"8px 8px 0 0":8, cursor:disabled?"default":"pointer", userSelect:"none" }}>
                  <div style={{ width:17, height:17, borderRadius:4, border:`2px solid ${checked?C.blue:C.mutedDark}`, background:checked?C.blue:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex:1, fontSize:13, color:checked?C.white:C.muted, lineHeight:1.3 }}>
                    {f.conditional && <span style={{ color:C.mutedDark, marginRight:4, fontSize:11 }}>↳</span>}
                    {f.label}
                    {isAuto && <span style={{ marginLeft:8, fontSize:9, fontWeight:700, color:C.gold, background:C.gold+"20", border:`1px solid ${C.gold}40`, borderRadius:4, padding:"1px 5px" }}>AUTO</span>}
                    {isOverride && <span style={{ marginLeft:8, fontSize:9, fontWeight:700, color:"#a78bfa", background:"#a78bfa20", border:"1px solid #a78bfa40", borderRadius:4, padding:"1px 5px" }}>OVERRIDE</span>}
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:checked?C.gold:C.mutedDark, minWidth:36, textAlign:"right" }}>+{f.points}{f.points===1?" pt":" pts"}</div>
                  <button onClick={e=>toggleEvid(f.id,e)} style={{ background:"none", border:"none", cursor:"pointer", color:open?C.blue:C.mutedDark, fontSize:14, padding:"0 2px", lineHeight:1 }}>ⓘ</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Injury table */}
      <InjuryTable injuries={injuries} />

      {/* Clinical notes */}
      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.mutedDark, fontWeight:700, marginBottom:6 }}>Clinical Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add any clinical observations, context or additional risk factors not captured above…"
          style={{ width:"100%", boxSizing:"border-box", background:C.navyDark, border:`1px solid ${C.navy}`, borderRadius:8, padding:"10px 14px", color:C.white, fontSize:13, outline:"none", fontFamily:"inherit", minHeight:80, resize:"vertical" }}/>
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
        <button onClick={() => setSummary(true)} style={{ background:C.blue, border:"none", borderRadius:8, padding:"11px 24px", color:C.white, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          📄 Generate Summary / Print
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN SIGNING TOOL — with search or manual mode
// ══════════════════════════════════════════════════════════════════════════
function EnhancedSigningScore() {
  const [playerData, setPlayerData] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [mode,       setMode]       = useState("search"); // "search" | "manual"

  // Manual mode state (same as original tool)
  const [sel,  setSel]  = useState({});
  const [evid, setEvid] = useState({});
  const [name, setName] = useState("");

  const handleSelect = async (player) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/api/player/${player.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlayerData(data);
    } catch (err) {
      setError("Could not load player data. Try searching again or use manual mode.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[["search","🔍 Auto — Search Player"],["manual","✏️ Manual — Enter Details"]].map(([m,l]) => (
          <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"10px", background:mode===m?C.navyDark:C.navyDeep, border:`2px solid ${mode===m?C.gold:C.navy}`, borderRadius:8, cursor:"pointer", color:mode===m?C.white:C.mutedDark, fontSize:13, fontWeight:mode===m?700:400, fontFamily:"inherit", transition:"all 0.15s" }}>
            {l}
          </button>
        ))}
      </div>

      {mode === "search" && (
        <>
          <PlayerSearch onSelect={handleSelect} />
          {loading && (
            <div style={{ textAlign:"center", padding:"32px", color:C.gold, fontSize:14 }}>
              ⟳ Loading player data from Transfermarkt…
            </div>
          )}
          {error && (
            <div style={{ background:"#450a0a", border:"1px solid #f87171", borderRadius:8, padding:"12px 16px", color:"#f87171", fontSize:13, marginBottom:16 }}>
              {error}
            </div>
          )}
          {playerData && !loading && (
            <AutoSigningScore playerData={playerData} onClear={() => setPlayerData(null)} />
          )}
          {!playerData && !loading && !error && (
            <div style={{ background:C.navyDark, border:`1px solid ${C.navy}`, borderRadius:10, padding:"32px", textAlign:"center", color:C.mutedDark, fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
              <div style={{ fontWeight:700, color:C.muted, marginBottom:6 }}>Search any professional player</div>
              <div>The tool will automatically pull their injury history, availability data and calculate the Nadeem Score from Transfermarkt records.</div>
            </div>
          )}
        </>
      )}

      {mode === "manual" && (
        // Original manual signing tool
        <ManualSigningScore />
      )}
    </div>
  );
}

// ── Manual signing score (original tool, kept as fallback) ────────────────
function ManualSigningScore() {
  const [sel,  setSel]  = useState({});
  const [evid, setEvid] = useState({});
  const [name, setName] = useState("");

  const toggle    = id => setSel(p=>{const n={...p,[id]:!p[id]};const ch=signingFactors.find(f=>f.conditional===id);if(ch&&!n[id])n[ch.id]=false;return n;});
  const toggleEv  = (id,e) => {e.stopPropagation();setEvid(p=>({...p,[id]:!p[id]}));};
  const reset     = () => {setSel({});setEvid({});setName("");};
  const score     = signingFactors.reduce((s,f)=>(!sel[f.id]||(f.conditional&&!sel[f.conditional]))?s:s+f.points,0);
  const risk      = getSigningRisk(score);
  const barPct    = Math.round((score/SIGNING_MAX)*100);

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.mutedDark, fontWeight:700, marginBottom:6 }}>Player Name</label>
        <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter player name…"
          style={{ width:"100%", boxSizing:"border-box", background:C.navyDark, border:`1px solid ${C.navy}`, borderRadius:8, padding:"10px 14px", color:C.white, fontSize:14, outline:"none", fontFamily:"inherit" }}/>
      </div>
      <div style={{ background:`linear-gradient(135deg,${C.navyDark},#1c2d4088)`, border:`1px solid ${risk.color}44`, borderLeft:`4px solid ${risk.color}`, borderRadius:12, padding:"20px 22px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase", color:C.mutedDark, marginBottom:2, fontWeight:600 }}>{name||"Score"}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
              <span style={{ fontSize:56, fontWeight:800, color:risk.color, lineHeight:1 }}>{score}</span>
              <span style={{ color:C.mutedDark, fontSize:15 }}>/ {SIGNING_MAX}</span>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ display:"inline-block", background:risk.color+"20", border:`1px solid ${risk.color}50`, borderRadius:6, padding:"4px 12px", fontSize:12, fontWeight:700, color:risk.color, marginBottom:8 }}>{risk.label}</div>
            <div style={{ fontSize:12, color:C.muted, maxWidth:250, lineHeight:1.55, textAlign:"right" }}>{getSigningRec(score)}</div>
          </div>
        </div>
        <div style={{ height:4, background:C.navy, borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${barPct}%`, background:`linear-gradient(90deg,${risk.color}77,${risk.color})`, borderRadius:2, transition:"width 0.4s" }}/>
        </div>
      </div>
      {signingCategories.map(cat=>(
        <div key={cat} style={{ marginBottom:22 }}>
          <div style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:C.blue, fontWeight:700, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.navyDark}`, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ display:"inline-block", width:3, height:10, background:C.gold, borderRadius:2 }}/>{cat}
          </div>
          {signingFactors.filter(f=>f.category===cat).map(f=>{
            const disabled=f.conditional&&!sel[f.conditional];
            const checked=!!sel[f.id]&&!disabled;
            const open=evid[f.id];
            return(
              <div key={f.id} style={{ marginBottom:5, opacity:disabled?0.28:1 }}>
                <div onClick={()=>!disabled&&toggle(f.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 13px", background:checked?`${C.blueDeep}cc`:C.navyDark, border:`1px solid ${checked?C.blue:C.navy}`, borderBottom:open?"none":undefined, borderRadius:open?"8px 8px 0 0":8, cursor:disabled?"default":"pointer", userSelect:"none" }}>
                  <div style={{ width:17, height:17, borderRadius:4, border:`2px solid ${checked?C.blue:C.mutedDark}`, background:checked?C.blue:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {checked&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex:1, fontSize:13, color:checked?C.white:C.muted, lineHeight:1.3 }}>
                    {f.conditional&&<span style={{ color:C.mutedDark, marginRight:4, fontSize:11 }}>↳</span>}{f.label}
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:checked?C.gold:C.mutedDark, minWidth:36, textAlign:"right" }}>+{f.points}{f.points===1?" pt":" pts"}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ textAlign:"center" }}>
        <button onClick={reset} style={{ background:"none", border:`1px solid ${C.navy}`, borderRadius:8, padding:"9px 26px", color:C.mutedDark, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Reset</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tool, setTool] = useState("signing");
  return (
    <div style={{ minHeight:"100vh", background:C.navyDeep, color:C.white, fontFamily:"'Helvetica Neue',Arial,sans-serif" }}>
      <div style={{ background:`linear-gradient(150deg,${C.navyDark} 0%,#1c2d40 100%)`, borderBottom:`3px solid ${C.blue}`, padding:"20px 28px 0" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{ width:42, height:50, background:`linear-gradient(160deg,${C.blue},${C.blueDeep})`, border:`2px solid ${C.gold}`, borderRadius:"4px 4px 18px 18px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:20 }}>🦉</span>
            </div>
            <div>
              <div style={{ fontSize:10, letterSpacing:"0.22em", textTransform:"uppercase", color:C.gold, fontWeight:700, marginBottom:3 }}>Sheffield Wednesday FC · Performance Medicine</div>
              <div style={{ fontSize:22, fontWeight:800, color:C.white, lineHeight:1 }}>Nadeem Performance Suite</div>
              <div style={{ fontSize:11, color:C.mutedDark, marginTop:3 }}>Dr Taaha Nadeem · MBChB, MRCGP, PgDipSEM, MSc Sports Directorship (current)</div>
            </div>
          </div>
          <div style={{ display:"flex", borderTop:`1px solid ${C.navy}` }}>
            {[{id:"signing",label:"Nadeem Score",sub:"Player Signing Risk + Availability Prediction",icon:"📋"},{id:"rtp",label:"Nadeem RTP Score",sub:"Return to Play",icon:"🏥"}].map(t=>(
              <button key={t.id} onClick={()=>setTool(t.id)} style={{ flex:1, padding:"12px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left", borderBottom:`3px solid ${tool===t.id?C.gold:"transparent"}`, transition:"border-color 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:tool===t.id?C.white:C.mutedDark }}>{t.label}</div>
                    <div style={{ fontSize:10, color:tool===t.id?C.gold:C.mutedDark }}>{t.sub}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"24px 28px 48px" }}>
        {tool === "signing" ? <EnhancedSigningScore /> : <RTPPlaceholder />}
      </div>
      <div style={{ textAlign:"center", fontSize:10, color:C.mutedDark, letterSpacing:"0.06em", borderTop:`1px solid ${C.navyDark}`, padding:"16px 28px 24px", maxWidth:720, margin:"0 auto" }}>
        Nadeem Performance Suite · Performance Medicine · Sheffield Wednesday FC · Est. 2025
      </div>
    </div>
  );
}

// RTP tab placeholder — full RTP tool from previous version goes here
function RTPPlaceholder() {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px", color:C.mutedDark }}>
      <div style={{ fontSize:32, marginBottom:12 }}>🏥</div>
      <div style={{ fontWeight:700, color:C.muted, marginBottom:8, fontSize:16 }}>Nadeem RTP Score</div>
      <div style={{ fontSize:13, maxWidth:400, margin:"0 auto", lineHeight:1.6 }}>
        The full Return to Play assessment tool is included in this build. Copy in the RTP components from the previous nadeem-suite version to complete this tab.
      </div>
    </div>
  );
}
