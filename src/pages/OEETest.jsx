import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const OeeDashboard = () => {
  const [selectedDate, setSelectedDate] = useState('2025-12-22');
  const [activeShift, setActiveShift] = useState(1);
  const [showMath, setShowMath] = useState(false);
  
  // --- HISTORY TABLE STATE ---
  const [historyStart, setHistoryStart] = useState('2025-12-01');
  const [historyEnd, setHistoryEnd] = useState('2025-12-31');
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Dashboard Data State
  const [data, setData] = useState({
    daily: null,
    shift1: null, shift2: null, shift3: null
  });
  const [trendData, setTrendData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const shiftLabels = { 1: "06:30 — 15:00", 2: "15:00 — 22:45", 3: "22:45 — 06:30" };
  
  const COLORS = {
    avail: ['#2563EB', '#E2E8F0'], // Blue
    perf:  ['#059669', '#E2E8F0'], // Emerald
    qual:  ['#D97706', '#E2E8F0']  // Amber
  };

  // 1. Fetch Dashboard Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dailyRes, s1Res, s2Res, s3Res, trendRes] = await Promise.all([
        axios.get(`http://localhost:8002/part/getDailyOEE`, { params: { date: selectedDate } }),
        axios.get(`http://localhost:8002/part/getUniversalOEE`, { params: { shift: 1, date: selectedDate } }),
        axios.get(`http://localhost:8002/part/getUniversalOEE`, { params: { shift: 2, date: selectedDate } }),
        axios.get(`http://localhost:8002/part/getUniversalOEE`, { params: { shift: 3, date: selectedDate } }),
        axios.get(`http://localhost:8002/part/getWeeklyTrend`)
      ]);

      setData({
        daily: dailyRes.data.data,
        shift1: s1Res.data.data,
        shift2: s2Res.data.data,
        shift3: s3Res.data.data,
        info1: s1Res.data.shift_info,
        info2: s2Res.data.shift_info,
        info3: s3Res.data.shift_info
      });

      if (trendRes.data.data) {
        const formattedTrend = trendRes.data.data.map(item => ({
          date: new Date(item.production_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          oee: parseFloat(item.oee_score),
          availability: parseFloat(item.availability),
          performance: parseFloat(item.performance),
          quality: parseFloat(item.quality)
        }));
        setTrendData(formattedTrend);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 2. Fetch History Log
  const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
          const res = await axios.get('http://localhost:8002/part/getHistoryLog', {
              params: { startDate: historyStart, endDate: historyEnd }
          });
          setHistoryData(res.data.data);
      } catch (error) {
          console.error(error);
          alert("Error fetching history");
      } finally {
          setLoadingHistory(false);
      }
  };

  useEffect(() => { 
      fetchData(); 
      fetchHistory(); 
  }, [selectedDate]);

  const handleGenerateData = async () => {
    if (!window.confirm("Overwrite data?")) return;
    setGenerating(true);
    try {
      await axios.get('http://localhost:8002/part/generateDummyDataWeekly');
      alert("✅ Data Generated!");
      fetchData(); 
    } catch (error) { alert("❌ Error"); } finally { setGenerating(false); }
  };

  const handleArchiveAll = async () => {
      if (!window.confirm("Archive ALL data? This calculates OEE for every day present in the raw database.")) return;
      setArchiving(true);
      try {
          const res = await axios.get('http://localhost:8002/part/archiveAll');
          alert(`✅ ${res.data.message}`);
          fetchData(); fetchHistory();
      } catch (error) { alert("❌ Archive Failed"); } finally { setArchiving(false); }
  };

  const activeData = activeShift === 1 ? { metrics: data.shift1 } : activeShift === 2 ? { metrics: data.shift2 } : { metrics: data.shift3 };
  
  // Helper for Pie Data
  const getPieData = (val) => [{ name: 'Ok', value: parseFloat(val)||0 }, { name: 'Loss', value: 100 - (parseFloat(val)||0) }];
  
  const getOeeColor = (val) => {
      const num = parseFloat(val);
      if(num >= 85) return "text-emerald-500";
      if(num >= 75) return "text-blue-500";
      if(num >= 60) return "text-amber-500";
      return "text-red-500";
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Fette Machine Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Production Overview | <span className="font-mono font-bold text-indigo-600">{selectedDate}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border p-2 rounded-lg font-bold text-slate-700 text-sm"/>
            
            <button onClick={handleArchiveAll} disabled={archiving} className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                {archiving ? 'Processing...' : (
                    <>
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                         Archive All
                    </>
                )}
            </button>

            <button onClick={handleGenerateData} disabled={generating} className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                {generating ? '...' : '⚡ New Data'}
            </button>
        </div>
      </header>

      {loading ? <div className="p-12 text-center text-slate-400 italic">Loading Dashboard...</div> : (
        <>
            {/* --- DAILY OEE SECTION --- */}
            <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-indigo-100">
                {/* 1. Daily Score (Centered) */}
                <div className="text-center mb-10 border-b border-slate-100 pb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Daily Aggregated OEE Score</h2>
                    <div className={`text-7xl font-black ${getOeeColor(data.daily?.oee)}`}>{data.daily?.oee || "0.00%"}</div>
                    <p className="text-xs text-slate-400 mt-2">(Shift 1 + Shift 2 + Shift 3)</p>
                </div>

                {/* 2. Daily Pie Charts (New Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 justify-items-center">
                    {/* Daily Availability */}
                    <div className="flex flex-col items-center">
                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Daily Availability</h4>
                        <div className="relative w-64 h-64">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={getPieData(data.daily?.availability?.value)} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {getPieData(data.daily?.availability?.value).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.avail[index % COLORS.avail.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-blue-600">
                                {data.daily?.availability?.value}
                            </div>
                        </div>
                    </div>

                    {/* Daily Performance */}
                    <div className="flex flex-col items-center">
                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Daily Performance</h4>
                        <div className="relative w-64 h-64">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={getPieData(data.daily?.performance?.value)} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {getPieData(data.daily?.performance?.value).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.perf[index % COLORS.perf.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-emerald-600">
                                {data.daily?.performance?.value}
                            </div>
                        </div>
                    </div>

                    {/* Daily Quality */}
                    <div className="flex flex-col items-center">
                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Daily Quality</h4>
                        <div className="relative w-64 h-64">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={getPieData(data.daily?.quality?.value)} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {getPieData(data.daily?.quality?.value).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.qual[index % COLORS.qual.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-amber-600">
                                {data.daily?.quality?.value}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SHIFT BREAKDOWN SECTION --- */}
            <div className="mb-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-end mb-6 pb-4 border-b border-slate-100">
                       <div>
                          <h2 className="text-xl font-bold text-slate-700">Shift Breakdown</h2>
                          <p className="text-xs text-slate-400 mt-1">Live Metrics for Shift {activeShift}</p>
                       </div>
                       <div className="flex gap-2">
                          {[1, 2, 3].map((num) => (
                              <button key={num} onClick={() => setActiveShift(num)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeShift === num ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                  Shift {num}
                              </button>
                          ))}
                      </div>
                  </div>

                  {activeData && (
                    <>
                        <div className="text-center mb-10">
                             <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-1">Shift {activeShift} OEE</h3>
                             <div className={`text-6xl font-black ${getOeeColor(activeData.metrics?.oee)}`}>{activeData.metrics?.oee}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 justify-items-center">
                             {/* Availability Pie */}
                             <div className="flex flex-col items-center">
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Availability</h4>
                                <div className="relative w-64 h-64">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={getPieData(activeData.metrics?.availability?.availability)} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {getPieData(activeData.metrics?.availability?.availability).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS.avail[index % COLORS.avail.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-blue-600">
                                        {activeData.metrics?.availability?.availability}
                                    </div>
                                </div>
                            </div>
                            {/* Performance Pie */}
                            <div className="flex flex-col items-center">
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Performance</h4>
                                <div className="relative w-64 h-64">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={getPieData(activeData.metrics?.performance?.performance)} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {getPieData(activeData.metrics?.performance?.performance).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS.perf[index % COLORS.perf.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-emerald-600">
                                        {activeData.metrics?.performance?.performance}
                                    </div>
                                </div>
                            </div>
                            {/* Quality Pie */}
                            <div className="flex flex-col items-center">
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Quality</h4>
                                <div className="relative w-64 h-64">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={getPieData(activeData.metrics?.quality?.quality)} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {getPieData(activeData.metrics?.quality?.quality).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS.qual[index % COLORS.qual.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-amber-600">
                                        {activeData.metrics?.quality?.quality}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MATH VALIDATOR */}
                        <div className="mt-8 flex justify-center">
                            <button onClick={() => setShowMath(!showMath)} className="text-xs font-bold text-slate-400 hover:text-indigo-600 underline">
                                {showMath ? 'Hide Logic' : 'Show Calculation Logic'}
                            </button>
                        </div>
                        {showMath && (
                             <div className="mt-4 bg-slate-50 text-slate-500 p-4 rounded-xl font-mono text-xs text-center border border-slate-200">
                                <p className="font-bold mb-2 uppercase">Validation (Shift {activeShift})</p>
                                <p>{activeData.metrics?.availability?.availability} × {activeData.metrics?.performance?.performance} × {activeData.metrics?.quality?.quality} = <span className="font-bold text-indigo-600">{activeData.metrics?.oee}</span></p>
                            </div>
                        )}
                    </>
                  )}
            </div>

            {/* --- WEEKLY TREND (BAR CHART) --- */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-10">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Weekly OEE Trend</h3>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 14}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 14}} domain={[0, 100]} />
                            <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} />
                            <Legend wrapperStyle={{paddingTop: '20px'}} />
                            <Bar dataKey="oee" fill="#6366F1" radius={[6, 6, 0, 0]} name="OEE Score" barSize={24} />
                            <Bar dataKey="availability" fill="#93C5FD" radius={[6, 6, 0, 0]} name="Avail" barSize={12} />
                            <Bar dataKey="performance" fill="#6EE7B7" radius={[6, 6, 0, 0]} name="Perf" barSize={12} />
                            <Bar dataKey="quality" fill="#FCD34D" radius={[6, 6, 0, 0]} name="Qual" barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- HISTORICAL TABLE --- */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest">Historical Log</h3>
                    <div className="flex gap-2 items-center mt-4 md:mt-0 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <input type="date" value={historyStart} onChange={e => setHistoryStart(e.target.value)} className="bg-transparent text-sm font-bold text-slate-600 outline-none"/>
                        <span className="text-slate-400 font-bold">-</span>
                        <input type="date" value={historyEnd} onChange={e => setHistoryEnd(e.target.value)} className="bg-transparent text-sm font-bold text-slate-600 outline-none"/>
                        <button onClick={fetchHistory} className="ml-2 bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-indigo-700 shadow-sm transition-transform active:scale-95">
                            Search
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-extrabold">Date</th>
                                <th className="px-6 py-4 font-bold text-indigo-600">Daily OEE</th>
                                <th className="px-6 py-4">Avail</th>
                                <th className="px-6 py-4">Perf</th>
                                <th className="px-6 py-4">Qual</th>
                                <th className="px-6 py-4">Run Time</th>
                                <th className="px-6 py-4">Stop Time</th>
                                <th className="px-6 py-4">Total Output</th>
                                <th className="px-6 py-4 text-red-500">Total Reject</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingHistory ? (
                                <tr><td colSpan="9" className="text-center py-8 text-slate-400">Loading history...</td></tr>
                            ) : historyData.length > 0 ? (
                                historyData.map((row, idx) => (
                                    <tr key={idx} className="bg-white border-b hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            {new Date(row.date_str).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 font-black text-indigo-600 text-lg">{row.daily_oee}%</td>
                                        <td className="px-6 py-4 font-medium">{row.daily_avail}%</td>
                                        <td className="px-6 py-4 font-medium">{row.daily_perf}%</td>
                                        <td className="px-6 py-4 font-medium">{row.daily_qual}%</td>
                                        <td className="px-6 py-4 font-mono text-slate-500">{row.total_run} m</td>
                                        <td className="px-6 py-4 font-mono text-amber-600">{row.total_stop} m</td>
                                        <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{row.total_out?.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-mono text-red-500 font-bold">{row.total_reject?.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="9" className="text-center py-8 text-slate-400 italic">No logs found for this period. Try archiving data first.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default OeeDashboard;