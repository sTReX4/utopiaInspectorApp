/* Sign-up field rules, kept in one place so the register screen and the
 * finish-registration form on the lock screen enforce exactly the same thing. */

/** PH mobile numbers are 11 digits: 09XX XXX XXXX. */
export const PHONE_LENGTH = 11;

/** Strips formatting as the inspector types, so the field only ever holds digits. */
export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

export interface PasswordRule {
    label: string;
    met: boolean;
}

/**
 * The checklist rendered under the password field.
 *
 * Shown live rather than only on submit: an inspector setting up a device in
 * the field should not have to guess which rule they missed.
 */
export const passwordRules = (password: string): PasswordRule[] => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One symbol (!@#$)', met: /[^A-Za-z0-9]/.test(password) },
];

export const isPasswordStrong = (password: string): boolean =>
    passwordRules(password).every((rule) => rule.met);

export const validatePhone = (raw: string): string | null => {
    const digits = digitsOnly(raw);

    if (!digits) return 'Enter your phone number.';
    if (digits.length !== PHONE_LENGTH) {
        return `Phone number must be exactly ${PHONE_LENGTH} digits.`;
    }
    if (!digits.startsWith('09')) {
        return 'Enter a mobile number starting with 09.';
    }
    return null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validateEmail = (raw: string): string | null => {
    const email = raw.trim();

    if (!email) return 'Enter your email address.';
    if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
    return null;
};

/* Deliberately permissive: accented letters, hyphens, apostrophes and periods
 * all appear in real names on the roster. Avoids unicode property escapes,
 * which are not dependable across the Hermes versions this app ships on. */
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ'.\- ]+$/;

export const validateFullName = (raw: string): string | null => {
    const name = raw.trim().replace(/\s+/g, ' ');

    if (name.length < 2) return 'Enter your full name.';
    if (!NAME_PATTERN.test(name)) {
        return 'Use letters, spaces, hyphens and apostrophes only.';
    }
    return null;
};

export const validatePassword = (password: string): string | null =>
    isPasswordStrong(password) ? null : 'Your password does not meet the requirements below.';
