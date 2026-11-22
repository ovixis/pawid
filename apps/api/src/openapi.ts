/** OpenAPI 3.1 description of the public API, served at /v1/openapi.json. */
export function openapi(base: string) {
  const err = { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } };
  return {
    openapi: "3.1.0",
    info: {
      title: "PawID API",
      version: "1.0.0",
      summary: "Verify PawID pet cards and read EU pet travel rules with official sources.",
      description: "Open source companion for the EU pet passport, by HosPet.eu. Not an official document. Read-only, no key. Fair use: about 120 requests a minute per IP. Rules data is CC BY 4.0 (cite \"PawID rules\").",
      license: { name: "Apache-2.0", identifier: "Apache-2.0" },
      contact: { name: "PawID", url: "https://github.com/ovixis/pawid" },
    },
    servers: [{ url: base }],
    paths: {
      "/v1/verify": {
        get: {
          operationId: "verifyPetCard",
          summary: "Verify a PawID code",
          description: "Checks the owner's signature and expiry. A valid card is declared by the owner, never verified by a vet (selfDeclared is always true).",
          parameters: [{ name: "token", in: "query", required: true, schema: { type: "string", maxLength: 4000 }, description: "The part after /v/ in a PawID link." }],
          responses: {
            "200": { description: "Valid", content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyOk" } } } },
            "400": { description: "Not valid", content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyFail" } } } },
            "429": err,
          },
        },
      },
      "/v1/rules": {
        get: {
          operationId: "getRules",
          summary: "EU base rules, or a country's rules",
          parameters: [{ name: "country", in: "query", required: false, schema: { type: "string", pattern: "^[A-Za-z]{2}$" }, description: "ISO 3166-1 alpha-2 destination." }],
          responses: { "200": { description: "Rules", content: { "application/json": { schema: { $ref: "#/components/schemas/Rules" } } } }, "400": err, "429": err },
        },
      },
      "/v1/countries": {
        get: { operationId: "listCountries", summary: "Countries with their own rules file", responses: { "200": { description: "List" }, "429": err } },
      },
      "/v1/revoke": {
        post: { operationId: "stopCode", summary: "Stop a code before it expires", description: "Body: { token, sig }. sig is the owner's Ed25519 signature (the key inside the token) over 'pawid-revoke:v1:' + the code's id (base64url of the first 16 bytes of SHA-256 of the signature part). Only a hash and the expiry are kept.", responses: { "200": { description: "Stopped" }, "400": err, "403": err, "429": err } },
      },
      "/v1/credential": {
        post: { operationId: "vetCredential", summary: "A vet confirmation as a W3C Verifiable Credential", description: "Body: { confirmation }. Returns a VC Data Model 2.0 credential with a Data Integrity proof (eddsa-jcs-2022), issuer did:web:pawid.hospet.eu. Nothing is stored.", responses: { "200": { description: "Credential" }, "400": err, "409": err, "429": err } },
      },
      "/v1/keys": {
        get: { operationId: "keys", summary: "Recognised confirmation issuers and their public keys", responses: { "200": { description: "Keys" } } },
      },
      "/mcp": {
        post: { operationId: "mcp", summary: "MCP server (Streamable HTTP, stateless JSON-RPC)", description: "Tools: verify_pet_card, get_pet_travel_rules, list_rule_countries.", responses: { "200": { description: "JSON-RPC response" } } },
      },
    },
    components: {
      schemas: {
        Error: { type: "object", properties: { error: { type: "string" } } },
        Card: {
          type: "object",
          required: ["name"],
          properties: {
            species: { enum: ["dog", "cat"] }, name: { type: "string" }, breed: { type: "string" }, sex: { enum: ["female", "male"] },
            weightKg: { type: "number" }, birthDate: { type: "string", format: "date" }, microchip: { type: "string", pattern: "^\\d{15}$" },
            chipDate: { type: "string", format: "date" }, passportNumber: { type: "string" }, homeCountry: { type: "string" },
            rabiesGivenOn: { type: "string", format: "date" }, rabiesValidUntil: { type: "string", format: "date" }, boosterInTime: { type: "boolean" },
            vetName: { type: "string" }, vetPhone: { type: "string" }, owner: { type: "string", description: "First name only." }, notes: { type: "string" },
          },
        },
        VerifyOk: {
          type: "object",
          properties: { ok: { const: true }, selfDeclared: { const: true }, keyId: { type: "string" }, payload: { allOf: [{ $ref: "#/components/schemas/Card" }, { type: "object", properties: { v: { enum: [1, 2] }, iat: { type: "integer" }, exp: { type: "integer" } } }] } },
        },
        VerifyFail: { type: "object", properties: { ok: { const: false }, reason: { enum: ["malformed", "bad_signature", "expired", "unsupported_version"] } } },
        Rules: {
          type: "object",
          properties: {
            country: { type: ["string", "null"] }, countryCovered: { type: "boolean" }, lastChecked: { type: "string", format: "date" }, disclaimer: { type: "string" },
            rules: { type: "array", items: { type: "object", properties: { id: { type: "string" }, text: { type: "string" }, status: { enum: ["verified", "needs_review"] }, todo: { type: "string" }, sources: { type: "array", items: { type: "string", format: "uri" } }, scope: { enum: ["eu", "country"] }, lastChecked: { type: "string", format: "date" } } } },
          },
        },
      },
    },
  };
}
