const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@trinetra.com');
if (user) {
  bcrypt.compare('ChangeMe@123', user.password).then(res => console.log('Password match:', res));
} else {
  console.log('User not found');
}
