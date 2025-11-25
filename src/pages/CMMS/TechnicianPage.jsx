// src/pages/TechnicianPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Button, VStack, Container, useToast, Table, Thead, Tbody,
  Tr, Th, Td, Text, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl,
  FormLabel, Input, Textarea, Select, Divider, HStack, Badge
} from '@chakra-ui/react';

// Helper function to format SQL DATETIME (e.g., "2025-11-08T13:00:00.000Z")
// for an <input type="datetime-local"> (which needs "2025-11-08T13:00")
const formatDateTimeForInput = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  try {
    const date = new Date(dateTimeStr);
    // Adjust for local timezone offset
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    // Format to 'YYYY-MM-DDTHH:mm'
    return date.toISOString().slice(0, 16);
  } catch (e) {
    return ''; // Handle invalid date strings
  }
};

// Helper function to make dates readable in the table
const formatDateTimeForTable = (dateTimeStr) => {
  if (!dateTimeStr) return 'N/A';
  try {
    return new Date(dateTimeStr).toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
};


function TechnicianPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const statusColors = {
    'Finished': 'green',
    'Open': 'red',
    'In Progress': 'yellow',
  };

// --- State for the Modal ---
  // 1. State for the *operations checklist*
  const [operations, setOperations] = useState([]);
  // 2. State for the *main job* details
  const [technicianName, setTechnicianName] = useState('');
  const [mainStatus, setMainStatus] = useState('In Progress');
  const [startTime, setStartTime] = useState('');
  const [completedTime, setCompletedTime] = useState('');
  const [mainTechnicianNote, setMainTechnicianNote] = useState('');

  // --- Data Fetching ---
  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      // Fetches the main list of jobs
      const response = await fetch('http://localhost:8002/part/live-work-orders');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setWorkOrders(data);
    } catch (err) {
      toast({ title: 'Error fetching work orders', status: 'error' });
    }
  };

  const fetchOperations = async (workOrderId) => {
    try {
      // Calls our NEW endpoint to get the checklist
      const response = await fetch(`http://localhost:8002/part/work-order-operations/${workOrderId}`);
      if (!response.ok) throw new Error('Could not fetch operations');
      const data = await response.json();
      setOperations(data);
    } catch (err) {
      toast({ title: 'Error fetching operations list', status: 'error' });
      setOperations([]); // Set to empty array on failure
    }
  };

  // --- Modal Handlers ---
  const handleOpenModal = (workOrder) => {
    setSelectedWorkOrder(workOrder);
    
    // Pre-fill the *main* job details
    setTechnicianName(workOrder.technician_name || '');
    setMainTechnicianNote(workOrder.technician_note || '');
    setMainStatus(workOrder.status || 'In Progress');
    setStartTime(formatDateTimeForInput(workOrder.start_time));
    setCompletedTime(formatDateTimeForInput(workOrder.completed_time));
    
    // Fetch the *operations checklist* for this job
    fetchOperations(workOrder.work_order_id);
    
    onOpen();
  };

  const handleCloseModal = () => {
    onClose();
    setOperations([]); // Clear the operations list when modal closes
  };

  // --- SAVE Handlers ---

  // This function saves the *main* job details
  const handleSaveMainJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch(`http://localhost:8002/part/pmp-data-tech/${selectedWorkOrder.work_order_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_name: technicianName,
          technician_note: mainTechnicianNote, // Note for the whole job
          status: mainStatus,
          start_time: startTime || null,
          completed_time: completedTime || null,
        }),
      });
      toast({ title: 'Work Order Updated', status: 'success' });
      fetchWorkOrders(); // Refresh the main table
      handleCloseModal(); // Close the modal
    } catch (err) {
      toast({ title: 'Error updating record', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteSave = async (operationId, newNote) => {
    
    // Optimistic update in local state (so it feels fast)
    const updatedOperations = operations.map(op => 
      op.operation_id === operationId ? { ...op, technician_note: newNote } : op
    );
    setOperations(updatedOperations);

    // Send the update to the backend
    try {
      const response = await fetch(`http://localhost:8002/part/work-order-operation/${operationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_note: newNote, // Only send the note
        }),
      });

      if (!response.ok) throw new Error('Save failed');

    } catch (err) {
      toast({ title: 'Note save failed, please retry', status: 'error' });
      // Revert state if save failed
      fetchOperations(selectedWorkOrder.work_order_id); 
    }
  };

  // --- 3. UPDATE: Handle saving the technician's data ---
  const handleSaveTechnicianData = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8002/part/pmp-data-tech/${selectedWorkOrder.work_order_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // --- THIS IS THE FIX ---
          // Use the correct state variables for the main job
          technician_name: technicianName,
          technician_note: mainTechnicianNote, // Use the main note state
          // eslint-disable-next-line no-restricted-globals
          status: mainStatus, // Use the main status state
          start_time: startTime || null,
          completed_time: completedTime || null,
          // --- END OF FIX ---
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || 'Failed to update record');
      }

      toast({
        title: 'Work Order Updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchWorkOrders(); // Refresh the table
      onClose(); // Close the modal

    } catch (err) {
      toast({
        title: 'Error updating record',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading as="h2" size="lg">
          Technician Work Orders
        </Heading>

        {/* --- READ Table (Updated with new columns) --- */}
        <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>WO Number</Th>
                  <Th>Machine Name</Th>
                  <Th>Scheduled Date</Th>
                  <Th>Status</Th>
                  <Th>Start Time</Th>
                  <Th>Completed Time</Th>
                  <Th>Technician</Th>
                  <Th isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {workOrders.length === 0 && (
                  <Tr><Td colSpan={8} textAlign="center">No work orders found.</Td></Tr>
                )}
                {workOrders.map((wo) => (
                  <Tr key={wo.work_order_id}>
                    <Td>{wo.wo_number}</Td>
                    <Td>{wo.machine_name || 'N/A'}</Td> 
                    <Td>{new Date(wo.scheduled_date).toLocaleDateString()}</Td>
                    
                    {/* 3. This is the updated line */}
                    <Td>
                      <Badge colorScheme={statusColors[wo.status] || 'gray'}>
                        {wo.status}
                      </Badge>
                    </Td>
                    <Td>{formatDateTimeForTable(wo.start_time)}</Td>
                    <Td>{formatDateTimeForTable(wo.completed_time)}</Td>
                    <Td>{wo.technician_name || 'N/A'}</Td>
                    <Td isNumeric>
                      <Button colorScheme="blue" size="sm" onClick={() => handleOpenModal(wo)}>
                        {wo.status === 'Finished' ? 'View/Edit' : 'Start/Update'}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>

      {/* --- UPDATE Modal (Completely new design) --- */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} isCentered size="4xl">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSaveTechnicianData}>
          <ModalHeader>Update Work Order: {selectedWorkOrder?.wo_number}</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              
              {/* --- Section 1: Operations Checklist (Simplified) --- */}
<Box>
  <Heading as="h4" size="md" mb={4}>Operations Checklist</Heading>
  <Box overflowY="auto" maxH="300px" borderWidth={1} borderRadius="md" p={4}>
    <Table variant="simple" size="sm">
      <Thead>
        <Tr>
          <Th>Description</Th>
          <Th>Technician Note</Th>
        </Tr>
      </Thead>
      <Tbody>
        {operations.map(op => (
          <Tr key={op.operation_id}>
            <Td>{op.description}</Td>
            <Td>
              <Input
                size="sm"
                placeholder="Add note..."
                defaultValue={op.technician_note || ''}
                // Save the note when the user clicks away (onBlur)
                onBlur={(e) => handleNoteSave(op.operation_id, e.target.value)}
              />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  </Box>
</Box>

              <Divider />
              
              {/* --- Section 2: Main Job Details --- */}
              <Box>
                <Heading as="h4" size="md" mb={4}>Main Job Details</Heading>
                <HStack spacing={4} mb={4}>
                  <FormControl isRequired>
                    <FormLabel>Technician Name</FormLabel>
                    <Input
                      value={technicianName}
                      onChange={(e) => setTechnicianName(e.target.value)}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Overall Status</FormLabel>
                    <Select value={mainStatus} onChange={(e) => setMainStatus(e.target.value)}>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Finished">Finished</option>
                    </Select>
                  </FormControl>
                </HStack>
                
                <HStack spacing={4} mb={4}>
                  <FormControl>
                    <FormLabel>Start Time</FormLabel>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Completed Time</FormLabel>
                    <Input
                      type="datetime-local"
                      value={completedTime}
                      onChange={(e) => setCompletedTime(e.target.value)}
                    />
                  </FormControl>
                </HStack>
                
                <FormControl>
                  <FormLabel>Main Technician Note (Overall)</FormLabel>
                  <Textarea
                    value={mainTechnicianNote}
                    onChange={(e) => setMainTechnicianNote(e.target.value)}
                    placeholder="Add overall job notes here..."
                  />
                </FormControl>
              </Box>

            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={handleCloseModal} mr={3}>Cancel</Button>
            <Button colorScheme="blue" type="submit" isLoading={isLoading}>
              Save and Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  );
}

export default TechnicianPage;