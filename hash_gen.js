const bcrypt = require('bcryptjs')

async function generateHash() {
  const password = 'password123'
  const hash = await bcrypt.hash(password, 12)
  console.log('Password:', password)
  console.log('Bcrypt hash:', hash)

  // Test the hash
  const isValid = await bcrypt.compare(password, hash)
  console.log('Hash verification:', isValid)

  // Test against your current hash
  const currentHash =
    '$2a$12$LQv3c1yqBwEHxv68.8YRu.hM.XKOqAjXH7TBrj9.MbOHKVvwzd7bO'
  const isCurrentValid = await bcrypt.compare(password, currentHash)
  console.log('Current hash verification:', isCurrentValid)
}

generateHash()
