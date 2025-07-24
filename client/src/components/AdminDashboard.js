import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Button, Badge, Tab, Tabs, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [key, setKey] = useState('unverifiedTechnicians'); // State for active tab
    const [unverifiedTechnicians, setUnverifiedTechnicians] = useState([]);
    const [allTechnicians, setAllTechnicians] = useState([]); // State for all technicians
    const [allUsers, setAllUsers] = useState([]); // State for all users
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUserId = localStorage.getItem('userId'); // Get current logged-in admin's ID
    const navigate = useNavigate();

    // Function to fetch data based on active tab
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        setMessage('');

        if (!token || userRole !== 'admin') {
            setError('Access Denied. You must be logged in as an administrator.');
            setLoading(false);
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        try {
            if (key === 'unverifiedTechnicians' || key === 'allTechnicians') {
                // Fetch all technicians (verified or not for 'allTechnicians' tab)
                const techRes = await fetch(key === 'unverifiedTechnicians' ? '/api/admin/unverified-technicians' : '/api/admin/all-technicians', {
                    headers: { 'x-auth-token': token },
                });
                const techData = await techRes.json();
                if (!techRes.ok) {
                    setError(techData.msg || `Failed to fetch ${key} data.`);
                } else {
                    if (key === 'unverifiedTechnicians') {
                        setUnverifiedTechnicians(techData);
                    } else {
                        setAllTechnicians(techData);
                    }
                }
            }

            if (key === 'allUsers') {
                // Fetch all users
                const userRes = await fetch('/api/admin/users', {
                    headers: { 'x-auth-token': token },
                });
                const userData = await userRes.json();
                if (!userRes.ok) {
                    setError(userData.msg || 'Failed to fetch users data.');
                } else {
                    setAllUsers(userData);
                }
            }
        } catch (err) {
            console.error('Frontend fetch admin data error:', err);
            setError('Could not connect to the server or retrieve data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [key, token, userRole]); // Re-fetch data when tab, token, or role changes

    // Handle technician verification (Approve/Disapprove)
    const handleTechnicianStatusChange = async (technicianId, statusType) => {
        setMessage('');
        setMessageType('');

        if (!token || userRole !== 'admin') {
            setMessage('Authentication required for this action.');
            setMessageType('danger');
            return;
        }

        try {
            const res = await fetch(`/api/admin/technicians/${technicianId}/${statusType}`, {
                method: 'PUT',
                headers: { 'x-auth-token': token },
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`Technician ${data.technician.user.name} ${statusType === 'verify' ? 'verified' : 'disapproved'} successfully!`);
                setMessageType('success');
                fetchData(); // Re-fetch all data to update lists
            } else {
                setMessage(data.msg || `Failed to ${statusType} technician.`);
                setMessageType('danger');
            }
        } catch (err) {
            console.error('Frontend technician status change error:', err);
            setMessage('Server error during technician status change. Please try again.');
            setMessageType('danger');
        }
    };

    // Handle user role change
    const handleUserRoleChange = async (userId, newRole) => {
        setMessage('');
        setMessageType('');

        if (!token || userRole !== 'admin') {
            setMessage('Authentication required for this action.');
            setMessageType('danger');
            return;
        }

        if (currentUserId === userId && newRole !== 'admin') {
            setMessage('Cannot demote your own admin account.');
            setMessageType('danger');
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`User ${data.user.email} role updated to ${newRole}!`);
                setMessageType('success');
                fetchData(); // Re-fetch all data
            } else {
                setMessage(data.msg || 'Failed to update user role.');
                setMessageType('danger');
            }
        } catch (err) {
            console.error('Frontend user role update error:', err);
            setMessage('Server error updating user role. Please try again.');
            setMessageType('danger');
        }
    };

    // Handle delete technician
    const handleDeleteTechnician = async (technicianId, techName) => {
        if (!window.confirm(`Are you sure you want to delete technician "${techName}" and all associated data? This action cannot be undone.`)) {
            return;
        }
        setMessage('');
        setMessageType('');

        try {
            const res = await fetch(`/api/admin/technicians/${technicianId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token },
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`Technician "${techName}" deleted successfully!`);
                setMessageType('success');
                fetchData(); // Re-fetch data
            } else {
                setMessage(data.msg || 'Failed to delete technician.');
                setMessageType('danger');
            }
        } catch (err) {
            console.error('Frontend delete technician error:', err);
            setMessage('Server error deleting technician. Please try again.');
            setMessageType('danger');
        }
    };

    // Handle delete user
    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Are you sure you want to delete user "${userEmail}" and ALL their associated data (technician profiles, bookings, reviews)? This action cannot be undone and is extremely destructive.`)) {
            return;
        }
        setMessage('');
        setMessageType('');

        if (currentUserId === userId) {
            setMessage('Cannot delete your own admin account. Please create another admin first if you wish to delete this account.');
            setMessageType('danger');
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token },
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`User "${userEmail}" and all associated data deleted successfully!`);
                setMessageType('success');
                fetchData(); // Re-fetch data
            } else {
                setMessage(data.msg || 'Failed to delete user.');
                setMessageType('danger');
            }
        } catch (err) {
            console.error('Frontend delete user error:', err);
            setMessage('Server error deleting user. Please try again.');
            setMessageType('danger');
        }
    };


    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p>Loading admin dashboard...</p>
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
            <h2 className="text-center mb-4">Admin Dashboard</h2>
            {message && <Alert variant={messageType}>{message}</Alert>}

            <Tabs
                id="admin-dashboard-tabs"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
            >
                <Tab eventKey="unverifiedTechnicians" title="Verify Technicians">
                    <h3 className="mb-3">Technicians Awaiting Verification</h3>
                    {unverifiedTechnicians.length === 0 ? (
                        <Alert variant="info" className="text-center my-5 p-4">
                            <h4 className="alert-heading"><i className="bi bi-check-circle me-2"></i>All Clear!</h4>
                            <p>There are no technicians currently awaiting your verification. Check back later for new registrations!</p>
                            <hr />
                            <p className="mb-0">You can register a new technician to see them appear here.</p>
                        </Alert>
                    ) : (
                        <Row>
                            {unverifiedTechnicians.map((tech) => (
                                <Col md={6} lg={4} className="mb-4" key={tech._id}>
                                    <Card>
                                        <Card.Body>
                                            <Card.Title>{tech.user.name}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted">Email: {tech.user.email}</Card.Subtitle>
                                            <Card.Text>
                                                <strong>Contact:</strong> {tech.contactNumber}<br/>
                                                <strong>Location:</strong> {tech.location}<br/>
                                                <strong>Services:</strong> {tech.servicesOffered.join(', ') || 'N/A'}<br/>
                                                <strong>Specializations:</strong> {tech.specializations.length > 0 ? tech.specializations.join(', ') : 'None'}<br/>
                                                <strong>Description:</strong> {tech.description ? `${tech.description.substring(0, 70)}...` : 'No description provided.'}<br/>
                                                <small className="text-muted">Registered On: {new Date(tech.createdAt).toLocaleDateString()}</small>
                                                <div className="mt-2">
                                                    <Badge bg="warning" className="me-1">Awaiting Verification</Badge>
                                                    <Badge bg={tech.isAvailable ? 'success' : 'danger'}>{tech.isAvailable ? 'Available Now' : 'Unavailable'}</Badge>
                                                </div>
                                            </Card.Text>
                                            <Button
                                                variant="success"
                                                onClick={() => handleTechnicianStatusChange(tech._id, 'verify')}
                                                className="w-100 mt-2"
                                            >
                                                Verify Technician
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={() => handleDeleteTechnician(tech._id, tech.user.name)}
                                                className="w-100 mt-2"
                                            >
                                                Delete Technician
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Tab>

                <Tab eventKey="allTechnicians" title="All Technicians">
                    <h3 className="mb-3">All Technicians</h3>
                    {allTechnicians.length === 0 ? (
                        <Alert variant="info" className="text-center my-5 p-4">No technicians found in the system.</Alert>
                    ) : (
                        <Row>
                            {allTechnicians.map((tech) => (
                                <Col md={6} lg={4} className="mb-4" key={tech._id}>
                                    <Card>
                                        <Card.Body>
                                            <Card.Title>{tech.user.name}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted">Email: {tech.user.email}</Card.Subtitle>
                                            <Card.Text>
                                                <strong>Status:</strong>{' '}
                                                <Badge bg={tech.isVerifiedByAdmin ? 'success' : 'danger'}>
                                                    {tech.isVerifiedByAdmin ? 'Verified' : 'Unverified'}
                                                </Badge><br/>
                                                <strong>Location:</strong> {tech.location}<br/>
                                                <strong>Services:</strong> {tech.servicesOffered.join(', ') || 'N/A'}<br/>
                                                <strong>Rating:</strong> {tech.averageRating.toFixed(1)} ({tech.reviewCount} reviews)
                                            </Card.Text>
                                            <Button
                                                variant={tech.isVerifiedByAdmin ? 'warning' : 'success'}
                                                onClick={() => handleTechnicianStatusChange(tech._id, tech.isVerifiedByAdmin ? 'disapprove' : 'verify')}
                                                className="w-100"
                                            >
                                                {tech.isVerifiedByAdmin ? 'Disapprove' : 'Approve'}
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={() => handleDeleteTechnician(tech._id, tech.user.name)}
                                                className="w-100 mt-2"
                                            >
                                                Delete Technician
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Tab>

                <Tab eventKey="allUsers" title="All Users">
                    <h3 className="mb-3">All Registered Users</h3>
                    {allUsers.length === 0 ? (
                        <Alert variant="info" className="text-center my-5 p-4">No users found in the system.</Alert>
                    ) : (
                        <Row>
                            {allUsers.map((user) => (
                                <Col md={6} lg={4} className="mb-4" key={user._id}>
                                    <Card>
                                        <Card.Body>
                                            <Card.Title>{user.name}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted">Email: {user.email}</Card.Subtitle>
                                            <Card.Text>
                                                <strong>Role:</strong> <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'technician' ? 'info' : 'primary'}>{user.role}</Badge><br/>
                                                <small className="text-muted">Registered On: {new Date(user.createdAt).toLocaleDateString()}</small>
                                            </Card.Text>
                                            <Dropdown className="w-100">
                                                <Dropdown.Toggle variant="secondary" id={`dropdown-role-${user._id}`} className="w-100">
                                                    Change Role
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="w-100">
                                                    <Dropdown.Item onClick={() => handleUserRoleChange(user._id, 'user')}>User</Dropdown.Item>
                                                    <Dropdown.Item onClick={() => handleUserRoleChange(user._id, 'technician')}>Technician</Dropdown.Item>
                                                    <Dropdown.Item onClick={() => handleUserRoleChange(user._id, 'admin')}>Admin</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                            <Button
                                                variant="danger"
                                                onClick={() => handleDeleteUser(user._id, user.email)}
                                                className="w-100 mt-2"
                                                disabled={user._id === currentUserId} // Disable delete for current admin
                                            >
                                                Delete User
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default AdminDashboard;