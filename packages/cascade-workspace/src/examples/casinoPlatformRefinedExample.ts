// Casino Platform Example - Production-Ready Flows
// Demonstrates sophisticated DSL features: complex interconnected flows, user segmentation,
// responsible gambling, KYC verification, bonus systems, withdrawal processing, and comprehensive StdLib usage

/**
 * SOPHISTICATED CASINO PLATFORM EXAMPLE
 * =====================================
 * 
 * This example demonstrates a production-ready casino platform with sophisticated interconnected flows
 * that showcase the full power of the Cascade DSL and comprehensive StdLib component usage.
 * 
 * KEY SOPHISTICATED FEATURES:
 * 
 * 1. COMPLEX INTERCONNECTED FLOWS:
 *    - User onboarding triggers KYC, responsible gambling setup, and referral processing
 *    - Betting flows integrate with risk assessment, compliance, payments, and analytics
 *    - Deposit flows trigger bonus evaluation, tier upgrades, and fraud detection
 *    - Withdrawal flows include comprehensive validation and compliance checks
 * 
 * 2. USER SEGMENTATION & TIER MANAGEMENT:
 *    - Dynamic user tier classification (Standard, Bronze, Silver, Gold, Platinum)
 *    - Tier-based betting limits, bonus eligibility, and feature access
 *    - Automatic tier upgrades based on lifetime deposits
 *    - Personalized experiences based on user tier and behavior
 * 
 * 3. COMPREHENSIVE KYC VERIFICATION:
 *    - Multi-level KYC based on risk assessment (Basic, Standard, Enhanced)
 *    - Document verification with primary/secondary provider fallback
 *    - Biometric verification and address validation
 *    - Manual review workflows for edge cases
 * 
 * 4. RESPONSIBLE GAMBLING PROTECTION:
 *    - Behavioral pattern analysis (loss chasing, session length, spending velocity)
 *    - Dynamic limit enforcement (deposit, loss, session time, wager limits)
 *    - Intervention triggers with escalating support measures
 *    - Self-exclusion management with account restrictions
 * 
 * 5. SOPHISTICATED BONUS SYSTEM:
 *    - Referral bonuses with tier-based rewards
 *    - Deposit bonuses with eligibility checking
 *    - Tier upgrade bonuses and VIP rewards
 *    - Wagering requirement tracking and validation
 * 
 * 6. ADVANCED PAYMENT PROCESSING:
 *    - Multi-provider payment processing with fallbacks
 *    - Fraud detection with device fingerprinting and behavioral analysis
 *    - Withdrawal limits and compliance checks
 *    - Payment method validation and risk scoring
 * 
 * 7. COMPREHENSIVE STDLIB COMPONENT USAGE:
 *    - StdLib:Fork for parallel processing (fraud checks, document verification)
 *    - StdLib:Switch for complex routing and decision logic
 *    - StdLib:FilterData for validation and limit checking
 *    - StdLib:MapData for data transformation and calculation
 *    - StdLib:HttpCall for external service integration
 *    - StdLib:JsonSchemaValidator for input validation
 *    - StdLib:SubFlowInvoker for flow composition and reuse
 * 
 * 8. PRODUCTION-READY PATTERNS:
 *    - Comprehensive error handling and validation
 *    - Timeout and retry configurations
 *    - Security headers and authentication
 *    - Audit trails and compliance logging
 *    - Performance monitoring and analytics
 * 
 * 9. REGULATORY COMPLIANCE:
 *    - AML (Anti-Money Laundering) checks
 *    - Sanctions screening
 *    - Jurisdiction compliance validation
 *    - Risk scoring and manual review triggers
 * 
 * 10. ANALYTICS & MONITORING:
 *     - Real-time gameplay analytics
 *     - User behavior tracking
 *     - Risk assessment metrics
 *     - Performance monitoring
 * 
 * FLOW INTERCONNECTIONS:
 * - UserOnboardingFlow → KYC, Responsible Gambling, Referral Bonuses
 * - PlaceBetFlow → Risk Assessment, Compliance, Payments, Games, Analytics
 * - ProcessDepositFlow → Fraud Detection, Bonus Evaluation, Tier Upgrades
 * - KYC flows → Compliance reviews and user status updates
 * - Responsible Gambling → Intervention workflows and support resources
 * 
 * This example showcases how complex business logic can be elegantly expressed
 * using Cascade DSL while maintaining readability, maintainability, and scalability.
 */

/**
 * SOPHISTICATED CASINO PLATFORM EXAMPLE (REFINED)
 * ===============================================
 *
 * This example demonstrates a production-ready casino platform with sophisticated interconnected flows
 * that showcase the full power of the Cascade DSL and comprehensive StdLib component usage.
 *
 * KEY REFINEMENTS APPLIED:
 * 1. CORRECT StdLib:Fork USAGE: Forks now correctly use outputNames, with parallel tasks as separate downstream steps.
 * 2. StdLib.Trigger:* NAMESPACING: Triggers use StdLib.Trigger:Http and StdLib.Trigger:EventBus.
 * 3. StdLib:SubFlowInvoker CONFIG: Uses flowName and initialData for inputs.
 * 4. StdLib:Switch OUTPUT HANDLING: Demonstrates a pattern for consuming dynamic switch outputs.
 * 5. NAMED COMPONENTS: Increased use for HTTP calls and reusable patterns.
 * 6. CONFIGURATION BEST PRACTICES: Consistent use of context for timeouts and other configs.
 * 7. DATA FLOW: Inputs_map and run_after dependencies carefully reviewed.
 *
 * KEY SOPHISTICATED FEATURES RETAINED:
 * (List from original example remains valid)
 *
 * FLOW INTERCONNECTIONS:
 * (List from original example remains valid)
 *
 * This refined example showcases how complex business logic can be elegantly expressed
 * using Cascade DSL while maintaining readability, maintainability, and scalability,
 * and adhering closely to component specifications.
 */

import { DslModuleInput } from '@/models/cfv_models_generated'; // Assuming this path

export const casinoPlatformModules: DslModuleInput[] = [
  // Core Casino Module - Central orchestration and user management
  {
    fqn: 'com.casino.core',
    content: `
dsl_version: "1.0"
namespace: com.casino.core
imports:
  - namespace: com.casino.kyc
    as: kyc
  - namespace: com.casino.payments
    as: payments
  - namespace: com.casino.games
    as: games
  - namespace: com.casino.compliance
    as: compliance
  - namespace: com.casino.bonuses
    as: bonuses
  - namespace: com.casino.responsible
    as: responsible
  - namespace: com.casino.analytics
    as: analytics

definitions:
  context:
    # User Tier Thresholds
    - name: bronze-tier-threshold
      value: 1000
      type: number
    - name: silver-tier-threshold
      value: 10000
      type: number
    - name: gold-tier-threshold
      value: 50000
      type: number
    - name: platinum-tier-threshold
      value: 250000
      type: number

    # Betting Limits by Tier
    - name: bronze-max-bet
      value: 100
      type: number
    - name: silver-max-bet
      value: 500
      type: number
    - name: gold-max-bet
      value: 2500
      type: number
    - name: platinum-max-bet
      value: 10000
      type: number
    - name: standard-max-bet
      value: 50
      type: number

    # System Configuration
    - name: house-edge-slots
      value: 0.05
      type: number
    - name: house-edge-table
      value: 0.02
      type: number
    - name: max-concurrent-sessions
      value: 3
      type: number
    - name: default-http-timeout-ms
      value: 5000
      type: number
    - name: risk-service-timeout-ms
      value: 3000
      type: number
    - name: compliance-service-timeout-ms
      value: 4000
      type: number
    - name: default-db-adapter-timeout-ms # For DB operations
      value: 3000
      type: number
    - name: communication-timeout-ms # For Comm plugins
      value: 2500
      type: number
    - name: auth-plugin-timeout-ms # For Auth plugins
      value: 2000
      type: number

    # Communication Config
    - name: welcome-email-from
      value: "welcome@example-casino.com"
      type: string
    - name: tier-upgrade-sms-sender-id
      value: "CasinoVIP"
      type: string
    - name: default-policy-engine-url # For Security.Authorize with OPA
      value: "http://opa-service:8181/v1/data/casino/authz" # Example OPA endpoint
      type: string

  components:
    # --- Named HTTP Call Components (for external services not covered by higher-level abstractions) ---
    - name: callComplianceJurisdictionCheck
      type: StdLib:HttpCall
      config:
        url: "{{secrets.compliance-service-url}}/jurisdiction-check"
        method: POST
        timeoutMs: "{{context.compliance-service-timeout-ms}}"
    - name: callComplianceSanctionsScreening
      type: StdLib:HttpCall
      config:
        url: "{{secrets.compliance-service-url}}/sanctions-screening"
        method: POST
        timeoutMs: "{{context.compliance-service-timeout-ms}}"
    - name: callRiskVelocityAnalysis
      type: StdLib:HttpCall
      config: { url: "{{secrets.risk-service-url}}/velocity-analysis", method: POST, timeoutMs: "{{context.risk-service-timeout-ms}}" }
    - name: callRiskBehavioralAnalysis
      type: StdLib:HttpCall
      config: { url: "{{secrets.risk-service-url}}/behavioral-analysis", method: POST, timeoutMs: "{{context.risk-service-timeout-ms}}" }
    - name: callRiskDeviceFingerprint
      type: StdLib:HttpCall
      config: { url: "{{secrets.risk-service-url}}/device-fingerprint", method: POST, timeoutMs: "{{context.risk-service-timeout-ms}}" }
    - name: callRiskGeoAnalysis
      type: StdLib:HttpCall
      config: { url: "{{secrets.risk-service-url}}/geo-analysis", method: POST, timeoutMs: "{{context.risk-service-timeout-ms}}" }
    - name: callFraudVelocityCheck
      type: StdLib:HttpCall
      config: { url: "{{secrets.fraud-service-url}}/velocity-check", method: POST, timeoutMs: "{{context.risk-service-timeout-ms}}" }
    - name: callFraudDeviceAnalysis
      type: StdLib:HttpCall
      config: { url: "{{secrets.fraud-service-url}}/device-analysis", method: POST, timeoutMs: "{{context.risk-service-timeout-ms}}" }
    - name: callFraudBehavioralAnalysis
      type: StdLib:HttpCall
      config: { url: "{{secrets.fraud-service-url}}/behavioral-analysis", method: POST, timeoutMs: "{{context.risk-service-timeout-ms}}" }
    - name: callPaymentValidateMethod
      type: StdLib:HttpCall
      config: { url: "{{secrets.payment-service-url}}/validate-method", method: POST, timeoutMs: "{{context.default-http-timeout-ms}}" }

    # --- Named Database Adapter Components (using Integration.ExternalServiceAdapter) ---
    - name: dbCreateUserAccount
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter" # Conceptual plugin ID
        adapterConfig: { connectionStringSecretName: "user-db-connection-string", timeoutMs: "{{context.default-db-adapter-timeout-ms}}" }
        operation: "ExecuteDML_ReturnFirst" # Assumes plugin operation that executes DML and returns the first row (e.g., using RETURNING)
    - name: dbGetUserProfile
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "user-db-connection-string", timeoutMs: "{{context.default-db-adapter-timeout-ms}}" }
        operation: "QuerySingleRow_ReturnFirst" # Assumes plugin operation that expects a single row and returns its first result
    - name: dbUpdateUserBalance
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "user-db-connection-string", timeoutMs: "{{context.default-db-adapter-timeout-ms}}" }
        operation: "ExecuteDML" # For operations that don't need to return data beyond success/failure
    - name: dbGetUserStatus
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "user-db-connection-string", timeoutMs: "{{context.default-db-adapter-timeout-ms}}" }
        operation: "QuerySingleRow_ReturnFirst"
    - name: dbGetUserLifetimeStats
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "user-db-connection-string", timeoutMs: "{{context.default-db-adapter-timeout-ms}}" }
        operation: "QuerySingleRow_ReturnFirst"
    - name: dbUpdateUserTier
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "user-db-connection-string", timeoutMs: "{{context.default-db-adapter-timeout-ms}}" }
        operation: "ExecuteDML"

    # --- Named Communication Components ---
    - name: sendWelcomeEmailComponent
      type: Communication.SendEmail
      config:
        serviceType: "StdLibPlugin:SesAdapter" # Conceptual plugin ID
        serviceConfig: { apiKeySecretName: "ses-api-key", region: "us-east-1", timeoutMs: "{{context.communication-timeout-ms}}" }
        fromAddress: "{{context.welcome-email-from}}"
        defaultFromName: "Casino Welcome Team"
    - name: sendWelcomeSmsComponent
      type: Communication.SendNotification
      config:
        channel: "SMS"
        serviceType: "StdLibPlugin:TwilioSmsAdapter" # Conceptual plugin ID
        serviceConfig: { accountSidSecretName: "twilio-account-sid", authTokenSecretName: "twilio-auth-token", defaultSenderId: "{{context.welcome-sms-sender-id}}", timeoutMs: "{{context.communication-timeout-ms}}" }
    - name: sendTierUpgradeNotificationComponent
      type: Communication.SendNotification
      config:
        channel: "SMS"
        serviceType: "StdLibPlugin:TwilioSmsAdapter"
        serviceConfig: { accountSidSecretName: "twilio-account-sid", authTokenSecretName: "twilio-auth-token", defaultSenderId: "{{context.tier-upgrade-sms-sender-id}}", timeoutMs: "{{context.communication-timeout-ms}}" }

    # --- Named Security Components ---
    - name: authorizePlaceBetAction
      type: Security.Authorize
      config:
        policySourceType: "Opa" # Example: Using OPA for policies
        policySourceConfig:
          opaQueryUrl: "{{context.default-policy-engine-url}}"
          policyPath: "place_bet" # e.g., /casino/authz/place_bet
          # Additional OPA config like secret for auth token if OPA is protected, timeoutMs
        inputDataExpression: "data" # Assumes input 'data' to Authorize is already { principal, action, resource }

    # --- Named SubFlow Invokers (Unchanged from previous refinement) ---
    - name: invokeInitiateKYCFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.kyc.InitiateKYCFlow, waitForCompletion: true }
    - name: invokeSetupDefaultLimitsFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.responsible.SetupDefaultLimitsFlow, waitForCompletion: true }
    - name: invokeProcessReferralBonusFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.bonuses.ProcessReferralBonusFlow, waitForCompletion: true } # Or false if async
    - name: invokeTrackUserRegistrationFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.analytics.TrackUserRegistrationFlow, waitForCompletion: false }
    - name: invokeValidateBettingLimitsFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.responsible.ValidateBettingLimitsFlow, waitForCompletion: true }
    - name: invokeApproveBetFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.compliance.ApproveBetFlow, waitForCompletion: true }
    - name: invokeProcessBetPaymentFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.payments.ProcessBetPaymentFlow, waitForCompletion: true }
    - name: invokeExecuteGameFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.games.ExecuteGameFlow, waitForCompletion: true }
    - name: invokeEvaluateBonusEligibilityFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.bonuses.EvaluateBonusEligibilityFlow, waitForCompletion: false }
    - name: invokeRecordGameplayAnalyticsFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.analytics.RecordGameplayAnalyticsFlow, waitForCompletion: false }
    - name: invokeProcessPaymentTransactionFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.payments.ProcessPaymentTransactionFlow, waitForCompletion: true }
    - name: invokeEvaluateDepositBonusFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.bonuses.EvaluateDepositBonusFlow, waitForCompletion: false }
    - name: invokeEvaluateUserTierFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.core.EvaluateUserTierFlow, waitForCompletion: false } # Can be async
    - name: invokeAwardTierUpgradeBonusFlow
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.bonuses.AwardTierUpgradeBonusFlow, waitForCompletion: false }

    # --- Logic Components (Unchanged from previous refinement) ---
    - name: user-tier-classifier
      type: StdLib:Switch
      config:
        cases:
          - conditionExpression: "data.totalLifetimeDeposits >= {{context.platinum-tier-threshold}}"
            outputName: is_platinum
          - conditionExpression: "data.totalLifetimeDeposits >= {{context.gold-tier-threshold}}"
            outputName: is_gold
          - conditionExpression: "data.totalLifetimeDeposits >= {{context.silver-tier-threshold}}"
            outputName: is_silver
          - conditionExpression: "data.totalLifetimeDeposits >= {{context.bronze-tier-threshold}}"
            outputName: is_bronze
        defaultOutputName: is_standard
    - name: mapDataToTierPlatinum
      type: StdLib:MapData
      config: { expression: "{ userTier: 'platinum', originalData: data }" }
    - name: mapDataToTierGold
      type: StdLib:MapData
      config: { expression: "{ userTier: 'gold', originalData: data }" }
    - name: mapDataToTierSilver
      type: StdLib:MapData
      config: { expression: "{ userTier: 'silver', originalData: data }" }
    - name: mapDataToTierBronze
      type: StdLib:MapData
      config: { expression: "{ userTier: 'bronze', originalData: data }" }
    - name: mapDataToTierStandard
      type: StdLib:MapData
      config: { expression: "{ userTier: 'standard', originalData: data }" }
    - name: bet-limit-calculator
      type: StdLib:MapData
      config:
        expression: |
          {
            maxBet: data.userTier == 'platinum' ? {{context.platinum-max-bet}} :
                   data.userTier == 'gold' ? {{context.gold-max-bet}} :
                   data.userTier == 'silver' ? {{context.silver-max-bet}} :
                   data.userTier == 'bronze' ? {{context.bronze-max-bet}} : {{context.standard-max-bet}},
            dailyLimit: data.userTier == 'platinum' ? 100000 :
                       data.userTier == 'gold' ? 25000 :
                       data.userTier == 'silver' ? 5000 :
                       data.userTier == 'bronze' ? 1000 : 500,
            sessionLimit: data.userTier == 'platinum' ? 25000 :
                         data.userTier == 'gold' ? 10000 :
                         data.userTier == 'silver' ? 2500 :
                         data.userTier == 'bronze' ? 500 : 200
          }

flows:
  # Comprehensive User Onboarding Flow
  - name: UserOnboardingFlow
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: /api/users/onboard
        method: POST
        # Note: Authentication for onboarding might be 'None' or a lightweight API key if it's a public endpoint.
        # For this example, assuming 'None' for initial registration.
        # authentication: { type: "None" }
        responseConfig: # For explicit error handling from StdLib:FailFlow
          errorStatusCode: 400 # Default for FailFlow if not overridden by FailFlow itself
          # Default error body from StdLib:FailFlow or StandardErrorStructure
          # errorBodyExpression: "data" # If FailFlow output is on 'data'
    steps:
      - step_id: validate-registration-data
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
            type: object
            required: [email, password, firstName, lastName, dateOfBirth, country, phoneNumber]
            properties:
              email: { type: string, format: email }
              password: { type: string, minLength: 8, pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\\\d)(?=.*[@$!%*?&])[A-Za-z\\\\d@$!%*?&]" }
              firstName: { type: string, minLength: 2, maxLength: 50 }
              lastName: { type: string, minLength: 2, maxLength: 50 }
              dateOfBirth: { type: string, format: date }
              country: { type: string, minLength: 2, maxLength: 3 } # ISO 3166-1 alpha-2
              phoneNumber: { type: string, pattern: "^\\\\+[1-9]\\\\d{1,14}$" } # E.164
              referralCode: { type: string }
        inputs_map:
          data: "trigger.body"
        outputs_map: # Explicitly wire error output for FailFlow
          error: "steps.fail-on-validation-error.inputs.data"

      - step_id: fail-on-validation-error
        component_ref: StdLib:FailFlow
        config:
          # errorMessageExpression uses 'data' which is the StandardErrorStructure from validator
          errorMessageExpression: "{ message: 'Registration data validation failed: ' + data.message, type: 'UserOnboarding.ValidationError', details: data.details }"
          language: JMESPath
        # This step only runs if validate-registration-data.outputs.error is emitted

      - step_id: trigger-geo-compliance-checks
        component_ref: StdLib:Fork
        config:
          outputNames: [for_jurisdiction, for_sanctions, for_age_verification]
        inputs_map:
          data: "steps.validate-registration-data.outputs.validData"
        run_after: [validate-registration-data] # Only runs if validation succeeds

      - step_id: check-jurisdiction
        component_ref: callComplianceJurisdictionCheck
        inputs_map:
          data: "steps.trigger-geo-compliance-checks.outputs.for_jurisdiction"
        run_after: [trigger-geo-compliance-checks]

      - step_id: screen-sanctions
        component_ref: callComplianceSanctionsScreening
        inputs_map:
          data: "steps.trigger-geo-compliance-checks.outputs.for_sanctions"
        run_after: [trigger-geo-compliance-checks]

      - step_id: verify-age
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              age: Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
              isEligible: Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) >= 18,
              jurisdiction: data.country
            }
        inputs_map:
          data: "steps.trigger-geo-compliance-checks.outputs.for_age_verification"
        run_after: [trigger-geo-compliance-checks]

      - step_id: evaluate-compliance-results
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              canProceed: jurisdictionAllowed && !onSanctionsList && ageEligible,
              complianceFlags: {
                jurisdiction: jurisdictionAllowed,
                sanctions: !onSanctionsList,
                age: ageEligible
              },
              riskLevel: jurisdictionAllowed && !onSanctionsList && ageEligible ? 'low' : 'high'
            }
        inputs_map:
          jurisdictionAllowed: "steps.check-jurisdiction.outputs.response.body.allowed"
          onSanctionsList: "steps.screen-sanctions.outputs.response.body.flagged"
          ageEligible: "steps.verify-age.outputs.result.isEligible"
        run_after: [check-jurisdiction, screen-sanctions, verify-age]

      - step_id: initiate-kyc-process
        component_ref: invokeInitiateKYCFlow
        inputs_map:
          initialData: "{ userData: steps.validate-registration-data.outputs.validData, complianceData: steps.evaluate-compliance-results.outputs.result }"
        run_after: [evaluate-compliance-results]
        condition: "steps.evaluate-compliance-results.outputs.result.canProceed == true"

      - step_id: create-user-account
        component_ref: dbCreateUserAccount # Refactored to DB adapter
        inputs_map:
          requestData: # Input for Integration.ExternalServiceAdapter
            # Conceptual SQL query. Actual query depends on DB schema and plugin capabilities.
            # Password hashing should ideally happen in a secure environment or via a crypto plugin before this step.
            # The 'hash_password' function is purely conceptual here.
            query: "INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth, country, phone_number, kyc_status, compliance_flags_json, user_tier, total_lifetime_deposits, created_at) VALUES ($1, hash_password($2), $3, $4, $5, $6, $7, $8, $9::jsonb, 'standard', 0, NOW()) RETURNING user_id, email, first_name, phone_number, created_at;"
            params: "[ steps.validate-registration-data.outputs.validData.email, steps.validate-registration-data.outputs.validData.password, steps.validate-registration-data.outputs.validData.firstName, steps.validate-registration-data.outputs.validData.lastName, steps.validate-registration-data.outputs.validData.dateOfBirth, steps.validate-registration-data.outputs.validData.country, steps.validate-registration-data.outputs.validData.phoneNumber, steps.initiate-kyc-process.outputs.result.status, steps.evaluate-compliance-results.outputs.result.complianceFlags ]"
        run_after: [initiate-kyc-process]

      - step_id: setup-responsible-gambling
        component_ref: invokeSetupDefaultLimitsFlow
        inputs_map:
          initialData: "{ userId: steps.create-user-account.outputs.responseData.user_id, userTier: 'standard' }" # Assuming responseData contains the first row if 'ReturnFirst'
        run_after: [create-user-account]

      - step_id: process-referral-bonus
        component_ref: invokeProcessReferralBonusFlow
        inputs_map:
          initialData: "{ newUserId: steps.create-user-account.outputs.responseData.user_id, referralCode: steps.validate-registration-data.outputs.validData.referralCode }"
        run_after: [create-user-account]
        condition: "steps.validate-registration-data.outputs.validData.referralCode != null"

      - step_id: trigger-welcome-communications
        component_ref: StdLib:Fork
        config:
          outputNames: [for_email, for_sms, for_analytics]
        inputs_map: # Pass data from the created user account (DB response)
          data: "{ userId: steps.create-user-account.outputs.responseData.user_id, email: steps.create-user-account.outputs.responseData.email, phoneNumber: steps.create-user-account.outputs.responseData.phone_number, firstName: steps.create-user-account.outputs.responseData.first_name }"
        run_after: [setup-responsible-gambling]

      - step_id: send-welcome-email
        component_ref: sendWelcomeEmailComponent # Refactored to Communication.SendEmail
        inputs_map: # Inputs for Communication.SendEmail
          toAddresses: "steps.trigger-welcome-communications.outputs.for_email.email"
          subject: "'Welcome to Our Casino, ' + steps.trigger-welcome-communications.outputs.for_email.firstName + '!'"
          bodyText: "'Hi ' + steps.trigger-welcome-communications.outputs.for_email.firstName + ', thank you for registering! Your user ID is ' + steps.trigger-welcome-communications.outputs.for_email.userId"
          # bodyHtml: "..." # Can also use HTML if templateId is not used
          # templateId: "welcome-email-template-v1" # Optional: use a pre-defined template
          # templateData: "{ firstName: steps.trigger-welcome-communications.outputs.for_email.firstName, userId: steps.trigger-welcome-communications.outputs.for_email.userId }"
          data: "{ firstName: steps.trigger-welcome-communications.outputs.for_email.firstName, userId: steps.trigger-welcome-communications.outputs.for_email.userId }" # Context for expressions in subject/body/templateData
        run_after: [trigger-welcome-communications]

      - step_id: send-welcome-sms
        component_ref: sendWelcomeSmsComponent # Refactored to Communication.SendNotification
        inputs_map: # Inputs for Communication.SendNotification
          recipient: "steps.trigger-welcome-communications.outputs.for_sms.phoneNumber"
          message: "'Welcome, ' + steps.trigger-welcome-communications.outputs.for_sms.firstName + '! Your Casino account (' + steps.trigger-welcome-communications.outputs.for_sms.userId + ') is ready.'"
          # templateId: "welcome-sms-template-v1" # Optional
          # data: "{ firstName: steps.trigger-welcome-communications.outputs.for_sms.firstName, userId: steps.trigger-welcome-communications.outputs.for_sms.userId }" # Context for expressions
        run_after: [trigger-welcome-communications]

      - step_id: track-registration-analytics
        component_ref: invokeTrackUserRegistrationFlow
        inputs_map:
          initialData: "{ userId: steps.trigger-welcome-communications.outputs.for_analytics.userId, registrationTimestamp: steps.create-user-account.outputs.responseData.created_at }"
        run_after: [trigger-welcome-communications]

  # Sophisticated Betting Flow with Multi-Layer Validation
  - name: PlaceBetFlow
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: /api/bets/place
        method: POST
        # CONCEPTUAL: Authentication handled by Core via trigger config.
        # This populates 'trigger.principal' if authentication is successful.
        authentication:
          type: "JwtValidator" # Example: Core uses a JWT validator middleware
          # jwtValidatorConfigRef: "global-casino-jwt-validator" # Reference to a globally defined JWT validator config
          # providerConfig for JwtValidator could include JWKS URI, issuer, audience, etc.
        responseConfig:
          errorStatusCode: 403 # For authorization failures
    steps:
      - step_id: authorize-bet-action
        component_ref: authorizePlaceBetAction # Using Security.Authorize
        inputs_map:
          data: "{ principal: trigger.principal, action: 'place_bet', resource: { type: 'game', id: trigger.body.gameId, attributes: { amount: trigger.body.amount, currency: trigger.body.currency } } }"
        # If not authorized, Security.Authorize emits on its 'error' port (type: Security.Authorize.Unauthorized),
        # which should terminate the flow and lead to the trigger's errorStatusCode (e.g., 403).

      - step_id: get-user-profile
        component_ref: dbGetUserProfile # Refactored to DB adapter
        inputs_map:
          requestData:
            query: "SELECT user_id, user_tier, balance, daily_spent_today, session_spent_current, total_lifetime_deposits, current_session_id, account_status FROM user_profiles_view WHERE user_id = $1;" # Assuming a view with calculated daily/session spent
            params: "[ trigger.principal.id ]" # Uses authenticated user ID from trigger.principal
        run_after: [authorize-bet-action] # Only if authorized

      - step_id: check-account-status
        component_ref: StdLib:FilterData
        config:
          expression: "data.account_status == 'active'"
          matchOutput: activeAccountData
          noMatchOutput: inactiveAccountError # This will be the data for the error output
        inputs_map:
          data: "steps.get-user-profile.outputs.responseData" # Pass the user profile data
        run_after: [get-user-profile]
        outputs_map:
          inactiveAccountError: "steps.fail-on-inactive-account.inputs.data"

      - step_id: fail-on-inactive-account
        component_ref: StdLib:FailFlow
        config:
          errorMessageExpression: "{ message: 'Account is not active. Current status: ' + data.account_status, type: 'PlaceBet.AccountInactive' }"
        # This step runs if check-account-status emits on 'inactiveAccountError'

      - step_id: classify-user-tier-switch
        component_ref: user-tier-classifier
        inputs_map:
          data: "{ totalLifetimeDeposits: steps.check-account-status.outputs.activeAccountData.total_lifetime_deposits }" # Use data from activeAccountData
        run_after: [check-account-status]

      - step_id: map-tier-platinum
        component_ref: mapDataToTierPlatinum
        inputs_map: { data: "steps.classify-user-tier-switch.outputs.is_platinum" }
        run_after: [classify-user-tier-switch]
      - step_id: map-tier-gold
        component_ref: mapDataToTierGold
        inputs_map: { data: "steps.classify-user-tier-switch.outputs.is_gold" }
        run_after: [classify-user-tier-switch]
      - step_id: map-tier-silver
        component_ref: mapDataToTierSilver
        inputs_map: { data: "steps.classify-user-tier-switch.outputs.is_silver" }
        run_after: [classify-user-tier-switch]
      - step_id: map-tier-bronze
        component_ref: mapDataToTierBronze
        inputs_map: { data: "steps.classify-user-tier-switch.outputs.is_bronze" }
        run_after: [classify-user-tier-switch]
      - step_id: map-tier-standard
        component_ref: mapDataToTierStandard
        inputs_map: { data: "steps.classify-user-tier-switch.outputs.is_standard" }
        run_after: [classify-user-tier-switch]

      - step_id: merge-classified-tier-data
        component_ref: StdLib:MergeStreams
        config: { inputNames: [p, g, s, b, std], mergedOutputName: classifiedTierInfo }
        inputs_map:
          p: "steps.map-tier-platinum.outputs.result"
          g: "steps.map-tier-gold.outputs.result"
          s: "steps.map-tier-silver.outputs.result"
          b: "steps.map-tier-bronze.outputs.result"
          std: "steps.map-tier-standard.outputs.result"
        run_after: [map-tier-platinum, map-tier-gold, map-tier-silver, map-tier-bronze, map-tier-standard]

      - step_id: calculate-betting-limits
        component_ref: bet-limit-calculator
        inputs_map:
          data: "steps.merge-classified-tier-data.outputs.classifiedTierInfo"
        run_after: [merge-classified-tier-data]

      - step_id: validate-bet-amount
        component_ref: StdLib:FilterData
        config:
          expression: |
            data.betAmount >= 1 &&
            data.betAmount <= data.maxBet &&
            data.betAmount <= (data.dailyLimit - data.dailySpent) &&
            data.betAmount <= (data.sessionLimit - data.sessionSpent) &&
            data.betAmount <= data.currentBalance
          matchOutput: validBetData
          noMatchOutput: invalidBetData
        inputs_map:
          data: "{ betAmount: trigger.body.amount, currentBalance: steps.check-account-status.outputs.activeAccountData.balance, maxBet: steps.calculate-betting-limits.outputs.result.maxBet, dailyLimit: steps.calculate-betting-limits.outputs.result.dailyLimit, sessionLimit: steps.calculate-betting-limits.outputs.result.sessionLimit, dailySpent: steps.check-account-status.outputs.activeAccountData.daily_spent_today, sessionSpent: steps.check-account-status.outputs.activeAccountData.session_spent_current }"
        run_after: [calculate-betting-limits, check-account-status]
        outputs_map:
          invalidBetData: "steps.fail-on-invalid-bet-amount.inputs.data"

      - step_id: fail-on-invalid-bet-amount
        component_ref: StdLib:FailFlow
        config:
          errorMessageExpression: "{ message: 'Bet amount validation failed or insufficient balance.', type: 'PlaceBet.InvalidAmountOrBalance', details: data }" # 'data' here is the input to validate-bet-amount

      - step_id: responsible-gambling-check
        component_ref: invokeValidateBettingLimitsFlow
        inputs_map:
          initialData: "{ userId: trigger.principal.id, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount, gameType: trigger.body.gameType }"
        run_after: [validate-bet-amount]
        condition: "steps.validate-bet-amount.outputs.validBetData != null" # Proceed only if bet is valid

      - step_id: trigger-comprehensive-risk-assessment
        component_ref: StdLib:Fork
        config:
          outputNames: [for_velocity, for_behavioral, for_device, for_geo]
        inputs_map:
          data: "{ userId: trigger.principal.id, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount, gameType: trigger.body.gameType, sessionData: steps.check-account-status.outputs.activeAccountData.current_session_id, ipAddress: trigger.headers['x-forwarded-for'] || trigger.headers['remote-addr'], userAgent: trigger.headers['user-agent'] }"
        run_after: [responsible-gambling-check]
        condition: "steps.responsible-gambling-check.outputs.result.approved == true"

      - step_id: assess-risk-velocity
        component_ref: callRiskVelocityAnalysis
        inputs_map: { data: "steps.trigger-comprehensive-risk-assessment.outputs.for_velocity" }
        run_after: [trigger-comprehensive-risk-assessment]
      - step_id: assess-risk-behavioral
        component_ref: callRiskBehavioralAnalysis
        inputs_map: { data: "steps.trigger-comprehensive-risk-assessment.outputs.for_behavioral" }
        run_after: [trigger-comprehensive-risk-assessment]
      - step_id: assess-risk-device
        component_ref: callRiskDeviceFingerprint
        inputs_map: { data: "steps.trigger-comprehensive-risk-assessment.outputs.for_device" }
        run_after: [trigger-comprehensive-risk-assessment]
      - step_id: assess-risk-geo
        component_ref: callRiskGeoAnalysis
        inputs_map: { data: "steps.trigger-comprehensive-risk-assessment.outputs.for_geo" }
        run_after: [trigger-comprehensive-risk-assessment]

      - step_id: aggregate-risk-scores
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              overallRiskScore: (data.velocityScore + data.behavioralScore + data.deviceScore + data.geoScore) / 4,
              riskLevel: ((data.velocityScore + data.behavioralScore + data.deviceScore + data.geoScore) / 4) > 0.8 ? 'high' :
                        ((data.velocityScore + data.behavioralScore + data.deviceScore + data.geoScore) / 4) > 0.5 ? 'medium' : 'low',
              requiresManualReview: ((data.velocityScore + data.behavioralScore + data.deviceScore + data.geoScore) / 4) > 0.9,
              autoApproved: ((data.velocityScore + data.behavioralScore + data.deviceScore + data.geoScore) / 4) < 0.3
            }
        inputs_map:
          data: "{ velocityScore: steps.assess-risk-velocity.outputs.response.body.score, behavioralScore: steps.assess-risk-behavioral.outputs.response.body.score, deviceScore: steps.assess-risk-device.outputs.response.body.score, geoScore: steps.assess-risk-geo.outputs.response.body.score }"
        run_after: [assess-risk-velocity, assess-risk-behavioral, assess-risk-device, assess-risk-geo]

      - step_id: compliance-approval
        component_ref: invokeApproveBetFlow
        inputs_map:
          initialData: "{ userId: trigger.principal.id, betData: steps.validate-bet-amount.outputs.validBetData, riskAssessment: steps.aggregate-risk-scores.outputs.result }"
        run_after: [aggregate-risk-scores]
        condition: "steps.aggregate-risk-scores.outputs.result.requiresManualReview == false"

      - step_id: process-bet-payment
        component_ref: invokeProcessBetPaymentFlow
        inputs_map:
          initialData: "{ userId: trigger.principal.id, amount: steps.validate-bet-amount.outputs.validBetData.betAmount, currency: trigger.body.currency, gameType: trigger.body.gameType }"
        run_after: [compliance-approval]
        condition: "steps.compliance-approval.outputs.result.approved == true"

      - step_id: execute-game-logic
        component_ref: invokeExecuteGameFlow
        inputs_map:
          initialData: "{ gameType: trigger.body.gameType, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount, userId: trigger.principal.id, gameParameters: trigger.body.gameParameters, transactionId: steps.process-bet-payment.outputs.result.transactionId }"
        run_after: [process-bet-payment]
        condition: "steps.process-bet-payment.outputs.result.success == true"

      - step_id: calculate-final-outcome
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              netResult: data.gameResult.winnings - data.betAmount,
              houseProfit: data.betAmount - data.gameResult.winnings,
              playerBalanceAfterWinnings: data.currentBalance + data.gameResult.winnings, # Balance before this bet + winnings
              gameOutcome: data.gameResult,
              transactionId: data.transactionId
            }
        inputs_map:
          data: "{ gameResult: steps.execute-game-logic.outputs.result, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount, currentBalance: steps.validate-bet-amount.outputs.validBetData.currentBalance, transactionId: steps.execute-game-logic.outputs.result.transactionId }" # Current balance from before bet payment was deducted
        run_after: [execute-game-logic]

      - step_id: update-user-balance
        component_ref: dbUpdateUserBalance # Refactored to DB adapter
        inputs_map:
          requestData:
            # This query should reflect the game outcome: add winnings, update spend.
            # The ProcessBetPaymentFlow would have already deducted the bet amount.
            query: "UPDATE user_profiles SET balance = balance + $1, daily_spent_today = daily_spent_today + $2, session_spent_current = session_spent_current + $2 WHERE user_id = $3; CALL record_transaction($3, 'bet_settlement', $4, $1, $2);"
            params: "[ steps.calculate-final-outcome.outputs.result.gameOutcome.winnings, steps.validate-bet-amount.outputs.validBetData.betAmount, trigger.principal.id, steps.calculate-final-outcome.outputs.result.transactionId ]" # Winnings to add, bet amount for spend
        run_after: [calculate-final-outcome]

      - step_id: trigger-bonus-evaluation
        component_ref: invokeEvaluateBonusEligibilityFlow
        inputs_map:
          initialData: "{ userId: trigger.principal.id, gameOutcome: steps.calculate-final-outcome.outputs.result.gameOutcome, userTier: steps.merge-classified-tier-data.outputs.classifiedTierInfo.userTier, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount }"
        run_after: [update-user-balance]

      - step_id: record-analytics
        component_ref: invokeRecordGameplayAnalyticsFlow
        inputs_map:
          initialData: "{ userId: trigger.principal.id, gameData: steps.calculate-final-outcome.outputs.result, riskData: steps.aggregate-risk-scores.outputs.result, userTier: steps.merge-classified-tier-data.outputs.classifiedTierInfo.userTier }"
        run_after: [update-user-balance]

  # Comprehensive Deposit Flow with Enhanced Security
  - name: ProcessDepositFlow
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: /api/payments/deposit
        method: POST
        # authentication: { type: "JwtValidator", ... } # Assume authenticated
        responseConfig:
          errorStatusCode: 400
    steps:
      - step_id: validate-deposit-request
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
            type: object
            required: [amount, paymentMethod, currency] # userId comes from trigger.principal
            properties:
              amount: { type: number, minimum: 10, maximum: 100000 }
              paymentMethod: { type: string, enum: [credit_card, bank_transfer, crypto, e_wallet] }
              currency: { type: string, enum: [USD, EUR, GBP, CAD] }
              bonusCode: { type: string }
        inputs_map:
          data: "trigger.body"
        outputs_map:
          error: "steps.fail-deposit-validation-error.inputs.data"

      - step_id: fail-deposit-validation-error
        component_ref: StdLib:FailFlow
        config:
          errorMessageExpression: "{ message: 'Deposit data validation failed: ' + data.message, type: 'ProcessDeposit.ValidationError', details: data.details }"

      - step_id: get-user-status
        component_ref: dbGetUserStatus
        inputs_map:
          requestData:
            query: "SELECT user_id, kyc_status, daily_deposits_sum_today, monthly_deposits_sum_current, daily_deposit_limit, monthly_deposit_limit, account_status FROM user_status_view WHERE user_id = $1;"
            params: "[ trigger.principal.id ]"
        run_after: [validate-deposit-request]

      - step_id: check-deposit-account-status
        component_ref: StdLib:FilterData
        config: { expression: "data.account_status == 'active'", matchOutput: activeAccountData, noMatchOutput: inactiveAccountError }
        inputs_map: { data: "steps.get-user-status.outputs.responseData" }
        run_after: [get-user-status]
        outputs_map: { inactiveAccountError: "steps.fail-deposit-inactive-account.inputs.data" }

      - step_id: fail-deposit-inactive-account
        component_ref: StdLib:FailFlow
        config: { errorMessageExpression: "{ message: 'Account is not active for deposits. Current status: ' + data.account_status, type: 'ProcessDeposit.AccountInactive' }" }

      - step_id: kyc-status-check
        component_ref: StdLib:FilterData
        config:
          expression: "data.kycStatus == 'verified' || (data.kycStatus == 'pending' && data.amount <= 500)"
          matchOutput: kycApprovedData
          noMatchOutput: kycRequiredData
        inputs_map:
          data: "{ kycStatus: steps.check-deposit-account-status.outputs.activeAccountData.kyc_status, amount: steps.validate-deposit-request.outputs.validData.amount }"
        run_after: [check-deposit-account-status]
        outputs_map: { kycRequiredData: "steps.fail-deposit-kyc-pending.inputs.data" }

      - step_id: fail-deposit-kyc-pending
        component_ref: StdLib:FailFlow
        config: { errorMessageExpression: "{ message: 'KYC verification pending or insufficient for deposit amount.', type: 'ProcessDeposit.KycPending' }" }

      - step_id: trigger-deposit-limit-checks
        component_ref: StdLib:Fork
        config:
          outputNames: [for_daily_limit, for_monthly_limit, for_velocity_check]
        inputs_map:
          data: "{ amount: steps.validate-deposit-request.outputs.validData.amount, dailyDeposits: steps.kyc-status-check.outputs.kycApprovedData.daily_deposits_sum_today, monthlyDeposits: steps.kyc-status-check.outputs.kycApprovedData.monthly_deposits_sum_current, dailyLimit: steps.kyc-status-check.outputs.kycApprovedData.daily_deposit_limit, monthlyLimit: steps.kyc-status-check.outputs.kycApprovedData.monthly_deposit_limit, userId: trigger.principal.id }"
        run_after: [kyc-status-check]
        condition: "steps.kyc-status-check.outputs.kycApprovedData != null"

      - step_id: check-daily-deposit-limit
        component_ref: StdLib:FilterData
        config: { expression: "data.dailyDeposits + data.amount <= data.dailyLimit", matchOutput: withinDailyLimitData, noMatchOutput: exceedsDailyLimitData }
        inputs_map: { data: "steps.trigger-deposit-limit-checks.outputs.for_daily_limit" }
        run_after: [trigger-deposit-limit-checks]
      - step_id: check-monthly-deposit-limit
        component_ref: StdLib:FilterData
        config: { expression: "data.monthlyDeposits + data.amount <= data.monthlyLimit", matchOutput: withinMonthlyLimitData, noMatchOutput: exceedsMonthlyLimitData }
        inputs_map: { data: "steps.trigger-deposit-limit-checks.outputs.for_monthly_limit" }
        run_after: [trigger-deposit-limit-checks]
      - step_id: check-deposit-velocity
        component_ref: callFraudVelocityCheck
        inputs_map: { data: "steps.trigger-deposit-limit-checks.outputs.for_velocity_check" } # Pass { userId, amount }
        run_after: [trigger-deposit-limit-checks]

      - step_id: evaluate-deposit-eligibility
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              canProceed: data.withinDailyLimit && data.withinMonthlyLimit && data.velocityApproved,
              limitFlags: { daily: data.withinDailyLimit, monthly: data.withinMonthlyLimit, velocity: data.velocityApproved },
              riskLevel: data.velocityApproved ? 'low' : 'high'
            }
        inputs_map:
          data: "{ withinDailyLimit: steps.check-daily-deposit-limit.outputs.withinDailyLimitData != null, withinMonthlyLimit: steps.check-monthly-deposit-limit.outputs.withinMonthlyLimitData != null, velocityApproved: steps.check-deposit-velocity.outputs.response.body.approved }"
        run_after: [check-daily-deposit-limit, check-monthly-deposit-limit, check-deposit-velocity]
        outputs_map: # Check if canProceed is false, then fail
          result: "steps.fail-deposit-limits-exceeded.inputs.data" # This is conceptual, need a filter before fail
          # Better: Add a FilterData step here to check result.canProceed

      # Add FilterData step before fail-deposit-limits-exceeded
      - step_id: filter-proceed-on-limits
        component_ref: StdLib:FilterData
        config: { expression: "data.canProceed == true", matchOutput: proceedData, noMatchOutput: failData }
        inputs_map: { data: "steps.evaluate-deposit-eligibility.outputs.result" }
        run_after: [evaluate-deposit-eligibility]
        outputs_map: { failData: "steps.fail-deposit-limits-exceeded.inputs.data" }

      - step_id: fail-deposit-limits-exceeded
        component_ref: StdLib:FailFlow
        config: { errorMessageExpression: "{ message: 'Deposit limits exceeded or velocity check failed.', type: 'ProcessDeposit.LimitsExceeded', details: data.limitFlags }" }

      - step_id: trigger-fraud-detection-screening
        component_ref: StdLib:Fork
        config:
          outputNames: [for_device_fp, for_behavioral_scan, for_payment_validation]
        inputs_map:
          data: "{ depositData: steps.validate-deposit-request.outputs.validData, userProfile: steps.kyc-status-check.outputs.kycApprovedData, ipAddress: trigger.headers['x-forwarded-for'] || trigger.headers['remote-addr'], userAgent: trigger.headers['user-agent'] }"
        run_after: [filter-proceed-on-limits] # Run if filter-proceed-on-limits.outputs.proceedData
        condition: "steps.filter-proceed-on-limits.outputs.proceedData != null"

      - step_id: screen-device-fingerprint
        component_ref: callFraudDeviceAnalysis
        inputs_map: { data: "steps.trigger-fraud-detection-screening.outputs.for_device_fp" }
        run_after: [trigger-fraud-detection-screening]
      - step_id: screen-behavioral-analysis
        component_ref: callFraudBehavioralAnalysis
        inputs_map: { data: "steps.trigger-fraud-detection-screening.outputs.for_behavioral_scan" }
        run_after: [trigger-fraud-detection-screening]
      - step_id: screen-payment-method-validation
        component_ref: callPaymentValidateMethod
        inputs_map: { data: "steps.trigger-fraud-detection-screening.outputs.for_payment_validation" }
        run_after: [trigger-fraud-detection-screening]

      - step_id: aggregate-fraud-scores
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              overallFraudScore: (data.deviceScore + data.behavioralScore + data.paymentScore) / 3,
              fraudRisk: ((data.deviceScore + data.behavioralScore + data.paymentScore) / 3) > 0.7 ? 'high' :
                        ((data.deviceScore + data.behavioralScore + data.paymentScore) / 3) > 0.4 ? 'medium' : 'low',
              requiresManualReview: ((data.deviceScore + data.behavioralScore + data.paymentScore) / 3) > 0.8,
              autoApproved: ((data.deviceScore + data.behavioralScore + data.paymentScore) / 3) < 0.2
            }
        inputs_map:
          data: "{ deviceScore: steps.screen-device-fingerprint.outputs.response.body.riskScore, behavioralScore: steps.screen-behavioral-analysis.outputs.response.body.riskScore, paymentScore: steps.screen-payment-method-validation.outputs.response.body.riskScore }"
        run_after: [screen-device-fingerprint, screen-behavioral-analysis, screen-payment-method-validation]

      - step_id: process-payment-transaction
        component_ref: invokeProcessPaymentTransactionFlow
        inputs_map:
          initialData: "{ userId: trigger.principal.id, depositData: steps.validate-deposit-request.outputs.validData, fraudAssessment: steps.aggregate-fraud-scores.outputs.result }"
        run_after: [aggregate-fraud-scores]
        condition: "steps.aggregate-fraud-scores.outputs.result.requiresManualReview == false"

      - step_id: update-user-balance-after-deposit
        component_ref: dbUpdateUserBalance
        inputs_map:
          requestData:
            query: "UPDATE user_profiles SET balance = balance + $1, total_lifetime_deposits = total_lifetime_deposits + $1, daily_deposits_sum_today = daily_deposits_sum_today + $1, monthly_deposits_sum_current = monthly_deposits_sum_current + $1 WHERE user_id = $2; CALL record_transaction($2, 'deposit', $3, $1);"
            params: "[ steps.process-payment-transaction.outputs.result.processedAmount, trigger.principal.id, steps.process-payment-transaction.outputs.result.transactionId ]"
        run_after: [process-payment-transaction]
        condition: "steps.process-payment-transaction.outputs.result.success == true"

      - step_id: evaluate-deposit-bonus
        component_ref: invokeEvaluateDepositBonusFlow
        inputs_map:
          initialData: "{ userId: trigger.principal.id, depositAmount: steps.process-payment-transaction.outputs.result.processedAmount, bonusCode: steps.validate-deposit-request.outputs.validData.bonusCode }"
        run_after: [update-user-balance-after-deposit]

      - step_id: trigger-tier-evaluation
        component_ref: invokeEvaluateUserTierFlow
        inputs_map:
          initialData: "{ userId: trigger.principal.id, newDepositAmount: steps.process-payment-transaction.outputs.result.processedAmount }"
        run_after: [update-user-balance-after-deposit]

  # User Tier Evaluation and Upgrade Flow
  - name: EvaluateUserTierFlow
    trigger:
      type: StdLib.Trigger:EventBus
      config:
        eventTypePattern: "casino.user.deposit.completed" # More specific event type
        # filterExpression: "event.payload.country == 'US'" # Example filter on event payload
    steps:
      - step_id: get-updated-user-stats
        component_ref: dbGetUserLifetimeStats
        inputs_map:
          requestData:
            query: "SELECT user_id, current_tier, total_lifetime_deposits, email, phone_number FROM user_profiles WHERE user_id = $1;"
            params: "[ trigger.event.payload.userId ]" # Assuming event schema from stdlib.yml is EventBusTriggerPayload { event: { payload: { userId: ...} } }

      - step_id: calculate-new-tier-switch
        component_ref: user-tier-classifier
        inputs_map: { data: "{ totalLifetimeDeposits: steps.get-updated-user-stats.outputs.responseData.total_lifetime_deposits }" }
        run_after: [get-updated-user-stats]

      - step_id: map-new-tier-platinum
        component_ref: mapDataToTierPlatinum
        inputs_map: { data: "steps.calculate-new-tier-switch.outputs.is_platinum" }
        run_after: [calculate-new-tier-switch]
      - step_id: map-new-tier-gold
        component_ref: mapDataToTierGold
        inputs_map: { data: "steps.calculate-new-tier-switch.outputs.is_gold" }
        run_after: [calculate-new-tier-switch]
      - step_id: map-new-tier-silver
        component_ref: mapDataToTierSilver
        inputs_map: { data: "steps.calculate-new-tier-switch.outputs.is_silver" }
        run_after: [calculate-new-tier-switch]
      - step_id: map-new-tier-bronze
        component_ref: mapDataToTierBronze
        inputs_map: { data: "steps.calculate-new-tier-switch.outputs.is_bronze" }
        run_after: [calculate-new-tier-switch]
      - step_id: map-new-tier-standard
        component_ref: mapDataToTierStandard
        inputs_map: { data: "steps.calculate-new-tier-switch.outputs.is_standard" }
        run_after: [calculate-new-tier-switch]

      - step_id: merge-new-tier-info
        component_ref: StdLib:MergeStreams
        config: { inputNames: [p,g,s,b,std], mergedOutputName: newTierData }
        inputs_map:
          p: "steps.map-new-tier-platinum.outputs.result"
          g: "steps.map-new-tier-gold.outputs.result"
          s: "steps.map-new-tier-silver.outputs.result"
          b: "steps.map-new-tier-bronze.outputs.result"
          std: "steps.map-new-tier-standard.outputs.result"
        run_after: [map-new-tier-platinum, map-new-tier-gold, map-new-tier-silver, map-new-tier-bronze, map-new-tier-standard]

      - step_id: check-tier-upgrade
        component_ref: StdLib:FilterData
        config:
          expression: "data.newTier != data.currentTier && data.tierRanking[data.newTier] > data.tierRanking[data.currentTier]"
          matchOutput: tierUpgradeData
          noMatchOutput: noChangeData
        inputs_map:
          data: "{ newTier: steps.merge-new-tier-info.outputs.newTierData.userTier, currentTier: steps.get-updated-user-stats.outputs.responseData.current_tier, tierRanking: { standard: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 } }"
        run_after: [merge-new-tier-info, get-updated-user-stats]

      - step_id: trigger-process-tier-upgrade
        component_ref: StdLib:Fork
        config:
          outputNames: [for_update_tier, for_award_bonus, for_send_notification]
        inputs_map:
          data: "{ userId: steps.get-updated-user-stats.outputs.responseData.user_id, newTier: steps.merge-new-tier-info.outputs.newTierData.userTier, oldTier: steps.get-updated-user-stats.outputs.responseData.current_tier, email: steps.get-updated-user-stats.outputs.responseData.email, phoneNumber: steps.get-updated-user-stats.outputs.responseData.phone_number }"
        run_after: [check-tier-upgrade]
        condition: "steps.check-tier-upgrade.outputs.tierUpgradeData != null"

      - step_id: update-user-tier-in-db
        component_ref: dbUpdateUserTier
        inputs_map:
          requestData:
            query: "UPDATE user_profiles SET current_tier = $1 WHERE user_id = $2;"
            params: "[ steps.trigger-process-tier-upgrade.outputs.for_update_tier.newTier, steps.trigger-process-tier-upgrade.outputs.for_update_tier.userId ]"
        run_after: [trigger-process-tier-upgrade]

      - step_id: award-tier-upgrade-bonus
        component_ref: invokeAwardTierUpgradeBonusFlow
        inputs_map:
          initialData: "steps.trigger-process-tier-upgrade.outputs.for_award_bonus"
        run_after: [trigger-process-tier-upgrade]

      - step_id: send-tier-upgrade-notification
        component_ref: sendTierUpgradeNotificationComponent
        inputs_map:
          recipient: "steps.trigger-process-tier-upgrade.outputs.for_send_notification.phoneNumber" # Or .email
          message: "'Congrats! You have been upgraded to the ' + steps.trigger-process-tier-upgrade.outputs.for_send_notification.newTier + ' tier! Enjoy your new benefits.'"
          # templateId: "tier-upgrade-notification"
          # data: "{ newTier: steps.trigger-process-tier-upgrade.outputs.for_send_notification.newTier, oldTier: steps.trigger-process-tier-upgrade.outputs.for_send_notification.oldTier }"
        run_after: [trigger-process-tier-upgrade]
    `
  },

  // User Management Module (Illustrative minimal changes for brevity, apply Fork refactoring as in Core)
  {
    fqn: 'com.casino.users',
    content: `
dsl_version: "1.1"
namespace: com.casino.users
imports:
  - namespace: com.casino.core # For shared context or components if any
    as: core
definitions:
  context:
    - name: kyc-verification-url
      value: "https://api.kyc-provider.com/verify" # Example: if some KYC is still direct HTTP
    - name: default-http-timeout-ms
      value: 5000
  components:
    - name: kycVerifierComponent
      type: StdLib:HttpCall
      config:
        url: "{{context.kyc-verification-url}}"
        method: POST
        timeoutMs: "{{context.default-http-timeout-ms}}"
    - name: userDbAdapter # Shared or specific DB adapter for this module
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "user-db-connection-string" }
        # Default operation might be set here, or overridden in step
flows:
  - name: UserRegistrationFlow # This flow is illustrative if com.casino.core.UserOnboardingFlow is the primary one.
    trigger:
      type: StdLib.Trigger:Http
      config: { path: /api/users/register, method: POST, responseConfig: { errorStatusCode: 400 } }
    steps:
      - step_id: validate-user-data
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
            type: object
            required: [email, password, firstName, lastName, dateOfBirth, country]
            properties: # Simplified
              email: { type: string, format: email }
              password: { type: string, minLength: 8 }
              firstName: { type: string }
              lastName: { type: string }
              dateOfBirth: { type: string, format: date }
              country: { type: string }
        inputs_map: { data: "trigger.body" }
        outputs_map: { error: "steps.fail-user-reg-validation.inputs.data" }

      - step_id: fail-user-reg-validation
        component_ref: StdLib:FailFlow
        config: { errorMessageExpression: "{ message: 'User registration validation failed: ' + data.message, type: 'UserRegistration.ValidationError', details: data.details }" }

      - step_id: perform-kyc-check # Assumes this KYC is simpler or a pre-check
        component_ref: kycVerifierComponent
        inputs_map: { data: "{ userData: steps.validate-user-data.outputs.validData }" }
        run_after: [validate-user-data]
        condition: "steps.validate-user-data.outputs.validData != null"

      - step_id: create-user-in-db
        component_ref: userDbAdapter
        config:
          operation: "ExecuteDML_ReturnFirst"
        inputs_map:
          requestData:
            query: "INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth, country, kyc_reference_id) VALUES ($1, hash_password($2), $3, $4, $5, $6, $7) RETURNING user_id;"
            params: "[ steps.validate-user-data.outputs.validData.email, steps.validate-user-data.outputs.validData.password, steps.validate-user-data.outputs.validData.firstName, steps.validate-user-data.outputs.validData.lastName, steps.validate-user-data.outputs.validData.dateOfBirth, steps.validate-user-data.outputs.validData.country, steps.perform-kyc-check.outputs.response.body.kycReferenceId ]"
        run_after: [perform-kyc-check]
        condition: "steps.perform-kyc-check.outputs.response.body.status == 'VERIFIED'" # Or similar success condition
    `
  },

  // Games Module (Refactoring Fork usage in SlotGameFlow and BlackjackGameFlow)
  {
    fqn: 'com.casino.games',
    content: `dsl_version: "1.1"
namespace: com.casino.games
imports:
  - namespace: com.casino.core
    as: core

definitions:
  context:
    - name: default-game-timeout-ms
      value: 5000
      type: number
    - name: house-edge-slots
      value: 0.05
      type: number
    - name: house-edge-blackjack
      value: 0.02
      type: number
    - name: max-win-multiplier
      value: 1000
      type: number

  components:
    # Game Engine Components
    - name: slotGameEngine
      type: StdLib:HttpCall
      config:
        url: "{{secrets.game-engine-url}}/slots/spin"
        method: POST
        timeoutMs: "{{context.default-game-timeout-ms}}"
        headers:
          Authorization: "Bearer {{secrets.game-engine-api-key}}"

    - name: blackjackGameEngine
      type: StdLib:HttpCall
      config:
        url: "{{secrets.game-engine-url}}/blackjack/play"
        method: POST
        timeoutMs: "{{context.default-game-timeout-ms}}"
        headers:
          Authorization: "Bearer {{secrets.game-engine-api-key}}"

    - name: rouletteGameEngine
      type: StdLib:HttpCall
      config:
        url: "{{secrets.game-engine-url}}/roulette/spin"
        method: POST
        timeoutMs: "{{context.default-game-timeout-ms}}"
        headers:
          Authorization: "Bearer {{secrets.game-engine-api-key}}"

    # Game Result Calculator
    - name: calculateGameOutcome
      type: StdLib:MapData
      config:
        expression: |
          {
            winnings: data.isWin ? data.betAmount * data.multiplier : 0,
            multiplier: data.multiplier || 0,
            isWin: data.isWin || false,
            gameDetails: data.gameDetails,
            transactionId: data.transactionId,
            houseEdge: data.gameType == 'slots' ? {{context.house-edge-slots}} : {{context.house-edge-blackjack}}
          }

flows:
  - name: ExecuteGameFlow
    trigger:
      type: StdLib:Manual
    steps:
      - step_id: validate-game-request
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
            type: object
            required: [gameType, betAmount, userId, transactionId]
            properties:
              gameType: { type: string, enum: [slots, blackjack, roulette] }
              betAmount: { type: number, minimum: 1, maximum: 10000 }
              userId: { type: string }
              transactionId: { type: string }
              gameParameters: { type: object }
        inputs_map:
          data: "trigger.initialData"

      - step_id: route-to-game-engine
        component_ref: StdLib:Switch
        config:
          cases:
            - conditionExpression: "data.gameType == 'slots'"
              outputName: slotsGame
            - conditionExpression: "data.gameType == 'blackjack'"
              outputName: blackjackGame
            - conditionExpression: "data.gameType == 'roulette'"
              outputName: rouletteGame
          defaultOutputName: unsupportedGame
        inputs_map:
          data: "steps.validate-game-request.outputs.validData"
        run_after: [validate-game-request]

      - step_id: execute-slots-game
        component_ref: slotGameEngine
        inputs_map:
          data: "steps.route-to-game-engine.outputs.slotsGame"
        run_after: [route-to-game-engine]
        condition: "steps.route-to-game-engine.outputs.slotsGame != null"

      - step_id: execute-blackjack-game
        component_ref: blackjackGameEngine
        inputs_map:
          data: "steps.route-to-game-engine.outputs.blackjackGame"
        run_after: [route-to-game-engine]
        condition: "steps.route-to-game-engine.outputs.blackjackGame != null"

      - step_id: execute-roulette-game
        component_ref: rouletteGameEngine
        inputs_map:
          data: "steps.route-to-game-engine.outputs.rouletteGame"
        run_after: [route-to-game-engine]
        condition: "steps.route-to-game-engine.outputs.rouletteGame != null"

      - step_id: calculate-final-outcome
        component_ref: calculateGameOutcome
        inputs_map:
          data: |
            {
              isWin: steps.execute-slots-game.outputs.response.body.isWin || steps.execute-blackjack-game.outputs.response.body.isWin || steps.execute-roulette-game.outputs.response.body.isWin,
              multiplier: steps.execute-slots-game.outputs.response.body.multiplier || steps.execute-blackjack-game.outputs.response.body.multiplier || steps.execute-roulette-game.outputs.response.body.multiplier,
              betAmount: steps.validate-game-request.outputs.validData.betAmount,
              gameType: steps.validate-game-request.outputs.validData.gameType,
              gameDetails: steps.execute-slots-game.outputs.response.body.gameDetails || steps.execute-blackjack-game.outputs.response.body.gameDetails || steps.execute-roulette-game.outputs.response.body.gameDetails,
              transactionId: steps.validate-game-request.outputs.validData.transactionId
            }
        run_after: [execute-slots-game, execute-blackjack-game, execute-roulette-game]
    `
  },

  // Payments Module (Minimal changes for brevity, ensure SubFlowInvoker and Trigger types are correct)
  {
    fqn: 'com.casino.payments',
    content: `
dsl_version: "1.1"
namespace: com.casino.payments

definitions:
  context:
    - name: payment-timeout-ms # Renamed for consistency
      value: 30000
      type: number
    - name: max-refund-days
      value: 30
      type: number
  components:
    - name: processPaymentOrRefundComponent # Generic name
      type: StdLib:HttpCall
      config:
        url: "{{secrets.payment-service-url}}/process" # This was for process, refund needs own URL
        method: POST
        timeoutMs: "{{context.payment-timeout-ms}}"
        headers:
          Authorization: "Bearer {{secrets.payment-api-key}}"
    - name: processRefundActualComponent
      type: StdLib:HttpCall
      config:
        url: "{{secrets.payment-service-url}}/refund"
        method: POST
        timeoutMs: "{{context.payment-timeout-ms}}"
        headers:
          Authorization: "Bearer {{secrets.payment-api-key}}"
    - name: processBetPaymentActualComponent
      type: StdLib:HttpCall
      config:
        url: "{{secrets.payment-service-url}}/process-payment"
        method: POST
        timeoutMs: "{{context.payment-timeout-ms}}"
    - name: processWithdrawalActualComponent
      type: StdLib:HttpCall
      config:
        url: "{{secrets.payment-service-url}}/process-withdrawal"
        method: POST
        timeoutMs: "{{context.payment-timeout-ms}}"

flows:
  - name: ProcessPaymentTransactionFlow # This is invoked by core.ProcessDepositFlow
    trigger: { type: StdLib:Manual } # Expects initialData: { depositData, fraudAssessment }
    steps:
      - step_id: execute-payment
        component_ref: processPaymentOrRefundComponent # Or a more specific named component
        inputs_map:
          data: "trigger.initialData.depositData" # Pass amount, paymentMethod etc.
        # This flow needs to output { success, processedAmount, transactionId }
        # For example, map from execute-payment.outputs.response.body
      - step_id: map-payment-output
        component_ref: StdLib:MapData
        config:
          expression: "{ success: data.status == 'completed', processedAmount: data.amount, transactionId: data.id }"
        inputs_map:
          data: "steps.execute-payment.outputs.response.body" # Assuming response structure
        run_after: [execute-payment]
    # The output of this flow is implicitly the output of its last step (map-payment-output.outputs.result)

  - name: ProcessBetPaymentFlow # Invoked by core.PlaceBetFlow
    trigger: { type: StdLib:Manual } # Expects initialData: { userId, amount, gameType }
    steps:
      - step_id: process-payment
        component_ref: processBetPaymentActualComponent
        inputs_map:
          data: "trigger.initialData"
      - step_id: map-bet-payment-output
        component_ref: StdLib:MapData
        config: # Example output structure
          expression: "{ success: data.status == 'success', transactionId: data.transaction_id, processedAmount: data.amount }"
        inputs_map:
          data: "steps.process-payment.outputs.response.body"
        run_after: [process-payment]

  - name: RefundFlow
    trigger:
      type: StdLib.Trigger:EventBus
      config:
        eventType: bet-cancelled
    steps:
      - step_id: validate-refund-eligibility
        component_ref: StdLib:FilterData
        config:
          expression: "data.daysSinceBet <= {{context.max-refund-days}} && data.originalBet.status == 'completed'"
          matchOutput: eligibleData
          noMatchOutput: ineligibleData
        inputs_map:
          data: "trigger.event" # EventBus trigger provides 'event'

      - step_id: calculate-refund-details # Renamed from calculate-refund
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              amount: data.originalBet.amount,
              userId: data.userId,
              refundReason: data.reason,
              originalTransactionId: data.originalBet.transactionId
            }
        inputs_map:
          data: "steps.validate-refund-eligibility.outputs.eligibleData" # originalBet, userId, reason
        run_after: [validate-refund-eligibility]
        condition: "steps.validate-refund-eligibility.outputs.eligibleData != null"

      - step_id: process-actual-refund
        component_ref: processRefundActualComponent
        inputs_map:
          data: "steps.calculate-refund-details.outputs.result"
        run_after: [calculate-refund-details]

  - name: ProcessWithdrawalFlow
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: /api/payments/withdraw
        method: POST
    steps:
      - step_id: validate-withdrawal
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
            type: object
            required: [userId, amount]
            properties:
              userId: { type: string }
              amount: { type: number, minimum: 10 }
        inputs_map:
          data: "trigger.body"

      - step_id: process-withdrawal-payment # Renamed from process-withdrawal
        component_ref: processWithdrawalActualComponent
        inputs_map:
          data: "steps.validate-withdrawal.outputs.validData"
        run_after: [validate-withdrawal]
    `
  },

  // ... Other modules (Compliance, KYC, Responsible, Bonuses, Analytics) would follow similar refactoring patterns ...
  // For brevity, I will not expand them all here but the principles are:
  // 1. Correct Fork usage.
  // 2. Correct SubFlowInvoker (flowName, initialData).
  // 3. Correct Trigger types (StdLib.Trigger:*).
  // 4. Use Named Components for HTTP calls.
  // 5. Check data flow and inputs_map.

  // Placeholder for KYC (Illustrating Fork refactor)
  {
    fqn: 'com.casino.kyc',
    content: `
dsl_version: "1.1"
namespace: com.casino.kyc
definitions:
  context:
    - name: kyc-provider-primary-url
      value: "https://api.kyc-primary.com"
      type: string
    - name: kyc-provider-secondary-url
      value: "https://api.kyc-secondary.com"
      type: string
    - name: document-verification-timeout-ms
      value: 30000
      type: number
  components:
    - name: callKycPrimaryDocumentVerify
      type: StdLib:HttpCall
      config: { url: "{{context.kyc-provider-primary-url}}/verify-document", method: POST, timeoutMs: "{{context.document-verification-timeout-ms}}" }
    - name: callKycSecondaryDocumentVerify
      type: StdLib:HttpCall
      config: { url: "{{secrets.kyc-secondary-url}}/verify-document", method: POST, timeoutMs: "{{context.document-verification-timeout-ms}}" } # Assuming kyc-secondary-url is a secret
    - name: callCreateKycSession
      type: StdLib:HttpCall
      config: { url: "{{secrets.kyc-service-url}}/sessions", method: POST, timeoutMs: 5000 }
flows:
  - name: InitiateKYCFlow
    trigger: { type: StdLib:Manual } # Invoked by UserOnboardingFlow
    # initialData: { userData, complianceData }
    steps:
      - step_id: create-kyc-session
        component_ref: callCreateKycSession
        inputs_map:
          data: "trigger.initialData" # Pass { userData, complianceData }

      - step_id: determine-kyc-level # Switch
        # ... (original switch logic is fine) ...
        inputs_map:
          data: "trigger.initialData.complianceData" # Use complianceData from trigger
        run_after: [create-kyc-session]

      - step_id: trigger-document-verification # Fork
        component_ref: StdLib:Fork
        config:
          outputNames: [for_primary_doc, for_secondary_doc]
        inputs_map:
          data: "{ sessionId: steps.create-kyc-session.outputs.response.body.sessionId, kycLevel: steps.determine-kyc-level.outputs.result }" # Pass data for verification calls
        run_after: [determine-kyc-level]

      - step_id: verify-doc-primary
        component_ref: callKycPrimaryDocumentVerify
        inputs_map:
          data: "steps.trigger-document-verification.outputs.for_primary_doc"
        run_after: [trigger-document-verification]
      - step_id: verify-doc-secondary
        component_ref: callKycSecondaryDocumentVerify
        inputs_map:
          data: "steps.trigger-document-verification.outputs.for_secondary_doc"
        run_after: [trigger-document-verification]
        condition: "steps.verify-doc-primary.outputs.response.body.status != 'verified'" # Example: fallback

      - step_id: calculate-kyc-score
        component_ref: StdLib:MapData
        # ... (original map logic is fine, adjust inputs) ...
        inputs_map:
          data: "{ primaryScore: steps.verify-doc-primary.outputs.response.body.confidence, secondaryScore: steps.verify-doc-secondary.outputs.response.body.confidence, dataConsistency: 0.9 }"
        run_after: [verify-doc-primary, verify-doc-secondary]
    # This flow should output { status: '...', ... }
    `
  },
  // Analytics Module (Illustrative)
  {
    fqn: 'com.casino.analytics',
    content: `
dsl_version: "1.1"
namespace: com.casino.analytics
definitions:
  components:
    - name: sendToAnalyticsService
      type: StdLib:HttpCall
      config:
        url: "{{secrets.analytics-service-url}}/events"
        method: POST
        timeoutMs: 2000
flows:
  - name: RecordGameplayAnalyticsFlow
    trigger: { type: StdLib:Manual } # Invoked by PlaceBetFlow
    # initialData: { userId, gameData, riskData }
    steps:
      - step_id: send-to-analytics
        component_ref: sendToAnalyticsService
        inputs_map:
          data: "trigger.initialData" # Pass all data to analytics service
  - name: TrackUserRegistrationFlow
    trigger: { type: StdLib:Manual } # Invoked by UserOnboardingFlow
    # initialData: { userId }
    steps:
      - step_id: send-registration-event
        component_ref: sendToAnalyticsService # Can reuse if event structure is flexible
        inputs_map:
          data: "{ eventType: 'userRegistration', payload: trigger.initialData }"
    `
  },
  // Bonuses Module
  {
    fqn: 'com.casino.bonuses',
    content: `dsl_version: "1.1"
namespace: com.casino.bonuses
imports:
  - namespace: com.casino.core # For potential context or shared components
    as: core
  - namespace: com.casino.users # For user data if needed directly
    as: users

definitions:
  context:
    - name: default-bonus-db-timeout-ms
      value: 3000
      type: number
    - name: referral-bonus-amount-standard
      value: 10 # e.g., 10 currency units
      type: number
    - name: referral-bonus-amount-vip-referrer
      value: 25
      type: number
    - name: default-wagering-multiplier
      value: 30 # e.g., 30x bonus amount
      type: number

  components:
    # --- Database Adapters ---
    - name: dbBonusAdapter
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "bonus-db-connection-string", timeoutMs: "{{context.default-bonus-db-timeout-ms}}" }
        # Default operation can be set here or in the step

    # --- Communication for Bonus Notifications (if any) ---
    - name: notifyBonusAwardedComponent
      type: Communication.SendNotification
      config:
        channel: "Push" # Example
        serviceType: "StdLibPlugin:FirebasePushAdapter"
        serviceConfig: { serverKeySecretName: "firebase-server-key" }

    # --- Logic Components ---
    - name: calculateWageringRequirement
      type: StdLib:MapData
      config:
        expression: "{ wageringRequired: data.bonusAmount * (data.customMultiplier || {{context.default-wagering-multiplier}}), bonusId: data.bonusId, userId: data.userId }"

flows:
  - name: ProcessReferralBonusFlow
    trigger:
      type: StdLib:Manual # Invoked by UserOnboardingFlow
      # Expected initialData: { newUserId, referralCode }
    steps:
      - step_id: get-referrer-details
        component_ref: dbBonusAdapter
        config:
          operation: "QuerySingleRow_ReturnFirst"
        inputs_map:
          requestData:
            query: "SELECT user_id, user_tier FROM users WHERE referral_code = $1 AND user_id != $2;" # Ensure not self-referral
            params: "[ trigger.initialData.referralCode, trigger.initialData.newUserId ]"
        outputs_map:
          error: "steps.fail-invalid-referral.inputs.data" # If referrer not found

      - step_id: fail-invalid-referral
        component_ref: StdLib:FailFlow
        config:
          errorMessageExpression: "{ message: 'Invalid or non-existent referral code.', type: 'ReferralBonus.InvalidCode' }"

      - step_id: determine-referral-bonus-amount
        component_ref: StdLib:MapData
        inputs_map:
          data: "steps.get-referrer-details.outputs.responseData" # Has user_tier
        config:
          expression: |
            {
              bonusAmount: data.user_tier == 'platinum' || data.user_tier == 'gold' ? {{context.referral-bonus-amount-vip-referrer}} : {{context.referral-bonus-amount-standard}},
              referrerId: data.user_id,
              newUserId: trigger.initialData.newUserId
            }
        run_after: [get-referrer-details]

      - step_id: award-bonus-to-referrer
        component_ref: dbBonusAdapter
        config:
          operation: "ExecuteDML"
        inputs_map:
          requestData:
            query: "INSERT INTO user_bonuses (user_id, bonus_type, amount, status, awarded_at) VALUES ($1, 'referral_credited', $2, 'active', NOW()); UPDATE users SET balance = balance + $2 WHERE user_id = $1;"
            params: "[ steps.determine-referral-bonus-amount.outputs.result.referrerId, steps.determine-referral-bonus-amount.outputs.result.bonusAmount ]"
        run_after: [determine-referral-bonus-amount]

      - step_id: award-bonus-to-new-user # New user might also get a bonus
        component_ref: dbBonusAdapter
        config:
          operation: "ExecuteDML"
        inputs_map:
          requestData:
            query: "INSERT INTO user_bonuses (user_id, bonus_type, amount, status, awarded_at) VALUES ($1, 'referral_received', $2, 'active', NOW()); UPDATE users SET balance = balance + $2 WHERE user_id = $1;"
            params: "[ steps.determine-referral-bonus-amount.outputs.result.newUserId, {{context.referral-bonus-amount-standard}} ]" # Example: new user gets standard amount
        run_after: [determine-referral-bonus-amount]
      # Optionally, notify users

  - name: EvaluateDepositBonusFlow
    trigger:
      type: StdLib:Manual # Invoked by ProcessDepositFlow
      # Expected initialData: { userId, depositAmount, bonusCode (optional) }
    steps:
      - step_id: get-bonus-definition
        component_ref: dbBonusAdapter
        config:
          operation: "QuerySingleRow_ReturnFirst"
        inputs_map:
          requestData:
            query: "SELECT bonus_id, bonus_type, min_deposit, percentage_match, max_bonus_amount, wagering_multiplier, valid_until FROM bonus_definitions WHERE bonus_code = $1 AND is_active = TRUE AND valid_until >= NOW();"
            params: "[ trigger.initialData.bonusCode ]"
        condition: "trigger.initialData.bonusCode != null" # Only if a bonus code is provided
        outputs_map:
          error: "steps.log-no-bonus-code-or-invalid.inputs.data"

      - step_id: log-no-bonus-code-or-invalid # Can be a NoOp or a specific logger if no active bonus
        component_ref: StdLib:NoOp # Or StdLib:Logger
        # config: { level: "INFO", messageExpression: "'No active bonus found for code: ' + trigger.initialData.bonusCode" }
        # This step is for control flow if the bonus definition is not found

      - step_id: check-deposit-eligibility
        component_ref: StdLib:FilterData
        config:
          expression: "data.depositAmount >= data.bonusDef.min_deposit"
          matchOutput: eligibleForBonus
          noMatchOutput: notEligibleAmount
        inputs_map:
          data: "{ depositAmount: trigger.initialData.depositAmount, bonusDef: steps.get-bonus-definition.outputs.responseData }"
        run_after: [get-bonus-definition]
        condition: "steps.get-bonus-definition.outputs.responseData != null" # Only if bonus def was found
        outputs_map:
          notEligibleAmount: "steps.log-deposit-not-eligible.inputs.data"

      - step_id: log-deposit-not-eligible
        component_ref: StdLib:NoOp # Or Logger
        # This step is for control flow if deposit amount is too low for the bonus

      - step_id: calculate-bonus-award
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              bonusAmountToAward: Math.min(data.depositAmount * (data.bonusDef.percentage_match / 100), data.bonusDef.max_bonus_amount),
              bonusId: data.bonusDef.bonus_id,
              userId: trigger.initialData.userId,
              wageringMultiplier: data.bonusDef.wagering_multiplier
            }
        inputs_map:
          data: "{ depositAmount: trigger.initialData.depositAmount, bonusDef: steps.check-deposit-eligibility.outputs.eligibleForBonus }" # Use data from filter pass
        run_after: [check-deposit-eligibility]
        condition: "steps.check-deposit-eligibility.outputs.eligibleForBonus != null"

      - step_id: calculate-wagering
        component_ref: calculateWageringRequirement
        inputs_map:
          data: "{ bonusAmount: steps.calculate-bonus-award.outputs.result.bonusAmountToAward, customMultiplier: steps.calculate-bonus-award.outputs.result.wageringMultiplier, bonusId: steps.calculate-bonus-award.outputs.result.bonusId, userId: steps.calculate-bonus-award.outputs.result.userId }"
        run_after: [calculate-bonus-award]

      - step_id: award-deposit-bonus
        component_ref: dbBonusAdapter
        config:
          operation: "ExecuteDML"
        inputs_map:
          requestData:
            query: "INSERT INTO user_bonuses (user_id, bonus_definition_id, amount, wagering_requirement, status, awarded_at) VALUES ($1, $2, $3, $4, 'active_wagering', NOW()); UPDATE users SET bonus_balance = bonus_balance + $3 WHERE user_id = $1;"
            params: "[ steps.calculate-wagering.outputs.result.userId, steps.calculate-wagering.outputs.result.bonusId, steps.calculate-bonus-award.outputs.result.bonusAmountToAward, steps.calculate-wagering.outputs.result.wageringRequired ]"
        run_after: [calculate-wagering]
      # Optionally notify user

  - name: AwardTierUpgradeBonusFlow
    trigger:
      type: StdLib:Manual # Invoked by EvaluateUserTierFlow
      # Expected initialData: { userId, newTier, oldTier }
    steps:
      - step_id: get-tier-bonus-definition
        component_ref: dbBonusAdapter
        config:
          operation: "QuerySingleRow_ReturnFirst"
        inputs_map:
          requestData:
            query: "SELECT bonus_id, fixed_amount, wagering_multiplier FROM bonus_definitions WHERE bonus_type = 'tier_upgrade' AND target_tier = $1 AND is_active = TRUE;"
            params: "[ trigger.initialData.newTier ]"
        outputs_map:
          error: "steps.log-no-tier-bonus-def.inputs.data"

      - step_id: log-no-tier-bonus-def
        component_ref: StdLib:NoOp

      - step_id: calculate-tier-wagering
        component_ref: calculateWageringRequirement
        inputs_map:
          data: "{ bonusAmount: steps.get-tier-bonus-definition.outputs.responseData.fixed_amount, customMultiplier: steps.get-tier-bonus-definition.outputs.responseData.wagering_multiplier, bonusId: steps.get-tier-bonus-definition.outputs.responseData.bonus_id, userId: trigger.initialData.userId }"
        run_after: [get-tier-bonus-definition]
        condition: "steps.get-tier-bonus-definition.outputs.responseData != null"

      - step_id: award-tier-bonus
        component_ref: dbBonusAdapter
        config:
          operation: "ExecuteDML"
        inputs_map:
          requestData:
            query: "INSERT INTO user_bonuses (user_id, bonus_definition_id, amount, wagering_requirement, status, awarded_at) VALUES ($1, $2, $3, $4, 'active_wagering', NOW()); UPDATE users SET bonus_balance = bonus_balance + $3 WHERE user_id = $1;"
            params: "[ steps.calculate-tier-wagering.outputs.result.userId, steps.calculate-tier-wagering.outputs.result.bonusId, steps.get-tier-bonus-definition.outputs.responseData.fixed_amount, steps.calculate-tier-wagering.outputs.result.wageringRequired ]"
        run_after: [calculate-tier-wagering]
        condition: "steps.calculate-tier-wagering.outputs.result != null"
      # Optionally notify

  - name: EvaluateBonusEligibilityFlow # Generic bonus evaluation post-gameplay
    trigger:
      type: StdLib:Manual # Invoked by PlaceBetFlow
      # Expected initialData: { userId, gameOutcome, userTier, betAmount }
    steps:
      # This flow could be complex:
      # 1. Check if any active bonuses have wagering requirements met by this gameplay.
      # 2. Check if this gameplay triggers any new "gameplay achievement" bonuses.
      # 3. Check for loyalty point accumulation.
      # For brevity, this is a placeholder.
      - step_id: check-active-wagering-bonuses
        component_ref: dbBonusAdapter
        config:
          operation: "QueryMultipleRows" # Conceptual
        inputs_map:
          requestData:
            query: "SELECT ub.user_bonus_id, ub.wagering_requirement, ub.wagering_progress, bd.game_type_contribution->>'$1' as contribution_percent FROM user_bonuses ub JOIN bonus_definitions bd ON ub.bonus_definition_id = bd.bonus_id WHERE ub.user_id = $2 AND ub.status = 'active_wagering';"
            params: "[ trigger.initialData.gameOutcome.gameType, trigger.initialData.userId ]"

      - step_id: update-wagering-progress # This would likely be a SplitList -> MapData -> Aggregate -> DB Update pattern
        component_ref: StdLib:NoOp # Placeholder for complex logic
        inputs_map:
          data: "{ activeBonuses: steps.check-active-wagering-bonuses.outputs.responseData, betAmount: trigger.initialData.betAmount, gameOutcome: trigger.initialData.gameOutcome }"
        run_after: [check-active-wagering-bonuses]
      # If wagering met, change bonus status to 'claimable' or auto-convert to real balance.`
  },
  // Compliance Module
  {
    fqn: 'com.casino.compliance',
    content: `dsl_version: "1.1"
namespace: com.casino.compliance
imports:
  - namespace: com.casino.core
    as: core

definitions:
  context:
    - name: default-compliance-db-timeout-ms
      value: 2000
      type: number
    - name: aml-threshold-single-bet
      value: 1000 # Amount above which a bet might need extra AML scrutiny
      type: number
    - name: aml-threshold-daily-bets
      value: 5000 # Cumulative daily bets amount for AML check
      type: number

  components:
    # --- Database Adapters ---
    - name: dbComplianceAdapter
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "compliance-db-connection-string", timeoutMs: "{{context.default-compliance-db-timeout-ms}}" }

    # --- External AML Check Service (if any) ---
    - name: callAmlCheckService
      type: StdLib:HttpCall
      config:
        url: "{{secrets.aml-check-service-url}}/screen"
        method: POST
        timeoutMs: 3000

flows:
  - name: ApproveBetFlow
    trigger:
      type: StdLib:Manual # Invoked by PlaceBetFlow
      # Expected initialData: { userId, betData: { amount, currency, gameType, ... }, riskAssessment: { overallRiskScore, riskLevel, ... } }
    steps:
      - step_id: check-bet-amount-aml
        component_ref: StdLib:FilterData
        config:
          expression: "data.betData.amount >= {{context.aml-threshold-single-bet}} || data.riskAssessment.riskLevel == 'high'"
          matchOutput: requiresAmlScreening
          noMatchOutput: amlScreeningNotRequired
        inputs_map:
          data: "trigger.initialData"

      - step_id: perform-external-aml-check
        component_ref: callAmlCheckService
        inputs_map:
          data: "{ userId: trigger.initialData.userId, amount: trigger.initialData.betData.amount, currency: trigger.initialData.betData.currency, transactionDetails: trigger.initialData.betData }"
        run_after: [check-bet-amount-aml]
        condition: "steps.check-bet-amount-aml.outputs.requiresAmlScreening != null"
        outputs_map:
          error: "steps.fail-aml-check.inputs.data" # If AML service fails

      - step_id: fail-aml-check
        component_ref: StdLib:FailFlow
        config:
          errorMessageExpression: "{ message: 'External AML check failed or returned high risk.', type: 'Compliance.AmlCheckFailed', details: data }"

      - step_id: evaluate-aml-result
        component_ref: StdLib:MapData
        config:
          expression: "{ amlClear: data.amlStatus == 'clear', requiresManualReview: data.amlStatus == 'review' }"
        inputs_map:
          data: "{ amlStatus: steps.perform-external-aml-check.outputs.response.body.status }" # Assuming response structure
        run_after: [perform-external-aml-check]
        condition: "steps.perform-external-aml-check.outputs.response != null" # Only if external check was done and successful

      - step_id: determine-final-approval
        component_ref: StdLib:MapData
        config:
          # Bet is approved if AML screening wasn't required, OR if it was required and the result is clear.
          # And risk assessment doesn't require manual review (handled in PlaceBetFlow before invoking this).
          expression: |
            {
              approved: (data.amlScreeningNotRequired || (data.amlScreeningRequired && data.amlClear)) && !data.requiresManualReviewFromAml,
              reason: data.amlScreeningRequired && !data.amlClear ? 'AML Flagged' :
                      data.requiresManualReviewFromAml ? 'AML Requires Manual Review' : 'Approved',
              complianceLogId: null # Would be set after logging
            }
        inputs_map:
          data: "{ amlScreeningNotRequired: steps.check-bet-amount-aml.outputs.amlScreeningNotRequired != null, amlScreeningRequired: steps.check-bet-amount-aml.outputs.requiresAmlScreening != null, amlClear: steps.evaluate-aml-result.outputs.result.amlClear, requiresManualReviewFromAml: steps.evaluate-aml-result.outputs.result.requiresManualReview }"
        run_after: [check-bet-amount-aml, evaluate-aml-result] # evaluate-aml-result might not run if amlScreeningNotRequired

      - step_id: log-compliance-action
        component_ref: dbComplianceAdapter
        config:
          operation: "ExecuteDML_ReturnFirst"
        inputs_map:
          requestData:
            query: "INSERT INTO compliance_log (user_id, action_type, subject_details_json, decision, reason, risk_assessment_json, timestamp) VALUES ($1, 'bet_approval', $2::jsonb, $3, $4, $5::jsonb, NOW()) RETURNING log_id;"
            params: "[ trigger.initialData.userId, trigger.initialData.betData, steps.determine-final-approval.outputs.result.approved ? 'APPROVED' : 'REVIEW_NEEDED_OR_DENIED', steps.determine-final-approval.outputs.result.reason, trigger.initialData.riskAssessment ]"
        run_after: [determine-final-approval]

      # This flow's output should be { approved: boolean, logId: string (optional) }
      # The PlaceBetFlow checks this 'approved' status.
      - step_id: prepare-flow-output
        component_ref: StdLib:MapData
        config:
          expression: "{ approved: data.decision.approved, complianceLogId: data.log.log_id }"
        inputs_map:
          data: "{ decision: steps.determine-final-approval.outputs.result, log: steps.log-compliance-action.outputs.responseData }"
        run_after: [log-compliance-action]`
  },
  // Responsible Gaming Module
  {
    fqn: 'com.casino.responsible',
    content: `dsl_version: "1.1"
namespace: com.casino.responsible
imports:
  - namespace: com.casino.core
    as: core

definitions:
  context:
    - name: default-responsible-db-timeout-ms
      value: 2000
      type: number
    - name: default-daily-deposit-limit
      value: 1000
      type: number
    - name: default-monthly-loss-limit
      value: 5000
      type: number
    - name: default-session-time-limit-minutes
      value: 180 # 3 hours
      type: number
    - name: cooling-off-period-days
      value: [1, 7, 30] # Available options
      type: array
    - name: self-exclusion-period-months
      value: [6, 12, 60] # 6m, 1y, 5y
      type: array

  components:
    # --- Database Adapters ---
    - name: dbResponsibleAdapter
      type: Integration.ExternalServiceAdapter
      config:
        adapterType: "StdLibPlugin:PostgresAdapter"
        adapterConfig: { connectionStringSecretName: "responsible-gaming-db-connection-string", timeoutMs: "{{context.default-responsible-db-timeout-ms}}" }

    # --- Communication for alerts/interventions ---
    - name: sendLimitApproachingAlertComponent
      type: Communication.SendNotification
      config:
        channel: "InAppMessage" # Example, could be Email/SMS
        serviceType: "StdLibPlugin:InAppMessagingAdapter"
        serviceConfig: { apiKeySecretName: "in-app-messaging-key" }

flows:
  - name: SetupDefaultLimitsFlow
    trigger:
      type: StdLib:Manual # Invoked by UserOnboardingFlow
      # Expected initialData: { userId, userTier }
    steps:
      - step_id: apply-default-limits
        component_ref: dbResponsibleAdapter
        config:
          operation: "ExecuteDML"
        inputs_map:
          requestData:
            query: |
              INSERT INTO user_responsible_gaming_limits
              (user_id, limit_type, limit_value, period, is_active, set_at, expires_at)
              VALUES
              ($1, 'deposit', $2, 'daily', TRUE, NOW(), NULL),
              ($1, 'loss', $3, 'monthly', TRUE, NOW(), NULL),
              ($1, 'session_time', $4, 'session', TRUE, NOW(), NULL)
              ON CONFLICT (user_id, limit_type, period) DO NOTHING;
            params: "[ trigger.initialData.userId, {{context.default-daily-deposit-limit}}, {{context.default-monthly-loss-limit}}, {{context.default-session-time-limit-minutes}} ]"
      # Output can be a simple success indicator.
      - step_id: set-output-success
        component_ref: StdLib:MapData
        config: { expression: "{ success: true, userId: trigger.initialData.userId, limitsSet: ['deposit_daily', 'loss_monthly', 'session_time'] }" }
        run_after: [apply-default-limits]

  - name: ValidateBettingLimitsFlow
    trigger:
      type: StdLib:Manual # Invoked by PlaceBetFlow
      # Expected initialData: { userId, betAmount, gameType }
    steps:
      - step_id: get-user-current-spend-and-limits
        component_ref: dbResponsibleAdapter
        config:
          operation: "QuerySingleRow_ReturnFirst"
        inputs_map:
          requestData:
            # This query needs to fetch current daily/weekly/monthly spend/loss, session time, and active limits
            query: "SELECT daily_loss_limit, current_daily_loss, session_time_limit, current_session_duration_minutes, etc FROM user_responsible_gaming_summary_view WHERE user_id = $1;"
            params: "[ trigger.initialData.userId ]"
        outputs_map:
          error: "steps.fail-getting-limits.inputs.data"

      - step_id: fail-getting-limits
        component_ref: StdLib:FailFlow
        config:
          errorMessageExpression: "{ message: 'Failed to retrieve user responsible gaming limits.', type: 'ResponsibleGaming.LimitsFetchError' }"

      - step_id: check-loss-limits
        component_ref: StdLib:FilterData
        config:
          # Simplified: assumes betAmount is potential loss for this check
          expression: "(data.limits.daily_loss_limit == null || (data.limits.current_daily_loss + data.betAmount) <= data.limits.daily_loss_limit) && (data.limits.session_time_limit == null || data.limits.current_session_duration_minutes < data.limits.session_time_limit)"
          matchOutput: limitsOk
          noMatchOutput: limitExceeded
        inputs_map:
          data: "{ limits: steps.get-user-current-spend-and-limits.outputs.responseData, betAmount: trigger.initialData.betAmount }"
        run_after: [get-user-current-spend-and-limits]
        outputs_map:
          limitExceeded: "steps.fail-on-limit-exceeded.inputs.data"

      - step_id: fail-on-limit-exceeded
        component_ref: StdLib:FailFlow
        config:
          errorMessageExpression: "{ message: 'Bet exceeds responsible gaming limits (loss or session time).', type: 'ResponsibleGaming.LimitExceeded', details: data.limits }" # 'data' here is the input to check-loss-limits

      - step_id: check-cooldown-or-exclusion
        component_ref: dbResponsibleAdapter
        config:
          operation: "QuerySingleRow_ReturnFirst"
        inputs_map:
          requestData:
            query: "SELECT status_type, end_date FROM user_gaming_status WHERE user_id = $1 AND status_type IN ('cooling_off', 'self_exclusion') AND (end_date IS NULL OR end_date >= NOW()) ORDER BY set_at DESC LIMIT 1;"
            params: "[ trigger.initialData.userId ]"
        run_after: [check-loss-limits] # Only if other limits are OK
        condition: "steps.check-loss-limits.outputs.limitsOk != null"

      - step_id: filter-active-restriction
        component_ref: StdLib:FilterData
        config:
          expression: "data == null" # If query returns null, no active restriction
          matchOutput: noRestriction
          noMatchOutput: restrictionActive
        inputs_map:
          data: "steps.check-cooldown-or-exclusion.outputs.responseData" # This will be null if no row found
        run_after: [check-cooldown-or-exclusion]
        outputs_map:
          restrictionActive: "steps.fail-on-active-restriction.inputs.data"

      - step_id: fail-on-active-restriction
        component_ref: StdLib:FailFlow
        config:
          errorMessageExpression: "{ message: 'Account has an active cooling-off period or self-exclusion.', type: 'ResponsibleGaming.RestrictionActive', details: data }" # 'data' here is the restriction details

      # If all checks pass, the flow output indicates approval
      - step_id: prepare-approval-output
        component_ref: StdLib:MapData
        config:
          expression: "{ approved: true, userId: trigger.initialData.userId, checksPassed: ['loss_limit', 'session_limit', 'cooldown_exclusion'] }"
        run_after: [filter-active-restriction]
        condition: "steps.filter-active-restriction.outputs.noRestriction != null"

  # Flow for user to set/update their own limits
  - name: UpdateUserLimitsFlow
    trigger:
      type: StdLib.Trigger:Http # Authenticated endpoint
      config:
        path: /api/responsible/limits
        method: POST
        authentication: { type: "JwtValidator" } # Requires user to be logged in
        responseConfig: { errorStatusCode: 400 }
    steps:
      - step_id: validate-limit-request
        component_ref: StdLib:JsonSchemaValidator
        # Schema would define limit_type (deposit, loss, wager, session_time), value, period (daily, weekly, monthly)
        config:
          schema:
            type: object
            required: [limit_type, value, period]
            properties:
              limit_type: { type: string, enum: ["deposit", "loss", "wager", "session_time"] }
              value: { type: number, minimum: 0 } # 0 could mean remove limit, or specific handling
              period: { type: string, enum: ["daily", "weekly", "monthly", "session"] }
        inputs_map: { data: "trigger.body" }
        outputs_map: { error: "steps.fail-limit-validation.inputs.data" }

      - step_id: fail-limit-validation
        component_ref: StdLib:FailFlow
        config: { errorMessageExpression: "{ message: 'Invalid limit update request.', type: 'ResponsibleGaming.InvalidLimitRequest', details: data.details }" }

      - step_id: persist-updated-limit
        component_ref: dbResponsibleAdapter
        config:
          operation: "ExecuteDML"
        inputs_map:
          requestData:
            query: |
              INSERT INTO user_responsible_gaming_limits
              (user_id, limit_type, limit_value, period, is_active, set_at, expires_at_calculation_logic) -- expires_at might be complex
              VALUES ($1, $2, $3, $4, TRUE, NOW(), ...)
              ON CONFLICT (user_id, limit_type, period) DO UPDATE SET
              limit_value = EXCLUDED.limit_value,
              is_active = TRUE,
              set_at = NOW(),
              previous_limit_value = user_responsible_gaming_limits.limit_value;
            params: "[ trigger.principal.id, steps.validate-limit-request.outputs.validData.limit_type, steps.validate-limit-request.outputs.validData.value, steps.validate-limit-request.outputs.validData.period ]"
        run_after: [validate-limit-request]
      # Output success`
  }
];

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
      "HttpTriggerRequest": {
        $id: "#/definitions/schemas/HttpTriggerRequest",
        type: "object",
        properties: {
          path: { type: "string", description: "Actual request path." },
          method: { type: "string", description: "HTTP method used." },
          headers: {
            type: "object",
            additionalProperties: { type: "string" },
            description: "Request headers."
          },
          queryParameters: {
            type: "object",
            additionalProperties: { type: ["string", "array"], items: { type: "string" } },
            description: "Parsed query parameters."
          },
          body: {
            description: "Request body. Object if JSON, string otherwise (Base64 for binary). Null if no body.",
            oneOf: [
              { type: "object", additionalProperties: true },
              { type: "array" },
              { type: "string" },
              { type: "null" }
            ]
          },
          principal: {
            type: ["object", "null"],
            description: "Authenticated principal details, if applicable. Structure depends on auth method.",
            properties: {
              id: { type: "string" },
              type: { type: "string", description: "e.g., 'user', 'apiKey', 'service_account'" },
              claims: { type: "object", additionalProperties: true, description: "Additional claims/attributes from token/auth provider." }
            },
            required: ["id", "type"]
          }
        },
        required: ["path", "method", "headers"]
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
            // type: "any" is not valid JSON schema, typically represented by not specifying type or using oneOf with multiple types
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
      }
    }
  },

  // --- Trigger Schemas ---
  'StdLib.Trigger:Http': {
    fqn: 'StdLib.Trigger:Http',
    configSchema: { // from stdlib.yml.md config_schema for StdLib.Trigger:Http
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "HTTP path prefix for this trigger (e.g., '/api/v1/orders'). Must be unique.",
          pattern: "^/"
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
          description: "HTTP method to listen for."
        },
        authentication: {
          type: "object",
          description: "Configuration for authentication middleware (e.g., API Key, JWT). Processed by Core before triggering.",
          additionalProperties: true
        },
        requestSchema: {
          type: "object", // JSON Schema
          description: "Optional JSON Schema to validate the incoming request body (if applicable for method). Rejection occurs before flow trigger."
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
              default: 500,
              description: "Default HTTP status code if flow fails or an unhandled error occurs."
            },
            successBodyExpression: { type: "string", description: "JMESPath/JsonPointer expression evaluated against flow's final output data to form the success response body." },
            errorBodyExpression: { type: "string", description: "JMESPath/JsonPointer expression evaluated against flow's error object to form the error response body."}
          },
          additionalProperties: true
        },
        timeoutMs: {
          type: "integer",
          minimum: 1, // PositiveInteger
          default: 30000,
          description: "Maximum time Core will wait for the flow to complete for a synchronous HTTP response."
        }
      },
      required: ["path", "method"]
    },
    outputSchema: { $ref: "#/definitions/schemas/HttpTriggerRequest" } // This is the output_to_flow_schema
  },
  'StdLib.Trigger:EventBus': {
    fqn: 'StdLib.Trigger:EventBus',
    configSchema: { // from stdlib.yml.md config_schema for StdLib.Trigger:EventBus
      type: "object",
      properties: {
        eventTypePattern: {
          type: "string",
          description: "Pattern to match event types (e.g., 'user.created', 'order.*.processed'). Core defines pattern syntax."
        },
        filterExpression: {
          type: "string", // ExpressionString
          description: "Optional expression (e.g., JMESPath) evaluated against the event's payload to further filter events."
        },
        filterLanguage: {
          type: "string",
          enum: ["JMESPath", "JsonPointer"],
          default: "JMESPath"
        }
      },
      required: ["eventTypePattern"]
    },
    outputSchema: { $ref: "#/definitions/schemas/EventBusTriggerPayload" } // This is the output_to_flow_schema
  },
  'StdLib.Trigger:Manual': { // Conceptual, from stdlib.yml.md
    fqn: 'StdLib.Trigger:Manual',
    configSchema: {
      type: "object",
      description: "Configuration is implicit: the 'initialData' provided at invocation time.",
      properties: {
        initialData: {
          description: "The data payload provided when the flow is manually triggered."
        }
      }
    },
    outputSchema: { // Represents trigger.initialData which can be 'any'
      description: "The data payload provided when the flow is manually triggered. Structure is defined by the invoker."
    }
  },
  // --- StdLib & Other Components ---
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
    outputSchema: { // Represents the 'validData' output port
      description: "Original input 'data' if conforms to schema."
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
      // 'data' is not strictly required by stdlib.yml.md for FailFlow input, but often used.
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
          items: { type: "string" }, // OutputPortNameString
          description: "List of names for output ports."
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
    outputSchema: { // Conceptual: Data on dynamic output ports is a copy of input 'data'
      description: "Copy of input data, available on dynamically named output ports."
    }
  },
  'StdLib:HttpCall': {
    fqn: 'StdLib:HttpCall',
    configSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Target URL (sandboxed if expression)." }, // ["URLString", "ExpressionString"] -> string
        method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], default: "GET" },
        headers: {
          oneOf: [{type: "object"}, {type: "string"}], // ["object", "ExpressionString"]
          description: "Request headers. Values support {{secrets.my_secret}}. Sandboxed if expression."
        },
        bodyExpression: { type: "string", description: "Expression for request body (sandboxed). If omitted, input 'data' used." },
        bodyLanguage: { type: "string", enum: ["JMESPath", "JsonPointer"], default: "JMESPath" },
        contentType: { type: "string", default: "application/json", description: "Content-Type header for request body." }, // ContentTypeString
        queryParameters: {
           oneOf: [{type: "object"}, {type: "string"}], // ["object", "ExpressionString"]
           description: "URL query parameters. Sandboxed if expression."
        },
        timeoutMs: { type: "integer", minimum: 1, default: 5000, description: "Request timeout in ms." }, // PositiveInteger
        followRedirects: { type: "boolean", default: false, description: "Whether to follow HTTP 3xx redirects." }
      },
      required: ["url"] // method has a default
    },
    inputSchema: {
      type: "object",
      properties: {
        data: { description: "Context for expressions and default request body." }
      }
      // 'data' is not strictly required per stdlib.yml.md but often used.
    },
    outputSchema: { $ref: "#/definitions/schemas/HttpResponse" } // Represents the 'response' output port
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
    outputSchema: { // Represents the 'result' output port
        description: "Transformed data."
    }
  },
  'StdLib:SubFlowInvoker': {
    fqn: 'StdLib:SubFlowInvoker',
    configSchema: {
      type: "object",
      properties: {
        flowName: { type: "string", description: "Target Flow definition name. Sandboxed if expression." }, // ["FlowNameString", "ExpressionString"] -> string
        waitForCompletion: { type: "boolean", default: false, description: "Pause and wait for sub-flow completion?" },
        timeoutMs: { type: "integer", minimum: 1, description: "Max wait time if waitForCompletion=true." }, // PositiveInteger
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
    outputSchema: { // Represents 'subFlowInstanceId' or 'result' port
      oneOf: [
        { type: "string", description: "Unique instance ID of started sub-flow (if not waiting or immediate emission)." },
        { description: "Final output from sub-flow's success (if waitForCompletion=true & success)." }
      ]
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
        defaultOutputName: { type: "string", default: "defaultOutput", description: "Output port if no cases match." } // OutputPortNameString
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
    outputSchema: { // Conceptual: Data on dynamic output ports is the original input 'data'
      description: "Input data, available on dynamically named output port that matched."
    }
  },
  'StdLib:FilterData': {
    fqn: 'StdLib:FilterData',
    configSchema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Boolean expression (sandboxed)." }, // BooleanExpressionString
        language: { type: "string", enum: ["JMESPath", "JsonPointer"], default: "JMESPath", description: "Expression language." },
        matchOutput: { type: "string", default: "matchOutput", description: "Output port name for true evaluation." }, // OutputPortNameString
        noMatchOutput: { type: "string", default: "noMatchOutput", description: "Output port name for false evaluation." } // OutputPortNameString
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
    outputSchema: { // Conceptual: Data on 'matchOutput' or 'noMatchOutput' is the original input 'data'
      description: "Input data, available on 'matchOutput' or 'noMatchOutput' port."
    }
  },
  'StdLib:MergeStreams': { // Not in stdlib.yml.md, defined based on common usage
    fqn: 'StdLib:MergeStreams',
    configSchema: {
      type: "object",
      properties: {
        inputNames: {
          type: "array",
          items: { type: "string" }, // InputPortNameString
          description: "List of input port names to merge."
        },
        mergedOutputName: { type: "string", default: "mergedOutput", description: "Single output port name." } // OutputPortNameString
      },
      required: ["inputNames"]
    },
    inputSchema: { // Conceptual: Dynamic input ports
      type: "object",
      description: "Dynamically defined input ports matching inputNames. Each port receives any data.",
      additionalProperties: {
        description: "Data from one of the input streams."
      }
    },
    outputSchema: { // Conceptual: One dynamic output port
      description: "Data packet from one of the inputs, available on the 'mergedOutputName' port."
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
    outputSchema: { // Represents the 'data' output port
      description: "Input data, unchanged."
    }
  },
  'Integration.ExternalServiceAdapter': {
    fqn: 'Integration.ExternalServiceAdapter',
    configSchema: {
      type: "object",
      properties: {
        adapterType: { type: "string", description: "Adapter plugin identifier (e.g., KafkaAdapter, PostgresSqlAdapter)." }, // PluginIdentifierString
        adapterConfig: { type: "object", description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." },
        operation: { type: "string", description: "Logical action defined by plugin (e.g., GetUser, Publish, Query)." } // OperationNameString
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
    outputSchema: { // Represents the 'responseData' output port
      description: "Parsed/structured data from external service via plugin, per operation."
    }
  },
  'Communication.SendEmail': {
    fqn: 'Communication.SendEmail',
    configSchema: {
      type: "object",
      properties: {
        serviceType: { type: "string", description: "Email service plugin ID (e.g., SendGridAdapter)." }, // PluginIdentifierString
        serviceConfig: { type: "object", description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." },
        fromAddress: { type: "string", description: "'From' email address (sandboxed if expression)." }, // ["EmailString", "ExpressionString"]
        defaultFromName: { type: "string", description: "Default 'From' name." }
      },
      required: ["serviceType", "serviceConfig", "fromAddress"]
    },
    inputSchema: {
      type: "object",
      properties: {
        toAddresses: { description: "Recipients (sandboxed if expression).", oneOf: [{type: "string"}, {type: "array", items: {type: "string"}}]}, // ["EmailString", "list<EmailString>", "ExpressionString"]
        ccAddresses: { description: "CC recipients (sandboxed if expression).", oneOf: [{type: "string"}, {type: "array", items: {type: "string"}}]},
        bccAddresses: { description: "BCC recipients (sandboxed if expression).", oneOf: [{type: "string"}, {type: "array", items: {type: "string"}}]},
        subject: { type: "string", description: "Email subject (sandboxed if expression)." }, // ["string", "ExpressionString"]
        bodyHtml: { type: "string", description: "HTML email body (sandboxed if expression)." }, // ["string", "ExpressionString"]
        bodyText: { type: "string", description: "Plain text email body (sandboxed if expression)." }, // ["string", "ExpressionString"]
        templateId: { type: "string", description: "Service template ID (sandboxed if expression)." }, // ["string", "ExpressionString"]
        templateData: { oneOf: [{type: "object"}, {type: "string"}], description: "Key-value data for template merge (sandboxed if expression)." }, // ["object", "ExpressionString"]
        attachments: {
          type: "array",
          description: "List of attachments.",
          items: {
            type: "object",
            properties: {
              filename: { type: "string" },
              contentType: { type: "string" },
              content: { type: "string", description: "Base64 encoded content or expression yielding it." } // ["bytes", "ExpressionString"] -> string
            },
            required: ["filename", "contentType", "content"]
          }
        },
        data: { type: "object", description: "Context for all expression inputs." } // Context for expressions
      },
      required: ["toAddresses", "subject"] // bodyHtml or bodyText or templateId also effectively required by logic
    },
    outputSchema: { // Represents the 'result' output port
      type: "object",
      properties: {
        messageId: { type: "string", description: "Optional: Provider's message ID." },
        status: { type: "string", enum: ["queued", "sent"], description: "Status from service API." } // Example, actual values per plugin
      },
      required: ["status"]
    }
  },
  'Communication.SendNotification': {
    fqn: 'Communication.SendNotification',
    configSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Target channel (sandboxed if expression)." }, // ["enum('Email', 'SMS', 'Push', 'Slack')", "ExpressionString"]
        serviceType: { type: "string", description: "Specific service plugin ID for channel. Sandboxed if expression." }, // ["PluginIdentifierString", "ExpressionString"]
        serviceConfig: { oneOf: [{type: "object"}, {type: "string"}], description: "Plugin/channel-specific config. Use Core Secrets. Sandboxed if expression." }, // ["object", "ExpressionString"]
        templateId: { type: "string", description: "Template ID for service/channel (sandboxed if expression)." } // ["string", "ExpressionString"]
      },
      required: ["channel"]
    },
    inputSchema: {
      type: "object",
      properties: {
        recipient: { description: "Recipient ID (email, phone, token, webhook). Structure per channel. Sandboxed if expression." }, // ["any", "ExpressionString"]
        message: { description: "Message content payload. Structure per channel. Sandboxed if expression." }, // ["string", "object", "ExpressionString"]
        data: { type: "object", description: "Context for all expression inputs." } // Context for expressions
      },
      required: ["recipient", "message"]
    },
    outputSchema: { // Represents the 'result' output port
      type: "object",
      properties: {
        deliveryId: { type: "string", description: "Optional: Provider's delivery/message ID." },
        status: { type: "string", description: "Status from service API (e.g., queued, sent)." } // enum per plugin
      },
      required: ["status"]
    }
  },
  'Security.Authorize': {
    fqn: 'Security.Authorize',
    configSchema: {
    type: "object",
    properties: {
        policySourceType: { type: "string", description: "How decisions are made (e.g., 'Static', 'Opa', or PluginIdentifierString)." }, // ["enum('Static', 'Opa', 'DatabaseLookup')", "PluginIdentifierString"]
        policySourceConfig: { type: "object", description: "Config for policySourceType. Structure per type/plugin schema. Use Core Secrets." },
        inputDataExpression: { type: "string", description: "JMESPath to construct/transform input 'data' for policy eval (sandboxed)." } // ExpressionString
      },
      required: ["policySourceType", "policySourceConfig"]
    },
    inputSchema: {
    type: "object",
    properties: {
        data: {
          type: "object",
          description: "Context for auth decision (principal, action, resource)."
          // Expected structure based on stdlib.yml.md example:
          // properties: {
          //   principal: { type: "object", properties: { id: {type: "string"}, roles: {type: "array", items: {type: "string"}}, permissions: {type: "array", items: {type: "string"}} } },
          //   action: { type: "string" },
          //   resource: { type: "object", properties: { type: {type: "string"}, id: {type: "string"}, attributes: {type: "object"} } }
          // }
        }
      },
      required: ["data"]
    },
    outputSchema: { // Represents the 'authorized' output port
      description: "Emits original input 'data' if granted."
    }
  }
};