import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Button, VStack, Container, useToast, Table, Thead, Tbody,
  Tr, Th, Td, Text, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl,
  FormLabel, Select, Divider, HStack, Badge // Added Badge for styling
} from '@chakra-ui/react';

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'N/A';
  try { return new Date(dateTimeStr).toLocaleString(); }
  catch (e) { return 'Invalid Date'; }
};

// Helper for just the date (no time) for approved_date
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try { return new Date(dateStr).toLocaleDateString(); }
    catch (e) { return 'Invalid Date'; }
};

const months = [
  { num: 1, name: 'January' }, { num: 2, name: 'February' }, { num: 3, name: 'March' },
  { num: 4, name: 'April' }, { num: 5, name: 'May' }, { num: 6, name: 'June' },
  { num: 7, name: 'July' }, { num: 8, name: 'August' }, { num: 9, name: 'September' },
  { num: 10, name: 'October' }, { num: 11, name: 'November' }, { num: 12, name: 'December' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 2 }, (_, i) => currentYear - i);

function CompletedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobOperations, setJobOperations] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (filterMonth) params.append('month', filterMonth);
    if (filterYear) params.append('year', filterYear);

    try {
      // Ensure this URL matches your backend port/IP
      const response = await fetch(`http://10.126.15.197:8002/part/completed-jobs?${params.toString()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      toast({ title: 'Error fetching jobs', description: err.message, status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOperations = async (workOrderId) => {
    try {
      const response = await fetch(`http://10.126.15.197:8002/part/work-order-operations/${workOrderId}`);
      if (!response.ok) throw new Error('Could not fetch operations');
      const data = await response.json();
      setJobOperations(data);
    } catch (err) {
      toast({ title: 'Error fetching operations list', status: 'error' });
      setJobOperations([]);
    }
  };

  const handleFilterClick = () => { fetchJobs(); };
  
  const handleClearFilters = () => {
    setFilterMonth('');
    setFilterYear('');
    // We need to manually call fetch with empty params to clear the view immediately
    // or just trigger a reload. For now, calling fetchJobs works because state updates are async 
    // but in this specific flow, passing empty params explicitly is safer:
    // Ideally: fetchJobs(true) where true forces no params, but for now:
    setTimeout(fetchJobs, 100); 
  };
  
  const handleViewDetails = (job) => {
    setSelectedJob(job);
    fetchOperations(job.work_order_id);
    onOpen();
  };

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading as="h2" size="lg">Completed PMP History</Heading>

        {/* --- Filter Controls --- */}
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h3" size="md" mb={4}>Filter by Date Completed</Heading>
          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Month</FormLabel>
              <Select placeholder="All Months" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                {months.map((m) => <option key={m.num} value={m.num}>{m.name}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Year</FormLabel>
              <Select placeholder="All Years" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            </FormControl>
            <Button colorScheme="blue" onClick={handleFilterClick} mt={8}>Filter</Button>
            <Button variant="ghost" onClick={handleClearFilters} mt={8}>Clear</Button>
          </HStack>
        </Box>

        {/* --- Completed Jobs Table --- */}
        <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h3" size="md" mb={4}>Finished Jobs</Heading>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Completed Date</Th>
                  <Th>WO Number</Th>
                  <Th>Machine</Th>
                  <Th>Technician</Th>
                  <Th>Approved By</Th> {/* Added Column */}
                  <Th isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading && <Tr><Td colSpan={6} textAlign="center">Loading...</Td></Tr>}
                {!isLoading && jobs.length === 0 && <Tr><Td colSpan={6} textAlign="center">No jobs found.</Td></Tr>}
                
                {jobs.map((job) => (
                  <Tr key={job.work_order_id}>
                    <Td>{formatDateTime(job.completed_time)}</Td>
                    <Td>{job.wo_number}</Td>
                    <Td>{job.machine_name}</Td>
                    <Td>{job.technician_name}</Td>
                    <Td>
                        {/* Display Approved By or a Pending Badge */}
                        {job.approved_by ? (
                            <Text fontWeight="bold" color="green.600">{job.approved_by}</Text>
                        ) : (
                            <Badge colorScheme="orange">Pending Approval</Badge>
                        )}
                    </Td>
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

      {/* --- Details Modal --- */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Job Details: {selectedJob?.wo_number}</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={4}>
                <Box>
                    <Text><strong>Machine:</strong> {selectedJob?.machine_name}</Text>
                    <Text><strong>Technician:</strong> {selectedJob?.technician_name}</Text>
                    <Text><strong>Started:</strong> {formatDateTime(selectedJob?.start_time)}</Text>
                    <Text><strong>Completed:</strong> {formatDateTime(selectedJob?.completed_time)}</Text>
                </Box>
                
                {/* ADDED: Approval Info Section */}
                <Box bg="green.50" p={3} borderRadius="md" border="1px dashed" borderColor="green.200">
                    <Heading size="xs" mb={2} color="green.800">APPROVAL STATUS</Heading>
                    <Text><strong>Approved By:</strong> {selectedJob?.approved_by || 'Not yet approved'}</Text>
                    <Text><strong>Date:</strong> {formatDate(selectedJob?.approved_date)}</Text>
                </Box>
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