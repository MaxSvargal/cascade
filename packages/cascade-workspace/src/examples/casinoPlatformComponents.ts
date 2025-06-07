export const casinoPlatformComponentSchemas = {
  // --- Global Schema Definitions (for $ref, from stdlib.yml.md) ---
  "definitions": {
    "schemas": {
      "StandardErrorStructure": {
        $id: "#/definitions/schemas/StandardErrorStructure",
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Category.ComponentName.SpecificErrorType (e.g., 'HttpCall.TimeoutError', 'AdapterError')"
          },
          message: {
            type: "string",
            description: "Human-readable error message."
          },
          code: {
            type: "string",
            description: "Optional internal/external code (e.g., HTTP status code)."
          },
          details: {
            type: ["object", "null"],
            description: "Optional, component-specific non-sensitive details.",
            additionalProperties: true
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "ISO 8601 timestamp (added by Core)."
          }
        },
        required: ["type", "message", "timestamp"]
      },
      "HttpResponse": {
        $id: "#/definitions/schemas/HttpResponse",
        type: "object",
        properties: {
          statusCode: { type: "integer" },
          headers: {
            type: "object",
            additionalProperties: { type: "string" }
          },
          body: {
            description: "Response body. Object if JSON, otherwise string (Base64 for binary).",
            oneOf: [
              { type: "object", additionalProperties: true },
              { type: "array" },
              { type: "string" },
              { type: "null" }
            ]
          }
        },
        required: ["statusCode", "headers"]
      },
      "ScheduledTriggerPayload": {
        $id: "#/definitions/schemas/ScheduledTriggerPayload",
        type: "object",
        properties: {
          triggerTime: {
            type: "string",
            format: "date-time",
            description: "Actual ISO 8601 timestamp when the trigger fired."
          },
          scheduledTime: {
            type: "string",
            format: "date-time",
            description: "ISO 8601 timestamp for which the execution was scheduled."
          },
          payload: {
            description: "The initialPayload configured for the trigger, if any."
          }
        },
        required: ["triggerTime", "scheduledTime"]
      },
      "StreamTriggerMessage": {
        $id: "#/definitions/schemas/StreamTriggerMessage",
        type: "object",
        properties: {
          message: {
            description: "Consumed message payload, processed according to StreamIngestor's outputFormat."
          },
          metadata: {
            type: "object",
            description: "Source-specific metadata (e.g., Kafka offset, SQS receiptHandle). Structure per plugin. For Manual ack."
          }
        },
        required: ["message"]
      },
      "StreamTriggerBatch": {
        $id: "#/definitions/schemas/StreamTriggerBatch",
        type: "object",
        properties: {
          messages: {
            type: "array",
            items: { $ref: "#/definitions/schemas/StreamTriggerMessage/properties/message" }
          },
          metadataList: {
            type: "array",
            items: { $ref: "#/definitions/schemas/StreamTriggerMessage/properties/metadata" }
          }
        },
        required: ["messages"]
      },
      "EventBusTriggerPayload": {
        $id: "#/definitions/schemas/EventBusTriggerPayload",
        type: "object",
        properties: {
          event: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique ID of the event." },
              type: { type: "string", description: "Type of the event (e.g., 'user.created')." },
              source: { type: "string", description: "Originator of the event." },
              timestamp: { type: "string", format: "date-time", description: "ISO 8601 timestamp of event creation." },
              payload: { description: "The actual event data." }
            },
            required: ["id", "type", "source", "timestamp", "payload"]
          }
        },
        required: ["event"]
      },
      "ManualTriggerPayload": {
        $id: "#/definitions/schemas/ManualTriggerPayload",
        type: "object",
        properties: {
          initialData: {
            description: "The data payload provided when the flow is manually triggered. Structure is defined by the invoker."
          }
        },
        required: ["initialData"]
      }
    }
  },

  // --- Trigger Schemas ---
  'StdLib.Trigger:Http': {
    fqn: 'StdLib.Trigger:Http',
    configSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "HTTP path prefix for this trigger (e.g., '/api/v1/orders'). Must be unique.",
          pattern: "^/",
          default: "/api/users/onboard",
          examples: ["/api/v1/orders", "/webhooks/payment", "/api/users/onboard"]
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
          description: "HTTP method to listen for.",
          default: "POST"
        },
        authentication: {
          type: "object",
          description: "Configuration for authentication middleware (e.g., API Key, JWT). Processed by Core before triggering.",
          additionalProperties: true,
          default: {
            type: "JwtValidator",
            secretName: "jwt-secret"
          },
          example: {
            type: "JwtValidator",
            secretName: "casino-jwt-secret",
            issuer: "https://auth.casino.com",
            audience: "casino-api",
            algorithms: ["HS256", "RS256"]
          }
        },
        requestSchema: {
          type: "object",
          description: "Optional JSON Schema to validate the incoming request body (if applicable for method). Rejection occurs before flow trigger.",
          default: {
            type: "object",
            properties: {
              data: { type: "object" }
            }
          },
          example: {
            type: "object",
            properties: {
              email: { type: "string", format: "email" },
              firstName: { type: "string", minLength: 1 },
              lastName: { type: "string", minLength: 1 },
              dateOfBirth: { type: "string", format: "date" },
              country: { type: "string", pattern: "^[A-Z]{2}$" },
              phoneNumber: { type: "string" },
              preferredLanguage: { type: "string", enum: ["en", "es", "fr", "de"] },
              marketingConsent: { type: "boolean" },
              referralCode: { type: "string" }
            },
            required: ["email", "firstName", "lastName", "dateOfBirth", "country"]
          }
        },
        responseConfig: {
          type: "object",
          description: "Configuration for mapping flow completion/error to HTTP response. Handled by Core.",
          properties: {
            successStatusCode: {
              type: "integer",
              default: 200,
              description: "HTTP status code for successful flow completion."
            },
            errorStatusCode: {
              type: "integer",
              default: 400,
              description: "Default HTTP status code if flow fails or an unhandled error occurs."
            },
            successBodyExpression: { type: "string", description: "JMESPath/JsonPointer expression evaluated against flow's final output data to form the success response body." },
            errorBodyExpression: { type: "string", description: "JMESPath/JsonPointer expression evaluated against flow's error object to form the error response body."}
          },
          additionalProperties: true,
          default: {
            successStatusCode: 201,
            errorStatusCode: 400
          },
          example: {
            successStatusCode: 201,
            errorStatusCode: 400,
            successBodyExpression: "{ userId: finalContext.userId, status: 'created', kycStatus: finalContext.kycStatus }",
            errorBodyExpression: "{ error: error.message, code: error.code, timestamp: error.timestamp }"
          }
        },
        timeoutMs: {
          type: "integer",
          minimum: 1,
          default: 30000,
          description: "Maximum time Core will wait for the flow to complete for a synchronous HTTP response."
        }
      },
      required: ["path", "method"]
    },
    inputSchema: {
      type: "object",
      description: "HTTP trigger input schema - defines the structure of external HTTP request event data",
      properties: {
        url: { 
          type: "string", 
          description: "Full request URL including query parameters.",
          example: "https://api.casino.com/api/users/onboard?source=web&campaign=summer2024"
        },
        method: { 
          type: "string", 
          description: "HTTP method from the request.",
          example: "POST"
        },
        headers: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "HTTP headers from the request.",
          example: {
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "X-Forwarded-For": "203.0.113.195",
            "X-Request-ID": "req-12345-abcde",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9"
          }
        },
        queryParameters: {
          type: "object",
          additionalProperties: { 
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } }
            ]
          },
          description: "Query parameters from the request URL.",
          example: {
            "source": "web",
            "campaign": "summer2024",
            "utm_source": "google",
            "utm_medium": "cpc"
          }
        },
        body: {
          description: "Raw request body as received. Could be string, buffer, or parsed JSON.",
          oneOf: [
            { type: "object", additionalProperties: true },
            { type: "array" },
            { type: "string" },
            { type: "null" }
          ],
          example: {
            "email": "john.doe@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "dateOfBirth": "1990-05-15",
            "country": "US",
            "phoneNumber": "+1-555-123-4567",
            "preferredLanguage": "en",
            "marketingConsent": true,
            "referralCode": "FRIEND123"
          }
        },
        remoteAddress: {
          type: "string",
          description: "IP address of the client making the request.",
          example: "203.0.113.195"
        },
        userAgent: {
          type: "string", 
          description: "User agent string from the request.",
          example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        timestamp: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 timestamp when the request was received.",
          example: "2024-01-15T14:30:45.123Z"
        },
        principal: {
          type: ["object", "null"],
          description: "Authenticated principal details, if applicable.",
          properties: {
            id: { type: "string" },
            type: { type: "string", description: "e.g., 'user', 'apiKey', 'service_account'" },
            claims: { type: "object", additionalProperties: true, description: "Additional claims/attributes from token/auth provider." }
          },
          required: ["id", "type"],
          example: {
            "id": "user-12345",
            "type": "user",
            "claims": {
              "email": "john.doe@example.com",
              "role": "customer",
              "tier": "bronze",
              "verified": true,
              "iat": 1642248645,
              "exp": 1642252245
            }
          }
        }
      },
      required: ["url", "method", "headers", "remoteAddress", "timestamp"]
    },
    outputSchema: {
      type: "object",
      description: "HTTP trigger output schema - standardized format provided to flow steps (derived from input event + config)",
      properties: {
        path: { 
          type: "string", 
          description: "Parsed request path (extracted from URL).",
          example: "/api/users/onboard"
        },
        method: { 
          type: "string", 
          description: "HTTP method (normalized to uppercase).",
          example: "POST"
        },
        headers: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Processed request headers (normalized keys, filtered).",
          example: {
            "content-type": "application/json",
            "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "x-forwarded-for": "203.0.113.195",
            "x-request-id": "req-12345-abcde",
            "accept": "application/json"
          }
        },
        queryParameters: {
          type: "object",
          additionalProperties: { 
            oneOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } }
            ]
          },
          description: "Parsed query parameters from URL.",
          example: {
            "source": "web",
            "campaign": "summer2024",
            "utm_source": "google",
            "utm_medium": "cpc"
          }
        },
        body: {
          description: "Processed request body. Parsed JSON if applicable, validated against requestSchema if configured. Derived from input data.",
          oneOf: [
            { type: "object", additionalProperties: true },
            { type: "array" },
            { type: "string" },
            { type: "null" }
          ],
          example: {
            "email": "john.doe@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "dateOfBirth": "1990-05-15",
            "country": "US",
            "phoneNumber": "+1-555-123-4567",
            "preferredLanguage": "en",
            "marketingConsent": true,
            "referralCode": "FRIEND123"
          }
        },
        remoteAddress: {
          type: "string",
          description: "IP address of the client making the request.",
          example: "203.0.113.195"
        },
        userAgent: {
          type: "string",
          description: "User agent string from the request.",
          example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        timestamp: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 timestamp when the request was received.",
          example: "2024-01-15T14:30:45.123Z"
        },
        principal: {
          type: ["object", "null"],
          description: "Authenticated principal details (added by authentication middleware if configured).",
          properties: {
            id: { type: "string" },
            type: { type: "string", description: "e.g., 'user', 'apiKey', 'service_account'" },
            claims: { type: "object", additionalProperties: true, description: "Additional claims/attributes from token/auth provider." }
          },
          required: ["id", "type"],
          example: {
            "id": "user-12345",
            "type": "user",
            "claims": {
              "email": "john.doe@example.com",
              "role": "customer",
              "tier": "bronze",
              "verified": true,
              "iat": 1642248645,
              "exp": 1642252245
            }
          }
        }
      },
      required: ["path", "method", "headers", "remoteAddress", "timestamp"],
      example: {
        path: "/api/users/onboard",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "x-forwarded-for": "203.0.113.195",
          "x-request-id": "req-12345-abcde",
          "accept": "application/json"
        },
        queryParameters: {
          "source": "web",
          "campaign": "summer2024",
          "utm_source": "google",
          "utm_medium": "cpc"
        },
        body: {
          "email": "john.doe@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "dateOfBirth": "1990-05-15",
          "country": "US",
          "phoneNumber": "+1-555-123-4567",
          "preferredLanguage": "en",
          "marketingConsent": true,
          "referralCode": "FRIEND123"
        },
        remoteAddress: "203.0.113.195",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        timestamp: "2024-01-15T14:30:45.123Z",
        principal: {
          "id": "user-12345",
          "type": "user",
          "claims": {
            "email": "john.doe@example.com",
            "role": "customer",
            "tier": "bronze",
            "verified": true,
            "iat": 1642248645,
            "exp": 1642252245
          }
        }
      }
    }
  },
  'StdLib.Trigger:EventBus': {
    fqn: 'StdLib.Trigger:EventBus',
    configSchema: {
      type: "object",
      properties: {
        eventTypePattern: {
          type: "string",
          description: "Pattern to match event types (e.g., 'user.created', 'order.*.processed'). Core defines pattern syntax.",
          default: "user.*",
          examples: ["user.created", "order.*.processed", "payment.completed"]
        },
        filterExpression: {
          type: "string",
          description: "Optional expression (e.g., JMESPath) evaluated against the event's payload to further filter events.",
          default: "payload.userId != null",
          examples: ["payload.amount > 100", "payload.status == 'active'"]
        },
        filterLanguage: {
          type: "string",
          enum: ["JMESPath", "JsonPointer"],
          default: "JMESPath"
        }
      },
      required: ["eventTypePattern"]
    },
    inputSchema: {
      type: "object",
      description: "EventBus trigger input schema - defines the structure of external event data",
      properties: {
        event: {
          type: "object",
          description: "The external event that triggered the flow",
          properties: {
            id: { type: "string", description: "Unique ID of the event" },
            type: { type: "string", description: "Type of the event" },
            source: { type: "string", description: "Originator of the event" },
            timestamp: { type: "string", format: "date-time", description: "ISO 8601 timestamp of event creation" },
            payload: { description: "The actual event data" }
          },
          required: ["id", "type", "source", "timestamp", "payload"]
        }
      },
      required: ["event"],
      example: {
        event: {
          id: "event-abc123def456",
          type: "user.deposit.completed",
          source: "payment-service",
          timestamp: "2024-01-15T14:30:45.123Z",
          payload: {
            userId: "user-12345",
            amount: 100.00,
            currency: "USD",
            transactionId: "txn-abc123",
            paymentMethod: "credit_card",
            processingTime: 2340
          }
        }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        event: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique ID of the event." },
            type: { type: "string", description: "Type of the event (e.g., 'user.created')." },
            source: { type: "string", description: "Originator of the event." },
            timestamp: { type: "string", format: "date-time", description: "ISO 8601 timestamp of event creation." },
            payload: { description: "The actual event data." }
          },
          required: ["id", "type", "source", "timestamp", "payload"]
        }
      },
      required: ["event"],
      example: {
        event: {
          id: "event-abc123def456",
          type: "user.deposit.completed",
          source: "payment-service",
          timestamp: "2024-01-15T14:30:45.123Z",
          payload: {
            userId: "user-12345",
            amount: 100.00,
            currency: "USD",
            transactionId: "txn-abc123",
            paymentMethod: "credit_card",
            processingTime: 2340
          }
        }
      }
    }
  },
  'StdLib:Manual': {
    fqn: 'StdLib:Manual',
    configSchema: {
      type: "object",
      description: "Configuration for manual trigger - defines the expected structure of initialData",
      properties: {
        initialDataSchema: {
          type: "object",
          description: "JSON Schema defining the structure of initialData that will be provided when manually triggering the flow",
          default: {
            type: "object",
            properties: {
              data: { type: "object" }
            }
          },
          example: {
            type: "object",
            properties: {
              userId: { type: "string", description: "User ID for manual flow execution" },
              action: { type: "string", enum: ["test", "retry", "manual_review"] },
              parameters: { type: "object", additionalProperties: true },
              reason: { type: "string", description: "Reason for manual execution" }
            },
            required: ["userId", "action"]
          }
        },
        description: {
          type: "string",
          description: "Human-readable description of what this manual trigger expects",
          default: "Manual trigger for flow execution",
          example: "Manual trigger for user onboarding flow - used for testing and manual review processes"
        }
      }
    },
    inputSchema: {
      type: "object",
      description: "Manual trigger input schema - defines the structure of external manual trigger event data",
      properties: {
        initialData: {
          type: "object",
          description: "The data payload provided when the flow is manually triggered",
          properties: {
            userId: { type: "string", description: "User ID for manual flow execution" },
            action: { type: "string", description: "Action being performed" },
            parameters: { type: "object", additionalProperties: true, description: "Additional parameters" },
            reason: { type: "string", description: "Reason for manual execution" },
            triggeredBy: { type: "string", description: "ID of user who triggered the flow" },
            timestamp: { type: "string", format: "date-time", description: "When the manual trigger was initiated" }
          },
          required: ["userId", "action"]
        }
      },
      required: ["initialData"],
      example: {
        initialData: {
          userId: "user-12345",
          action: "retry_kyc_verification",
          parameters: {
            skipDocumentUpload: false,
            forceManualReview: true,
            region: "US",
            tier: "bronze"
          },
          reason: "Customer requested KYC retry after document update",
          triggeredBy: "admin-user-789",
          timestamp: "2024-01-15T14:30:45.123Z"
        }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        initialData: {
          description: "The data payload provided when the flow is manually triggered. Structure is defined by the invoker.",
          example: {
            userId: "user-12345",
            action: "test",
            parameters: {
              skipKyc: false,
              testMode: true,
              region: "US"
            },
            reason: "Testing new onboarding flow with real user data",
            triggeredBy: "admin-user-789",
            timestamp: "2024-01-15T14:30:45.123Z"
          }
        }
      },
      required: ["initialData"]
    }
  },
  'StdLib.Trigger:Scheduled': {
    fqn: 'StdLib.Trigger:Scheduled',
    configSchema: {
      type: "object",
      properties: {
        cronExpression: {
          type: "string",
          description: "Cron expression defining when the trigger should fire",
          default: "0 0 * * *",
          examples: ["0 0 * * *", "*/5 * * * *", "0 9 * * MON-FRI"]
        },
        timezone: {
          type: "string",
          description: "Timezone for the cron expression",
          default: "UTC",
          examples: ["UTC", "America/New_York", "Europe/London"]
        },
        initialPayload: {
          type: "object",
          description: "Optional payload to include with each scheduled trigger",
          default: {}
        }
      },
      required: ["cronExpression"]
    },
    inputSchema: {
      type: "object",
      description: "Scheduled trigger input schema - defines the structure of external scheduled event data",
      properties: {
        triggerTime: {
          type: "string",
          format: "date-time",
          description: "Actual ISO 8601 timestamp when the trigger fired"
        },
        scheduledTime: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 timestamp for which the execution was scheduled"
        },
        payload: {
          type: "object",
          description: "The payload data for this scheduled execution",
          additionalProperties: true
        }
      },
      required: ["triggerTime", "scheduledTime"],
      example: {
        triggerTime: "2024-01-15T09:00:02.123Z",
        scheduledTime: "2024-01-15T09:00:00.000Z",
        payload: {
          jobType: "daily_report",
          reportDate: "2024-01-15",
          parameters: {
            includeAnalytics: true,
            format: "pdf",
            recipients: ["admin@casino.com", "reports@casino.com"]
          }
        }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        triggerTime: {
          type: "string",
          format: "date-time",
          description: "Actual ISO 8601 timestamp when the trigger fired. Derived from input or current time."
        },
        scheduledTime: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 timestamp for which the execution was scheduled. Derived from input or current time."
        },
        payload: {
          description: "The initialPayload configured for the trigger, derived from input data."
        }
      },
      required: ["triggerTime", "scheduledTime"],
      example: {
        triggerTime: "2024-01-15T09:00:02.123Z",
        scheduledTime: "2024-01-15T09:00:00.000Z",
        payload: {
          jobType: "daily_report",
          reportDate: "2024-01-15",
          parameters: {
            includeAnalytics: true,
            format: "pdf",
            recipients: ["admin@casino.com", "reports@casino.com"]
          }
        }
      }
    }
  },

  // --- StdLib Core Components ---
  'StdLib:JsonSchemaValidator': {
    fqn: 'StdLib:JsonSchemaValidator',
    configSchema: {
      type: "object",
      properties: {
        schema: { type: "object", description: "JSON Schema object for validation (inline or $ref if Core supports)." }
      },
      required: ["schema"]
    },
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Input data to validate." }
      },
      required: ["data"]
    },
    outputSchema: {
      type: "object",
      properties: {
        validData: {
          description: "Original input 'data' if it conforms to schema."
        },
        error: {
          type: "object",
          description: "Validation error if data does not conform to schema.",
          properties: {
            type: {
              type: "string",
              description: "Category.ComponentName.SpecificErrorType (e.g., 'HttpCall.TimeoutError', 'AdapterError')"
            },
            message: {
              type: "string",
              description: "Human-readable error message."
            },
            code: {
              type: "string",
              description: "Optional internal/external code (e.g., HTTP status code)."
            },
            details: {
              type: ["object", "null"],
              description: "Optional, component-specific non-sensitive details.",
              additionalProperties: true
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "ISO 8601 timestamp (added by Core)."
            }
          },
          required: ["type", "message", "timestamp"]
        }
      }
    }
  },
  'StdLib:FailFlow': {
    fqn: 'StdLib:FailFlow',
    configSchema: {
      type: "object",
      properties: {
        errorMessageExpression: { type: "string", description: "Expression for error message (sandboxed)." },
        language: { type: "string", enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      },
      required: ["errorMessageExpression"]
    },
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Context data for errorMessageExpression." }
      }
    },
    outputSchema: null // Terminates flow, no output ports
  },
  'StdLib:Fork': {
    fqn: 'StdLib:Fork',
    configSchema: {
      type: "object",
      properties: {
        outputNames: {
          type: "array",
          items: { type: "string" },
          description: "List of names for output ports.",
          default: ["output1", "output2"],
          examples: [
            ["branch1", "branch2"],
            ["for_processing", "for_audit"],
            ["primary", "secondary", "backup"]
          ]
        }
      },
      required: ["outputNames"]
    },
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Input data to duplicate." }
      },
      required: ["data"]
    },
    outputSchema: {
      type: "object",
      description: "Dynamic output ports matching outputNames config. Each port emits a copy of input data.",
      additionalProperties: {
        description: "Copy of input data, available on dynamically named output ports."
      }
    }
  },
  'StdLib:HttpCall': {
    fqn: 'StdLib:HttpCall',
    configSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Target URL (sandboxed if expression)." },
        method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], default: "GET" },
        headers: {
          oneOf: [{type: "object"}, {type: "string"}],
          description: "Request headers. Values support {{secrets.my_secret}}. Sandboxed if expression."
        },
        bodyExpression: { type: "string", description: "Expression for request body (sandboxed). If omitted, input 'data' used." },
        bodyLanguage: { type: "string", enum: ["JMESPath", "JsonPointer"], default: "JMESPath" },
        contentType: { type: "string", default: "application/json", description: "Content-Type header for request body." },
        queryParameters: {
           oneOf: [{type: "object"}, {type: "string"}],
           description: "URL query parameters. Sandboxed if expression."
        },
        timeoutMs: { type: "integer", minimum: 1, default: 5000, description: "Request timeout in ms." },
        followRedirects: { type: "boolean", default: false, description: "Whether to follow HTTP 3xx redirects." }
      },
      required: ["url"]
    },
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Context for expressions and default request body." }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        response: {
          type: "object",
          properties: {
            statusCode: { type: "integer" },
            headers: {
              type: "object",
              additionalProperties: { type: "string" }
            },
            body: {
              description: "Response body. Object if JSON, otherwise string (Base64 for binary).",
              oneOf: [
                { type: "object", additionalProperties: true },
                { type: "array" },
                { type: "string" },
                { type: "null" }
              ]
            }
          },
          required: ["statusCode", "headers"]
        },
        error: {
          description: "HTTP call error (timeout, network, etc.)",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  },
  'StdLib:MapData': {
    fqn: 'StdLib:MapData',
    configSchema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Transformation expression (sandboxed)." },
        language: { type: "string", enum: ["JMESPath", "JsonPointer"], default: "JMESPath", description: "Expression language." }
      },
      required: ["expression"]
    },
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Input data to transform." }
      },
      required: ["data"]
    },
    outputSchema: {
      type: "object",
      properties: {
        result: {
          description: "Transformed data."
        },
        error: {
          description: "Error if expression is invalid or evaluation fails.",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  },
  'StdLib:SubFlowInvoker': {
    fqn: 'StdLib:SubFlowInvoker',
    configSchema: {
      type: "object",
      properties: {
        flowName: { 
          type: "string", 
          description: "Target Flow definition name. Sandboxed if expression.",
          default: "ExampleSubFlow",
          examples: ["ProcessPaymentFlow", "ValidateUserFlow", "SendNotificationFlow"]
        },
        waitForCompletion: { type: "boolean", default: false, description: "Pause and wait for sub-flow completion?" },
        timeoutMs: { 
          type: "integer", 
          minimum: 1, 
          description: "Max wait time if waitForCompletion=true.",
          default: 30000
        },
        parametersLanguage: { type: "string", enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      },
      required: ["flowName"]
    },
    inputSchema: {
      type: "object",
      properties: {
        initialData: { description: "Initial trigger data for sub-flow." },
        contextData: { description: "Context for flowName expression evaluation." }
      },
      required: ["initialData"]
    },
    outputSchema: {
      type: "object",
      properties: {
        result: {
          description: "Final output from sub-flow's success (if waitForCompletion=true & success) or sub-flow instance ID."
        },
        error: {
          description: "Error from sub-flow execution.",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  },
  'StdLib:Switch': {
    fqn: 'StdLib:Switch',
    configSchema: {
      type: "object",
      properties: {
        cases: {
          type: "array",
          description: "List defining conditions and output port names.",
          items: {
            type: "object",
            properties: {
              conditionExpression: { type: "string", description: "Boolean expression (sandboxed)." },
              language: { type: "string", enum: ["JMESPath", "JsonPointer"], default: "JMESPath" },
              outputName: { type: "string", description: "Target output port name." }
            },
            required: ["conditionExpression", "outputName"]
          }
        },
        defaultOutputName: { type: "string", default: "defaultOutput", description: "Output port if no cases match." }
      },
      required: ["cases"]
    },
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Input data for condition evaluation." }
      },
      required: ["data"]
    },
    outputSchema: {
      type: "object",
      description: "Dynamic output ports matching outputName from cases and defaultOutputName. Each port emits input data if condition matched.",
      additionalProperties: {
        description: "Input data, available on dynamically named output port that matched."
      },
      properties: {
        error: {
          description: "Error if any conditionExpression is invalid or evaluation fails.",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  },
  'StdLib:FilterData': {
    fqn: 'StdLib:FilterData',
    configSchema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Boolean expression (sandboxed)." },
        language: { type: "string", enum: ["JMESPath", "JsonPointer"], default: "JMESPath", description: "Expression language." },
        matchOutput: { type: "string", default: "matchOutput", description: "Output port name for true evaluation." },
        noMatchOutput: { type: "string", default: "noMatchOutput", description: "Output port name for false evaluation." }
      },
      required: ["expression"]
    },
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Input data to filter." }
      },
      required: ["data"]
    },
    outputSchema: {
      type: "object",
      description: "Dynamic output ports matching matchOutput and noMatchOutput config. Emits input data on appropriate port.",
      additionalProperties: {
        description: "Input data, available on 'matchOutput' or 'noMatchOutput' port based on expression evaluation."
      },
      properties: {
        error: {
          description: "Error if expression is invalid or eval fails (non-boolean).",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  },
  'StdLib:MergeStreams': {
    fqn: 'StdLib:MergeStreams',
    configSchema: {
      type: "object",
      properties: {
        inputNames: {
          type: "array",
          items: { type: "string" },
          description: "List of input port names to merge."
        },
        mergedOutputName: { type: "string", default: "mergedOutput", description: "Single output port name." }
      },
      required: ["inputNames"]
    },
    inputSchema: {
      type: "object",
      description: "Dynamically defined input ports matching inputNames. Each port receives any data.",
      additionalProperties: {
        description: "Data from one of the input streams."
      }
    },
    outputSchema: {
      type: "object",
      description: "Single output port with name from mergedOutputName config.",
      additionalProperties: {
        description: "Data packet from one of the inputs, available on the 'mergedOutputName' port."
      }
    }
  },
  'StdLib:NoOp': {
    fqn: 'StdLib:NoOp',
    configSchema: null,
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Any input data." }
      },
      required: ["data"]
    },
    outputSchema: {
      type: "object",
      properties: {
        data: {
          description: "Input data, unchanged."
        }
      }
    }
  },
  'Integration.ExternalServiceAdapter': {
    fqn: 'Integration.ExternalServiceAdapter',
    configSchema: {
      type: "object",
      properties: {
        adapterType: { 
          type: "string", 
          description: "Adapter plugin identifier (e.g., KafkaAdapter, PostgresSqlAdapter).",
          default: "StdLibPlugin:PostgresAdapter",
          examples: ["StdLibPlugin:PostgresAdapter", "StdLibPlugin:KafkaAdapter", "StdLibPlugin:RedisAdapter"]
        },
        adapterConfig: { 
          type: "object", 
          description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets.",
          default: {
            connectionStringSecretName: "database-connection-string",
            timeoutMs: 5000
          },
          examples: [
            {
              connectionStringSecretName: "database-connection-string",
              timeoutMs: 5000
            },
            {
              brokers: ["kafka1:9092", "kafka2:9092"],
              clientId: "cascade-client"
            }
          ]
        },
        operation: { 
          type: "string", 
          description: "Logical action defined by plugin (e.g., GetUser, Publish, Query).",
          default: "QuerySingleRow",
          examples: ["QuerySingleRow", "ExecuteDML", "QueryMultipleRows", "Publish", "Subscribe"]
        }
      },
      required: ["adapterType", "adapterConfig", "operation"]
    },
    inputSchema: {
      type: "object",
      properties: {
        requestData: { description: "Data payload for the operation, per plugin definition." }
      },
      required: ["requestData"]
    },
    outputSchema: {
      type: "object",
      properties: {
        responseData: {
          description: "Parsed/structured data from external service via plugin, per operation."
        },
        error: {
          description: "Error from external service adapter.",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  },
  'Communication.SendEmail': {
    fqn: 'Communication.SendEmail',
    configSchema: {
      type: "object",
      properties: {
        serviceType: { type: "string", description: "Email service plugin ID (e.g., SendGridAdapter)." },
        serviceConfig: { type: "object", description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." },
        fromAddress: { type: "string", description: "'From' email address (sandboxed if expression)." },
        defaultFromName: { type: "string", description: "Default 'From' name." }
      },
      required: ["serviceType", "serviceConfig", "fromAddress"]
    },
    inputSchema: {
      type: "object",
      properties: {
        toAddresses: { description: "Recipients (sandboxed if expression).", oneOf: [{type: "string"}, {type: "array", items: {type: "string"}}]},
        ccAddresses: { description: "CC recipients (sandboxed if expression).", oneOf: [{type: "string"}, {type: "array", items: {type: "string"}}]},
        bccAddresses: { description: "BCC recipients (sandboxed if expression).", oneOf: [{type: "string"}, {type: "array", items: {type: "string"}}]},
        subject: { type: "string", description: "Email subject (sandboxed if expression)." },
        bodyHtml: { type: "string", description: "HTML email body (sandboxed if expression)." },
        bodyText: { type: "string", description: "Plain text email body (sandboxed if expression)." },
        templateId: { type: "string", description: "Service template ID (sandboxed if expression)." },
        templateData: { oneOf: [{type: "object"}, {type: "string"}], description: "Key-value data for template merge (sandboxed if expression)." },
        attachments: {
          type: "array",
          description: "List of attachments.",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              contentType: { type: "string" },
              content: { type: "string", description: "Base64 encoded content or expression yielding it." }
            },
            required: ["filename", "contentType", "content"]
          }
        },
        data: { type: "object", description: "Context for all expression inputs." }
      },
      required: ["toAddresses", "subject"]
    },
    outputSchema: {
      type: "object",
      properties: {
        result: {
          type: "object",
          properties: {
            messageId: { type: "string", description: "Optional: Provider's message ID." },
            status: { type: "string", enum: ["queued", "sent"], description: "Status from service API." }
          },
          required: ["status"]
        },
        error: {
          description: "Email sending error.",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  },
  'Communication.SendNotification': {
    fqn: 'Communication.SendNotification',
    configSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Target channel (sandboxed if expression)." },
        serviceType: { type: "string", description: "Specific service plugin ID for channel. Sandboxed if expression." },
        serviceConfig: { oneOf: [{type: "object"}, {type: "string"}], description: "Plugin/channel-specific config. Use Core Secrets. Sandboxed if expression." },
        templateId: { type: "string", description: "Template ID for service/channel (sandboxed if expression)." }
      },
      required: ["channel"]
    },
    inputSchema: {
      type: "object",
      properties: {
        recipient: { description: "Recipient ID (email, phone, token, webhook). Structure per channel. Sandboxed if expression." },
        message: { description: "Message content payload. Structure per channel. Sandboxed if expression." },
        data: { type: "object", description: "Context for all expression inputs." }
      },
      required: ["recipient", "message"]
    },
    outputSchema: {
      type: "object",
      properties: {
        result: {
          type: "object",
          properties: {
            deliveryId: { type: "string", description: "Optional: Provider's delivery/message ID." },
            status: { type: "string", description: "Status from service API (e.g., queued, sent)." }
          },
          required: ["status"]
        },
        error: {
          description: "Notification sending error.",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  },
  'Security.Authorize': {
    fqn: 'Security.Authorize',
    configSchema: {
      type: "object",
      properties: {
        policySourceType: { type: "string", description: "How decisions are made (e.g., 'Static', 'Opa', or PluginIdentifierString)." },
        policySourceConfig: { type: "object", description: "Config for policySourceType. Structure per type/plugin schema. Use Core Secrets." },
        inputDataExpression: { type: "string", description: "JMESPath to construct/transform input 'data' for policy eval (sandboxed)." }
      },
      required: ["policySourceType", "policySourceConfig"]
    },
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "object",
          description: "Context for auth decision (principal, action, resource)."
        }
      },
      required: ["data"]
    },
    outputSchema: {
      type: "object",
      properties: {
        authorized: {
          description: "Emits original input 'data' if granted."
        },
        error: {
          description: "Authorization error (denied, policy error, etc.)",
          schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        }
      }
    }
  }
};