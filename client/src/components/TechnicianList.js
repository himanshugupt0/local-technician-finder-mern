import React, { useState, useEffect, useCallback } from 'react'; // <--- NEW: Import useCallback
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce';

const TechnicianList = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState('');

  const [searchTermLocation, setSearchTermLocation] = useState('');
  const [searchTermServiceArea, setSearchTermServiceArea] = useState('');

  const debouncedSearchLocation = useDebounce(searchTermLocation, 500);
  const debouncedSearchServiceArea = useDebounce(searchTermServiceArea, 500);

  const [message, setMessage] = useState(''); // For info messages like "No technicians found"

  // Define the expanded service types for the dropdown (must match backend enum)
  const serviceTypes = [
    'Home Appliance Repair', 'Plumbing', 'Electrical Services',
    'Computer Hardware Repair', 'Software Troubleshooting', 'Network Setup',
    'Car Repair', 'Motorcycle Repair', 'Vehicle AC Repair', 'Other'
  ];

  // --- FIX: Wrap fetchTechnicians in useCallback to stabilize its reference ---
  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage('');

    let url = '/api/technicians';
    const params = new URLSearchParams();

    if (selectedService) {
      params.append('service', selectedService);
    }
    if (debouncedSearchLocation) {
      params.append('location', debouncedSearchLocation);
    }
    if (debouncedSearchServiceArea) {
      params.append('serviceArea', debouncedSearchServiceArea);
    }

    const isSearchQuery = selectedService || debouncedSearchLocation || debouncedSearchServiceArea;

    if (isSearchQuery) {
        url = `/api/technicians/search?${params.toString()}`;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}${url}`);
      const data = await res.json();

      if (res.ok) {
        setTechnicians(data);
        if (isSearchQuery && data.length === 0) {
            setMessage('No technicians found matching your criteria. Try different filters.');
        } else if (!isSearchQuery && data.length === 0) {
            setMessage('No verified technicians available in the system yet.');
        }
      } else {
        if (res.status === 404 && isSearchQuery) {
            setTechnicians([]);
            setMessage(data.msg || 'No technicians found matching your criteria.');
        } else {
            setTechnicians([]);
            setError(data.msg || `Failed to fetch technicians. Status: ${res.status}`);
        }
      }
    } catch (err) {
      console.error('Frontend fetch technicians error:', err);
      setError('Could not connect to the server or retrieve data. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedService, debouncedSearchLocation, debouncedSearchServiceArea]); // Dependencies for useCallback

  // --- UPDATED: useEffect depends on the stable fetchTechnicians function ---
  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const handleSearchSubmit = (e) => {
      e.preventDefault();
  }

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading technicians...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h2 className="text-center mb-4">Our Verified Technicians</h2>

      <Form onSubmit={handleSearchSubmit} className="mb-4">
        <Row className="align-items-end">
          <Col md={4} className="mb-3">
            <Form.Group controlId="serviceSelect">
              <Form.Label>Service Type</Form.Label>
              <Form.Select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="">All Services</option>
                {serviceTypes.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4} className="mb-3">
            <Form.Group controlId="searchLocation">
              <Form.Label>Technician's City/Town</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Ludhiana"
                value={searchTermLocation}
                onChange={(e) => setSearchTermLocation(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={4} className="mb-3">
            <Form.Group controlId="searchServiceArea">
              <Form.Label>Service Area</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Model Town"
                value={searchTermServiceArea}
                onChange={(e) => setSearchTermServiceArea(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col xs={12} className="text-center mb-3">
              <Button variant="outline-secondary" onClick={() => {
                  setSelectedService('');
                  setSearchTermLocation('');
                  setSearchTermServiceArea('');
              }} className="me-2">
                  Clear All Filters
              </Button>
              <Button variant="outline-info" onClick={fetchTechnicians}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Refresh List
              </Button>
          </Col>
        </Row>
      </Form>

      {message && <Alert variant="info">{message}</Alert>}

      <Row>
        {technicians.map((tech) => (
          <Col md={4} className="mb-4" key={tech._id}>
            <Card>
              <Card.Body>
                <Card.Title>{tech.user.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {tech.servicesOffered.join(', ') || 'No services listed'}
                </Card.Subtitle>
                <Card.Text>
                  Location: {tech.location}
                  <br />
                  Service Areas: {(tech.serviceAreas && tech.serviceAreas.length > 0) ? tech.serviceAreas.join(', ') : 'Not specified'}
                  <br />
                  Rating: {tech.averageRating.toFixed(1)} ({tech.reviewCount} reviews)
                  <br />
                  <small className="text-muted">Contact: {tech.contactNumber}</small>
                </Card.Text>
                <Link to={`/technicians/${tech._id}`} className="btn btn-info btn-sm">
                  View Profile
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default TechnicianList;