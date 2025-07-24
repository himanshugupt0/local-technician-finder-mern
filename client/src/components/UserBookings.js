import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, ListGroup, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Import Link for navigation to tech profile

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]); // NEW STATE for bookings needing review
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId'); // Get user's ID

  const fetchUserBookingsAndReviews = async () => {
    setLoading(true);
    setError(null);

    if (!token || userRole !== 'user') {
      setError('You must be logged in as a user to view your bookings.');
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user's bookings
      const bookingsRes = await fetch('/api/bookings/me', {
        headers: { 'x-auth-token': token },
      });
      const bookingsData = await bookingsRes.json();

      if (!bookingsRes.ok) {
        setError(bookingsData.msg || 'Failed to fetch bookings.');
        setLoading(false);
        return;
      }
      setBookings(bookingsData);

      // 2. Fetch all reviews made by this user (to check if a booking has been reviewed)
      // Note: Our backend doesn't have a direct route to get ALL reviews by user easily yet.
      // For simplicity, we'll fetch all reviews for all technicians involved in user's completed bookings
      // and then filter locally. A more scalable solution would be a backend endpoint like /api/reviews/by-user/:userId
      // For now, let's assume we can loop through and check.

      const completedBookings = bookingsData.filter(b => b.status === 'completed');
      const techIdsInCompletedBookings = [...new Set(completedBookings.map(b => b.technician._id))];

      const reviewsByThisUser = [];
      for (const techId of techIdsInCompletedBookings) {
        const reviewsForTechRes = await fetch(`/api/reviews/${techId}`);
        const reviewsForTechData = await reviewsForTechRes.json();
        if (reviewsForTechRes.ok) {
          reviewsForTechData.filter(r => r.user._id === userId).forEach(r => reviewsByThisUser.push(r));
        }
      }
      // console.log("Reviews by this user:", reviewsByThisUser); // Debugging

      // 3. Identify completed bookings that need reviews
      const needsReview = completedBookings.filter(booking => {
        // Check if there's ANY review for this specific booking's technician by this user
        const hasReviewedThisTech = reviewsByThisUser.some(
          review => review.technician === booking.technician._id && review.user._id === userId
        );
        return !hasReviewedThisTech; // If not reviewed, it needs a review
      });
      setPendingReviews(needsReview);


    } catch (err) {
      console.error('Frontend fetch user bookings and reviews error:', err);
      setError('Could not connect to the server or retrieve data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookingsAndReviews();
  }, [token, userRole, userId]); // Re-fetch if auth status or user ID changes

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

      {/* --- NEW: Pending Review Notifications Section --- */}
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
      {/* --- END NEW Section --- */}

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