import React, { useState, useEffect } from 'react';
import './SparepartDashboard.css';

const InventoryTable = () => {
    const [parts, setParts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await fetch('http://10.126.15.197:8002/part/getInventoryParts'); 
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setParts(data);
            } catch (err) {
                console.error("Failed to fetch parts:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInventory();
    }, []);

    const filteredParts = parts.filter((part) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            (part.Part_Number && part.Part_Number.toLowerCase().includes(searchLower)) ||
            (part.Part_Description && part.Part_Description.toLowerCase().includes(searchLower));

        const matchesType = typeFilter === 'ALL' || part.Type === typeFilter;

        return matchesSearch && matchesType;
    });

    if (isLoading) return <div className="inventory-container">Loading inventory data...</div>;
    if (error) return <div className="inventory-container" style={{ color: '#ef4444' }}>Error: {error}</div>;

    return (
        <div className="inventory-container">
            <div className="header-section">
                <h2>Inventory Parts Overview</h2>
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
            </div>
            
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
                            filteredParts.map((part) => (
                                <tr key={part.Part_Number}>
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
                                    <td>
                                        <span className={part.Availability < 5 ? 'stock-low' : 'stock-ok'}>
                                            {part.Availability}
                                        </span>
                                    </td>
                                    <td>{part.Last_Date}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;