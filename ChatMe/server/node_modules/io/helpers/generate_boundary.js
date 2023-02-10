const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';
const alphanumeric = alphabet + alphabet.toLowerCase(); + numbers;

module.exports = (length = 32) => {
  const randomString = Array(length)
    .fill(0)
    .map(() => alphanumeric[(Math.random() * alphanumeric.length) | 0])
    .join('');
  return '-'.repeat(20) + randomString;
};
