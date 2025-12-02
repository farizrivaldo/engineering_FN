// src/pages/DailyAssignmentPage.jsx

import React, { useState, useEffect } from 'react';
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
  InputGroup,      // <--- NEW: For styling the search bar
  InputLeftElement // <--- NEW: For the search icon (optional)
} from '@chakra-ui/react';
import { Search } from "@mui/icons-material";

function DailyAssignmentPage() {
  const [pendingJobs, setPendingJobs] = useState([]); 
  const [selectedJobs, setSelectedJobs] = useState(new Set()); 
  const [scheduledDate, setScheduledDate] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  
  // --- NEW STATE: Holds the search text ---
  const [searchQuery, setSearchQuery] = useState(''); 

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

  // --- NEW LOGIC: Filter the jobs based on the search query ---
  // We use .filter() so we don't lose the original data. 
  // We convert both to lowercase so "PWO" matches "pwo".
  const filteredJobs = pendingJobs.filter((job) => 
    job.wo_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        setSearchQuery(''); // Optional: Clear search after assigning
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
          
          {/* Header + Search Bar Area */}
          <HStack justify="space-between" mb={4}>
            <Heading as="h3" size="md">
              Pending Jobs List (Holding Pen)
            </Heading>
            
            {/* --- NEW: Search Input --- */}
            <Box w="300px">
                {/* If you don't have InputGroup/Icons, just use <Input ... /> */}
                <InputGroup>
                    <InputLeftElement pointerEvents='none'>
                        <Search color='gray.300' />
                    </InputLeftElement>
                    <Input 
                        placeholder="Search PWO Number..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </InputGroup>
            </Box>
          </HStack>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Assign?</Th>
                  <Th>WO Number</Th>
                  <Th>Machine Name</Th>
                  <Th>Asset Number</Th>
                </Tr>
              </Thead>
              <Tbody>
                {/* --- UPDATE: Check filteredJobs instead of pendingJobs --- */}
                {filteredJobs.length === 0 && (
                  <Tr>
                    <Td colSpan={4}>
                      <Text textAlign="center">
                        {pendingJobs.length === 0 
                            ? "No pending jobs found." 
                            : "No jobs match your search."}
                      </Text>
                    </Td>
                  </Tr>
                )}
                
                {/* --- UPDATE: Map through filteredJobs --- */}
                {filteredJobs.map((job) => (
                  <Tr key={job.pending_id}>
                    <Td>
                      <Checkbox
                        isChecked={selectedJobs.has(job.pending_id)}
                        onChange={() => handleCheckboxChange(job.pending_id)}
                      />
                    </Td>
                    {/* Highlight the match if needed, for now just text */}
                    <Td fontWeight="bold">{job.wo_number}</Td>
                    <Td>{job.machine_name}</Td>
                    <Td>{job.asset_number}</Td>
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