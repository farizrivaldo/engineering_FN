import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const WH2Dashboard = () => {
    // State Management
    const [area, setArea] = useState('Area 1');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [hourlyData, setHourlyData] = useState([]);
    const [stats, setStats] = useState({});
    
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 24;

    // Fetch Data
    const fetchData = async () => {
        if (!startDate || !endDate || !area) {
            alert("Please select an area, start date, and end date.");
            return;
        }
        try {
            const response = await axios.get("http://10.126.15.197:8002/part/getWH2DashboardData", {
                params: { area, startDate, endDate }
            });
            if (response.data.success) {
                setHourlyData(response.data.hourlyData);
                setStats(response.data.statistics);
                setCurrentPage(1); 
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // Pagination Logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentTableData = hourlyData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(hourlyData.length / rowsPerPage);

    // PDF Generation Logic
    const exportTableToPDF = () => {
        if (hourlyData.length === 0) {
            alert("No data to export. Please query data first.");
            return;
        }

        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text(`Historical Log - Warehouse 2 (${area})`, 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);

        const tableColumn = ["NO", "DATE TIME", "TEMPERATURE (°C)", "HUMIDITY (%)"];
        const tableRows = hourlyData.map((row, index) => [
            index + 1,
            row.log_time,
            row.temperature,
            row.humidity
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            styles: { fontSize: 9, font: 'helvetica', textColor: [60, 60, 60] },
            headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold', halign: 'left' },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            theme: 'grid',
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
        });

        doc.save(`WH2_Log_${area}_${startDate}.pdf`);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
            
            {/* --- TOP CARD: GRAPH & STATS --- */}
            <div className="bg-white rounded-3xl shadow-sm p-8 mb-8">
                
                {/* Header & Controls Grouping */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">WAREHOUSE 2 DATA GRAPH</h2>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Area Dropdown (Separated from the Date Pill) */}
                        <select 
                            value={area} 
                            onChange={(e) => setArea(e.target.value)}
                            className="bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-md px-4 py-2 outline-none shadow-sm cursor-pointer"
                        >
                            <option value="Area 1">C56 WH2</option>
                            <option value="Area 2">C64 WH2</option>
                            <option value="Area 3">C72 WH2</option>
                        </select>
                        
                        {/* Date Range & Search Pill */}
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full p-1 shadow-sm text-sm">
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider pl-4 pr-2">RANGE</span>
                            {/* Changed type to 'date' */}
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent px-2 py-1 outline-none text-slate-600 font-medium"/>
                            <span className="text-slate-400 font-medium">-</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent px-2 py-1 outline-none text-slate-600 font-medium mr-2"/>
                            
                            <button onClick={fetchData} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-1.5 rounded-full transition-colors text-sm">
                                SEARCH
                            </button>
                        </div>
                    </div>
                </div>

                {/* Conditional Rendering for Chart Empty State */}
                {hourlyData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 mb-8">
                        <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        <p className="text-slate-500 font-medium">Please select a date range and click Search to view monitoring data.</p>
                    </div>
                ) : (
                    <>
                        {/* Chart */}
                        <div className="h-80 w-full mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="log_time" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                    <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#4f46e5" strokeWidth={3} name="Temp (°C)" dot={false} activeDot={{r: 6}} />
                                    <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#0ea5e9" strokeWidth={3} name="RH (%)" dot={false} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Stats Section */}
                        {stats.avgTemp && (
                            <div className="flex justify-center gap-16 md:gap-32 text-center border-t border-slate-100 pt-8">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Temperature</p>
                                    <div className="text-slate-800 font-medium">
                                        <span className="block text-2xl font-extrabold text-indigo-600 mb-1">{stats.avgTemp}°C <span className="text-sm font-normal text-slate-400">Avg</span></span>
                                        <span className="text-sm">Max: {stats.maxTemp}°C <span className="mx-2 text-slate-300">|</span> Min: {stats.minTemp}°C</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Humidity</p>
                                    <div className="text-slate-800 font-medium">
                                        <span className="block text-2xl font-extrabold text-sky-500 mb-1">{stats.avgHum}% <span className="text-sm font-normal text-slate-400">Avg</span></span>
                                        <span className="text-sm">Max: {stats.maxHum}% <span className="mx-2 text-slate-300">|</span> Min: {stats.minHum}%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- BOTTOM CARD: HISTORICAL LOG TABLE --- */}
            <div className="bg-white rounded-3xl shadow-sm p-8">
                <div className="flex justify-between items-center pb-6 mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">HISTORICAL LOG</h2>
                        <p className="text-sm text-slate-400 font-medium mt-1">Warehouse Archive Data</p>
                    </div>
                    <button onClick={exportTableToPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase tracking-wider px-6 py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50" disabled={hourlyData.length === 0}>
                        Export Table (PDF)
                    </button>
                </div>

                {/* Conditional Rendering for Table Empty State */}
                {hourlyData.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-100">
                        No historical data available.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left border-collapse min-w-max">
                                <thead className="bg-slate-50">
                                    {/* Added border classes to th for grids */}
                                    <tr>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">DATE TIME</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-l border-slate-200 text-center">TEMPERATURE (°C)</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-l border-slate-200 text-center">HUMIDITY (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTableData.map((row, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-6 text-sm font-semibold text-slate-700 border-b border-slate-100">{row.log_time}</td>
                                            <td className="py-3 px-6 text-sm font-bold text-indigo-600 text-center border-b border-l border-slate-100">{row.temperature}</td>
                                            <td className="py-3 px-6 text-sm font-bold text-sky-500 text-center border-b border-l border-slate-100">{row.humidity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center mt-6 text-sm font-medium text-slate-500">
                            <span>Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, hourlyData.length)} of {hourlyData.length} entries</span>
                            <div className="flex gap-2">
                                <button 
                                    disabled={currentPage === 1} 
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors font-semibold"
                                >
                                    Prev
                                </button>
                                <button 
                                    disabled={currentPage === totalPages} 
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="px-4 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors font-semibold"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
};

export default WH2Dashboard;