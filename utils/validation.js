/**
 * Validation utility functions for Quick-Job app
 */

// Email validation regex
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (basic international format)
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Password strength validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Numeric validation for pay amounts (positive numbers only)
export const isValidPayAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

// General required field validation
export const isRequired = (value) => {
  return value && value.trim().length > 0;
};

// Validate all login fields
export const validateLogin = (email, password) => {
  const errors = {};

  if (!isRequired(email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!isRequired(password)) {
    errors.password = 'Password is required';
  }

  return errors;
};

// Validate all signup fields
export const validateSignup = (email, password, confirmPassword) => {
  const errors = {};

  if (!isRequired(email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!isRequired(password)) {
    errors.password = 'Password is required';
  } else if (!isStrongPassword(password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
  }

  if (!isRequired(confirmPassword)) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

// Validate job posting fields
export const validateJobPost = (title, description, jobType, pay, contact) => {
  const errors = {};

  if (!isRequired(title)) {
    errors.title = 'Job title is required';
  }

  if (!isRequired(description)) {
    errors.description = 'Job description is required';
  }

  if (!isRequired(jobType)) {
    errors.jobType = 'Job type is required';
  }

  if (!isRequired(pay)) {
    errors.pay = 'Pay amount is required';
  } else if (!isValidPayAmount(pay)) {
    errors.pay = 'Please enter a valid positive pay amount';
  }

  if (!isRequired(contact)) {
    errors.contact = 'Contact information is required';
  } else if (!isValidPhoneNumber(contact)) {
    errors.contact = 'Please enter a valid phone number';
  }

  return errors;
};
