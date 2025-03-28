import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Function to hash a password
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Function to compare passwords
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// The main test function
async function testPasswordHash() {
  // Test with our admin password
  const password = "Admin123!";
  
  // Hash the password
  const hashedPassword = await hashPassword(password);
  console.log("Newly generated hash for 'Admin123!':", hashedPassword);
  
  // Check the pre-computed hash from storage.ts
  const storedHash = 'c56f5a1595286b302903652a6d5c011dc7fd542f605c4bfa3810f81a3621b1c464c3f3e325fdc6d2f9f7d53ba176f7b534d37c273ef656e00f68258b3f3cef73.f7ac01a7d91cf82ade4b28a2c5602682';
  
  // Compare password with our stored hash
  const isMatch = await comparePasswords(password, storedHash);
  console.log("Does 'Admin123!' match the stored hash?", isMatch);
  
  // Compare password with our new hash
  const isNewMatch = await comparePasswords(password, hashedPassword);
  console.log("Does 'Admin123!' match the newly generated hash?", isNewMatch);
}

// Run the test
testPasswordHash()
  .then(() => console.log("Test completed"))
  .catch(err => console.error("Test failed:", err));