import React, { useState, useEffect, useRef } from 'react';
import './SparepartDashboard.css';
import { useNavigate } from 'react-router-dom';
import SparepartLogForm from './SparepartForm'; // Adjust path as needed
import Papa from 'papaparse';

const InventoryTable = () => {
    const [parts, setParts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [showReorderOnly, setShowReorderOnly] = useState(false); 
    const fileInputRef = useRef(null); // <-- NEW: Reference for the hidden file input

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await fetch('http://10.126.15.197:8002/part/getInventoryParts'); 
                
                // --- NEW ERROR HANDLING LOGIC ---
                if (!response.ok) {
                    let serverErrorMessage = `HTTP status ${response.status}`;
                    try {
                        // Try to read the exact JSON error sent by Express
                        const errorData = await response.json(); 
                        // Grab the message whether your backend sends { error: "..." } or { message: "..." }
                        serverErrorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
                    } catch (e) {
                        // If the backend sent pure text instead of JSON, read it here
                        serverErrorMessage = await response.text(); 
                    }
                    // Throw this detailed message down to the catch block
                    throw new Error(serverErrorMessage); 
                }

                const data = await response.json();
                setParts(data);
            } catch (err) {
                console.error("Failed to fetch parts:", err);
                // This now sets the detailed string into your UI
                setError(err.message); 
            } finally {
                setIsLoading(false);
            }
        };
        fetchInventory();
    }, []);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsLoading(true); // Show loading state while parsing and uploading

        Papa.parse(file, {
            delimiter: ";", // Your CSV uses semicolons
            skipEmptyLines: true,
            complete: async function(results) {
                // results.data is a giant array containing every row.
                // Row index 17 contains your column names. Index 18 is where the actual data starts.
                const dataRows = results.data.slice(18);
                const payload = [];

                dataRows.forEach(row => {
                    // Based on your CSV structure:
                    // Index 0 = Part Number, Index 6 = Availability, Index 17 = Last Issue Date
                    const partNumber = row[0] ? row[0].trim() : null;
                    const rawAvailability = row[6] ? row[6].trim() : '0';
                    const lastIssueDate = row[17] ? row[17].trim() : null;

                    if (partNumber) {
                        // Strip out commas from numbers (e.g., "1,000" -> 1000)
                        const availability = parseInt(rawAvailability.replace(/,/g, ''), 10) || 0;
                        
                        payload.push({
                            partNumber,
                            availability,
                            lastIssueDate
                        });
                    }
                });

                try {
                    // Send the clean JSON payload to your new backend route
                    const response = await fetch('http://10.126.15.197:8002/part/updateInventoryBatch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ updates: payload })
                    });

                    if (!response.ok) throw new Error("Failed to update database.");
                    
                    alert("Inventory updated successfully!");
                    window.location.reload(); // Refresh to see the new numbers

                } catch (err) {
                    console.error(err);
                    alert("Error uploading CSV data.");
                } finally {
                    setIsLoading(false);
                    // Reset the file input so they can upload the same file again if needed
                    if (fileInputRef.current) fileInputRef.current.value = ""; 
                }
            }
        });
    };

    // FIX 1: We are now declaring filteredParts using parts.filter()
    const filteredParts = parts.filter((part) => {
        // 1. Search Logic
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            (part.Part_Number && part.Part_Number.toLowerCase().includes(searchLower)) ||
            (part.Part_Description && part.Part_Description.toLowerCase().includes(searchLower));

        // 2. Type Logic
        const matchesType = typeFilter === 'ALL' || part.Type === typeFilter;

        // 3. REORDER LOGIC (Strictly Less Than)
        const isReorder = part.Availability < part.Reorder_Min;
        
        // If the user checked the box, but this part is NOT a reorder part, drop it.
        if (showReorderOnly && !isReorder) {
            return false;
        }

        return matchesSearch && matchesType;
    });

   return (
        <div className="inventory-container">
            
            {/* Added Flexbox here to align the title and the button perfectly on the same line */}
            <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Inventory Parts Overview</h2>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => navigate('/sparepartlogs')} 
                        style={{
                            backgroundColor: 'var(--element-bg)',
                            color: 'var(--text-main)',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        📄 View Audit Logs
                    </button>
                    
                    <button 
                        onClick={() => setIsLogFormOpen(true)}
                        style={{
                            backgroundColor: 'var(--accent-blue)',
                            color: '#ffffff',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        + Log Sparepart Usage
                    </button>

                    {/* HIDDEN FILE INPUT */}
                    <input 
                        type="file" 
                        accept=".csv" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload} 
                    />

                    {/* NEW UPLOAD BUTTON */}
                    <button 
                        onClick={() => fileInputRef.current.click()} 
                        style={{
                            backgroundColor: 'var(--element-bg)',
                            color: 'var(--text-main)',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            border: '1px solid var(--accent-blue)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        ⬆️ Upload CSV
                    </button>
                </div>
            </div>

            <div className="controls-section">
                <input 
                    type="text" 
                    placeholder="Search by Part Number or Description..." 
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <select 
                    className="type-select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="ALL">All Types</option>
                    <option value="MESIN">MESIN</option>
                    <option value="BUILDING">BUILDING</option>
                    <option value="UTILITY">UTILITY</option>
                </select>

                <div className="reorder-toggle-wrapper">
                    <input 
                        type="checkbox" 
                        id="reorderToggle" 
                        className="reorder-checkbox"
                        checked={showReorderOnly}
                        onChange={(e) => setShowReorderOnly(e.target.checked)}
                    />
                    <label htmlFor="reorderToggle" style={{ cursor: 'pointer', fontWeight: '600', color: '#ef4444' }}>
                        Show Reorder Items Only
                    </label>
                </div>
            </div>
            
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading inventory data...
                </div>
            ) : error ? (
                <div style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid #ef4444', 
                    padding: '20px', 
                    borderRadius: '8px',
                    margin: '20px 0'
                }}>
                    <h3 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>⚠️ Failed to Load Database</h3>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: 'var(--text-main)' }}>
                        The server responded with the following error:
                    </p>
                    <code style={{ 
                        display: 'block', 
                        padding: '12px', 
                        backgroundColor: 'var(--main-bg)',
                        color: '#ef4444',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                        {error}
                    </code>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Part Number</th>
                                <th>Description</th>
                                <th>Location</th>
                                <th>Type</th>
                                <th>Availability</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        No parts match your search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredParts.map((part) => {
                                    // FIX 2: We calculate isReorder inside the map loop so the HTML knows if it should be red
                                    const isReorder = part.Availability < part.Reorder_Min;
                                    
                                    return (
                                        <tr key={part.Part_Number} className={isReorder ? 'reorder-row' : ''}>
                                            <td><strong>{part.Part_Number}</strong></td>
                                            <td>
                                                {part.Part_Description}
                                                {part.Description && (
                                                    <div className="description-subtext">
                                                        {part.Description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{part.Part_Location || '-'}</td>
                                            <td>{part.Type || '-'}</td>
                                            
                                            {/* Show Availability and the Minimum threshold */}
                                            <td>
                                                <span className={isReorder ? 'stock-low' : 'stock-ok'}>
                                                    {part.Availability}
                                                </span>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    Min: {part.Reorder_Min}
                                                </div>
                                            </td>
                                            
                                            <td>{part.Last_Date}</td>
                                        </tr>
                                    ) 
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* When isLogFormOpen is true, this renders our popup over the table */}
            {isLogFormOpen && (
                <SparepartLogForm onClose={() => setIsLogFormOpen(false)} />
            )}

        </div>
    )
}

export default InventoryTable;