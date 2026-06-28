import { PASSWORD_REQUIREMENTS } from './constants';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`);
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?92[-.\s]?[0-9]{3}[-.\s]?[0-9]{7}$/;
  return phoneRegex.test(phone);
};

export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const isValidBudgetRange = (minBudget: number, maxBudget: number): boolean => {
  return minBudget > 0 && maxBudget > minBudget && maxBudget - minBudget >= 100000;
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').slice(0, 255);
};
