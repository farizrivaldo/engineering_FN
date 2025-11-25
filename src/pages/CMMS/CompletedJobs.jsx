// src/pages/CompletedJobsPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Button, VStack, Container, useToast, Table, Thead, Tbody,
  Tr, Th, Td, Text, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl,
  FormLabel, Input, Select, Divider, HStack,
} from '@chakra-ui/react';

// Helper function to make dates readable
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'N/A';
  try { return new Date(dateTimeStr).toLocaleString(); }
  catch (e) { return 'Invalid Date'; }
};

// Arrays for the filter dropdowns
const months = [
  { num: 1, name: 'January' }, { num: 2, name: 'February' }, { num: 3, name: 'March' },
  { num: 4, name: 'April' }, { num: 5, name: 'May' }, { num: 6, name: 'June' },
  { num: 7, name: 'July' }, { num: 8, name: 'August' }, { num: 9, name: 'September' },
  { num: 10, name: 'October' }, { num: 11, name: 'November' }, { num: 12, name: 'December' },
];
// Get current year and last 5 years
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 2 }, (_, i) => currentYear - i); // [2025, 2024, ...]


function CompletedJobsPage() {
  const [jobs, setJobs] = useState([]); // Holds the main list of completed jobs
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // --- State for Filters ---
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // --- State for Details Modal ---
  const [selectedJob, setSelectedJob] = useState(null); // The main job details
  const [jobOperations, setJobOperations] = useState([]); // The operations checklist
  const { isOpen, onOpen, onClose } = useDisclosure();

  // --- Data Fetching ---
  useEffect(() => {
    fetchJobs(); // Fetch jobs when component loads
  }, []);

  // Main function to fetch jobs based on current filters
  const fetchJobs = async () => {
    setIsLoading(true);
    // Build the query string from our filters
    const params = new URLSearchParams();
    if (filterMonth) params.append('month', filterMonth);
    if (filterYear) params.append('year', filterYear);

    try {
      const response = await fetch(`http://10.126.15.197:8002/completed-jobs?${params.toString()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      toast({ title: 'Error fetching jobs', description: err.message, status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the operations *for a specific job* when "View Details" is clicked
  const fetchOperations = async (workOrderId) => {
    try {
      const response = await fetch(`http://localhost:8002/part/work-order-operations/${workOrderId}`);
      if (!response.ok) throw new Error('Could not fetch operations');
      const data = await response.json();
      setJobOperations(data);
    } catch (err) {
      toast({ title: 'Error fetching operations list', status: 'error' });
      setJobOperations([]);
    }
  };

  // --- Handlers ---
  const handleFilterClick = () => {
    fetchJobs(); // Re-run the fetch with the new filter state
  };

  const handleClearFilters = () => {
    setFilterMonth('');
    setFilterYear('');
    // We must pass an empty fetchJobs() to clear the params
    fetchJobs(); 
  };
  
  const handleViewDetails = (job) => {
    setSelectedJob(job);
    fetchOperations(job.work_order_id);
    onOpen();
  };

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading as="h2" size="lg">
          Completed PMP History
        </Heading>

        {/* --- 1. Filter Controls --- */}
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h3" size="md" mb={4}>Filter by Date Completed</Heading>
          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Month</FormLabel>
              <Select
                placeholder="All Months"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.num} value={m.num}>{m.name}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Year</FormLabel>
              <Select
                placeholder="All Years"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </FormControl>
            <Button colorScheme="blue" onClick={handleFilterClick} mt={8}>Filter</Button>
            <Button variant="ghost" onClick={handleClearFilters} mt={8}>Clear</Button>
          </HStack>
        </Box>

        {/* --- 2. Completed Jobs Table --- */}
        <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h3" size="md" mb={4}>
            Finished Jobs (Sorted by most recent)
          </Heading>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Completed Date</Th>
                  <Th>WO Number</Th>
                  <Th>Machine Name</Th>
                  <Th>Technician</Th>
                  <Th isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading && (
                  <Tr><Td colSpan={5} textAlign="center">Loading...</Td></Tr>
                )}
                {!isLoading && jobs.length === 0 && (
                  <Tr><Td colSpan={5} textAlign="center">No completed jobs found.</Td></Tr>
                )}
                {jobs.map((job) => (
                  <Tr key={job.work_order_id}>
                    <Td>{formatDateTime(job.completed_time)}</Td>
                    <Td>{job.wo_number}</Td>
                    <Td>{job.machine_name}</Td>
                    <Td>{job.technician_name}</Td>
                    <Td isNumeric>
                      <Button colorScheme="gray" size="sm" onClick={() => handleViewDetails(job)}>
                        View Details
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>

      {/* --- 3. Details Modal --- */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Job Details: {selectedJob?.wo_number}</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text><strong>Machine:</strong> {selectedJob?.machine_name}</Text>
                <Text><strong>Technician:</strong> {selectedJob?.technician_name}</Text>
                <Text><strong>Started:</strong> {formatDateTime(selectedJob?.start_time)}</Text>
                <Text><strong>Completed:</strong> {formatDateTime(selectedJob?.completed_time)}</Text>
              </Box>
              <Divider />
              <Box>
                <Heading as="h4" size="sm" mb={2}>Overall Job Note:</Heading>
                <Text p={2} bg="gray.50" borderRadius="md">
                  {selectedJob?.technician_note || 'N/A'}
                </Text>
              </Box>
              <Divider />
              <Heading as="h4" size="sm" mb={2}>Operations Checklist</Heading>
              <Box overflowY="auto" maxH="300px" borderWidth={1} borderRadius="md" p={4}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Operation</Th>
                      <Th>Note</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {jobOperations.map(op => (
                      <Tr key={op.operation_id}>
                        <Td>{op.description}</Td>
                        <Td>{op.technician_note || 'N/A'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default CompletedJobsPage;