import React, { useState, useEffect, useCallback } from 'react'; // <--- NEW: Import useCallback
import { Container, Row, Col, Card, Alert, Spinner, Button, Badge, Tab, Tabs, Dropdown } from 'react-bootstrap';
import { useHistory } from 'react-router-dom'; // Changed from useNavigate
import { useToast } from '../context/ToastContext';

const AdminDashboard = () => {
    const [key, setKey] = useState('unverifiedTechnicians'); // State for active tab
    const [unverifiedTechnicians, setUnverifiedTechnicians] = useState([]);
    const [allTechnicians, setAllTechnicians] = useState([]); // State for all technicians
    const [allUsers, setAllUsers] = useState([]); // State for all users
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // For initial page load error
    // const [message, setMessage] = useState(''); // <--- REMOVED (permanently, as it's not used)
    // const [messageType, setMessageType] = useState(''); // <--- REMOVED (permanently)

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const currentUserId = localStorage.getItem('userId');
    const history = useHistory();
    const { showToast } = useToast();

    // Function to fetch data based on active tab
    // --- FIX: Wrap fetchData in useCallback to stabilize its reference ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!token || userRole !== 'admin') {
            showToast('Access Denied. You must be logged in as an administrator.', 'danger');
            setLoading(false);
            setTimeout(() => history.push('/login'), 2000);
            return;
        }

        try {
            if (key === 'unverifiedTechnicians' || key === 'allTechnicians') {
                const techRes = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}${key === 'unverifiedTechnicians' ? '/api/admin/unverified-technicians' : '/api/admin/all-technicians'}`,
                    {
                        headers: { 'x-auth-token': token },
                    }
                );
                const techData = await techRes.json();
                if (!techRes.ok) {
                    showToast(techData.msg || `Failed to fetch ${key} data.`, 'danger');
                } else {
                    if (key === 'unverifiedTechnicians') {
                        setUnverifiedTechnicians(techData);
                    } else {
                        setAllTechnicians(techData);
                    }
                }
            }

            if (key === 'allUsers') {
                const userRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/users`, {
                    headers: { 'x-auth-token': token },
                });
                const userData = await userRes.json();
                if (!userRes.ok) {
                    showToast(userData.msg || 'Failed to fetch users data.', 'danger');
                } else {
                    setAllUsers(userData);
                }
            }
        } catch (err) {
            console.error('Frontend fetch admin data error:', err);
            showToast('Could not connect to the server or retrieve data.', 'danger');
        } finally {
            setLoading(false);
        }
    }, [key, token, userRole, history, showToast]); // Dependencies for useCallback

    // --- UPDATED: useEffect dependencies to resolve warning ---
    useEffect(() => {
        fetchData();
    }, [fetchData]); // Now useEffect depends on the stable fetchData function

    // Handle technician verification (Approve/Disapprove)
    const handleTechnicianStatusChange = async (technicianId, statusType) => {
        if (!token || userRole !== 'admin') {
            showToast('Authentication required for this action.', 'danger');
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/technicians/${technicianId}/${statusType}`, {
                method: 'PUT',
                headers: { 'x-auth-token': token },
            });
            const data = await res.json();

            if (res.ok) {
                showToast(`Technician ${data.technician.user.name} ${statusType === 'verify' ? 'verified' : 'disapproved'} successfully!`, 'success');
                fetchData(); // Re-fetch all data to update lists
            } else {
                showToast(data.msg || `Failed to ${statusType} technician.`, 'danger');
            }
        } catch (err) {
            console.error('Frontend technician status change error:', err);
            showToast('Server error during technician status change. Please try again.', 'danger');
        }
    };

    // Handle user role change
    const handleUserRoleChange = async (userId, newRole) => {
        if (!token || userRole !== 'admin') {
            showToast('Authentication required for this action.', 'danger');
            return;
        }

        if (currentUserId === userId) {
            showToast('Cannot change role for your own admin account.', 'danger');
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json(); // <--- Corrected: Add 'await' here

            if (res.ok) {
                showToast(`User ${data.user.email} role updated to ${newRole}!`, 'success');
                fetchData(); // Re-fetch all data
            } else {
                showToast(data.msg || 'Failed to update user role.', 'danger');
            }
        } catch (err) {
            console.error('Frontend user role update error:', err);
            showToast('Server error updating user role. Please try again.', 'danger');
        }
    };

    // Handle delete technician
    const handleDeleteTechnician = async (technicianId, techName) => {
        if (!window.confirm(`Are you sure you want to delete technician "${techName}" and all associated data? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/technicians/${technicianId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token },
            });
            const data = await res.json();

            if (res.ok) {
                showToast(`Technician "${techName}" deleted successfully!`, 'success');
                fetchData(); // Re-fetch data
            } else {
                showToast(data.msg || 'Failed to delete technician.', 'danger');
            }
        } catch (err) {
            console.error('Frontend delete technician error:', err);
            showToast('Server error deleting technician. Please try again.', 'danger');
        }
    };

    // Handle delete user
    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`Are you sure you want to delete user "${userEmail}" and ALL their associated data (technician profiles, bookings, reviews)? This action cannot be undone and is extremely destructive.`)) {
            return;
        }

        if (currentUserId === userId) {
            showToast('Cannot delete your own admin account. Please create another admin first if you wish to delete this account.', 'danger');
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token },
            });
            const data = await res.json();

            if (res.ok) {
                showToast(`User "${userEmail}" and all associated data deleted successfully!`, 'success');
                fetchData(); // Re-fetch data
            } else {
                showToast(data.msg || 'Failed to delete user.', 'danger');
            }
        } catch (err) {
            console.error('Frontend delete user error:', err);
            showToast('Server error deleting user. Please try again.', 'danger');
        }
    };


    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading admin dashboard...</span>
                </Spinner>
                <p>Loading admin dashboard...</p>
            </Container>
        );
    }

    if (error) { // This error is for initial page load failure, not individual action failures
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">Admin Dashboard</h2>
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
                                                disabled={user._id === currentUserId}
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