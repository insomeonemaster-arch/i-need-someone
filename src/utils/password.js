const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const hash = async (password) => bcrypt.hash(password, SALT_ROUNDS);
const compare = async (password, hash) => bcrypt.compare(password, hash);

module.exports = { hash, compare };
