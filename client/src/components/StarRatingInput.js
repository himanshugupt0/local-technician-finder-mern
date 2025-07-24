import React, { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa'; // Import star icons

// Custom Star Rating Input Component
const StarRatingInput = ({ value, onChange, size = 30, activeColor = "#ffd700", count = 5 }) => {
  // State for hover effect
  const [hover, setHover] = useState(0);

  // Handler when a star is clicked
  const handleClick = (index) => {
    onChange(index); // Pass the selected rating (1-5) to the parent's onChange handler
  };

  // Handler for mouse enter (hover effect)
  const handleMouseEnter = (index) => {
    setHover(index); // Set hover state to show stars up to this index
  };

  // Handler for mouse leave (reset hover effect)
  const handleMouseLeave = () => {
    setHover(0); // Reset hover state
  };

  return (
    <div style={{ display: 'inline-block', cursor: 'pointer' }} onMouseLeave={handleMouseLeave}>
      {[...Array(count)].map((star, index) => {
        index += 1; // Stars are 1-indexed (1 to 5)
        return (
          <span
            key={index}
            className="star-rating-item" // Add a class for potential custom CSS if needed
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            style={{ cursor: 'pointer', display: 'inline-flex', verticalAlign: 'middle' }} // Ensure clickability
          >
            {/* Render full star if index is less than or equal to current value OR hover value */}
            {index <= (hover || value) ? (
              <FaStar color={activeColor} size={size} />
            ) : (
              <FaRegStar color="#ccc" size={size} />
            )}
          </span>
        );
      })}
    </div>
  );
};

export default StarRatingInput;