import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const GranulationReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        line: '', // Kosongkan
        machine: '', // Kosongkan
        startDate: '',
        endDate: '',
    }); 
        
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(100);
    const [totalRows, setTotalRows] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // 1. Fungsi Ambil Data (SINKRON DENGAN TOMBOL CARI)
    // Ganti fungsi fetchData kamu dengan ini
    const fetchData = async () => {
    // 1. Deklarasikan currentFilters agar terbaca
    const currentFilters = filters; 

    // 2. Validasi Input: Harus pilih semua filter sebelum cari
    if (!currentFilters.line || !currentFilters.machine || !currentFilters.startDate || !currentFilters.endDate) {
        alert("Harap pilih Line, Unit Mesin, serta rentang Tanggal!");
        return;
    }

    setLoading(true);
    try {
        const response = await axios.get('http://10.126.15.197:8002/part/granulation-batch-record', { 
            params: { 
                line: currentFilters.line,
                machine: currentFilters.machine,
                startDate: currentFilters.startDate,
                endDate: currentFilters.endDate,
                page: page,
                limit: limit 
            } 
        });

        const rawData = response.data.data || [];

        // 3. Notif jika data tidak ditemukan (Tanggal salah/Data belum ada)
        if (rawData.length === 0) {
            alert("Data tidak ditemukan untuk rentang waktu tersebut!");
            setData([]);
            setTotalRows(0);
            setTotalPages(0);
            return;
        }

        // 4. Buang ID dan timestamp (Destructuring) agar tabel bersih
        const filteredData = rawData.map(({ id, ID, timestamp, ...rest }) => ({
            ...rest
        }));

        setData(filteredData);
        setTotalRows(response.data.totalRows || 0);
        setTotalPages(response.data.totalPages || 0);

    } catch (err) {
        // Cek jika error 500 dari backend
        alert(`Gagal menarik data: ${err.response?.data?.error || err.message}`);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        if (filters.startDate && filters.endDate) {
            fetchData();
        }
    }, [page, limit]);

    // 2. Fungsi Export PDF (Dinamis & WIB Paling Kiri)
    const handleExportPDF = async () => {
    try {
        setLoading(true);
        const response = await axios.get('http://10.126.15.197:8002/part/export-pdf', { params: filters });
        const fullData = response.data;

        if (!fullData || fullData.length === 0) return alert("Data kosong");

        // Buat data bersih: WIB TIME paling kiri, timestamp unix dibuang
        const cleanData = fullData.map(({ id, timestamp, wib_time, ...rest }) => ({
            "WIB TIME": wib_time,
            ...rest
        }));

        const tableColumn = Object.keys(cleanData[0]).map(key => key.replace(/_/g, ' ').toUpperCase());
        const tableRows = cleanData.map(item => Object.values(item));

        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text(`Report - ${filters.machine}`, 14, 15);

        // PANGGIL SEPERTI INI (Jangan doc.autoTable)
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`Report_${filters.machine}.pdf`);
    } catch (err) { 
        alert("Gagal PDF: " + err.message); 
    } finally { 
        setLoading(false); 
    }
};

    // 3. Fungsi Export Excel (Dinamis & WIB Paling Kiri)
    const handleExportExcel = async () => {
    try {
        setLoading(true);
        const response = await axios.get('http://10.126.15.197:8002/part/export-pdf', { params: filters });
        
        // 1. Validasi: Jika response kosong atau data tidak ada
        if (!response.data || response.data.length === 0) {
            alert("Gagal Export: Data tidak ditemukan untuk rentang waktu tersebut!");
            return;
        }

        // 2. Mapping data: WIB TIME paling kiri, buang ID & timestamp
        const cleanData = response.data.map(({ id, ID, timestamp, wib_time, ...rest }) => ({
            "WIB TIME": wib_time,
            ...rest
        }));

        const ws = XLSX.utils.json_to_sheet(cleanData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Batch Record");
        XLSX.writeFile(wb, `Report_${filters.machine}.xlsx`);

    } catch (err) { 
        // 3. Notif jika terjadi error 500 atau koneksi putus
        alert("Gagal Excel: " + (err.response?.data?.error || err.message)); 
    } finally { 
        setLoading(false); 
    }
};
    // Deteksi kolom untuk tabel UI
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return (
    <div className="p-6 bg-[#f8fafd] dark:bg-[#0f111a] min-h-screen font-sans transition-colors duration-300">
        {/* Card Filter */}
        <div className="bg-white dark:bg-[#161b22] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase">Line</label>
                    <select className="w-full border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-[#0d1117] text-sm font-semibold dark:text-white"
                        value={filters.line} 
        onChange={(e) => {
            const newLine = e.target.value;
            // Logic reset: Kalau pindah ke Line 1, mesin kW Meter otomatis dibuang dari state
            const newMachine = (newLine === "Line 1" && filters.machine === "PMA kW Meter") ? "" : filters.machine;
            
            setFilters({
                ...filters, 
                line: newLine,
                machine: newMachine
            });
        }}
    >
                        <option value="">-- Pilih Line --</option>
                        <option value="Line 1">Line 1</option>
                        <option value="Line 3">Line 3</option>
                    </select>
                </div>
                <div>
    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase">Unit Mesin</label>
    <select 
        className="w-full border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-[#0d1117] text-sm font-semibold dark:text-white transition-all"
        value={filters.machine} 
        onChange={(e) => setFilters({...filters, machine: e.target.value})}
    >
        <option value="">-- Pilih Mesin --</option>
        <option value="PMA">PMA</option>
        <option value="FBD">FBD</option>
        <option value="Wetmill">Wetmill</option>
        <option value="EPH">EPH</option>
        
        {/* Logic: Hanya tampilkan PMA kW Meter jika Line 3 dipilih */}
        {filters.line === "Line 3" && (
            <option value="PMA kW Meter">PMA kW Meter</option>
        )}
    </select>
</div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase">Mulai</label>
                    <input type="datetime-local"  className="w-full border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-[#0d1117] text-sm dark:text-white"
                        value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase">Selesai</label>
                    <input type="datetime-local" className="w-full border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-[#0d1117] text-sm dark:text-white"
                        value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
                </div>
                <button onClick={() => { setPage(1); fetchData(); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-md transition-transform active:scale-95">
                    {loading ? 'LOADING...' : 'CARI DATA'}
                </button>
            </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
            <div className="flex justify-between p-4 bg-gray-50/50 dark:bg-[#1c2128] border-b dark:border-gray-800 items-center text-gray-900 dark:text-white">
                <div className="flex items-center gap-4">
                    <select value={limit} onChange={(e) => {setLimit(parseInt(e.target.value)); setPage(1);}} className="border dark:border-gray-700 rounded px-2 py-1 text-sm dark:bg-[#0d1117] dark:text-white">
                        <option value="100">100</option>
                        <option value="500">500</option>
                        <option value="1000">1000</option>
                    </select>
                    <div className="text-sm dark:text-gray-400">Total: <b className="text-blue-600">{totalRows}</b> Baris</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all">📊 EXCEL</button>
                    <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all">📄 PDF</button>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 dark:bg-[#1c2128] sticky top-0 transition-colors">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="p-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase border-b dark:border-gray-700">{col.replace(/_/g, ' ')}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-xs dark:text-gray-300">
                        {data.length > 0 ? (
                            data.map((row, i) => (
                                <tr key={i} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 border-b dark:border-gray-800 transition-colors">
                                    {columns.map(col => (
                                        <td key={col} className="p-4 whitespace-nowrap border-b dark:border-gray-800">
                                            {typeof row[col] === 'number' ? row[col].toFixed(2) : row[col]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length || 5} className="p-10 text-center text-gray-400 dark:text-gray-500 italic bg-white dark:bg-[#161b22]">
                                    Data tidak ditemukan atau silakan klik "CARI DATA"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* BAGIAN PAGINATION */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-[#1c2128] border-t dark:border-gray-800">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Halaman <b className="text-blue-600">{page}</b> dari <b>{totalPages}</b>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setPage(1)} 
                        disabled={page === 1}
                        className="px-3 py-1 bg-white dark:bg-[#0d1117] border dark:border-gray-700 rounded text-xs dark:text-white disabled:opacity-30">
                        First
                    </button>
                    <button 
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                        disabled={page === 1}
                        className="px-3 py-1 bg-white dark:bg-[#0d1117] border dark:border-gray-700 rounded text-xs dark:text-white disabled:opacity-30">
                        Prev
                    </button>
                    
                    <span className="px-4 py-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded">
                        {page}
                    </span>

                    <button 
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={page === totalPages}
                        className="px-3 py-1 bg-white dark:bg-[#0d1117] border dark:border-gray-700 rounded text-xs dark:text-white disabled:opacity-30">
                        Next
                    </button>
                    <button 
                        onClick={() => setPage(totalPages)} 
                        disabled={page === totalPages}
                        className="px-3 py-1 bg-white dark:bg-[#0d1117] border dark:border-gray-700 rounded text-xs dark:text-white disabled:opacity-30">
                        Last
                    </button>
                </div>
            </div>
        </div>
    </div>
);
};

export default GranulationReport;