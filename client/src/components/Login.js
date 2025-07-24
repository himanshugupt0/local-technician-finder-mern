import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext'; // <--- NEW IMPORT

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  // Removed message and messageType states as they will be handled by toast
  // const [message, setMessage] = useState('');
  // const [messageType, setMessageType] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast(); // <--- Use the showToast function

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    // setMessage(''); // No longer needed
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Login successful!', 'success'); // <--- UPDATED: Use toast
        login(data.token, data.role, data.userId);

        if (data.role === 'admin') {
          setTimeout(() => navigate('/admin-dashboard'), 1000);
        } else if (data.role === 'technician') {
          setTimeout(() => navigate('/technician-dashboard'), 1000);
        } else {
          setTimeout(() => navigate('/user-dashboard'), 1000);
        }

      } else {
        showToast(data.msg || 'Login failed.', 'danger'); // <--- UPDATED: Use toast
      }
    } catch (err) {
      console.error('Frontend login error:', err);
      showToast('Server error during login. Please try again later.', 'danger'); // <--- UPDATED: Use toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Login to Your Account</h2>
          {/* Removed static Alert as toasts will handle messages */}
          {/* {message && <Alert variant={messageType}>{message}</Alert>} */}
          <Form onSubmit={onSubmit}>
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
                required
                disabled={loading}
              />
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
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;