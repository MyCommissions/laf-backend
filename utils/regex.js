const oneUpperCase = /^(?=.*[A-Z])/;
const oneNumber = /^(?=.*[0-9])/;
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = {
    oneUpperCase,
    oneNumber,
    validEmail
}