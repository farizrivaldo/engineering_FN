import { useEffect, useState } from "react";
import LogoIcon from '../assets/kalbe CH-logo-putih.png';
import LogoIconn2 from '../assets/logo-kalbe CH-black.png';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { LuPill } from "react-icons/lu";
import { FaScrewdriverWrench } from "react-icons/fa6";
import FactoryIcon from '@mui/icons-material/Factory';
import { BsBuildingsFill } from "react-icons/bs";
import { FaChartPie } from "react-icons/fa";
import AssignmentIcon from '@mui/icons-material/Assignment';
import EngineeringIcon from '@mui/icons-material/Engineering';
// import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import MenuOpenSharpIcon from '@mui/icons-material/MenuOpenSharp';
import TableViewIcon from '@mui/icons-material/TableView';
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import '../index.css'
import { AddTask, StickyNote2, Task, AssignmentInd, Description } from "@mui/icons-material";
// import { PieChart } from "@mui/icons-material";


function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(true);
  const [dropdownStates, setDropdownStates] = useState({});
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const userGlobal = useSelector((state) => state.user.user);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSidebarToggle = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
    if (!isSidebarMinimized) {
      setDropdownStates({}); // Close all dropdowns when minimizing
    }
    setOpen(!open);
  };

  const toggleDropdown = (menuKey) => {
    setDropdownStates((prevState) => ({
      ...prevState,
      [menuKey]: !prevState[menuKey], // Toggle the specific dropdown
    }));
  };
  
  useEffect(() => {
    // Define a function to check the `data-theme` attribute on the `<html>` element
    const checkTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(currentTheme === 'dark');
    };

    // Initial check
    checkTheme();

    // Listen for changes in the theme attribute
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const getNavigationItems = () => {
    const navigation = [];
    if(userGlobal.level < 1 ){
      navigation.push(
        { name: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/dashboard" }
      );
    }
    if (userGlobal.level == 1) {
      navigation.push({
        name: "Dashboard",
        icon: <DashboardOutlinedIcon sx={{ fontSize: 21 }} className="flex-shrink-0 m-1 "/>,
        path: "/dashboard",
      },{
        name: "Maintenance",
        icon: <EngineeringIcon />,
        path: "/maintenance",
        subMenu: [
          {
            name: "Maintenance Breakdown Report",
            path: "/maintenance?tab=maintenance-breakdown",
            visible: userGlobal.level < 2, // Conditional visibility
          },
          { name: "Maintenance Report", path: "/maintenance?tab=handover" },
          { name: "Data Report", path: "/maintenance?tab=data-report" },
          { name: "Historical Machine", path: "/maintenance?tab=historical" },
        ],
      });
    }
    if (userGlobal.level == 2) {
      navigation.push({
        name: "Dashboard",
        icon: <DashboardOutlinedIcon sx={{ fontSize: 21 }} className="flex-shrink-0 m-1 "/>,
        path: "/dashboard",
      },{
        name: "Maintenance",
        icon: <EngineeringIcon />,
        path: "/maintenance",
        subMenu: [
          {
            name: "Maintenance Breakdown Report",
            path: "/maintenance?tab=maintenance-breakdown",
            visible: userGlobal.level < 2, // Conditional visibility
          },
          { name: "Maintenance Report", path: "/maintenance?tab=handover" },
          { name: "Data Report", path: "/maintenance?tab=data-report" },
          { name: "Historical Machine", path: "/maintenance?tab=historical" },
        ],
      },{
        name: "Instrument",
        icon: <LuPill sx={{ fontSize: 21 }} className="flex-shrink-0 m-1 "/>,
        path: "/Instrument",
      },{
        name: "Production",
        icon: <FactoryIcon sx={{ fontSize: 22 }} className="flex-shrink-0 "/>,
        path: "/production",
        subMenu: [
          {
            name: "Input Data",
            path: "/production?tab=Input",
            visible: userGlobal.level < 5, // Conditional visibility
          },
          { name: "Overview", path: "/production?tab=Prod" },
        ],
      });
    }
    if (userGlobal.level == 3) {
      navigation.push({
        name: "Dashboard",
        icon: <DashboardOutlinedIcon sx={{ fontSize: 21 }} className="flex-shrink-0 m-1 "/>,
        path: "/dashboard",
      },{
        name: "Maintenance",
        icon: <EngineeringIcon />,
        path: "/maintenance",
        subMenu: [
          {
            name: "Maintenance Breakdown Report",
            path: "/maintenance?tab=maintenance-breakdown",
            visible: userGlobal.level < 2, // Conditional visibility
          },
          { name: "Maintenance Report", path: "/maintenance?tab=handover" },
          { name: "Data Report", path: "/maintenance?tab=data-report" },
          { name: "Historical Machine", path: "/maintenance?tab=historical" },
        ],
      },{
        name: "Instrument",
        icon: <LuPill size={21} className="flex-shrink-0 m-1"/>,
        path: "/Instrument",
      },{
        name: "Utility",
        icon: <FaScrewdriverWrench size={20}/>,
        path: "/utility",
        subMenu: [
          {
            name: "Power Management",
            path: "/utility?tab=power-management",
          },
          { name: "Water Management", path: "/utility?tab=water-management" },
          { name: "Waste Water Management", path: "/utility?tab=waste-water-management" },
          { name: "Heating Ventilating & Air Control", path: "/utility?tab=HVAC" },
          { name: "Steam Control", path: "/utility?tab=steam-control" },
          { name: "Solar Management", path: "/utility?tab=solar-management" },
          { name: "Loopo", path: "/utility?tab=loopo" },
          { name: "Osmotron", path: "/utility?tab=osmotron" },
          { name: "Alarm List", path: "/utility?tab=alarm-list" },
          { name: "Motor Vibration", path: "/utility?tab=motor-vibration" },
        ],
      },{
        name: "Production",
        icon: <FactoryIcon sx={{ fontSize: 22 }} className="flex-shrink-0 "/>,
        path: "/production",
        subMenu: [
          {
            name: "Input Data",
            path: "/production?tab=Input",
            visible: userGlobal.level < 5, // Conditional visibility
          },
          { name: "Overview", path: "/production?tab=Prod" },
        ],
      },{
        name: "Building",
        icon: <BsBuildingsFill size={20}/>,
        path: "/building",
        subMenu: [
          {
            name: "Environment Monitoring Process",
            path: "/building?tab=EMS",
          },
          { name: "Building Management System", path: "/building?tab=BAS" },
          { name: "RnD Laboratorium Monitoring", path: "/building?tab=RnD" },
          { name: "Warehouse 1 Monitoring", path: "/building?tab=WH1" },
        ],
      });
    }
    if (userGlobal.level == 4) {
      navigation.push({
        name: "Dashboard",
        icon: <DashboardOutlinedIcon sx={{ fontSize: 21 }} className="flex-shrink-0 m-1 " />,
        path: "/TechnicianDashboard",
      },{
        name: "Maintenance",
        icon: <EngineeringIcon />,
        path: "/maintenance",
        subMenu: [
          {
            name: "Maintenance Breakdown Report",
            path: "/maintenance?tab=maintenance-breakdown",
            visible: userGlobal.level < 2, // Conditional visibility
          },
          { name: "Maintenance Report", path: "/maintenance?tab=handover" },
          { name: "Data Report", path: "/maintenance?tab=data-report" },
          { name: "Historical Machine", path: "/maintenance?tab=historical" },
        ],
      },{
        name: "Instrument",
        icon: <LuPill size={21} className="flex-shrink-0 m-1"/>,
        path: "/Instrument",
      },{
        name: "Utility",
        icon: <FaScrewdriverWrench size={20}/>,
        path: "/utility",
        subMenu: [
          {
            name: "Power Management",
            path: "/utility?tab=power-management",
          },
          { name: "Water Management", path: "/utility?tab=water-management" },
          { name: "Waste Water Management", path: "/utility?tab=waste-water-management" },
          { name: "Heating Ventilating & Air Control", path: "/utility?tab=HVAC" },
          { name: "Steam Control", path: "/utility?tab=steam-control" },
          { name: "Solar Management", path: "/utility?tab=solar-management" },
          { name: "Loopo", path: "/utility?tab=loopo" },
          { name: "Osmotron", path: "/utility?tab=osmotron" },
          { name: "Alarm List", path: "/utility?tab=alarm-list" },
          { name: "Motor Vibration", path: "/utility?tab=motor-vibration" },
        ],
      },{
        name: "Production",
        icon: <FactoryIcon sx={{ fontSize: 22 }} className="flex-shrink-0 "/>,
        path: "/production",
        subMenu: [
          {
            name: "Input Data",
            path: "/production?tab=Input",
            visible: userGlobal.level < 5, // Conditional visibility
          },
          { name: "Overview", path: "/production?tab=Prod" },
        ],
      },{
        name: "Building",
        icon: <BsBuildingsFill size={20}/>,
        path: "/building",
        subMenu: [
          {
            name: "Environment Monitoring Process",
            path: "/building?tab=EMS",
          },
          { name: "Building Management System", path: "/building?tab=BAS" },
          { name: "RnD Laboratorium Monitoring", path: "/building?tab=RnD" },
          { name: "Warehouse 1 Monitoring", path: "/building?tab=WH1" },
        ],
      },{
        name: "OPE",
        icon: <FaChartPie size={21} className="flex-shrink-0 m-1 gap-y-4" />,
        path: "/OPE",
      },{
        name: "Batch Record",
        icon: <AssignmentIcon size={21} className="flex-shrink-0 m-[2px] gap-y-1"/>,
        path: "/BatchRecord",
      },{
        name: "PMP",
        icon: <AssignmentInd size={21}/>,
        path: "/PWOInput",
        subMenu: [
          { name: "Technician", path: "/TechnicianPage"  },
          { name: "Completed PWO", path: "/CompletedJobs"},
          { name: "Technician Dashboard", path: "/TechnicianDashboard"},
        ],        
      }
    
    );
    }
    if (userGlobal.level == 5) {
      navigation.push({
        name: "Dashboard",
        icon: <DashboardOutlinedIcon sx={{ fontSize: 21 }} className="flex-shrink-0 m-1 "/>,
        path: "/dashboard",
      },{
        name: "Maintenance",
        icon: <EngineeringIcon />,
        path: "/maintenance",
        subMenu: [
          {
            name: "Maintenance Breakdown Report",
            path: "/maintenance?tab=maintenance-breakdown",
            visible: userGlobal.level < 2, // Conditional visibility
          },
          { name: "Maintenance Report", path: "/maintenance?tab=handover" },
          { name: "Data Report", path: "/maintenance?tab=data-report" },
          { name: "Historical Machine", path: "/maintenance?tab=historical" },
        ],
      },{
        name: "Instrument",
        icon: <LuPill size={21} className="flex-shrink-0 m-1"/>,
        path: "/Instrument",
      },{
        name: "Utility",
        icon: <FaScrewdriverWrench size={20} />,
        path: "/utility",
        subMenu: [
          {
            name: "Power Management",
            path: "/utility?tab=power-management",
          },
          { name: "Water Management", path: "/utility?tab=water-management" },
          { name: "Waste Water Management", path: "/utility?tab=waste-water-management" },
          { name: "Heating Ventilating & Air Control", path: "/utility?tab=HVAC" },
          { name: "Steam Control", path: "/utility?tab=steam-control" },
          { name: "Solar Management", path: "/utility?tab=solar-management" },
          { name: "Loopo", path: "/utility?tab=loopo" },
          { name: "Osmotron", path: "/utility?tab=osmotron" },
          { name: "Alarm List", path: "/utility?tab=alarm-list" },
          { name: "Motor Vibration", path: "/utility?tab=motor-vibration" },
        ],
      },{
        name: "Production",
        icon: <FactoryIcon sx={{ fontSize: 22 }} className="flex-shrink-0 " />,
        path: "/production",
        subMenu: [
          {
            name: "Input Data",
            path: "/production?tab=Input",
            visible: userGlobal.level < 5, // Conditional visibility
          },
          { name: "Overview", path: "/production?tab=Prod" },
          { name: "OEE Fette", path: "/OeeDashboard" },
        ],
      },{
        name: "Building",
        icon: <BsBuildingsFill size={20} />,
        path: "/building",
        subMenu: [
          {
            name: "Environment Monitoring Process",
            path: "/building?tab=EMS",
          },
          { name: "Building Management System", path: "/building?tab=BAS" },
          { name: "RnD Laboratorium Monitoring", path: "/building?tab=RnD" },
          { name: "Warehouse 1 Monitoring", path: "/building?tab=WH1" },
        ],
      },{
        name: "OPE",
        icon: <FaChartPie size={21} className="flex-shrink-0 m-1 gap-y-4"/>,
        path: "/OPE",
      },{
        name: "Batch Record",
        icon: <AssignmentIcon size={21} className="flex-shrink-0 m-[2px] gap-y-1"/>,
        path: "/BatchRecord",
      },{
        name: "History Tabel",
        icon: <TableViewIcon size={21} className="flex-shrink-0 m-[2px] gap-y-1"/>,
        path: "/HistoryTabel",
      },{
        name: "PMP",
        icon: <AssignmentInd size={21}/>,
        path: "/PWOInput",
        subMenu: [
          // { name: "Machine Manager", path: "/MachineManager", visible: userGlobal.level > 4 },
          { name: "PMP Uploader", path: "/PMPUploader", visible: userGlobal.level > 4 },
          { name: "Assign PMP", path: "/assign-jobs", visible: userGlobal.level > 4 },
          // { name: "Operations", path: "/MasterPMP", visible: userGlobal.level > 4 },
          // { name: "Input PWO Data", path: "/PWOInput", visible: userGlobal.level > 4 },
          // { name: "Assign PWO", path: "/AssignPWO" },
          { name: "Technician", path: "/TechnicianPage", visible: userGlobal.level <= 5 },
          { name: "Supervisor Approval", path: "/supervisor-approval", visible: userGlobal.level > 4 },
          { name: "Completed PWO", path: "/CompletedJobs",visible: userGlobal.level > 4 },
          // { name: "Technician Dashboard", path: "/TechnicianDashboard",visible: userGlobal.level > 4 },
          // { name: "Profile Manager", path: "/ProfileManager", visible: userGlobal.level > 4 },
          // { name: "PWO List", path: "/ReadPWO" },
        ],
        
      },
      {
        name: "Work Order",
        icon: <Description size={21} className="flex-shrink-0 m-1"/>,
        path: "/work-orders",
      }    
    );
  }

    
    // Add more items as needed for higher levels
    return navigation;
  };

  const navigation = getNavigationItems();
  // console.log(userGlobal.level);
  
  return (
    <nav
    className={`box-border bg-background border-border min-h-screen ${
      open ? "w-[250px]" : "w-[88px]"
    } sticky left-0 self-start overflow-hidden top-0 transition-all duration-500 ease-in-out py-[5px]`}
    style={{ paddingInline: "1em" }}
  >
    <ul className="list-none space-y-1">
      <li className="flex justify-end mb-[16px] pt-[2px]" style={{ height: "65.54px" }}>
        {open && <img className="h-[54px] flex-shrink-0" src={isDarkMode ? LogoIcon : LogoIconn2} alt="logo" />}
        <button
          className={`ml-auto p-[10px] pr-[5px] border-none rounded-md bg-none cursor-pointer focus:outline-none hover:bg-hvrr ${
            !open ? "justify-center w-full" : ""
          }`}
        >
          <MenuOpenSharpIcon
            sx={{ fontSize: 40 }}
            onClick={handleSidebarToggle}
            className="flex-shrink-0 w-6 h-6"
          />
        </button>
      </li>

      {navigation.map((item) => (
        <li key={item.name}>
          {item.subMenu ? (
            <>
              {/* Main menu with dropdown */}
              <button
                className="flex items-center text-left w-full gap-[19px] rounded-md p-[14px] border-none hover:bg-hvrr cursor-pointer bg-none focus:outline-none"
                style={{ height: "51.18px" }}
                onClick={() => toggleDropdown(item.name)}
              >
                <span className="w-6 h-6 m-[4px] flex-shrink-0">
                  {item.icon}
                </span>
                {open && <span className="no-underline flex-grow">{item.name}</span>}
                <ArrowDropDownIcon
                  className={`w-6 h-6 transform transition-transform duration-300 ${
                    dropdownStates[item.name] ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Submenu items */}
              <ul
                className="pl-[32px] grid gap-1 mt-2 overflow-hidden transition-[max-height] duration-500 ease-in-out"
                style={{
                  maxHeight:
                    dropdownStates[item.name] && !isSidebarMinimized ? "500px" : "0px",
                }}
              >
                {item.subMenu.map(
                  (subItem) =>
                    (!subItem.visible || subItem.visible) && ( // Check visibility
                      <li key={subItem.name}>
                        <a
                          className="block p-2 text-sm cursor-pointer hover:bg-hvrr rounded-md"
                          onClick={() => navigate(subItem.path)}
                        >
                          {subItem.name}
                        </a>
                      </li>
                    )
                )}
              </ul>
            </>
          ) : (
            /* Single menu item */
            <a
              className="flex items-center gap-[22px] rounded-md p-[14px] hover:bg-hvrr cursor-pointer"
              style={{ height: "51.18px" }}
              onClick={() => navigate(item.path)}
            >
              <span className="gap-1">
              {item.icon}
              </span>
              {open && <span className="no-underline flex-grow ">{item.name}</span>}
            </a>
          )}
        </li>
      ))}
    </ul>
  </nav>
  );
}

export default Sidebar;
