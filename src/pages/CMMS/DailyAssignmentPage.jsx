// src/pages/DailyAssignmentPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Container,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Divider,
  HStack,
  Checkbox,
  InputGroup,
  InputLeftElement,
  Select // <--- Import Select for the dropdowns
} from '@chakra-ui/react';
import { Search } from "@mui/icons-material";

// Helper constant for month names
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function DailyAssignmentPage() {
  const [pendingJobs, setPendingJobs] = useState([]); 
  const [selectedJobs, setSelectedJobs] = useState(new Set()); 
  const [scheduledDate, setScheduledDate] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 

  // --- NEW STATE: Month and Year Filters ---
  // Default to CURRENT Month (0-11) and CURRENT Year
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth()); 
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const toast = useToast();

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      const response = await fetch('http://10.126.15.197:8002/part/pending-jobs');
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      setPendingJobs(data);
    } catch (err) {
      toast({ title: 'Error fetching pending jobs', status: 'error' });
    }
  };

  const handleCheckboxChange = (jobId) => {
    const newSet = new Set(selectedJobs);
    if (newSet.has(jobId)) {
      newSet.delete(jobId);
    } else {
      newSet.add(jobId);
    }
    setSelectedJobs(newSet);
  };

  // --- GET UNIQUE YEARS FROM DATA ---
  // This ensures the dropdown contains years present in your database
  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()]); // Always include current year
    pendingJobs.forEach(job => {
      if (job.created_at) {
        years.add(new Date(job.created_at).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (2025, 2024...)
  }, [pendingJobs]);

  // --- FILTERING LOGIC ---
  const filteredJobs = pendingJobs.filter((job) => {
    // 1. Text Search
    const matchesSearch = job.wo_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Date Filter
    // We parse the DB date. If created_at is null, it fails the filter.
    if (!job.created_at) return false;

    const jobDate = new Date(job.created_at);
    
    // Check if valid date
    if (isNaN(jobDate.getTime())) return false;

    // Compare Month (0-11) and Year
    const matchesMonth = jobDate.getMonth() === parseInt(filterMonth);
    const matchesYear = jobDate.getFullYear() === parseInt(filterYear);

    return matchesSearch && matchesMonth && matchesYear;
  });

  const handleAssignJobs = async () => {
    if (selectedJobs.size === 0) {
      toast({ title: 'No jobs selected', status: 'warning', isClosable: true });
      return;
    }
    if (!scheduledDate) {
      toast({ title: 'Please select a scheduled date', status: 'warning', isClosable: true });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://10.126.15.197:8002/part/assign-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobs),
          scheduled_date: scheduledDate,
        }),
      });

      const result = await response.json();
      
      if (response.status === 201) {
        toast({ title: 'Jobs Assigned', description: result.message, status: 'success', duration: 5000, isClosable: true });
      } 
      else if (response.status === 207) {
        toast({ title: 'Partial Success', description: `${result.message}. See console.`, status: 'warning', duration: 9000, isClosable: true });
        console.error('Assignment Errors:', result.errors);
      }
      else {
        throw new Error(result.error || result.message || 'Failed to assign jobs');
      }

      if (response.ok) { 
        setSelectedJobs(new Set());
        setScheduledDate('');
        setSearchQuery(''); 
        fetchPendingJobs(); 
      }
    
    } catch (err) {
      toast({ title: 'Error Assigning Jobs', description: err.message, status: 'error', duration: 9000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading as="h2" size="lg">
          Assign Daily PMP Jobs
        </Heading>

        {/* --- Assignment Controls --- */}
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h3" size="md" mb={4}>Assignment Controls</Heading>
          <HStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Scheduled Date for Selected Jobs</FormLabel>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </FormControl>
            <Button
              colorScheme="blue"
              onClick={handleAssignJobs}
              isLoading={isLoading}
              alignSelf="flex-end"
              minW="180px"
            >
              Assign {selectedJobs.size} Jobs
            </Button>
          </HStack>
        </Box>

        <Divider />

        {/* --- Pending Jobs Table --- */}
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          
          {/* Header + Filters Area */}
          <HStack justify="space-between" mb={4} wrap="wrap" spacing={4} align="flex-end">
            <Heading as="h3" size="md" mb={1}>
              Pending Jobs List (Holding Pen)
            </Heading>
            
            <HStack spacing={3}>
                {/* --- MONTH SELECTOR --- */}
                <FormControl w="150px">
                    <FormLabel fontSize="xs" mb={0} color="gray.500">Filter Month</FormLabel>
                    <Select 
                        value={filterMonth} 
                        onChange={(e) => setFilterMonth(e.target.value)} 
                        size="md"
                        borderColor="gray.300"
                    >
                        {MONTH_NAMES.map((month, index) => (
                            <option key={index} value={index}>{month}</option>
                        ))}
                    </Select>
                </FormControl>

                {/* --- YEAR SELECTOR --- */}
                <FormControl w="100px">
                    <FormLabel fontSize="xs" mb={0} color="gray.500">Filter Year</FormLabel>
                    <Select 
                        value={filterYear} 
                        onChange={(e) => setFilterYear(e.target.value)} 
                        size="md"
                        borderColor="gray.300"
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </Select>
                </FormControl>

                {/* --- Search Input --- */}
                <Box w="250px">
                    <FormLabel fontSize="xs" mb={0} color="gray.500">Search</FormLabel>
                    <InputGroup>
                        <InputLeftElement pointerEvents='none'>
                            <Search color='gray.300' />
                        </InputLeftElement>
                        <Input 
                            placeholder="PWO Number..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </InputGroup>
                </Box>
            </HStack>
          </HStack>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Assign?</Th>
                  <Th>WO Number</Th>
                  <Th>Machine Name</Th>
                  <Th>Asset Number</Th>
                  <Th>Created Date</Th> 
                </Tr>
              </Thead>
              <Tbody>
                {filteredJobs.length === 0 && (
                  <Tr>
                    <Td colSpan={5}>
                      <Text textAlign="center" py={4} color="gray.500">
                        {pendingJobs.length === 0 
                            ? "No pending jobs found in database." 
                            : `No jobs found for ${MONTH_NAMES[filterMonth]} ${filterYear}.`}
                      </Text>
                    </Td>
                  </Tr>
                )}
                
                {filteredJobs.map((job) => (
                  <Tr key={job.pending_id}>
                    <Td>
                      <Checkbox
                        isChecked={selectedJobs.has(job.pending_id)}
                        onChange={() => handleCheckboxChange(job.pending_id)}
                      />
                    </Td>
                    <Td fontWeight="bold">{job.wo_number}</Td>
                    <Td>{job.machine_name}</Td>
                    <Td>{job.asset_number}</Td>
                    <Td>
                        {/* Show formatted date */}
                        {job.created_at ? new Date(job.created_at).toLocaleDateString('en-GB') : '-'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>

      </VStack>
    </Container>
  );
}

export default DailyAssignmentPage;