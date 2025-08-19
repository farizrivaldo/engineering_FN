import { useSelector } from "react-redux";
import { Routes, Route, useLocation } from "react-router-dom";
import './index.css'
import Navbar from "./components/Navbar";
import Maintenance from "./pages/Maintenance";
import Pareto from "./pages/ParetoData";
import Instrument from "./pages/Instrument";
import CreateNew from "./pages/CreateNew";
import CreateEdit from "./pages/CreateEdit";
import AppPareto from "./pages/building";
import Login from "./pages/Login";
import Loginasli from "./pages/Loginasli"
import Register from "./pages/Register";
import { CheckLogin } from "./features/part/userSlice";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import CheckMail from "./pages/CheckMail";
import EditProfile from "./pages/EditProfile";
import Production from "./pages/Production";
import App1 from "./pages/LandingProduction";
import AvabilityOPE from "./pages/AvabilityOPE";
import AvabilityMachine from "./pages/AvabilityMachine";
import Admin from "./pages/Admin";
import Sidebar from "./components/Sidebar";
import OEEline from "./pages/OEEline";
import Utility from "./pages/Utility";
import Stopwatch from "./pages/Stopwatch";
import MachineHistorical from "./pages/MachineHistorical";
import BatchRecord from "./pages/BatchRecord";
import HistoryTabel from "./pages/HistoryTabel";
import LandingPage from "./pages/LandingPage";
import ResetPass from "./pages/ResetPass";
import Dashboard from "./pages/Dashboard";
import Chat from "./components/Chat";
import Header from "./components/header";


function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const userlocalStorage = localStorage.getItem("user_token");
  const userGlobal = useSelector((state) => state.user.user.level);
  const [levelData, setLevelData] = useState();

  //KEEP LOGIN CHECKER
  const keepLogin = () => {
    if (userlocalStorage) {
      dispatch(CheckLogin(userlocalStorage));
    }
  };

  useEffect(() => {
    // getArrival()
    setLevelData(userGlobal);
    // console.log(levelData);
    keepLogin();
  }, [userGlobal]);

  if (location.pathname === "/") {
    // Separate layout for landing page, without grid
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />

      </Routes>
    );
  }

  if (location.pathname === "/login") {
    // Separate layout for landing page, without grid
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }
  if (location.pathname === "/register") {
    // Separate layout for landing page, without grid
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }
  if (location.pathname === "/resetpass") {
    // Separate layout for landing page, without grid
    return (
      <Routes>
        <Route path="/resetpass" element={<ResetPass />} />
      </Routes>
    );
  }



  if (levelData === 5) {
    return (
      <div className="bg-background min-h-screen min-w-full grid grid-cols-[auto_1fr] ">
        <>
          <Sidebar /> 
        </>

        {/* Wrapper untuk Header + Konten */}
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          
          {/* Header */}
          <>
            <Header />
          </>

          {/* Konten Utama */}
          <div className="overflow-x-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/Instrument" element={<Instrument />} />
              <Route path="/pareto" element={<Pareto />} />
              <Route path="/createnew" element={<CreateNew />} />
              <Route path="/createedite/:id" element={<CreateEdit />} />
              <Route path="/building" element={<AppPareto />} />
              <Route path="/mail" element={<CheckMail />} />
              <Route path="/editprofile" element={<EditProfile />} />
              <Route path="/production" element={<Production />} />
              <Route path="/OPE" element={<App1 />} />
              <Route path="/avabilityope" element={<AvabilityOPE />} />
              <Route path="/avabilitmachine" element={<AvabilityMachine />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/oeeLine" element={<OEEline />} />
              <Route path="/utility" element={<Utility />} />
              <Route path="/Stopwatch" element={<Stopwatch />} />
              <Route path="/HistoricalMachine" element={<MachineHistorical />} />
              <Route path="/BatchRecord" element={<BatchRecord />} />
              <Route path="/HistoryTabel" element={<HistoryTabel />} />
            </Routes>
          </div>
        </div>
        <>
          <Chat />
        </>
      </div>
    );
  } else if (levelData === 4) {
    return (
      <div className="bg-background min-h-screen min-w-full grid grid-cols-[auto_1fr] ">
        <>
          <Sidebar /> 
        </>

        {/* Wrapper untuk Header + Konten */}
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          
          {/* Header */}
          <>
            <Header />
          </>
          <div className="overflow-x-auto">
            <Routes>
              {/* <Route path="/" element={<Login />} /> */}
              {/* <Route path="/register" element={<Register />} /> */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/Instrument" element={<Instrument />} />
              <Route path="/pareto" element={<Pareto />} />
              <Route path="/createnew" element={<CreateNew />} />
              <Route path="/createedite/:id" element={<CreateEdit />} />
              <Route path="/building" element={<AppPareto />} />
              <Route path="/mail" element={<CheckMail />} />
              <Route path="/editprofile" element={<EditProfile />} />
              <Route path="/production" element={<Production />} />
              <Route path="/HistoricalMachine" element={<MachineHistorical />} />
              <Route path="/avabilityope" element={<AvabilityOPE />} />
              <Route path="/avabilitmachine" element={<AvabilityMachine />} />
              <Route path="/oeeLine" element={<OEEline />} />
              <Route path="/utility" element={<Utility />} />
              <Route path="/Stopwatch" element={<Stopwatch />} />
            </Routes>
          </div>
        </div>
        <>
          <Chat />
        </>
      </div>
    );
  } if (levelData === 3) {
    return (
      <div className="bg-background min-h-screen min-w-full grid grid-cols-[auto_1fr] ">
        <>
          <Sidebar /> 
        </>
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          <>
            <Header />
          </>
          <div className="overflow-x-auto">
            <Routes>
              {/* <Route path="/" element={<Login />} /> */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/Instrument" element={<Instrument />} />
              <Route path="/pareto" element={<Pareto />} />
              <Route path="/createnew" element={<CreateNew />} />
              <Route path="/createedite/:id" element={<CreateEdit />} />
              <Route path="/mail" element={<CheckMail />} />
              <Route path="/editprofile" element={<EditProfile />} />
              <Route path="/production" element={<Production />} />
              <Route path="/OPE" element={<App1 />} />
              <Route path="/avabilityope" element={<AvabilityOPE />} />
              <Route path="/avabilitmachine" element={<AvabilityMachine />} />
              <Route path="/oeeLine" element={<OEEline />} />
              <Route path="/utility" element={<Utility />} />
              <Route path="/Stopwatch" element={<Stopwatch />} />
            </Routes>
          </div>
        </div>
        <>
          <Chat />
        </> 
      </div>
    );
  } else if (levelData === 2) {
    return (
      <div className="bg-background min-h-screen min-w-full grid grid-cols-[auto_1fr] ">
        <>
          <Sidebar /> 
        </>
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          <>
            <Header />
          </>
          <div className="overflow-x-auto">
            <Routes>
              {/* <Route path="/" element={<Login />} /> */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/Instrument" element={<Instrument />} />
              <Route path="/production" element={<Production />} />
            </Routes>
          </div>
        </div>
        <>
          <Chat />
        </> 
      </div>
    );
  } else if (levelData === 1) {
    return (
      <div className="bg-background min-h-screen min-w-full grid grid-cols-[auto_1fr] ">
        <>
          <Sidebar /> 
        </>
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          <>
            <Header />
          </>
          <div className="overflow-x-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/maintenance" element={<Maintenance />} />
            </Routes>
          </div>
        </div>
        <>
          <Chat />
        </> 
      </div>
    );
  } else {
    return (
      <div className="bg-background min-h-screen min-w-full grid grid-cols-[auto_1fr] ">
        <>
          <Sidebar /> 
        </>
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          <>
            <Header />
          </>
          <div className="overflow-x-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mail" element={<CheckMail />} />
              <Route path="/Stopwatch" element={<Stopwatch />} />            
            </Routes>
          </div>
        </div>
        <>
          <Chat />
        </>      
      </div>
    );
  }
}

export default App;
