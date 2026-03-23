/**
 * Client-side validation helpers. Never trust these for security — server validates too.
 */

export function validateEmail(email) {
  if (!email) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Please enter a valid email address.';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

export function validateFullName(name) {
  if (!name) return 'Full name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  return null;
}

export function validatePlantName(name) {
  if (!name || !name.trim()) return 'Plant name is required.';
  if (name.length > 200) return 'Plant name must be 200 characters or less.';
  return null;
}

export function validateFrequencyValue(value) {
  if (!value && value !== 0) return 'Frequency is required.';
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > 365) return 'Must be between 1 and 365.';
  return null;
}

export function validatePhotoFile(file) {
  if (!file) return null;
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) return 'Unsupported file type. Use JPG or PNG.';
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) return 'Photo is too large (max 5MB).';
  return null;
}
