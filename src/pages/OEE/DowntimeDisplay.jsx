import React, { useState, useMemo } from 'react';

const ShiftStatsDisplay = ({ events = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  // LOGIC: Aggregate Data for Cards ONLY (Totals for the big numbers)
  const stats = useMemo(() => {
      const computed = {
          planned: { freq: 0, duration: 0 },
          unplanned: { freq: 0, duration: 0 }
      };

      events.forEach(curr => {
          const dur = parseFloat(curr.duration_minutes || 0);
          if (curr.category === 'Planned') {
              computed.planned.freq += 1;
              computed.planned.duration += dur;
          } else {
              computed.unplanned.freq += 1;
              computed.unplanned.duration += dur;
          }
      });
      return computed;
  }, [events]);

  // LOGIC: List Items (Just Sort, DO NOT GROUP)
  const listItems = useMemo(() => {
      // Sort by duration descending
      return [...events].sort((a, b) => b.duration_minutes - a.duration_minutes);
  }, [events]);

  const toggleAll = () => setIsOpen(!isOpen);

  // --- COLOR LOGIC ---
  const getStatusColor = (source) => {
      switch(source) {
          case 'SUPERVISOR': return 'text-green-600 font-bold'; // Confirmed by human
          case 'MACHINE': return 'text-gray-500 italic';       // Fallback machine data
          default: return 'text-gray-600';
      }
  };

  const renderDropdownList = (category) => {
    const filteredItems = listItems.filter(e => e.category === category);
    const borderColor = category === 'Unplanned' ? 'border-red-100' : 'border-blue-100';

    return (
      <div className={`mt-4 pt-2 border-t ${borderColor} animate-in fade-in slide-in-from-top-2 duration-200`}>
        <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="font-bold text-gray-400 uppercase sticky top-0 bg-white">
              <tr>
                <th className="py-2 w-20">Dur</th>
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {filteredItems.length === 0 ? (
                <tr><td colSpan="3" className="py-2 italic text-gray-400">No events found</td></tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2 font-bold text-gray-800">
                      {Math.round(item.duration_minutes)} m
                    </td>
                    
                    {/* DYNAMIC COLORED DESCRIPTION */}
                    <td className={`py-2 ${getStatusColor(item.compareStatus)}`}>
                      {item.reason_name}
                    </td>

                    <td className="py-2 text-right">
                       {/* BADGES */}
                       {item.compareStatus === 'new' && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded border border-red-200">NEW</span>}
                       {item.compareStatus === 'diff' && <span className="text-[9px] bg-yellow-100 text-yellow-600 px-1 rounded border border-yellow-200">DIFF</span>}
                       {item.compareStatus === 'match' && <span className="text-[9px] bg-green-100 text-green-600 px-1 rounded border border-green-200">MATCH</span>}
                       {item.compareStatus === 'pending' && <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded border border-gray-200">OPR</span>}
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

  return (
    <div className="grid grid-cols-2 gap-4 mb-6 items-start">
      
      {/* UNPLANNED CARD */}
      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-red-500 transition-all duration-300 ${isOpen ? 'ring-2 ring-red-100' : 'hover:shadow-lg cursor-pointer'}`}>
        <div onClick={toggleAll} className="flex justify-between items-center cursor-pointer">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-red-500 transition-colors">
                Unplanned Downtime 
                {isOpen ? <span className="ml-2 text-[10px] text-red-400">▼</span> : <span className="ml-2 text-[10px] text-gray-300">▶</span>}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-red-600">{Math.round(stats.unplanned.duration)}m</span>
                <span className="text-sm font-medium text-gray-500">total loss</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-800">{stats.unplanned.freq}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">Events</div>
            </div>
        </div>
        {isOpen && renderDropdownList('Unplanned')}
      </div>

      {/* PLANNED CARD */}
      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-100' : 'hover:shadow-lg cursor-pointer'}`}>
        <div onClick={toggleAll} className="flex justify-between items-center cursor-pointer">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">
                Planned Budget
                {isOpen ? <span className="ml-2 text-[10px] text-blue-400">▼</span> : <span className="ml-2 text-[10px] text-gray-300">▶</span>}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-blue-600">{Math.round(stats.planned.duration)}m</span>
                <span className="text-sm font-medium text-gray-500">utilized</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-800">{stats.planned.freq}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">Activities</div>
            </div>
        </div>
        {isOpen && renderDropdownList('Planned')}
      </div>

    </div>
  );
};

export default ShiftStatsDisplay;