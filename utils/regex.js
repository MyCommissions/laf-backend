const oneUpperCase = /^(?=.*[A-Z])/;
const oneNumber = /^(?=.*[0-9])/;
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sixDigits = /^\d{6}$/;

module.exports = {
    oneUpperCase,
    oneNumber,
    validEmail,
    sixDigits
}