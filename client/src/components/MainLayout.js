import React from 'react'; // `useState`, `useEffect` removed as they are not directly used in MainLayout, now handled by useAuth
// --- UPDATED IMPORTS FOR REACT-ROUTER-DOM V5 ---
import { BrowserRouter as Router, Switch, Route, Link, useHistory } from 'react-router-dom'; // `Router` is used, so keep it. `Routes` becomes Switch, `useNavigate` becomes `useHistory`
// --- END UPDATED IMPORTS ---
import { Navbar, Nav, Container, Button, Card, Row, Col, Spinner } from 'react-bootstrap';

import { useAuth } from '../context/AuthContext';

// Import ALL custom components used in this file
import Register from './Register';
import Login from './Login';
import TechnicianList from './TechnicianList';
import TechnicianProfile from './TechnicianProfile';
import UserBookings from './UserBookings';
import TechnicianBookings from './TechnicianBookings'; // This is TechnicianDashboard component
import AdminDashboard from './AdminDashboard';
import TechnicianProfileEdit from './TechnicianProfileEdit';
import Footer from './Footer';


const HomePage = () => {
  const [totalTechnicians, setTotalTechnicians] = React.useState(null);
  const [loadingTechCount, setLoadingTechCount] = React.useState(true);

  React.useEffect(() => {
    const fetchTechCount = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/technicians`);
        if (res.ok) {
          const data = await res.json();
          setTotalTechnicians(data.length);
        } else {
          setTotalTechnicians('N/A');
        }
      } catch (err) {
        console.error('Error fetching technician count:', err);
        setTotalTechnicians('N/A');
      } finally {
        setLoadingTechCount(false);
      }
    };
    fetchTechCount();
  }, []);

  return (
    <Container className="mt-4 flex-grow-1">
      {/* Hero Section */}
      <Row className="justify-content-center text-center py-5 bg-light rounded-3 shadow-sm">
        <Col md={10}>
          <h1 className="display-4 fw-bold mb-3">Find Your Local Expert, Fast.</h1>
          <p className="lead mb-4">
            Connect with verified technicians for all your home, computer, and vehicle repair needs.
            Reliable service, just a click away.
          </p>
          <Button as={Link} to="/technicians" variant="primary" size="lg" className="me-2 mb-2">
            Browse Technicians Now
          </Button>
          <Button as={Link} to="/register" variant="outline-secondary" size="lg" className="mb-2">
            Join as a Technician
          </Button>
        </Col>
      </Row>

      {/* Stats Section */}
      <Row className="justify-content-center mt-5">
        <Col md={8} className="text-center">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Our Network At a Glance</Card.Title>
              <Card.Text className="fs-3">
                {loadingTechCount ? (
                  'Loading...'
                ) : (
                  <>
                    <strong>{totalTechnicians}</strong> Verified Technicians Available
                  </>
                )}
              </Card.Text>
              <p className="text-muted">Ready to serve your neighborhood.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* How It Works Section */}
      <Row className="justify-content-center mt-5">
        <Col md={10}>
          <h2 className="text-center mb-4">How It Works</h2>
          <Row>
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <i className="bi bi-search fs-1 text-primary"></i>
                  <Card.Title>1. Search</Card.Title>
                  <Card.Text>Easily find technicians by service type and location.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <i className="bi bi-person-check fs-1 text-success"></i>
                  <Card.Title>2. Connect</Card.Title>
                  <Card.Text>View profiles and ratings of verified local experts.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <i className="bi bi-calendar-check fs-1 text-info"></i>
                  <Card.Title>3. Book</Card.Title>
                  <Card.Text>Schedule your service directly through the platform.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

    </Container>
  );
};

// --- REMOVED: TechnicianDashboard placeholder (as it's an imported component) ---
// const TechnicianDashboard = () => ( ... );

// --- REMOVED: AdminDashboard placeholder (as it's an imported component) ---
// const AdminDashboard = () => ( ... );


function MainLayout() {
  const { isLoggedIn, userRole, loading: authLoading, logout } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Bootstrap Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">LocalTechFinder</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/technicians">Technicians</Nav.Link>
              {/* Conditional links based on role */}
              {isLoggedIn && userRole === 'user' && (
                <Nav.Link as={Link} to="/user-dashboard">My Bookings</Nav.Link>
              )}
              {isLoggedIn && userRole === 'technician' && (
                <Nav.Link as={Link} to="/technician-dashboard">Tech Dashboard</Nav.Link>
              )}
              {isLoggedIn && userRole === 'admin' && (
                <Nav.Link as={Link} to="/admin-dashboard">Admin Panel</Nav.Link>
              )}
            </Nav>
            <Nav> {/* Right-aligned links */}
              {authLoading ? (
                  <Spinner animation="border" size="sm" variant="light" />
              ) : (
                  isLoggedIn ? (
                      <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
                  ) : (
                      <>
                          <Nav.Link as={Link} to="/login">Login</Nav.Link>
                          <Nav.Link as={Link} to="/register">Register</Nav.Link>
                      </>
                  )
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content Area - Routes will render here */}
      <div style={{ flex: 1 }}>
          <Switch> {/* Routes becomes Switch */}
            <Route exact path="/" component={HomePage} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/technicians" component={TechnicianList} />
            <Route path="/technicians/:id" component={TechnicianProfile} />
            {/* Dashboard Routes */}
            <Route path="/user-dashboard" component={UserBookings} />
            <Route path="/technician-dashboard" component={TechnicianBookings} />
            <Route path="/admin-dashboard" component={AdminDashboard} />
            <Route path="/technician-profile-edit" component={TechnicianProfileEdit} />
          </Switch>
      </div>

      {/* Footer is rendered outside of Routes, so it appears on every page */}
      <Footer />
    </div>
  );
}

export default MainLayout;