/**
 * Interface definition for Phase 3 Multi-Factor Authentication (MFA) Providers
 * Implementations (e.g., FIDO2, WebAuthn) will conform to this interface.
 */
export class IMfaProvider {
  /**
   * Generates a registration challenge for the user.
   * @param {string} userId
   * @returns {Promise<Object>} The registration options/challenge
   */
  async generateRegistrationOptions(userId) { throw new Error('Not implemented'); }

  /**
   * Verifies the registration response.
   * @param {string} userId
   * @param {Object} response
   * @returns {Promise<boolean>}
   */
  async verifyRegistrationResponse(userId, response) { throw new Error('Not implemented'); }

  /**
   * Generates an authentication challenge.
   * @param {string} userId
   * @returns {Promise<Object>} The authentication challenge
   */
  async generateAuthenticationOptions(userId) { throw new Error('Not implemented'); }

  /**
   * Verifies an authentication response (e.g. for reauthentication during approval).
   * @param {string} userId
   * @param {Object} response
   * @returns {Promise<boolean>}
   */
  async verifyAuthenticationResponse(userId, response) { throw new Error('Not implemented'); }
}
