import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear(); // Dynamically get current year

  return (
    <footer className="bg-dark text-white text-center py-3 mt-5">
      <Container>
        <p className="mb-0">&copy; {currentYear} Local Technician Finder. All rights reserved.</p>
        <p className="mb-0">Designed and Developed by Himanshu Gupta</p>
      </Container>
    </footer>
  );
};

export default Footer;