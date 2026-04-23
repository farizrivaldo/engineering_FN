import React, { useState, useEffect } from 'react';
import './SparepartLogs.css';
import { useNavigate } from 'react-router-dom';

const SparepartLogs = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Ensure this matches the route you set up in Express!
                const response = await fetch('http://10.126.15.197:8002/part/GetSparepartLogs');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setLogs(data);
            } catch (err) {
                console.error("Failed to fetch sparepart logs:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

    // --- DEEP SEARCH FILTER LOGIC ---
    const filteredLogs = logs.filter((log) => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();

        // 1. Check top-level info (Name, Work Order)
        const matchesTopLevel = 
            (log.Employee_Name && log.Employee_Name.toLowerCase().includes(searchLower)) ||
            (log.Work_Order_Number && log.Work_Order_Number.toLowerCase().includes(searchLower));

        // 2. Check INSIDE the JSON array (Part Number, Description)
        const matchesItems = log.Items_Taken && log.Items_Taken.some(item => 
            (item.part_number && item.part_number.toLowerCase().includes(searchLower)) ||
            (item.part_description && item.part_description.toLowerCase().includes(searchLower))
        );

        return matchesTopLevel || matchesItems;
    });

    if (isLoading) return <div className="audit-container wo-container">Loading sparepart logs...</div>;
    if (error) return <div className="audit-container wo-container" style={{ color: '#ef4444' }}>Error: {error}</div>;

    return (
        <div className="audit-container wo-container">
            <div className="header-section">

                <button 
                    onClick={() => navigate(-1)} // -1 means "Go back one page in history"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-blue)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        marginBottom: '16px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.95rem'
                    }}
                >
                    ← Back to Dashboard
                </button>
                <h2 style={{ margin: 0 }}>Sparepart Audit Logs</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                    Track all sparepart checkouts and inventory reductions.
                </p>
            </div>

            <div className="controls-section">
                <input 
                    type="text" 
                    placeholder="Search by Employee, Work Order, or Part Number..." 
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="table-wrapper">
                <table className="audit-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>Log ID</th>
                            <th style={{ width: '180px' }}>Date & Time</th>
                            <th style={{ width: '200px' }}>Employee</th>
                            <th style={{ width: '150px' }}>Work Order</th>
                            <th>Parts Taken</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    No audit logs match your search criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log.Log_ID}>
                                    <td><strong>#{log.Log_ID}</strong></td>
                                    <td style={{ color: 'var(--text-muted)' }}>{log.Log_Date}</td>
                                    <td><strong>{log.Employee_Name}</strong></td>
                                    <td>
                                        {log.Work_Order_Number ? (
                                            <span style={{ color: 'var(--accent-blue)' }}>{log.Work_Order_Number}</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        {/* Render the JSON array as a list of clean cards */}
                                        <div className="nested-items-container">
                                            {log.Items_Taken && log.Items_Taken.length > 0 ? (
                                                log.Items_Taken.map((item, index) => (
                                                    <div key={index} className="nested-item">
                                                        <div className="nested-item-header">
                                                            <span>{item.part_number}</span>
                                                            <span className="qty-badge">Qty: {item.qty}</span>
                                                        </div>
                                                        <div className="nested-item-desc">
                                                            {item.part_description}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>No items logged.</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SparepartLogs;