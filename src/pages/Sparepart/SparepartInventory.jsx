import React, { useState, useEffect, useRef } from 'react';
import './SparepartDashboard.css';
import { useNavigate } from 'react-router-dom';
import SparepartLogForm from './SparepartForm'; // Adjust path as needed
import Papa from 'papaparse';
import MapLightbox from './LightboxMapping'; // <-- NEW: Import the lightbox component

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
    const [showMapModal, setShowMapModal] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);

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

        setIsLoading(true);

        Papa.parse(file, {
            delimiter: ";", 
            skipEmptyLines: true,
            complete: async function(results) {
                const headerIndex = results.data.findIndex(row => row[0] && row[0].trim() === 'Part Number');
                
                if (headerIndex === -1) {
                    alert("Invalid CSV Format: Could not find the 'Part Number' header row.");
                    setIsLoading(false);
                    return;
                }

                const headers = results.data[headerIndex].map(h => h ? h.trim() : '');
                
                const idxPart = headers.indexOf('Part Number');
                const idxDesc = headers.indexOf('Part Description');
                const idxAvail = headers.indexOf('Availability');
                const idxMin = headers.indexOf('Re-Order Point Min');
                const idxMax = headers.indexOf('Re-Order Point Max');

                // PASTE IT RIGHT HERE!
                const parseNumber = (val) => {
                    if (val === undefined || val === null || val.trim() === '') return null;
                    const parsed = parseInt(val.replace(/,/g, ''), 10);
                    return isNaN(parsed) ? null : parsed;
                };

                const dataRows = results.data.slice(headerIndex + 1);
                const payload = [];

                dataRows.forEach(row => {
                    const partNumber = row[idxPart] ? row[idxPart].trim() : null;

                    // --- THE BOUNCER: STRICT VALIDATION ---
                    // 1. Must not be empty
                    // 2. Must not be the header text itself
                    // 3. Must not contain spaces or colons (blocks metadata like "Category : ")
                    if (
                        !partNumber || 
                        partNumber.toLowerCase().includes('part number') || 
                        partNumber.includes(' ') || 
                        partNumber.includes(':')
                    ) {
                        return; // Skip this garbage row entirely and move to the next one
                    }

                    // If it passed the bouncer, it's a real part number! Extract the rest:
                    const description = (idxDesc !== -1 && row[idxDesc] && row[idxDesc].trim() !== '') ? row[idxDesc].trim() : null;
                    const availability = idxAvail !== -1 ? parseNumber(row[idxAvail]) : null;
                    const reorderMin = idxMin !== -1 ? parseNumber(row[idxMin]) : null;
                    const reorderMax = idxMax !== -1 ? parseNumber(row[idxMax]) : null;

                    payload.push({
                        partNumber,
                        description,
                        availability,
                        reorderMin,
                        reorderMax
                    });
                });

                try {
                    const response = await fetch('http://10.126.15.197:8002/part/updateInventoryBatch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ updates: payload })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.details || "Failed to update database.");
                    }
                    
                    alert("Inventory synced successfully!");
                    window.location.reload(); 

                } catch (err) {
                    console.error(err);
                    alert(`Error: ${err.message}`);
                } finally {
                    setIsLoading(false);
                    if (fileInputRef.current) fileInputRef.current.value = ""; 
                }
            }
        });
    };

    const sparepartMaps = [
    { id: 1, title: 'Layout Sparepart', src: '/SparepartMap/LAYOUT_SPAREPART.png' },
    { id: 2, title: 'Rack F1', src: '/SparepartMap/F1.png' },
    { id: 3, title: 'Rack F2', src: '/SparepartMap/F2.png' },
    { id: 4, title: 'Rack G1', src: '/SparepartMap/G1.png' },
    { id: 5, title: 'Rack G2', src: '/SparepartMap/G2.1.png' },
    { id: 6, title: 'Rack GEA', src: '/SparepartMap/G2.2.png' },
    { id: 7, title: 'Rack H1', src: '/SparepartMap/H1.png' },
    { id: 8, title: 'Rack H2', src: '/SparepartMap/H2.png' },
    { id: 9, title: 'Rack I1', src: '/SparepartMap/I1.png' },
    { id: 10, title: 'Rack I2', src: '/SparepartMap/I2.png' },
];
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
                    <button className="action-btn cancel-btn" onClick={() => setIsMapOpen(true)}>
                        🗺️ Show Mapping
                    </button>
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

            <MapLightbox 
                isOpen={isMapOpen} 
                onClose={() => setIsMapOpen(false)} 
                mapImages={sparepartMaps} 
            />

        </div>
    )
}

export default InventoryTable;