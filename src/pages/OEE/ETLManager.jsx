import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ParetoChart from './ParetoChartFette';

const EtlManager = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [etlLoading, setEtlLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // --- TAB STATE (Updated Order) ---
  const [activeTab, setActiveTab] = useState('shift'); // 'shift', 'summary', 'analytics', 'logs'

  // --- FILTERS ---
  // Global Range for Pareto/Summary/Logs
  const [detailFilter, setDetailFilter] = useState({ start: "2026-01-01", end: "2026-01-31" });
  
  // Specific Filter for "Shift Summary" Tab
  const [shiftFilter, setShiftFilter] = useState({ date: "2026-01-21", name: "Shift 1" });
  const [shiftData, setShiftData] = useState({ events: [], baseline: [] });

  // 1. FETCH GLOBAL DATA (For Tabs 2, 3, and 4)
  const fetchGlobalEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://10.126.15.197:8002/part/getAllSmartEvents", {
          params: {
              start_date: detailFilter.start || '2026-01-01', 
              end_date: detailFilter.end || '2026-12-31'
          }
      }); 
      setEvents(res.data);
    } catch (err) {
      console.error("Error loading smart events", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. FETCH SPECIFIC SHIFT DATA (For Tab 1)
  const fetchShiftSummary = async () => {
    try {
      // Define timestamps for the baseline fetch based on shift name
      let startTime = "06:30:00";
      let endTime = "15:00:00";
      if (shiftFilter.name === "Shift 2") { startTime = "15:00:00"; endTime = "22:45:00"; }
      if (shiftFilter.name === "Shift 3") { startTime = "22:45:00"; endTime = "06:30:00"; }

      const startIso = `${shiftFilter.date} ${startTime}`;
      let endIso = `${shiftFilter.date} ${endTime}`;
      if (shiftFilter.name === "Shift 3") {
          const nextDay = new Date(shiftFilter.date);
          nextDay.setDate(nextDay.getDate() + 1);
          endIso = `${nextDay.toISOString().split('T')[0]} ${endTime}`;
      }

      const [smartRes, baselineRes] = await Promise.all([
        axios.get(`http://10.126.15.197:8002/part/getStoredShiftEvents`, { 
            params: { date: shiftFilter.date, shift: shiftFilter.name } 
        }),
        axios.get(`http://10.126.15.197:8002/part/getStoredShiftEvents`, { 
            params: { start_date: startIso, end_date: endIso } 
        })
      ]);
      
      setShiftData({
          events: smartRes.data.events || [],
          baseline: baselineRes.data.events || []
      });
    } catch (err) {
      console.error("Error loading shift summary", err);
    }
  };

  useEffect(() => {
    fetchGlobalEvents();
  }, [detailFilter.start, detailFilter.end]);

  useEffect(() => {
    if (activeTab === 'shift') fetchShiftSummary();
  }, [shiftFilter, activeTab]);

  const handleRunEtl = async () => {
    setEtlLoading(true);
    setStatusMsg("Processing...");
    try {
      const res = await axios.post("http://10.126.15.197:8002/part/runEtlProcess");
      if (res.data.total_created > 0) {
          setStatusMsg(`✅ Success! Created ${res.data.total_created} new events.`);
      } else {
          setStatusMsg("ℹ️ System up to date.");
      }
      fetchGlobalEvents(); 
    } catch (err) {
      setStatusMsg("❌ Error: " + (err.response?.data?.error || err.message));
    } finally {
      setEtlLoading(false);
    }
  };

  // --- COMPARISON LOGIC FOR SHIFT SUMMARY ---
  const shiftComparison = useMemo(() => {
    const machineMap = {};
    shiftData.baseline.forEach(e => {
        const key = e.reason_name || "Undefined";
        if (!machineMap[key]) machineMap[key] = [];
        machineMap[key].push(parseFloat(e.duration_minutes || 0));
    });

    const machineUsage = {};
    return shiftData.events.map(e => {
        const key = e.reason_name || "Undefined";
        const dur = parseFloat(e.duration_minutes || 0);
        const available = machineMap[key] || [];
        const used = machineUsage[key] || 0;

        let status = 'NEW';
        if (used < available.length) {
            status = Math.abs(available[used] - dur) <= 1 ? 'MATCH' : 'DIFF';
            machineUsage[key] = used + 1;
        }
        return { ...e, status };
    });
  }, [shiftData]);

  // --- HELPER: FILTER LOGIC ---
  const filterData = (data, range) => {
    if (!range.start || !range.end) return data; 
    const start = new Date(range.start).getTime();
    const end = new Date(range.end).getTime();
    return data.filter(ev => {
        const time = new Date(ev.start_time).getTime();
        return time >= start && time <= end;
    });
  };

  // --- 2. DATA PREPARATION ---
  const summaryFilter = detailFilter; // Link summary to global filter

  const detailedUnplanned = useMemo(() => 
    filterData(events.filter(e => e.category === 'Unplanned'), detailFilter), 
  [events, detailFilter]);

  const detailedPlanned = useMemo(() => 
    filterData(events.filter(e => e.category === 'Planned'), detailFilter), 
  [events, detailFilter]);

  const calculateStats = (category) => {
    const raw = events.filter(e => e.category === category);
    const filtered = filterData(raw, summaryFilter);
    const stats = {};
    
    filtered.forEach(ev => {
        const key = ev.reason_name || `Unknown (ID: ${ev.reason_id})`;
        if (!stats[key]) stats[key] = { name: key, freq: 0, dur: 0 };
        stats[key].freq += 1;
        stats[key].dur += parseFloat(ev.duration_minutes || 0);
    });
    return Object.values(stats).sort((a, b) => b.dur - a.dur);
  };

  const summaryUnplanned = useMemo(() => calculateStats('Unplanned'), [events, summaryFilter]);
  const summaryPlanned = useMemo(() => calculateStats('Planned'), [events, summaryFilter]);

  // --- REUSABLE COMPONENTS ---

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-8 py-4 font-bold text-sm transition-all border-b-4 ${
        activeTab === id 
          ? "border-blue-600 text-blue-600 bg-blue-50/50" 
          : "border-transparent text-gray-400 hover:text-gray-600"
      }`}
    >
      <span>{icon}</span> {label}
    </button>
  );

  const DatePickerBar = ({ label, range, setRange }) => (
    <div className="flex flex-wrap items-end gap-4 bg-gray-50 p-3 rounded border border-gray-200 mb-4">
        <div className="font-bold text-gray-700 text-sm w-32 pt-2">{label}</div>
        <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Start Time</label>
            <input 
                type="date" 
                className="w-full border p-1.5 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500"
                value={range.start}
                onChange={(e) => setRange({...range, start: e.target.value})}
            />
        </div>
        <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">End Time</label>
            <input 
                type="date" 
                className="w-full border p-1.5 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500"
                value={range.end}
                onChange={(e) => setRange({...range, end: e.target.value})}
            />
        </div>
        <button 
            onClick={() => setRange({start:"", end:""})}
            className="text-xs text-blue-600 underline font-bold px-2 py-2 hover:text-blue-800"
        >
            Clear Filter
        </button>
    </div>
  );

  const DetailTable = ({ title, data, colorClass, headerColor, showStatus }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 ${colorClass} h-full flex flex-col`}>
        <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                {title} 
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{data.length}</span>
            </h3>
        </div>
        <div className="overflow-x-auto flex-1 max-h-[400px]">
            <table className="min-w-full text-left text-sm relative">
                <thead className={`${headerColor} text-gray-600 uppercase text-xs sticky top-0 z-10 shadow-sm`}>
                    <tr>
                        <th className="px-4 py-2">Dur</th>
                        <th className="px-4 py-2">Description</th>
                        {!showStatus && <th className="px-4 py-2">Date/Time</th>}
                        <th className={`px-4 py-2 ${showStatus ? 'text-right' : 'text-center'}`}>
                            {showStatus ? 'Status' : 'Source'}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.length === 0 ? (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400 italic">No events found</td></tr>
                    ) : (
                        data.map((ev, i) => (
                            <tr key={ev.id || i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2 font-bold text-gray-800">{Math.round(ev.duration_minutes)}m</td>
                                <td className="px-4 py-2 text-blue-700 text-xs font-medium">{ev.reason_name}</td>
                                {!showStatus && (
                                    <td className="px-4 py-2 text-[10px] text-gray-400">
                                        {new Date(ev.start_time).toLocaleDateString()} {new Date(ev.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </td>
                                )}
                                <td className={`px-4 py-2 ${showStatus ? 'text-right' : 'text-center'}`}>
                                    {showStatus ? (
                                        <span className={`text-[10px] px-1 rounded font-bold border ${
                                            ev.status === 'MATCH' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
                                        }`}>
                                            {ev.status}
                                        </span>
                                    ) : (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                                            ev.source_type === 'SUPERVISOR' ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"
                                        }`}>
                                            {ev.source_type === 'SUPERVISOR' ? 'HUMAN' : 'MACHINE'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );

  const StatsTable = ({ title, data, colorClass, headerColor }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 ${colorClass} h-full flex flex-col`}>
        <div className="p-3 bg-gray-50 border-b">
            <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
        </div>
        <div className="overflow-x-auto flex-1 max-h-[300px]">
            <table className="min-w-full text-left text-sm relative">
                <thead className={`${headerColor} text-gray-700 uppercase text-xs font-bold sticky top-0 z-10 shadow-sm`}>
                    <tr>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2 text-right">Freq</th>
                        <th className="px-4 py-2 text-right">Total Duration</th>
                        <th className="px-4 py-2 text-right">Avg</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.length === 0 ? (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic">No records in range</td></tr>
                    ) : (
                        data.map((stat, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-gray-700">{stat.name}</td>
                                <td className="px-4 py-2 text-right font-mono text-gray-600">{stat.freq}</td>
                                <td className="px-4 py-2 text-right font-bold text-gray-800">{stat.dur.toFixed(0)} m</td>
                                <td className="px-4 py-2 text-right text-gray-400 text-xs">{(stat.dur / stat.freq).toFixed(1)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
                {data.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold text-gray-800 border-t sticky bottom-0">
                        <tr>
                            <td className="px-4 py-2">TOTAL</td>
                            <td className="px-4 py-2 text-right">{data.reduce((s, i) => s + i.freq, 0)}</td>
                            <td className="px-4 py-2 text-right">{data.reduce((s, i) => s + i.dur, 0).toFixed(0)} m</td>
                            <td></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Fette Downtime Statistics</h1>
            <p className="text-sm text-gray-500">Analyze planned and unplanned frequencies, durations, and human-verified logs.</p>
        </div>
        <div className="flex gap-4">
             {statusMsg && <span className="text-sm font-bold text-green-600 pt-2 animate-pulse">{statusMsg}</span>}
             <button 
                onClick={handleRunEtl}
                disabled={etlLoading}
                className={`px-6 py-2 rounded text-white font-bold shadow ${etlLoading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}`}
            >
                {etlLoading ? "Processing..." : "Execute ETL"}
            </button>
        </div>
      </div>

      {/* TABS SELECTION (Updated Order) */}
      <div className="flex bg-white rounded-t-xl border border-gray-200 shadow-sm mb-0 overflow-hidden">
          <TabButton id="shift" label="Shift Summary" icon="🕒" />
          <TabButton id="summary" label="Reason Summary" icon="📊" />
          <TabButton id="analytics" label="Pareto Analysis" icon="🎯" />
          <TabButton id="logs" label=" Detailed Logs" icon="📋" />
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white p-6 rounded-b-xl shadow-sm border border-t-0 border-gray-200 min-h-[500px]">
        {loading && activeTab !== 'shift' ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Loading Smart Data...</div>
        ) : (
            <>
                {/* TAB 1: SHIFT SUMMARY */}
                {activeTab === 'shift' && (
                    <div className="animate-fadeIn">
                        <div className="flex gap-4 mb-6 bg-gray-50 p-4 rounded border border-gray-200 items-end">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Target Date</label>
                                <input type="date" className="border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" value={shiftFilter.date} onChange={e => setShiftFilter({...shiftFilter, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Shift Name</label>
                                <select className="border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" value={shiftFilter.name} onChange={e => setShiftFilter({...shiftFilter, name: e.target.value})}>
                                    <option>Shift 1</option><option>Shift 2</option><option>Shift 3</option>
                                </select>
                            </div>
                            <button onClick={fetchShiftSummary} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm hover:bg-blue-700">Audit Shift</button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                            <DetailTable title="🔴 Unplanned Breakdown" data={shiftComparison.filter(e => e.category === 'Unplanned')} colorClass="border-red-500" headerColor="bg-red-50" showStatus={true} />
                            <DetailTable title="🔵 Planned Breakdown" data={shiftComparison.filter(e => e.category === 'Planned')} colorClass="border-blue-500" headerColor="bg-blue-50" showStatus={true} />
                        </div>
                    </div>
                )}

                {/* TAB 2: REASON SUMMARY */}
                {activeTab === 'summary' && (
                    <div className="animate-fadeIn">
                        <DatePickerBar label="Analysis Period:" range={detailFilter} setRange={setDetailFilter} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                            <StatsTable title="🔴 Unplanned Summary" data={summaryUnplanned} colorClass="border-red-500" headerColor="bg-red-100" />
                            <StatsTable title="🔵 Planned Summary" data={summaryPlanned} colorClass="border-blue-500" headerColor="bg-blue-100" />
                        </div>
                    </div>
                )}

                {/* TAB 3: PARETO ANALYSIS */}
                {activeTab === 'analytics' && (
                    <div className="animate-fadeIn">
                        <div className="grid grid-cols-1 gap-6 h-[450px]">
                            <ParetoChart title="Monthly Pareto (Unplanned Losses)" data={events.filter(e => e.category === 'Unplanned')} />
                        </div>
                    </div>
                )}

                {/* TAB 4: DETAILED LOGS */}
                {activeTab === 'logs' && (
                    <div className="animate-fadeIn">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                            <DetailTable title="🔴 All Unplanned Logs" data={detailedUnplanned} colorClass="border-red-500" headerColor="bg-red-50" />
                            <DetailTable title="🔵 All Planned Logs" data={detailedPlanned} colorClass="border-blue-500" headerColor="bg-blue-50" />
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default EtlManager;