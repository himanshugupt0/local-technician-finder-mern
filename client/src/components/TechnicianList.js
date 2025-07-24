import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce'; // <--- NEW IMPORT: Import the useDebounce hook

const TechnicianList = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState('');

  // --- UPDATED: Use separate states for immediate input and debounced values ---
  const [searchTermLocation, setSearchTermLocation] = useState(''); // Immediate input for location
  const [searchTermServiceArea, setSearchTermServiceArea] = useState(''); // Immediate input for service area

  const debouncedSearchLocation = useDebounce(searchTermLocation, 500); // <--- DEBOUNCED: 500ms delay
  const debouncedSearchServiceArea = useDebounce(searchTermServiceArea, 500); // <--- DEBOUNCED: 500ms delay
  // --- END UPDATED STATE ---

  const [message, setMessage] = useState('');

  // Define the expanded service types for the dropdown (must match backend enum)
  const serviceTypes = [
    'Home Appliance Repair', 'Plumbing', 'Electrical Services',
    'Computer Hardware Repair', 'Software Troubleshooting', 'Network Setup',
    'Car Repair', 'Motorcycle Repair', 'Vehicle AC Repair', 'Other'
  ];

  const fetchTechnicians = async () => {
    setLoading(true);
    setError(null);
    setMessage('');

    let url = '/api/technicians';
    const params = new URLSearchParams();

    if (selectedService) {
      params.append('service', selectedService);
    }
    // --- UPDATED: Use debounced values for API call ---
    if (debouncedSearchLocation) {
      params.append('location', debouncedSearchLocation);
    }
    if (debouncedSearchServiceArea) {
      params.append('serviceArea', debouncedSearchServiceArea);
    }
    // --- END UPDATED API PARAMS ---

    const isSearchQuery = selectedService || debouncedSearchLocation || debouncedSearchServiceArea;

    if (isSearchQuery) {
        url = `/api/technicians/search?${params.toString()}`;
    }

    try {
      const res = await fetch(url);
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
  };

  // --- UPDATED: useEffect dependencies to use debounced values ---
  useEffect(() => {
    fetchTechnicians();
  }, [selectedService, debouncedSearchLocation, debouncedSearchServiceArea]); // Fetch when debounced values change

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

      {/* Search/Filter Form */}
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
                // --- UPDATED: Bind to searchTermLocation, not debounced ---
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
                // --- UPDATED: Bind to searchTermServiceArea, not debounced ---
                value={searchTermServiceArea}
                onChange={(e) => setSearchTermServiceArea(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col xs={12} className="text-center mb-3">
              <Button variant="outline-secondary" onClick={() => {
                  setSelectedService('');
                  setSearchTermLocation(''); // Clear immediate input
                  setSearchTermServiceArea(''); // Clear immediate input
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