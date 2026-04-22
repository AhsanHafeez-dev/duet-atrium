const bcrypt = require('bcryptjs');

async function check() {
  const hash = "$2a$10$BceOrqSrCnqV/KP/hQHAYOcT9xzSLf1mu.M22mIKAnVaSTMpIN6fi";
  const isMatch = await bcrypt.compare("12345678", hash);
  console.log("Does 12345678 match?", isMatch);

  const hash2 = await bcrypt.hash("12345678", 10);
  console.log("New Hash for 12345678:", hash2);
}
check();
