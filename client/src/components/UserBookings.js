import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, ListGroup, Badge /* Removed Button */ } from 'react-bootstrap'; // <--- UPDATED: Removed Button from import
import { Link } from 'react-router-dom'; // Import Link for navigation to tech profile

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId');

  const fetchUserBookingsAndReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!token || userRole !== 'user') {
      setError('You must be logged in as a user to view your bookings.');
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user's bookings
      const bookingsRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/bookings/me`, {
        headers: { 'x-auth-token': token },
      });
      const bookingsData = await bookingsRes.json();

      if (!bookingsRes.ok) {
        setError(bookingsData.msg || 'Failed to fetch bookings.');
        setLoading(false);
        return;
      }
      setBookings(bookingsData);

      const completedBookings = bookingsData.filter(b => b.status === 'completed');
      const techIdsInCompletedBookings = [...new Set(completedBookings.map(b => b.technician._id))];

      const reviewsByThisUser = [];
      for (const techId of techIdsInCompletedBookings) {
        const reviewsForTechRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/${techId}`);
        const reviewsForTechData = await reviewsForTechRes.json();
        if (reviewsForTechRes.ok) {
          reviewsForTechData.filter(r => r.user && r.user._id === userId).forEach(r => reviewsByThisUser.push(r));
        }
      }

      const needsReview = completedBookings.filter(booking => {
        const hasReviewedThisTech = reviewsByThisUser.some(
          review => review.technician === booking.technician._id && review.user._id === userId
        );
        return !hasReviewedThisTech;
      });
      setPendingReviews(needsReview);


    } catch (err) {
      console.error('Frontend fetch user bookings and reviews error:', err);
      setError('Could not connect to the server or retrieve data.');
    } finally {
      setLoading(false);
    }
  }, [token, userRole, userId]);

  useEffect(() => {
    fetchUserBookingsAndReviews();
  }, [fetchUserBookingsAndReviews]);

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
      <h2 className="text-center mb-4">My Bookings</h2>

      {/* Pending Review Notifications Section */}
      {pendingReviews.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>
            <i className="bi bi-star-fill me-2"></i> Feedback Needed!
          </Alert.Heading>
          <p>You have completed services awaiting your valuable feedback:</p>
          <ListGroup className="mb-3">
            {pendingReviews.map(booking => (
              <ListGroup.Item key={booking._id} className="d-flex justify-content-between align-items-center">
                Service: <strong>{booking.service}</strong> with{' '}
                <strong>{booking.technician ? booking.technician.name : 'Unknown Technician'}</strong>
                <Link to={`/technicians/${booking.technician._id}`} className="btn btn-sm btn-outline-warning">
                  Leave Review
                </Link>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <hr />
          <p className="mb-0 text-muted">Your review helps other users and technicians.</p>
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Alert variant="info" className="text-center">You have no bookings yet.</Alert>
      ) : (
        <Row>
          {bookings.map((booking) => (
            <Col md={6} lg={4} className="mb-4" key={booking._id}>
              <Card>
                <Card.Body>
                  <Card.Title>Service: {booking.service}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Technician: {booking.technician ? booking.technician.name : 'N/A'}
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
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default UserBookings;