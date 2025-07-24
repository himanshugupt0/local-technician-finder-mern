import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // <--- NEW IMPORT

const TechnicianProfileEdit = () => {
  const [formData, setFormData] = useState({
    contactNumber: '',
    location: '',
    serviceAreas: '',
    servicesOffered: [],
    specializations: '',
    description: '',
    availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    isAvailable: true
  });
  const [dataLoading, setDataLoading] = useState(true);
  // Removed error state as it will be handled by toast/conditional rendering
  // const [error, setError] = useState(null);
  // Removed message and messageType states as they will be handled by toast
  // const [message, setMessage] = useState('');
  // const [messageType, setMessageType] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { userRole, loading: authLoading } = useAuth();
  const componentToken = localStorage.getItem('token');
  const navigate = useNavigate();
  const { showToast } = useToast(); // <--- Use the showToast function

  const serviceTypes = [
    'Home Appliance Repair', 'Plumbing', 'Electrical Services',
    'Computer Hardware Repair', 'Software Troubleshooting', 'Network Setup',
    'Car Repair', 'Motorcycle Repair', 'Vehicle AC Repair', 'Other'
  ];

  useEffect(() => {
    const fetchTechnicianProfile = async () => {
      setDataLoading(true);
      // Removed setError(null); setMessage('');

      if (!componentToken || userRole !== 'technician') {
        return;
      }

      try {
        const res = await fetch('/api/profile/technician/me', {
          headers: {
            'x-auth-token': componentToken,
          },
        });
        const data = await res.json();

        if (res.ok) {
          setFormData({
            contactNumber: data.contactNumber || '',
            location: data.location || '',
            serviceAreas: (data.serviceAreas || []).join(', '),
            servicesOffered: data.servicesOffered || [],
            specializations: (data.specializations || []).join(', '),
            description: data.description || '',
            availability: data.availability || [],
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
          });
        } else {
          // Replaced setError with showToast
          showToast(data.msg || 'Failed to fetch technician profile data.', 'danger');
        }
      } catch (err) {
        console.error('Frontend fetch tech profile for edit error:', err);
        // Replaced setError with showToast
        showToast('Could not connect to the server or retrieve your profile data.', 'danger');
      } finally {
        setDataLoading(false);
      }
    };

    if (!authLoading && componentToken && userRole === 'technician') {
      fetchTechnicianProfile();
    } else if (!authLoading && (!componentToken || userRole !== 'technician')) {
      setDataLoading(false);
      // This alert is specifically handled in JSX, so no showToast here directly.
      // The JSX conditional rendering for Access Denied uses the 'error' prop which will be null now.
      // So we should just let the conditional return path handle it.
    }
  }, [authLoading, componentToken, userRole, navigate, showToast]); // Added showToast to dependencies

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      servicesOffered: checked
        ? [...prev.servicesOffered, value]
        : prev.servicesOffered.filter(service => service !== value)
    }));
  };

  const onSubmit = async e => {
    e.preventDefault();
    // Removed setMessage('');
    setFormSubmitting(true);

    if (formData.servicesOffered.length === 0) {
        showToast('Please select at least one service offered.', 'danger'); // <--- UPDATED
        setFormSubmitting(false);
        return;
    }
    if (formData.availability.length === 0) {
        showToast('Please select at least one available day.', 'danger'); // <--- UPDATED
        setFormSubmitting(false);
        return;
    }

    if (!componentToken || userRole !== 'technician') {
      showToast('Authentication required to update profile.', 'danger'); // <--- UPDATED
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/profile/technician', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': componentToken,
        },
        body: JSON.stringify({
          ...formData,
          specializations: formData.specializations.split(',').map(s => s.trim()).filter(s => s.length > 0),
          serviceAreas: formData.serviceAreas.split(',').map(s => s.trim()).filter(s => s.length > 0)
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Profile updated successfully!', 'success'); // <--- UPDATED
      } else {
        showToast(data.msg || 'Failed to update profile.', 'danger'); // <--- UPDATED
      }
    } catch (err) {
      console.error('Frontend update tech profile error:', err);
      showToast('Server error during profile update. Please try again.', 'danger'); // <--- UPDATED
    } finally {
      setFormSubmitting(false);
    }
  };


  // --- Conditional Rendering for different states ---
  if (authLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading authentication...</span>
        </Spinner>
        <p>Checking authentication status...</p>
      </Container>
    );
  }

  if (!componentToken || userRole !== 'technician') {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center">
          {/* No specific error state here, message is static */}
          Access Denied. Please log in as a technician to edit your profile.
        </Alert>
        <div className="text-center mt-3">
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </Container>
    );
  }

  if (dataLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading technician profile for editing...</p>
      </Container>
    );
  }

  // No longer need 'if (error)' block here, as errors trigger toasts and don't block render.
  // If a fetch error occurs, a toast will show, but the form will still try to render with its current data.


  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2 className="text-center mb-4">Edit Your Technician Profile</h2>
          {/* Removed message Alert as toasts will handle messages */}
          {/* {message && <Alert variant={messageType}>{message}</Alert>} */}
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="contactNumber">
              <Form.Label>Contact Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your contact number"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={onChange}
                required
                disabled={formSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="location">
              <Form.Label>Your Primary Location (City/Town)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Ludhiana, Punjab"
                name="location"
                value={formData.location}
                onChange={onChange}
                required
                disabled={formSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="serviceAreas">
              <Form.Label>Service Areas (Comma-separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Downtown, Southside, Model Town"
                name="serviceAreas"
                value={formData.serviceAreas}
                onChange={onChange}
                required
                disabled={formSubmitting}
              />
              <Form.Text className="text-muted">
                List the specific areas/localities you serve, separated by commas.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Services Offered</Form.Label>
              <div className="d-flex flex-wrap">
                {serviceTypes.map(service => (
                  <Form.Check
                    key={service}
                    type="checkbox"
                    id={`service-${service}`}
                    label={service}
                    value={service}
                    checked={formData.servicesOffered.includes(service)}
                    onChange={handleServiceChange}
                    className="me-3 mb-2"
                    disabled={formSubmitting}
                  />
                ))}
              </div>
              {formData.servicesOffered.length === 0 && (
                  <Form.Text className="text-danger">Please select at least one service.</Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3" controlId="specializations">
              <Form.Label>Specializations (Comma-separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Laptop repair, Home wiring, Car AC"
                name="specializations"
                value={formData.specializations}
                onChange={onChange}
                disabled={formSubmitting}
              />
              <Form.Text className="text-muted">
                List specific skills or niches, separated by commas.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Tell users about your experience and qualifications."
                name="description"
                value={formData.description}
                onChange={onChange}
                disabled={formSubmitting}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="availability">
              <Form.Label>Available Days</Form.Label>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <Form.Check
                      key={day}
                      type="checkbox"
                      id={`availability-${day}`}
                      label={day}
                      value={day}
                      checked={formData.availability.includes(day)}
                      onChange={(e) => {
                          const { value, checked } = e.target;
                          setFormData(prev => ({
                              ...prev,
                              availability: checked
                                  ? [...prev.availability, value]
                                  : prev.availability.filter(d => d !== value)
                      }));
                  }}
                  className="me-3 mb-2"
                  disabled={formSubmitting}
              />
              ))}
              {formData.availability.length === 0 && (
                  <Form.Text className="text-danger">Please select at least one available day.</Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3" controlId="isAvailable">
              <Form.Check
                type="checkbox"
                label="Mark me as currently available for bookings"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                disabled={formSubmitting}
              />
            </Form.Group>


            <Button variant="primary" type="submit" className="w-100" disabled={formSubmitting}>
              {formSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default TechnicianProfileEdit;