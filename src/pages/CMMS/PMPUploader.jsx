// src/pages/PMPUploader.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Heading, FormControl, FormLabel, Input, Button, VStack,
  Container, useToast, Text, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, Divider, HStack, Select,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, useDisclosure,
} from '@chakra-ui/react';
import { Delete, Refresh } from "@mui/icons-material";
import Papa from 'papaparse'; // Import the CSV parser

function PMPUploader() {
// --- State for Bulk Uploader ---
  const [stagedJobs, setStagedJobs] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  // --- State for CRUD Manager ---
  const [pendingJobs, setPendingJobs] = useState([]); // Holds the list from the DB
  const [machineList, setMachineList] = useState([]); // Holds all machines for dropdowns
  const [isLoading, setIsLoading] = useState(false);
  const [editingJob, setEditingJob] = useState(null); // Holds the job being edited
  const { isOpen, onOpen, onClose } = useDisclosure(); // For the Edit Modal

// --- State for Forms ---
  const [newJobMachineId, setNewJobMachineId] = useState('');
  const [newJobWoNumber, setNewJobWoNumber] = useState('');

  // Fetch all data on load
  useEffect(() => {
    fetchPendingJobs();
    fetchMachineList();
  }, []);

  // --- 1. Parse the CSV file in the browser ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      
      // Use Papaparse to read the CSV
      Papa.parse(file, {
        header: false, // Your CSV does not have headers
        skipEmptyLines: true,
        complete: (results) => {
          // 'results.data' is an array of arrays, e.g., ["1", "Chopper...", "", "CKR-...", "PWO-...", "P"]
          const jobs = results.data
            .map((row) => ({
              // We create a clean object from the row data
              machine_name: row[1], 
              asset_number: row[3],
              wo_number: row[4],
            }))
            .filter(job => job.asset_number && job.wo_number); // Filter out 'A' rows and blanks

          setStagedJobs(jobs);
        },
      });
    }
  };

  // --- 2. Handle deleting a row from the staging table ---
  const handleDeleteRow = (wo_number) => {
    // Filter out the row with the matching WO number
    const newJobs = stagedJobs.filter(job => job.wo_number !== wo_number);
    setStagedJobs(newJobs);
  };

  // --- 3. Send the FINAL JSON list to the backend ---
  const handleSaveToPending = async () => {
    if (stagedJobs.length === 0) {
      toast({
        title: 'No data to save',
        description: 'Please upload a file and review the rows.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // This route now expects a JSON array, NOT FormData
      const response = await fetch('http://10.126.15.197:8002/api/bulk-import-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stagedJobs), // Send the staged jobs array
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import');
      }

      toast({
        title: 'Import Successful',
        description: `Successfully created ${result.createdCount} pending jobs.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      
      // Clear the form
      setStagedJobs([]);
      setFileName('');

    } catch (err) {
      toast({
        title: 'Import Error',
        description: err.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- CRUD Functions ---

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

  const fetchMachineList = async () => {
    try {
      const response = await fetch('http://10.126.15.197:8002/part/machines-list');
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      setMachineList(data);
    } catch (err) {
      toast({ title: 'Error fetching machines', status: 'error' });
    }
  };

  // Handle CREATE
  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://10.126.15.197:8002/part/pending-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: newJobMachineId,
          wo_number: newJobWoNumber,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create job');

      toast({ title: 'Pending job created', status: 'success' });
      setNewJobMachineId('');
      setNewJobWoNumber('');
      fetchPendingJobs(); // Refresh list
    } catch (err) {
      toast({ title: 'Error creating job', description: err.message, status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle UPDATE
  const openEditModal = (job) => {
    setEditingJob(job); // Set the job to be edited
    onOpen(); // Open the modal
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`http://10.126.15.197:8002/part/pending-job/${editingJob.pending_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: editingJob.machine_id,
          wo_number: editingJob.wo_number,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update job');

      toast({ title: 'Pending job updated', status: 'success' });
      onClose(); // Close modal
      setEditingJob(null);
      fetchPendingJobs(); // Refresh list
    } catch (err) {
      toast({ title: 'Error updating job', description: err.message, status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle DELETE
  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pending job?')) return;
    try {
      await fetch(`http://10.126.15.197:8002/part/pending-job/${id}`, { method: 'DELETE' });
      toast({ title: 'Pending job deleted', status: 'info' });
      fetchPendingJobs(); // Refresh list
    } catch (err) {
      toast({ title: 'Error deleting job', status: 'error' });
    }
  };


  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">

        {/* --- PART 1: BULK CSV UPLOADER --- */}
        <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h2" size="lg" mb={6}>
            Step 1: Bulk Import Pending Jobs
          </Heading>
          <FormControl>
            <FormLabel>Select Monthly PMP CSV File</FormLabel>
            <Input type="file" accept=".csv" onChange={handleFileChange} p={1} />
          </FormControl>
          
          {/* Review Table appears here */}
          {stagedJobs.length > 0 && (
            <Box mt={6}>
              <Heading as="h3" size="md">Review CSV Data</Heading>
              {/* ... (Your CSV review table... ) ... */}
              <Button colorScheme="blue" isFullWidth mt={4} onClick={handleSaveToPending}>
                Save {stagedJobs.length} Jobs to Pending List
              </Button>
            </Box>
          )}
        </Box>

        <Divider />

        {/* --- PART 2: PENDING JOBS CRUD MANAGER --- */}
        <Heading as="h2" size="lg">
          Manage Pending Jobs (Holding Pen)
        </Heading>

        {/* --- CREATE Form (Manual) --- */}
        <Box 
          p={6} borderWidth={1} borderRadius="lg" boxShadow="lg" 
          as="form" onSubmit={handleCreateJob}
        >
          <Heading as="h3" size="md" mb={4}>Add Single Job</Heading>
          <HStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Machine</FormLabel>
              <Select 
                placeholder="Select machine" 
                value={newJobMachineId}
                onChange={(e) => setNewJobMachineId(e.target.value)}
              >
                {machineList.map(m => (
                  <option key={m.machine_id} value={m.machine_id}>{m.machine_name}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>WO Number</FormLabel>
              <Input 
                placeholder="e.g., PWO-296XXX"
                value={newJobWoNumber}
                onChange={(e) => setNewJobWoNumber(e.target.value)}
              />
            </FormControl>
            <Button type="submit" colorScheme="green" alignSelf="flex-end" isLoading={isLoading}>
              Add
            </Button>
          </HStack>
        </Box>

        {/* --- READ/DELETE Table --- */}
        <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Heading as="h3" size="md" mb={4}>Current Pending Jobs</Heading>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Machine Name</Th>
                  <Th>Asset Number</Th>
                  <Th>WO Number</Th>
                  <Th>Status</Th>
                  <Th isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pendingJobs.map((job) => (
                  <Tr key={job.pending_id}>
                    <Td>{job.machine_name}</Td>
                    <Td>{job.asset_number}</Td>
                    <Td>{job.wo_number}</Td>
                    <Td>{job.status}</Td>
                    <Td isNumeric>
                      <HStack spacing={2} justify="flex-end">
                        <IconButton
                          colorScheme="blue"
                          icon={<Refresh />}
                          size="sm"
                          onClick={() => openEditModal(job)}
                        />
                        <IconButton
                          colorScheme="red"
                          icon={<Delete />}
                          size="sm"
                          onClick={() => handleDeleteJob(job.pending_id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>

      {/* --- EDIT Modal --- */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleUpdateJob}>
          <ModalHeader>Edit Pending Job</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Machine</FormLabel>
                <Select
                  placeholder="Select machine"
                  value={editingJob?.machine_id}
                  onChange={(e) => setEditingJob({...editingJob, machine_id: e.target.value})}
                >
                  {machineList.map(m => (
                    <option key={m.machine_id} value={m.machine_id}>{m.machine_name}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>WO Number</FormLabel>
                <Input
                  value={editingJob?.wo_number}
                  onChange={(e) => setEditingJob({...editingJob, wo_number: e.target.value})}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>Cancel</Button>
            <Button colorScheme="blue" type="submit" isLoading={isLoading}>
              Save Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  );
}

export default PMPUploader;