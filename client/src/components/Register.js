import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // <--- NEW IMPORT

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    role: 'user',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  // Removed message and messageType states as they will be handled by toast
  // const [message, setMessage] = useState('');
  // const [messageType, setMessageType] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast(); // <--- Use the showToast function

  const { name, email, password, password2, role, location } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    // Removed setMessage('');
    setLoading(true);

    if (password !== password2) {
      showToast('Passwords do not match', 'danger'); // <--- UPDATED: Use toast
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, location }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Registration successful! Logging you in...', 'success'); // <--- UPDATED: Use toast
        login(data.token, data.role, data.userId);

        if (data.role === 'admin') {
          setTimeout(() => navigate('/admin-dashboard'), 1000);
        } else if (data.role === 'technician') {
          setTimeout(() => navigate('/technician-dashboard'), 1000);
        } else {
          setTimeout(() => navigate('/user-dashboard'), 1000);
        }

      } else {
        showToast(data.msg || 'Registration failed.', 'danger'); // <--- UPDATED: Use toast
      }
    } catch (err) {
      console.error('Frontend registration error:', err);
      showToast('Server error during registration. Please try again later.', 'danger'); // <--- UPDATED: Use toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Register Account</h2>
          {/* Removed static Alert as toasts will handle messages */}
          {/* {message && <Alert variant={messageType}>{message}</Alert>} */}
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                name="name"
                value={name}
                onChange={onChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                name="email"
                value={email}
                onChange={onChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                name="password"
                value={password}
                onChange={onChange}
                minLength="6"
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password2">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm Password"
                name="password2"
                value={password2}
                onChange={onChange}
                minLength="6"
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="role">
              <Form.Label>Register As</Form.Label>
              <Form.Select name="role" value={role} onChange={onChange} disabled={loading}>
                <option value="user">User (Looking for Technician)</option>
                <option value="technician">Technician (Offering Services)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="location">
              <Form.Label>Your Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Ludhiana, Punjab"
                name="location"
                value={location}
                onChange={onChange}
                required
                disabled={loading}
              />
              <Form.Text className="text-muted">
                This helps technicians find you or helps you filter results.
              </Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;