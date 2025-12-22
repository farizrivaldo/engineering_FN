import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Text, Input, InputGroup, InputLeftElement,
  SimpleGrid, Badge, VStack, HStack, IconButton, Avatar,
  Stat, StatLabel, StatNumber, StatHelpText, Icon, Spacer,
  Container, useColorModeValue, Button, Toast
} from '@chakra-ui/react';
import { 
  FiSearch, FiBell, FiMail, FiCheckCircle, FiClipboard, FiTool, FiCalendar 
} from 'react-icons/fi';
import { toast, ToastContainer } from "react-toastify";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';



// Helper to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'No Date';
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });
};

// --- COMPONENT: STAT CARD ---
const StatCard = ({ label, value, icon, color }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderCol = useColorModeValue('gray.100', 'gray.700');
  const labelCol = useColorModeValue('gray.500', 'gray.400');
  const valueCol = useColorModeValue('gray.700', 'gray.100');
  const iconBg = useColorModeValue(`${color}.50`, 'gray.700');
  const iconCol = useColorModeValue(`${color}.500`, `${color}.300`);
  return (
    <Box 
      bg={cardBg} p={6} borderRadius="xl" boxShadow="sm" 
      border="1px solid" borderColor={borderCol}
      transition="all 0.2s" _hover={{ boxShadow: "md" }}
    >
      <Flex justify="space-between" align="center">
        <Box>
          <Text fontSize="sm" color={labelCol} mb={1}>{label}</Text>
          <Text fontSize="3xl" fontWeight="bold" color={valueCol}>{value}</Text>
        </Box>
        <Box p={3} bg={iconBg} borderRadius="lg">
          <Icon as={icon} w={6} h={6} color={iconCol} />
        </Box>
      </Flex>
    </Box>
  );
};

// --- COMPONENT: CIRCULAR CHART ---
const CircularChart = ({ completed, total, label }) => {
  const data = [
    { name: 'Completed', value: completed },
    { name: 'Remaining', value: total - completed }
  ];
  const COLORS = ['#48bb78', '#c2c6daff'];
  const textCol = useColorModeValue('gray.700', 'gray.100');
  const subCol = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <Box textAlign="center">
      <Heading size="sm" color={textCol} mb={3}>{label}</Heading>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <Text fontSize="lg" fontWeight="bold" color={textCol}>{completed}/{total}</Text>
      <Text fontSize="sm" color={subCol}>Completed</Text>
    </Box>
  );
};

const TaskCard = ({ job, isUrgent }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderCol = useColorModeValue('gray.100', 'gray.700');
  const headingCol = useColorModeValue('gray.700', 'gray.100');
  const textCol = useColorModeValue('gray.500', 'gray.400');
  return (
    <Box 
      bg={cardBg} p={5} borderRadius="xl" boxShadow="sm" 
      border="1px solid" borderColor={borderCol} w="100%"
      _hover={{ borderColor: "blue.200", boxShadow: "md" }}
    >
      <Flex justify="space-between" align="start" mb={2}>
        <Heading size="sm" color={headingCol} noOfLines={1}>
          {job.machine_name || "Unknown Machine"}
        </Heading>
        <Badge colorScheme={isUrgent ? "red" : "orange"} borderRadius="full" px={2}>
          {isUrgent ? "High" : "Medium"}
        </Badge>
      </Flex>
      
      <Text fontSize="xs" color={textCol} mb={3} fontWeight="medium">
        {job.wo_number} • {job.category || 'Maintenance'}
      </Text>

      <HStack fontSize="sm" color={textCol}>
        <Icon as={FiCalendar} />
        <Text>Due: {formatDate(job.scheduled_date)}</Text>
      </HStack>
    </Box>
  );
};

function TechnicianDashboard() {
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingCol = useColorModeValue('gray.700', 'gray.100');
  const subTextCol = useColorModeValue('gray.500', 'gray.400');
  const listHeaderCol = useColorModeValue('gray.700', 'gray.100');
  const listCountCol = useColorModeValue('gray.500', 'gray.400');
  const listContainerBg = useColorModeValue('white', 'gray.800');
  const listBorderCol = useColorModeValue('gray.100', 'gray.700');

  const [workOrders, setWorkOrders] = useState([]);
  const [myAssignedPwoData, setMyAssignedPwoData] = useState([]);
  const [userName, setUserName] = useState("Technician");
  const [userId, setUserId] = useState(null);
  const [searchAllQuery, setSearchAllQuery] = useState("");
  const [searchMyQuery, setSearchMyQuery] = useState("");

// Put this inside TechnicianDashboard function
  
  useEffect(() => {
    // 1. Log when the component mounts
    console.log("🟢 Dashboard Component Mounted!"); 
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    console.log("🚀 STARTING fetchMyData function...");

    // 2. Check Local Storage
    const token = localStorage.getItem('user_token');
    
    if (!token) {
        console.error("❌ STOPPING: No 'user_token' found in localStorage.");
        console.warn("👉 Please Log Out and Log In again to save the token.");
        toast.error("Authentication Error: No token found. Please relogin.");
        return; 
    }

    console.log("✅ Token found:", token.substring(0, 15) + "..."); // Print part of token

    // Decode user info from token (including user ID)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserName(payload.name || "Technician");
      setUserId(payload.id);
      console.log("👤 User Name from token:", payload.name);
      console.log("🆔 User ID from token:", payload.id);
    } catch (e) {
      console.error("❌ Failed to decode token:", e);
    }

    try {
      await Promise.all([
        fetchAllPwo(token),
        fetchAssignedPwo(token)
      ]);
    } catch (err) {
      console.error("🔥 FETCH ERROR:", err);
      toast.error("Failed to load tasks.");
    }
  };

  const fetchAllPwo = async (token) => {
    console.log("📡 Request: /live-work-orders (ALL)");
    const response = await fetch('http://10.126.15.197:8002/part/live-work-orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("📥 ALL PWO Status:", response.status);
    if (!response.ok) throw new Error(`ALL PWO failed: ${response.status}`);
    const data = await response.json();
    console.log("📦 ALL PWO DATA:", Array.isArray(data) ? data.length : data);
    if (Array.isArray(data)) setWorkOrders(data);
  };

  const fetchAssignedPwo = async (token) => {
    console.log("📡 Request: /live-work-orders-assigned (MY)");
    const response = await fetch('http://10.126.15.197:8002/part/live-work-orders-assigned', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("📥 MY PWO Status:", response.status);
    if (!response.ok) throw new Error(`MY PWO failed: ${response.status}`);
    const data = await response.json();
    console.log("📦 MY PWO DATA:", Array.isArray(data) ? data.length : data);
    if (Array.isArray(data)) setMyAssignedPwoData(data);
  };

  // --- FILTERING LOGIC ---
  const allPwoBase = workOrders.filter(j => j.status !== 'Completed' && (j.wo_number || '').includes('PWO'));
  const myPwoBase = myAssignedPwoData.filter(j => j.status !== 'Completed' && (j.wo_number || '').includes('PWO'));

  const matchesSearch = (job, term) => {
    const q = term.toLowerCase();
    const wo = (job.wo_number || '').toLowerCase();
    const machine = (job.machine_name || '').toLowerCase();
    return wo.includes(q) || machine.includes(q);
  };

  const allPwoTasks = allPwoBase.filter(j => matchesSearch(j, searchAllQuery));
  const myAssignedPwo = myPwoBase.filter(j => matchesSearch(j, searchMyQuery));

  // Stats use full data (not filtered by search)
  const completedPwoCount = workOrders.filter(j => j.status === 'Completed' && (j.wo_number || '').includes('PWO')).length;
  const totalPwoCount = workOrders.filter(j => (j.wo_number || '').includes('PWO')).length;
  const totalIncompleteCount = allPwoBase.length;

  return (
    <Box bg={pageBg} minH="100vh" py={8}>
      <Container maxW="container.xl" bg={pageBg}>
        
        {/* --- 1. HEADER (Navbar removed, simple greeting kept) --- */}
        <Flex mb={8} align="center" direction={{ base: "column", md: "row" }} gap={4}>
          <Box>
            <Heading size="lg" color={headingCol}>Good Morning, {userName}</Heading>
            <Text color={subTextCol}>Here's your task overview for today</Text>
          </Box>
        </Flex>

        {/* --- 2. STATS GRID --- */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <StatCard 
            label="All Incomplete PWO" 
            value={allPwoTasks.length} 
            icon={FiClipboard} 
            color="blue" 
          />
          <StatCard 
            label="My Assigned PWO" 
            value={myAssignedPwo.length} 
            icon={FiTool} 
            color="orange" 
          />
          <StatCard 
            label="Completed PWO" 
            value={completedPwoCount} 
            icon={FiCheckCircle} 
            color="green" 
          />
          <StatCard 
            label="Total PWO" 
            value={totalPwoCount} 
            icon={FiCalendar} 
            color="purple" 
          />
        </SimpleGrid>

        {/* --- 3. CIRCULAR CHARTS GRID --- */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
          <Box bg={listContainerBg} border="1px solid" borderColor={listBorderCol} borderRadius="xl" p={6}>
            <CircularChart 
              completed={completedPwoCount} 
              total={totalPwoCount} 
              label="Overall PWO Status"
            />
          </Box>
          <Box bg={listContainerBg} border="1px solid" borderColor={listBorderCol} borderRadius="xl" p={6}>
            <CircularChart 
              completed={myAssignedPwo.length} 
              total={totalIncompleteCount} 
              label="My Assignment Status"
            />
          </Box>
        </SimpleGrid>

        {/* --- 4. MAIN CONTENT (Task Lists) --- */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          
          {/* LEFT COLUMN: All Incomplete PWO */}
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="md" color={listHeaderCol}>All Incomplete PWO</Heading>
              <Text fontSize="sm" color={listCountCol}>{allPwoTasks.length} tasks</Text>
            </Flex>
            <InputGroup mb={3}>
              <InputLeftElement pointerEvents="none"><FiSearch color="gray.400" /></InputLeftElement>
              <Input 
                placeholder="Search PWO number..." 
                value={searchAllQuery}
                onChange={(e) => setSearchAllQuery(e.target.value)}
              />
            </InputGroup>
            <Box bg={listContainerBg} border="1px solid" borderColor={listBorderCol} borderRadius="xl" p={3} maxH="60vh" overflowY="auto">
            <VStack spacing={4} align="stretch">
              {allPwoTasks.length === 0 ? (
                 <Box p={6} bg={listContainerBg} borderRadius="xl" textAlign="center" color={listCountCol}>
                    <Icon as={FiClipboard} w={10} h={10} mb={3} />
                    <Text fontSize="md" fontWeight="medium">No incomplete PWO tasks</Text>
                 </Box>
              ) : (
                allPwoTasks.map(job => (
                    <TaskCard key={job.work_order_id} job={job} isUrgent={false} />
                ))
              )}
            </VStack>
            </Box>
          </Box>

          {/* RIGHT COLUMN: My Assigned PWO */}
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Heading size="md" color={listHeaderCol}>My Assigned PWO</Heading>
              <Text fontSize="sm" color={listCountCol}>{myAssignedPwo.length} assigned to me</Text>
            </Flex>
            <InputGroup mb={3}>
              <InputLeftElement pointerEvents="none"><FiSearch color="gray.400" /></InputLeftElement>
              <Input 
                placeholder="Search PWO number..." 
                value={searchMyQuery}
                onChange={(e) => setSearchMyQuery(e.target.value)}
              />
            </InputGroup>
            <Box bg={listContainerBg} border="1px solid" borderColor={listBorderCol} borderRadius="xl" p={3} maxH="60vh" overflowY="auto">
            <VStack spacing={4} align="stretch">
              {myAssignedPwo.length === 0 ? (
                 <Box p={6} bg={listContainerBg} borderRadius="xl" textAlign="center" color={listCountCol}>
                    <Icon as={FiTool} w={10} h={10} mb={3} />
                    <Text fontSize="md" fontWeight="medium">No PWO assigned to you</Text>
                    <Text fontSize="sm" mt={2}>Check back later or contact your supervisor</Text>
                 </Box>
              ) : (
                myAssignedPwo.map(job => (
                    <TaskCard key={job.work_order_id} job={job} isUrgent={true} />
                ))
              )}
            </VStack>
            </Box>
          </Box>

        </SimpleGrid>
      </Container>
    </Box>
  );
}

export default TechnicianDashboard;