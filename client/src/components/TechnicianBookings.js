import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, ListGroup, Badge, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // <--- Link imported for the Edit Profile button

const TechnicianBookings = () => { // This component acts as the Technician Dashboard
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const fetchTechnicianBookings = async () => {
    setLoading(true);
    setError(null);
    setMessage('');

    if (!token || userRole !== 'technician') {
      setError('You must be logged in as a technician to view your bookings.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/bookings/me', {
        headers: {
          'x-auth-token': token, // Send the technician's JWT token
        },
      });
      const data = await res.json();

      if (res.ok) {
        setBookings(data);
        if (data.length === 0) {
          setMessage('You have no bookings assigned yet.');
        }
      } else {
        setError(data.msg || 'Failed to fetch technician bookings.');
      }
    } catch (err) {
      console.error('Frontend fetch technician bookings error:', err);
      setError('Could not connect to the server or retrieve bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicianBookings();
  }, [token, userRole]);

  // Handle updating booking status
  const handleStatusChange = async (bookingId, newStatus) => {
    setMessage('');
    setMessageType('');

    if (!token || userRole !== 'technician') {
      setMessage('Authentication required to update status.');
      setMessageType('danger');
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(`Booking status updated to "${newStatus}"!`);
        setMessageType('success');
        // Re-fetch bookings to update the list
        fetchTechnicianBookings();
      } else {
        setMessage(data.msg || 'Failed to update booking status.');
        setMessageType('danger');
      }
    } catch (err) {
      console.error('Frontend update booking status error:', err);
      setMessage('Server error updating booking status. Please try again.');
      setMessageType('danger');
    }
  };


  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading your bookings...</p>
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
      <h2 className="text-center mb-4">Technician Dashboard: My Bookings</h2>
      <div className="text-center mb-4">
        <Button as={Link} to="/technician-profile-edit" variant="outline-primary">
          Edit My Profile
        </Button>
      </div>
      {message && <Alert variant={messageType}>{message}</Alert>}
      {bookings.length === 0 ? (
        <Alert variant="info" className="text-center">You have no bookings assigned yet.</Alert>
      ) : (
        <Row>
          {bookings.map((booking) => (
            <Col md={6} lg={4} className="mb-4" key={booking._id}>
              <Card>
                <Card.Body>
                  <Card.Title>Service: {booking.service}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Booked by: {booking.user ? booking.user.name : 'Unknown User'}
                  </Card.Subtitle>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Time:</strong> {booking.bookingTime}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Status:</strong>{' '}
                      <Badge bg={
                        booking.status === 'confirmed' ? 'success' :
                        booking.status === 'pending' ? 'warning' :
                        booking.status === 'completed' ? 'primary' :
                        'danger'
                      }>
                        {booking.status}
                      </Badge>
                    </ListGroup.Item>
                    {booking.notes && (
                      <ListGroup.Item>
                        <strong>Notes:</strong> {booking.notes}
                      </ListGroup.Item>
                    )}
                    <ListGroup.Item>
                      <strong>Booked On:</strong> {new Date(booking.createdAt).toLocaleDateString()}
                    </ListGroup.Item>
                  </ListGroup>
                  <Dropdown className="mt-3">
                    <Dropdown.Toggle variant="secondary" id={`dropdown-status-${booking._id}`}>
                      Update Status
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleStatusChange(booking._id, 'confirmed')}>Confirm</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleStatusChange(booking._id, 'completed')}>Complete</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleStatusChange(booking._id, 'cancelled')}>Cancel</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default TechnicianBookings;