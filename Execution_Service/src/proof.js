"use strict";
const crypto = require("crypto");
const { BigNumber } = require("ethers");
const { modPow, modInv } = require("bigint-mod-arith");
// --- Modular Arithmetic Helpers ---

/**
 * Performs modular exponentiation.
 * Computes (base^exponent) mod modulus.
 */
function modExp(base, exponent, modulus) {
  let result = BigInt(1);
  base = base % modulus;
  while (exponent > BigInt(0)) {
    if (exponent % BigInt(2) === BigInt(1)) {
      result = (result * base) % modulus;
    }
    exponent = exponent / BigInt(2);
    base = (base * base) % modulus;
  }
  return result;
}

/**
 * Computes the modular inverse of a modulo m using the Extended Euclidean Algorithm.
 */
// function modInv(a, m) {
//   let m0 = m;
//   let y = BigInt(0);
//   let x = BigInt(1);

//   if (m === BigInt(1)) return BigInt(0);

//   while (a > BigInt(1)) {
//     let q = a / m;
//     let t = m;
//     m = a % m;
//     a = t;
//     t = y;
//     y = x - q * y;
//     x = t;
//   }

//   if (x < BigInt(0)) x += m0;
//   return x;
// }
function randomBigint(bits) {
  // Ensure bits is positive and greater than zero to avoid infinite loop
  if (bits <= 0) {
    throw new RangeError("Bit length must be greater than 0");
  }

  // Calculate the number of hexadecimal digits needed
  const hexDigits = Math.ceil(bits / 4);

  // The first hex digit must be between 8 and F (inclusive) to ensure the MSB is set
  const firstDigit = (8 + Math.floor(Math.random() * 8)).toString(16);

  // Generate the remaining hex digits randomly
  const remainingDigits = Array(hexDigits - 1)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

  // Combine, convert to BigInt, and return
  return BigInt(`0x${firstDigit}${remainingDigits}`);
}
function getRandomBigIntegerInRange(min, max) {
  const range = max - min + 1n;
  // Determine the number of bits needed for the range
  const bitsNeeded = range.toString(2).length;
  // Generate a random bigint within the calculated bits
  let num = randomBigint(bitsNeeded);
  // Adjust the number to the range
  num = num % range;
  // Add the minimum to align with the desired range
  return min + num;
}
/**
 * Returns a random BigInt uniformly in the range [0, max).
 */
function randomBigInt(max) {
  const numBytes = Math.ceil(max.toString(2).length / 8);
  let randomValue;
  do {
    const randomBuffer = crypto.randomBytes(numBytes);
    randomValue = BigInt("0x" + randomBuffer.toString("hex"));
  } while (randomValue >= max);
  return randomValue;
}

// --- Data Structures ---

// --- Zero-Knowledge Proof for "Encryption of 1" ---
function encryptShowRandom(secret, publicKey, prime, generator) {
  if (secret >= Number(prime)) {
    throw new Error("Message is too large for direct encryption");
  }
  const randomNumber = getRandomBigIntegerInRange(1n, prime - 1n);

  const c1 = modPow(generator, randomNumber, prime);
  const messageBigInt = BigInt(secret);
  const c2 = (modPow(publicKey, randomNumber, prime) * messageBigInt) % prime;

  return { encryptedMessage: { c1, c2 }, randomNumber };
}
/**
 * Generates a Chaum–Pedersen proof that the operator multiplied the user ciphertext
 * by an encryption of 1. That is, given:
 *    E = (E1, E2)   // User submission
 *    R = (R1, R2)   // Result = E × Enc(1) = (E1 * g^(r1), E2 * y^(r1))
 *
 * the operator (who knows r1) shows that
 *    A = R1 / E1 = g^(r1)   and   B = R2 / E2 = y^(r1)
 *
 * without revealing r1.
 *
 * @param userSubmission - The user’s ciphertext E.
 * @param cipherProduct - The resulting ciphertext R.
 * @param r1 - The randomness used in the encryption of 1.
 * @param g - The group generator.
 * @param y - The public key (y = g^x mod p).
 * @param p - The prime modulus.
 *
 * @returns A proof object containing (T1, T2, c, s).
 */
function generateEncryptionOfOneProof(
  userSubmission,
  cipherProduct,
  r1,
  g,
  y,
  p
) {
  // Compute the ratios A and B.
  const A = (cipherProduct.c1 * modInv(userSubmission.c1, p)) % p;
  const B = (cipherProduct.c2 * modInv(userSubmission.c2, p)) % p;

  // We know A = g^(r1) and B = y^(r1).
  // Generate a proof of knowledge for r1 using Chaum–Pedersen.
  const t = randomBigInt(p - BigInt(1)); // random nonce in Z_{p-1}
  const T1 = modExp(g, t, p);
  const T2 = modExp(y, t, p);

  // In an interactive protocol, the verifier would supply a challenge.
  // Here we simulate it by choosing a random challenge.
  const c = randomBigInt(p - BigInt(1));

  // Compute the response s = t + c * r1 (mod p-1)
  const s = (t + c * r1) % (p - BigInt(1));

  return { T1, T2, c, s };
}

/**
 * Verifies the Chaum–Pedersen proof that the ratio between the cipherProduct and userSubmission
 * is an encryption of 1.
 *
 * @param userSubmission - The user’s ciphertext E.
 * @param cipherProduct - The result ciphertext R.
 * @param proof - The proof object containing T1, T2, c, and s.
 * @param g - The group generator.
 * @param y - The public key.
 * @param p - The prime modulus.
 *
 * @returns true if the proof is valid, false otherwise.
 */
function verifyEncryptionOfOneProof(
  userSubmission,
  cipherProduct,
  proof,
  g,
  y,
  p
) {
  // Recompute A and B:
  const A = (cipherProduct.c1 * modInv(userSubmission.c1, p)) % p;
  const B = (cipherProduct.c2 * modInv(userSubmission.c2, p)) % p;

  // The verifier checks:
  //   g^s ?= T1 * A^c  (mod p)
  //   y^s ?= T2 * B^c  (mod p)
  const lhs1 = modExp(g, proof.s, p);
  const rhs1 = (proof.T1 * modExp(A, proof.c, p)) % p;
  const lhs2 = modExp(y, proof.s, p);
  const rhs2 = (proof.T2 * modExp(B, proof.c, p)) % p;

  return lhs1 === rhs1 && lhs2 === rhs2;
}

// --- Example Integration in Your Express Router ---

// (Assuming you already have group parameters, e.g., from the contract or config.)

// In your router.post("/execute") handler, after computing the cipherProduct:
// async function proveAndVerifyExample(
//   userSubmission,
//   cipherProduct,
//   r1 // the randomness used in encrypting 1
// ) {
//   // Operator generates a proof that cipherProduct = userSubmission × Enc(1)
//   const proof = generateEncryptionOfOneProof(
//     userSubmission,
//     cipherProduct,
//     r1,
//     g,
//     y,
//     p
//   );
//   console.log("Generated proof:", proof);

//   // Later, the validator can verify this proof:
//   const valid = verifyEncryptionOfOneProof(
//     userSubmission,
//     cipherProduct,
//     proof,
//     g,
//     y,
//     p
//   );
//   console.log("Proof valid?", valid);
//   return valid;
// }

/*
  In your actual router code the operator would send the proof (or commit to it)
  along with the updated vote (cipherProduct). The validator, who already knows the
  user submission and the public parameters (g, y, p), can run verifyEncryptionOfOneProof
  to be convinced that the multiplication was done correctly (i.e. that an encryption of 1
  was multiplied in).
*/

// For demonstration purposes, suppose we have:
// const exampleUserSubmission = {
//   c1: BigInt("12345678901234567890"), // placeholder
//   c2: BigInt("98765432109876543210"),
// };

// const encryptionOfOne = {
//   c1: modExp(g, BigInt(1234), p), // imagine r1 = 1234 (for example)
//   c2: modExp(y, BigInt(1234), p),
// };

// // The operator multiplies the ciphertexts componentwise:
// const exampleCipherProduct = {
//   c1: (exampleUserSubmission.c1 * encryptionOfOne.c1) % p,
//   c2: (exampleUserSubmission.c2 * encryptionOfOne.c2) % p,
// };

// // Now generate and verify the proof (in practice r1 remains secret and only the proof is revealed)
// proveAndVerifyExample(exampleUserSubmission, exampleCipherProduct, BigInt(1234))
//   .then((valid) => {
//     if (valid) {
//       console.log("Validator is convinced: the multiplication is correct.");
//     } else {
//       console.log("Proof verification failed.");
//     }
//   })
//   .catch((error) => {
//     console.error("Error during proof generation/verification:", error);
//   });
module.exports = {
  encryptShowRandom,
  generateEncryptionOfOneProof,
  verifyEncryptionOfOneProof,
};
