import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastNotification = ({ message, type, show, onClose }) => {
  // Determine header background and text color based on type
  let headerBg = '';
  let headerText = 'text-white'; // Default to white text for dark backgrounds

  switch (type) {
    case 'success':
      headerBg = 'bg-success';
      break;
    case 'danger':
      headerBg = 'bg-danger';
      break;
    case 'warning':
      headerBg = 'bg-warning';
      headerText = 'text-dark'; // Dark text for warning
      break;
    case 'info':
      headerBg = 'bg-info';
      break;
    default:
      headerBg = 'bg-secondary'; // Default for unknown type
      break;
  }

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1050 }}>
      <Toast show={show} onClose={onClose} delay={3000} autohide>
        <Toast.Header className={`${headerBg} ${headerText}`}>
          <strong className="me-auto">
            {type === 'success' && 'Success!'}
            {type === 'danger' && 'Error!'}
            {type === 'warning' && 'Warning!'}
            {type === 'info' && 'Info'}
            {type === '' && 'Notification'} {/* Default if type is not set */}
          </strong>
        </Toast.Header>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default ToastNotification;