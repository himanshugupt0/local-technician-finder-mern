import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, Alert, Spinner, Badge, Form, Button } from 'react-bootstrap';
import Rating from 'react-rating';
import { FaStar, FaRegStar } from 'react-icons/fa';

import StarRatingInput from './StarRatingInput';
import { useToast } from '../context/ToastContext';

const TechnicianProfile = () => {
  const { id } = useParams();
  const [technician, setTechnician] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bookingFormData, setBookingFormData] = useState({
    bookingDate: '',
    bookingTime: '',
    service: '',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const [reviewFormData, setReviewFormData] = useState({
    rating: 0,
    comment: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [hasCompletedBookingWithTech, setHasCompletedBookingWithTech] = useState(false);


  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const { showToast } = useToast();

  // Function to fetch technician details, reviews, AND user's bookings
  const fetchTechnicianAndReviews = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    setHasCompletedBookingWithTech(false);

    try {
      // --- UPDATED: Prepend process.env.REACT_APP_API_BASE_URL to the fetch URLs ---
      // Fetch technician profile
      const techRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/technicians/${id}`);
      const techData = await techRes.json();

      if (!techRes.ok) {
        setError(techData.msg || 'Failed to fetch technician profile.');
        setLoading(false);
        return;
      }
      setTechnician(techData);
      if (techData.servicesOffered && techData.servicesOffered.length > 0) {
        setBookingFormData(prev => ({ ...prev, service: techData.servicesOffered[0] }));
      }

      // Fetch reviews for this technician
      const reviewRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/reviews/${id}`);
      const reviewData = await reviewRes.json();

      if (reviewRes.ok) {
        setReviews(reviewData);
      } else {
        console.error('Failed to fetch reviews:', reviewData.msg || 'Unknown error');
        setReviews([]);
      }

      if (userRole === 'user' && token) {
        const bookingsRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/bookings/me`, {
          headers: { 'x-auth-token': token }
        });
        const bookingsData = await bookingsRes.json();

        if (bookingsRes.ok) {
          const completedBooking = bookingsData.some(
            booking => booking.technician && booking.technician._id === id && booking.status === 'completed'
          );
          setHasCompletedBookingWithTech(completedBooking);
        } else {
          console.error('Failed to fetch user bookings for review check:', bookingsData.msg || 'Unknown error');
        }
      }
      // --- END UPDATED FETCH CALLS ---

    } catch (err) {
      console.error('Frontend fetch error (tech or reviews):', err);
      setError('Could not connect to the server or retrieve data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTechnicianAndReviews();
    }
  }, [id, userRole, token]);

  const handleBookingChange = e => {
    setBookingFormData({ ...bookingFormData, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = async e => {
    e.preventDefault();
    setBookingLoading(true);

    if (!token) {
      showToast('Please log in to book a technician.', 'danger');
      setBookingLoading(false);
      return;
    }

    if (userRole !== 'user') {
      showToast('Only regular users can book technicians.', 'danger');
      setBookingLoading(false);
      return;
    }

    if (!bookingFormData.bookingDate || !bookingFormData.bookingTime || !bookingFormData.service) {
        showToast('Please select a service, date, and time.', 'danger');
        setBookingLoading(false);
        return;
    }

    try {
      // --- UPDATED: Prepend process.env.REACT_APP_API_BASE_URL to the fetch URL ---
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          technicianId: technician._id,
          service: bookingFormData.service,
          bookingDate: bookingFormData.bookingDate,
          bookingTime: bookingFormData.bookingTime,
          notes: bookingFormData.notes
        }),
      });
      // --- END UPDATED FETCH CALL ---

      const data = await res.json();

      if (res.ok) {
        showToast('Booking successfully created! Status: Pending.', 'success');
        setBookingFormData({ bookingDate: '', bookingTime: '', service: technician.servicesOffered[0] || '', notes: '' });
      } else {
        showToast(data.msg || 'Failed to create booking.', 'danger');
      }
    } catch (err) {
      console.error('Frontend booking error:', err);
      showToast('Server error during booking. Please try again later.', 'danger');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewChange = e => {
    setReviewFormData({ ...reviewFormData, [e.target.name]: e.target.value });
  };

  const handleStarRatingChange = newRating => {
    setReviewFormData(prev => ({ ...prev, rating: newRating }));
  };

  const handleReviewSubmit = async e => {
    e.preventDefault();
    setReviewSubmitting(true);

    if (!token) {
        showToast('Please log in to submit a review.', 'danger');
        setReviewSubmitting(false);
        return;
    }
    if (userRole !== 'user') {
        showToast('Only regular users can submit reviews.', 'danger');
        setReviewSubmitting(false);
        return;
    }
    if (reviewFormData.rating === 0) {
        showToast('Please select a rating (1-5 stars).', 'danger');
        setReviewSubmitting(false);
        return;
    }

    try {
      // --- UPDATED: Prepend process.env.REACT_APP_API_BASE_URL to the fetch URL ---
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          technicianId: technician._id,
          rating: reviewFormData.rating,
          comment: reviewFormData.comment
        }),
      });
      // --- END UPDATED FETCH CALL ---

      const data = await res.json();

      if (res.ok) {
        showToast('Review submitted successfully!', 'success');
        fetchTechnicianAndReviews();
        setReviewFormData({ rating: 0, comment: '' });
      } else {
        showToast(data.msg || 'Failed to submit review.', 'danger');
      }
    } catch (err) {
      console.error('Frontend review submission error:', err);
      showToast('Server error during review submission. Please try again.', 'danger');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading technician profile...</p>
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

  if (!technician) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">Technician profile not found.</Alert>
      </Container>
    );
  }

  const hasReviewed = reviews.some(review => review.user && review.user._id === userId);
  const canSubmitReview = userRole === 'user' && token && !hasReviewed && hasCompletedBookingWithTech;


  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          {/* Technician Profile Card */}
          <Card className="mb-4">
            <Card.Header as="h3" className="text-center">{technician.user.name}'s Profile</Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Email:</strong> {technician.user.email}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Contact Number:</strong> {technician.contactNumber}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Location:</strong> {technician.location}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Services Offered:</strong>
                  <div>
                    {technician.servicesOffered.map((service, index) => (
                      <Badge bg="primary" key={index} className="me-1 mb-1">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </ListGroup.Item>
                {technician.specializations && technician.specializations.length > 0 && (
                    <ListGroup.Item>
                        <strong>Specializations:</strong>
                        <div>
                            {technician.specializations.map((spec, index) => (
                            <Badge bg="secondary" key={index} className="me-1 mb-1">
                                {spec}
                            </Badge>
                            ))}
                        </div>
                    </ListGroup.Item>
                )}
                <ListGroup.Item>
                  <strong>Availability:</strong> {technician.availability.join(', ')}
                </ListGroup.Item>
                <ListGroup.Item className="d-flex align-items-center">
                  <strong>Overall Rating:</strong>
                  <div className="ms-2">
                    <Rating
                        initialRating={technician.averageRating}
                        emptySymbol={<FaRegStar color="#ccc" className="icon" />}
                        fullSymbol={<FaStar color="#ffd700" className="icon" />}
                        readonly
                        fractions={2}
                        start={0}
                        stop={5}
                        className="d-inline-block"
                    />
                  </div>
                  <span className="ms-2">
                    {technician.averageRating.toFixed(1)} ({technician.reviewCount} reviews)
                  </span>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Description:</strong> {technician.description || 'No description provided.'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong>{' '}
                  <Badge bg={technician.isAvailable ? 'success' : 'danger'}>
                    {technician.isAvailable ? 'Available' : 'Currently Unavailable'}
                  </Badge>
                  {' '}
                  <Badge bg={technician.isVerifiedByAdmin ? 'info' : 'warning'}>
                    {technician.isVerifiedByAdmin ? 'Verified by Admin' : 'Pending Verification'}
                  </Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Booking Form Section */}
          {userRole === 'user' && token ? (
            <Card className="mt-4">
              <Card.Header as="h4">Book This Technician</Card.Header>
              <Card.Body>
                {bookingMessage && <Alert variant={bookingMessageType}>{bookingMessage}</Alert>}
                <Form onSubmit={handleBookingSubmit}>
                  <Form.Group className="mb-3" controlId="serviceSelect">
                    <Form.Label>Select Service</Form.Label>
                    <Form.Select
                      name="service"
                      value={bookingFormData.service}
                      onChange={handleBookingChange}
                      required
                      disabled={bookingLoading}
                    >
                      <option value="">Choose...</option>
                      {technician.servicesOffered.map((service, index) => (
                        <option key={index} value={service}>
                          {service}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="bookingDate">
                    <Form.Label>Preferred Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="bookingDate"
                      value={bookingFormData.bookingDate}
                      onChange={handleBookingChange}
                      required
                      disabled={bookingLoading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="bookingTime">
                    <Form.Label>Preferred Time</Form.Label>
                    <Form.Control
                      type="time"
                      name="bookingTime"
                      value={bookingFormData.bookingTime}
                      onChange={handleBookingChange}
                      required
                      disabled={bookingLoading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="notes">
                    <Form.Label>Notes (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Any specific instructions or details?"
                      name="notes"
                      value={bookingFormData.notes}
                      onChange={handleBookingChange}
                      disabled={bookingLoading}
                    />
                  </Form.Group>

                  <Button variant="success" type="submit" className="w-100" disabled={bookingLoading}>
                    {bookingLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          ) : (
            <Alert variant="info" className="mt-4 text-center">
              Please <Link to="/login">login</Link> as a **user** to book this technician.
            </Alert>
          )}


          {/* Review Section */}
          <Card className="mt-4">
            <Card.Header as="h4">Reviews ({technician.reviewCount})</Card.Header>
            <Card.Body>
              {reviewMessage && <Alert variant={reviewMessageType}>{reviewMessage}</Alert>}

              {/* Review Submission Form */}
              {canSubmitReview ? (
                <Form onSubmit={handleReviewSubmit} className="mb-4">
                  <h5>Submit Your Review</h5>
                  <Form.Group className="mb-3" controlId="rating">
                    <Form.Label>Rating</Form.Label>
                    <StarRatingInput
                        value={reviewFormData.rating}
                        onChange={handleStarRatingChange}
                        size={30}
                        activeColor="#ffd700"
                        count={5}
                        disabled={reviewSubmitting}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="comment">
                    <Form.Label>Comment (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Share your experience..."
                      name="comment"
                      value={reviewFormData.comment}
                      onChange={handleReviewChange}
                      disabled={reviewSubmitting}
                    />
                  </Form.Group>

                  <Button variant="info" type="submit" disabled={reviewSubmitting}>
                    {reviewSubmitting ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                            Submitting...
                        </>
                    ) : (
                        'Submit Review'
                    )}
                  </Button>
                </Form>
              ) : userRole === 'user' && token && hasReviewed ? (
                <Alert variant="info" className="text-center">
                    You have already reviewed this technician.
                </Alert>
              ) : userRole === 'user' && token && !hasCompletedBookingWithTech ? (
                <Alert variant="info" className="text-center">
                    You can only submit a review after a service with this technician is marked as "Completed".
                </Alert>
              ) : (
                <Alert variant="info" className="mt-4 text-center">
                    <Link to="/login">Login</Link> as a **user** to submit a review.
                </Alert>
              )}

              {/* Display Existing Reviews */}
              {reviews.length === 0 ? (
                <p className="text-center mt-4">No reviews yet. Be the first to leave one!</p>
              ) : (
                <ListGroup className="mt-4">
                  {reviews.map((review) => (
                    <ListGroup.Item key={review._id} className="mb-2 shadow-sm rounded">
                      <strong>{review.user ? review.user.name : 'Anonymous User'}</strong>
                      <div className="d-flex align-items-center mb-1">
                        <Rating
                          initialRating={review.rating}
                          emptySymbol={<FaRegStar color="#ccc" size={20} />}
                          fullSymbol={<FaStar color="#ffd700" size={20} />}
                          readonly
                          fractions={0}
                          start={0}
                          stop={5}
                          className="d-inline-block"
                        />
                        <span className="ms-2 text-muted">({review.rating}/5)</span>
                      </div>
                      <p className="text-muted mb-1"><small>{new Date(review.createdAt).toLocaleDateString()}</small></p>
                      <p>{review.comment || <em>No comment provided.</em>}</p>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TechnicianProfile;