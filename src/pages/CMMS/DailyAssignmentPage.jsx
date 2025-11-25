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
  Checkbox, // Import Checkbox
} from '@chakra-ui/react';

function DailyAssignmentPage() {
  const [pendingJobs, setPendingJobs] = useState([]); // All jobs from the holding pen
  const [selectedJobs, setSelectedJobs] = useState(new Set()); // IDs of checked jobs
  const [scheduledDate, setScheduledDate] = useState(''); // The date to assign
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // 1. Fetch all pending jobs on load
  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      const response = await fetch('http://localhost:8002/part/pending-jobs');
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      setPendingJobs(data);
    } catch (err) {
      toast({ title: 'Error fetching pending jobs', status: 'error' });
    }
  };

  // 2. Handle checking/unchecking a job
  const handleCheckboxChange = (jobId) => {
    const newSet = new Set(selectedJobs);
    if (newSet.has(jobId)) {
      newSet.delete(jobId);
    } else {
      newSet.add(jobId);
    }
    setSelectedJobs(newSet);
  };

  // 3. Handle assigning all selected jobs
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
      
      // Check for full success (201)
      if (response.status === 201) {
        toast({
          title: 'Jobs Assigned',
          description: result.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } 
      // Check for partial success (207)
      else if (response.status === 207) {
        toast({
          title: 'Partial Success',
          description: `${result.message}. See console (F12) for details.`,
          status: 'warning',
          duration: 9000,
          isClosable: true,
        });
        // Log the specific errors
        console.error('Assignment Errors:', result.errors);
      }
      // Check for full failure (409) or other errors
      else {
        // This will catch 409, 500, 400, etc.
        throw new Error(result.error || result.message || 'Failed to assign jobs');
      }

      // Clear selection and refresh the list ONLY if at least one job succeeded
      if (response.ok) { // response.ok is true for 201 and 207
        setSelectedJobs(new Set());
        setScheduledDate('');
        fetchPendingJobs(); // This will show the updated list
      }
    
    } catch (err) {
      // This will catch network errors and 4xx/5xx errors
      toast({ 
        title: 'Error Assigning Jobs', 
        description: err.message, 
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
      console.error('Full Error Response:', err);
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

        {/* --- 1. Assignment Controls --- */}
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h3" size="md" mb={4}>
            Assignment Controls
          </Heading>
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

        {/* --- 2. Pending Jobs Table --- */}
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h3" size="md" mb={4}>
            Pending Jobs List (Holding Pen)
          </Heading>
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
                {pendingJobs.length === 0 && (
                  <Tr>
                    <Td colSpan={4}>
                      <Text textAlign="center">No pending jobs found.</Text>
                    </Td>
                  </Tr>
                )}
                {pendingJobs.map((job) => (
                  <Tr key={job.pending_id}>
                    <Td>
                      <Checkbox
                        isChecked={selectedJobs.has(job.pending_id)}
                        onChange={() => handleCheckboxChange(job.pending_id)}
                      />
                    </Td>
                    <Td>{job.wo_number}</Td>
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