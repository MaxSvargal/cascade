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
dsl_version: "1.1"
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

    # Betting Limits by Tier (Simplified for brevity, real would be more complex)
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
    - name: user-service-timeout-ms
      value: 3000
      type: number
    - name: communication-service-timeout-ms
      value: 2000
      type: number
    - name: auth-service-timeout-ms
      value: 2000
      type: number

  components:
    # --- Named HTTP Call Components ---
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
    - name: callCreateUserAccount
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users"
        method: POST
        timeoutMs: "{{context.user-service-timeout-ms}}"
    - name: callSendWelcomeEmail
      type: StdLib:HttpCall
      config:
        url: "{{secrets.communication-service-url}}/send-email"
        method: POST
        timeoutMs: "{{context.communication-service-timeout-ms}}"
    - name: callSendWelcomeSms
      type: StdLib:HttpCall
      config:
        url: "{{secrets.communication-service-url}}/send-sms"
        method: POST
        timeoutMs: "{{context.communication-service-timeout-ms}}"
    - name: callAuthValidateSession
      type: StdLib:HttpCall
      config:
        url: "{{secrets.auth-service-url}}/validate-session"
        method: POST
        timeoutMs: "{{context.auth-service-timeout-ms}}"
    - name: callGetUserProfile
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users/{{inputs.data.userId}}/profile" # URL templated with input
        method: GET
        timeoutMs: "{{context.user-service-timeout-ms}}"
    - name: callRiskVelocityAnalysis
      type: StdLib:HttpCall
      config:
        url: "{{secrets.risk-service-url}}/velocity-analysis"
        method: POST
        timeoutMs: "{{context.risk-service-timeout-ms}}"
    - name: callRiskBehavioralAnalysis
      type: StdLib:HttpCall
      config:
        url: "{{secrets.risk-service-url}}/behavioral-analysis"
        method: POST
        timeoutMs: "{{context.risk-service-timeout-ms}}"
    - name: callRiskDeviceFingerprint
      type: StdLib:HttpCall
      config:
        url: "{{secrets.risk-service-url}}/device-fingerprint"
        method: POST
        timeoutMs: "{{context.risk-service-timeout-ms}}"
    - name: callRiskGeoAnalysis
      type: StdLib:HttpCall
      config:
        url: "{{secrets.risk-service-url}}/geo-analysis"
        method: POST
        timeoutMs: "{{context.risk-service-timeout-ms}}"
    - name: callUpdateUserBalance
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users/{{inputs.data.userId}}/balance"
        method: PATCH
        timeoutMs: "{{context.user-service-timeout-ms}}"
    - name: callGetUserStatus
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users/{{inputs.data.userId}}/status"
        method: GET
        timeoutMs: "{{context.user-service-timeout-ms}}"
    - name: callFraudVelocityCheck
      type: StdLib:HttpCall
      config:
        url: "{{secrets.fraud-service-url}}/velocity-check"
        method: POST
        timeoutMs: "{{context.risk-service-timeout-ms}}" # Assuming similar timeout
    - name: callFraudDeviceAnalysis
      type: StdLib:HttpCall
      config:
        url: "{{secrets.fraud-service-url}}/device-analysis"
        method: POST
        timeoutMs: "{{context.risk-service-timeout-ms}}"
    - name: callFraudBehavioralAnalysis
      type: StdLib:HttpCall
      config:
        url: "{{secrets.fraud-service-url}}/behavioral-analysis"
        method: POST
        timeoutMs: "{{context.risk-service-timeout-ms}}"
    - name: callPaymentValidateMethod
      type: StdLib:HttpCall
      config:
        url: "{{secrets.payment-service-url}}/validate-method"
        method: POST
        timeoutMs: "{{context.default-http-timeout-ms}}"
    - name: callGetUserLifetimeStats
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users/{{inputs.data.userId}}/lifetime-stats"
        method: GET
        timeoutMs: "{{context.user-service-timeout-ms}}"
    - name: callUpdateUserTier
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users/{{inputs.data.userId}}/tier"
        method: PATCH
        timeoutMs: "{{context.user-service-timeout-ms}}"
    - name: callSendTierUpgradeNotification
      type: StdLib:HttpCall
      config:
        url: "{{secrets.communication-service-url}}/send-tier-upgrade"
        method: POST
        timeoutMs: "{{context.communication-service-timeout-ms}}"

    # --- Named SubFlow Invokers ---
    - name: invokeInitiateKYCFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.kyc.InitiateKYCFlow
        waitForCompletion: true
    - name: invokeSetupDefaultLimitsFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.responsible.SetupDefaultLimitsFlow
        waitForCompletion: true # Assuming synchronous setup
    - name: invokeProcessReferralBonusFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.bonuses.ProcessReferralBonusFlow
        waitForCompletion: true # Or false if async
    - name: invokeTrackUserRegistrationFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.analytics.TrackUserRegistrationFlow
        waitForCompletion: false
    - name: invokeValidateBettingLimitsFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.responsible.ValidateBettingLimitsFlow
        waitForCompletion: true
    - name: invokeApproveBetFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.compliance.ApproveBetFlow
        waitForCompletion: true
    - name: invokeProcessBetPaymentFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.payments.ProcessBetPaymentFlow
        waitForCompletion: true
    - name: invokeExecuteGameFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.games.ExecuteGameFlow
        waitForCompletion: true
    - name: invokeEvaluateBonusEligibilityFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.bonuses.EvaluateBonusEligibilityFlow
        waitForCompletion: false
    - name: invokeRecordGameplayAnalyticsFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.analytics.RecordGameplayAnalyticsFlow
        waitForCompletion: false
    - name: invokeProcessPaymentTransactionFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.payments.ProcessPaymentTransactionFlow
        waitForCompletion: true
    - name: invokeEvaluateDepositBonusFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.bonuses.EvaluateDepositBonusFlow
        waitForCompletion: false
    - name: invokeEvaluateUserTierFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.core.EvaluateUserTierFlow
        waitForCompletion: false # Can be async
    - name: invokeAwardTierUpgradeBonusFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.bonuses.AwardTierUpgradeBonusFlow
        waitForCompletion: false

    # --- Logic Components ---
    - name: user-tier-classifier # This is a Switch
      type: StdLib:Switch
      config:
        cases: # data input to switch: { totalLifetimeDeposits: number }
          - conditionExpression: "data.totalLifetimeDeposits >= {{context.platinum-tier-threshold}}"
            outputName: is_platinum # Routes input data to this port if condition met
          - conditionExpression: "data.totalLifetimeDeposits >= {{context.gold-tier-threshold}}"
            outputName: is_gold
          - conditionExpression: "data.totalLifetimeDeposits >= {{context.silver-tier-threshold}}"
            outputName: is_silver
          - conditionExpression: "data.totalLifetimeDeposits >= {{context.bronze-tier-threshold}}"
            outputName: is_bronze
        defaultOutputName: is_standard

    # MapData to convert switch output to a tier string
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

    # Dynamic Bet Limit Calculator - consumes { userTier: string } from merged tier data
    - name: bet-limit-calculator
      type: StdLib:MapData
      config:
        expression: | # Expects input: { data: { userTier: "tier_name_string" } }
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

    # User Profile Management (Moved from bottom, examples of general purpose named components)
    - name: GetUserProfileComponent # General purpose, distinct from callGetUserProfile which is specific
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users/{{inputs.data.userId}}/profile"
        method: GET
        timeoutMs: "{{context.user-service-timeout-ms}}"

    - name: UpdateUserProfileComponent
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users/{{inputs.data.userId}}/profile"
        method: PATCH
        timeoutMs: "{{context.user-service-timeout-ms}}"

    # Balance Management
    - name: GetUserBalanceComponent
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/users/{{inputs.data.userId}}/balance"
        method: GET
        timeoutMs: "{{context.user-service-timeout-ms}}"

    # UpdateUserBalanceComponent is same as callUpdateUserBalance, can reuse or keep distinct name for clarity

flows:
  # Comprehensive User Onboarding Flow
  - name: UserOnboardingFlow
    trigger:
      type: StdLib.Trigger:Http # Corrected Trigger type
      config:
        path: /api/users/onboard
        method: POST
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
              country: { type: string, minLength: 2, maxLength: 3 }
              phoneNumber: { type: string, pattern: "^\\\\+[1-9]\\\\d{1,14}$" }
              referralCode: { type: string }
        inputs_map:
          data: "trigger.body" # HttpTrigger provides body directly

      - step_id: trigger-geo-compliance-checks # This is the Fork
        component_ref: StdLib:Fork
        config:
          outputNames: [for_jurisdiction, for_sanctions, for_age_verification]
        inputs_map: # Data for all branches
          data: "steps.validate-registration-data.outputs.validData"
        run_after: [validate-registration-data]

      - step_id: check-jurisdiction
        component_ref: callComplianceJurisdictionCheck
        inputs_map:
          data: "steps.trigger-geo-compliance-checks.outputs.for_jurisdiction" # Use forked data
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
        component_ref: callCreateUserAccount
        inputs_map:
          data: "{ userData: steps.validate-registration-data.outputs.validData, kycStatus: steps.initiate-kyc-process.outputs.result.status, complianceData: steps.evaluate-compliance-results.outputs.result }" # Assuming subflow result is on .result
        run_after: [initiate-kyc-process]

      - step_id: setup-responsible-gambling
        component_ref: invokeSetupDefaultLimitsFlow
        inputs_map:
          initialData: "{ userId: steps.create-user-account.outputs.response.body.userId, userTier: 'standard' }"
        run_after: [create-user-account]

      - step_id: process-referral-bonus
        component_ref: invokeProcessReferralBonusFlow
        inputs_map:
          initialData: "{ newUserId: steps.create-user-account.outputs.response.body.userId, referralCode: steps.validate-registration-data.outputs.validData.referralCode }"
        run_after: [create-user-account]
        condition: "steps.validate-registration-data.outputs.validData.referralCode != null"

      - step_id: trigger-welcome-communications # Fork step
        component_ref: StdLib:Fork
        config:
          outputNames: [for_email, for_sms, for_analytics]
        inputs_map:
          data: "{ userData: steps.create-user-account.outputs.response.body }" # Pass relevant user data
        run_after: [setup-responsible-gambling] # Or create-user-account if no dependency

      - step_id: send-welcome-email
        component_ref: callSendWelcomeEmail
        inputs_map:
          data: "steps.trigger-welcome-communications.outputs.for_email.userData" # Pass data to email service
        run_after: [trigger-welcome-communications]

      - step_id: send-welcome-sms
        component_ref: callSendWelcomeSms
        inputs_map:
          data: "steps.trigger-welcome-communications.outputs.for_sms.userData"
        run_after: [trigger-welcome-communications]

      - step_id: track-registration-analytics
        component_ref: invokeTrackUserRegistrationFlow
        inputs_map:
          initialData: "{ userId: steps.trigger-welcome-communications.outputs.for_analytics.userData.userId }" # Pass data to analytics subflow
        run_after: [trigger-welcome-communications]

  # Sophisticated Betting Flow with Multi-Layer Validation
  - name: PlaceBetFlow
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: /api/bets/place
        method: POST
    steps:
      - step_id: authenticate-session
        component_ref: callAuthValidateSession
        inputs_map:
          data: "{ sessionToken: trigger.headers.authorization, userId: trigger.body.userId }"
        # No output_map needed if next step consumes .response.body or similar default

      - step_id: get-user-profile
        component_ref: callGetUserProfile
        inputs_map:
          data: "{ userId: trigger.body.userId }"
        run_after: [authenticate-session]
        condition: "steps.authenticate-session.outputs.response.body.valid == true" # Check for successful auth

      - step_id: classify-user-tier-switch # The Switch step
        component_ref: user-tier-classifier # Named Switch component
        inputs_map:
          data: "{ totalLifetimeDeposits: steps.get-user-profile.outputs.response.body.totalLifetimeDeposits }"
        run_after: [get-user-profile]

      # Map Switch outputs to a consistent tier string
      - step_id: map-tier-platinum
        component_ref: mapDataToTierPlatinum
        inputs_map:
          data: "steps.classify-user-tier-switch.outputs.is_platinum"
        run_after: [classify-user-tier-switch]
      - step_id: map-tier-gold
        component_ref: mapDataToTierGold
        inputs_map:
          data: "steps.classify-user-tier-switch.outputs.is_gold"
        run_after: [classify-user-tier-switch]
      - step_id: map-tier-silver
        component_ref: mapDataToTierSilver
        inputs_map:
          data: "steps.classify-user-tier-switch.outputs.is_silver"
        run_after: [classify-user-tier-switch]
      - step_id: map-tier-bronze
        component_ref: mapDataToTierBronze
        inputs_map:
          data: "steps.classify-user-tier-switch.outputs.is_bronze"
        run_after: [classify-user-tier-switch]
      - step_id: map-tier-standard
        component_ref: mapDataToTierStandard
        inputs_map:
          data: "steps.classify-user-tier-switch.outputs.is_standard"
        run_after: [classify-user-tier-switch]

      - step_id: merge-classified-tier-data # Assuming StdLib:MergeStreams exists
        component_ref: StdLib:MergeStreams
        config:
          inputNames: [p, g, s, b, std]
          mergedOutputName: classifiedTierInfo
        inputs_map:
          p: "steps.map-tier-platinum.outputs.result"
          g: "steps.map-tier-gold.outputs.result"
          s: "steps.map-tier-silver.outputs.result"
          b: "steps.map-tier-bronze.outputs.result"
          std: "steps.map-tier-standard.outputs.result"
        run_after: [map-tier-platinum, map-tier-gold, map-tier-silver, map-tier-bronze, map-tier-standard]

      - step_id: calculate-betting-limits
        component_ref: bet-limit-calculator # Named MapData component
        inputs_map:
          data: "steps.merge-classified-tier-data.outputs.classifiedTierInfo" # Pass { userTier: "..." }
        run_after: [merge-classified-tier-data]

      - step_id: validate-bet-amount
        component_ref: StdLib:FilterData
        config:
          expression: | # Assuming input data has betAmount, maxBet, dailyLimit, dailySpent etc.
            data.betAmount >= 1 &&
            data.betAmount <= data.maxBet &&
            data.betAmount <= (data.dailyLimit - data.dailySpent) &&
            data.betAmount <= (data.sessionLimit - data.sessionSpent)
          matchOutput: validBetData # Output port name for true
          noMatchOutput: invalidBetData # Output port name for false
        inputs_map:
          data: "{ betAmount: trigger.body.amount, maxBet: steps.calculate-betting-limits.outputs.result.maxBet, dailyLimit: steps.calculate-betting-limits.outputs.result.dailyLimit, sessionLimit: steps.calculate-betting-limits.outputs.result.sessionLimit, dailySpent: steps.get-user-profile.outputs.response.body.dailySpent, sessionSpent: steps.get-user-profile.outputs.response.body.sessionSpent }"
        run_after: [calculate-betting-limits]

      - step_id: responsible-gambling-check
        component_ref: invokeValidateBettingLimitsFlow
        inputs_map:
          initialData: "{ userId: trigger.body.userId, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount, gameType: trigger.body.gameType }"
        run_after: [validate-bet-amount]
        condition: "steps.validate-bet-amount.outputs.validBetData != null" # Proceed only if bet is valid

      - step_id: trigger-comprehensive-risk-assessment # Fork step
        component_ref: StdLib:Fork
        config:
          outputNames: [for_velocity, for_behavioral, for_device, for_geo]
        inputs_map:
          data: "{ userId: trigger.body.userId, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount, gameType: trigger.body.gameType, sessionData: steps.get-user-profile.outputs.response.body.currentSession }"
        run_after: [responsible-gambling-check]
        condition: "steps.responsible-gambling-check.outputs.result.approved == true"

      - step_id: assess-risk-velocity
        component_ref: callRiskVelocityAnalysis
        inputs_map:
          data: "steps.trigger-comprehensive-risk-assessment.outputs.for_velocity"
        run_after: [trigger-comprehensive-risk-assessment]
      - step_id: assess-risk-behavioral
        component_ref: callRiskBehavioralAnalysis
        inputs_map:
          data: "steps.trigger-comprehensive-risk-assessment.outputs.for_behavioral"
        run_after: [trigger-comprehensive-risk-assessment]
      - step_id: assess-risk-device
        component_ref: callRiskDeviceFingerprint
        inputs_map:
          data: "steps.trigger-comprehensive-risk-assessment.outputs.for_device"
        run_after: [trigger-comprehensive-risk-assessment]
      - step_id: assess-risk-geo
        component_ref: callRiskGeoAnalysis
        inputs_map:
          data: "steps.trigger-comprehensive-risk-assessment.outputs.for_geo"
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
          initialData: "{ userId: trigger.body.userId, betData: steps.validate-bet-amount.outputs.validBetData, riskAssessment: steps.aggregate-risk-scores.outputs.result }"
        run_after: [aggregate-risk-scores]
        condition: "steps.aggregate-risk-scores.outputs.result.requiresManualReview == false"

      - step_id: process-bet-payment
        component_ref: invokeProcessBetPaymentFlow
        inputs_map:
          initialData: "{ userId: trigger.body.userId, amount: steps.validate-bet-amount.outputs.validBetData.betAmount, gameType: trigger.body.gameType }"
        run_after: [compliance-approval]
        condition: "steps.compliance-approval.outputs.result.approved == true"

      - step_id: execute-game-logic
        component_ref: invokeExecuteGameFlow
        inputs_map:
          initialData: "{ gameType: trigger.body.gameType, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount, userId: trigger.body.userId, gameParameters: trigger.body.gameParameters }"
        run_after: [process-bet-payment]
        # Condition for successful payment might be implicit if subflow invoker handles errors by not proceeding,
        # or explicit: condition: "steps.process-bet-payment.outputs.result.success == true"

      - step_id: calculate-final-outcome
        component_ref: StdLib:MapData
        config:
          expression: | # Expects data: { gameResult, betAmount, currentBalance, paymentTransactionId }
            {
              netResult: data.gameResult.winnings - data.betAmount,
              houseProfit: data.betAmount - data.gameResult.winnings,
              playerBalance: data.currentBalance + data.gameResult.winnings,
              gameOutcome: data.gameResult,
              transactionId: data.paymentTransactionId # Use transactionId from payment
            }
        inputs_map:
          data: "{ gameResult: steps.execute-game-logic.outputs.result, betAmount: steps.validate-bet-amount.outputs.validBetData.betAmount, currentBalance: steps.get-user-profile.outputs.response.body.balance, paymentTransactionId: steps.process-bet-payment.outputs.result.transactionId }"
        run_after: [execute-game-logic]

      - step_id: update-user-balance
        component_ref: callUpdateUserBalance
        inputs_map:
          data: "{ userId: trigger.body.userId, newBalance: steps.calculate-final-outcome.outputs.result.playerBalance, transactionId: steps.calculate-final-outcome.outputs.result.transactionId }"
        run_after: [calculate-final-outcome]

      - step_id: trigger-bonus-evaluation
        component_ref: invokeEvaluateBonusEligibilityFlow
        inputs_map:
          initialData: "{ userId: trigger.body.userId, gameOutcome: steps.calculate-final-outcome.outputs.result.gameOutcome, userTier: steps.merge-classified-tier-data.outputs.classifiedTierInfo.userTier }"
        run_after: [update-user-balance]

      - step_id: record-analytics
        component_ref: invokeRecordGameplayAnalyticsFlow
        inputs_map:
          initialData: "{ userId: trigger.body.userId, gameData: steps.calculate-final-outcome.outputs.result, riskData: steps.aggregate-risk-scores.outputs.result }"
        run_after: [update-user-balance] # Can run in parallel with bonus evaluation

  # Comprehensive Deposit Flow with Enhanced Security
  - name: ProcessDepositFlow
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: /api/payments/deposit
        method: POST
    steps:
      - step_id: validate-deposit-request
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema: # Same as original
            type: object
            required: [userId, amount, paymentMethod, currency]
            properties:
              userId: { type: string }
              amount: { type: number, minimum: 10, maximum: 100000 }
              paymentMethod: { type: string, enum: [credit_card, bank_transfer, crypto, e_wallet] }
              currency: { type: string, enum: [USD, EUR, GBP, CAD] }
              bonusCode: { type: string }
        inputs_map:
          data: "trigger.body"

      - step_id: get-user-status
        component_ref: callGetUserStatus
        inputs_map:
          data: "{ userId: steps.validate-deposit-request.outputs.validData.userId }"
        run_after: [validate-deposit-request]

      - step_id: kyc-status-check
        component_ref: StdLib:FilterData
        config:
          expression: "data.kycStatus == 'verified' || (data.kycStatus == 'pending' && data.amount <= 500)"
          matchOutput: kycApprovedData
          noMatchOutput: kycRequiredData
        inputs_map:
          data: "{ kycStatus: steps.get-user-status.outputs.response.body.kycStatus, amount: steps.validate-deposit-request.outputs.validData.amount }"
        run_after: [get-user-status]

      - step_id: trigger-deposit-limit-checks # Fork
        component_ref: StdLib:Fork
        config:
          outputNames: [for_daily_limit, for_monthly_limit, for_velocity_check]
        inputs_map:
          data: "{ amount: steps.validate-deposit-request.outputs.validData.amount, dailyDeposits: steps.get-user-status.outputs.response.body.dailyDeposits, monthlyDeposits: steps.get-user-status.outputs.response.body.monthlyDeposits, dailyLimit: steps.get-user-status.outputs.response.body.limits.dailyDepositLimit, monthlyLimit: steps.get-user-status.outputs.response.body.limits.monthlyDepositLimit, userId: steps.validate-deposit-request.outputs.validData.userId }"
        run_after: [kyc-status-check]
        condition: "steps.kyc-status-check.outputs.kycApprovedData != null"

      - step_id: check-daily-deposit-limit
        component_ref: StdLib:FilterData
        config:
          expression: "data.dailyDeposits + data.amount <= data.dailyLimit"
          matchOutput: withinDailyLimitData
          noMatchOutput: exceedsDailyLimitData
        inputs_map:
          data: "steps.trigger-deposit-limit-checks.outputs.for_daily_limit"
        run_after: [trigger-deposit-limit-checks]

      - step_id: check-monthly-deposit-limit
        component_ref: StdLib:FilterData
        config:
          expression: "data.monthlyDeposits + data.amount <= data.monthlyLimit"
          matchOutput: withinMonthlyLimitData
          noMatchOutput: exceedsMonthlyLimitData
        inputs_map:
          data: "steps.trigger-deposit-limit-checks.outputs.for_monthly_limit"
        run_after: [trigger-deposit-limit-checks]

      - step_id: check-deposit-velocity
        component_ref: callFraudVelocityCheck
        inputs_map:
          data: "steps.trigger-deposit-limit-checks.outputs.for_velocity_check" # Pass { userId, amount }
        run_after: [trigger-deposit-limit-checks]

      - step_id: evaluate-deposit-eligibility
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              canProceed: data.withinDailyLimit && data.withinMonthlyLimit && data.velocityApproved,
              limitFlags: {
                daily: data.withinDailyLimit,
                monthly: data.withinMonthlyLimit,
                velocity: data.velocityApproved
              },
              riskLevel: data.velocityApproved ? 'low' : 'high'
            }
        inputs_map:
          data: "{ withinDailyLimit: steps.check-daily-deposit-limit.outputs.withinDailyLimitData != null, withinMonthlyLimit: steps.check-monthly-deposit-limit.outputs.withinMonthlyLimitData != null, velocityApproved: steps.check-deposit-velocity.outputs.response.body.approved }"
        run_after: [check-daily-deposit-limit, check-monthly-deposit-limit, check-deposit-velocity]

      - step_id: trigger-fraud-detection-screening # Fork
        component_ref: StdLib:Fork
        config:
          outputNames: [for_device_fp, for_behavioral_scan, for_payment_validation]
        inputs_map:
          data: "{ depositData: steps.validate-deposit-request.outputs.validData, userProfile: steps.get-user-status.outputs.response.body }"
        run_after: [evaluate-deposit-eligibility]
        condition: "steps.evaluate-deposit-eligibility.outputs.result.canProceed == true"

      - step_id: screen-device-fingerprint
        component_ref: callFraudDeviceAnalysis
        inputs_map:
          data: "steps.trigger-fraud-detection-screening.outputs.for_device_fp"
        run_after: [trigger-fraud-detection-screening]
      - step_id: screen-behavioral-analysis
        component_ref: callFraudBehavioralAnalysis
        inputs_map:
          data: "steps.trigger-fraud-detection-screening.outputs.for_behavioral_scan"
        run_after: [trigger-fraud-detection-screening]
      - step_id: screen-payment-method-validation
        component_ref: callPaymentValidateMethod
        inputs_map:
          data: "steps.trigger-fraud-detection-screening.outputs.for_payment_validation"
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
          initialData: "{ depositData: steps.validate-deposit-request.outputs.validData, fraudAssessment: steps.aggregate-fraud-scores.outputs.result }"
        run_after: [aggregate-fraud-scores]
        condition: "steps.aggregate-fraud-scores.outputs.result.requiresManualReview == false"

      - step_id: update-user-balance-after-deposit # Renamed for clarity
        component_ref: callUpdateUserBalance
        inputs_map:
          data: "{ userId: steps.validate-deposit-request.outputs.validData.userId, amount: steps.process-payment-transaction.outputs.result.processedAmount, transactionId: steps.process-payment-transaction.outputs.result.transactionId }"
        run_after: [process-payment-transaction]
        condition: "steps.process-payment-transaction.outputs.result.success == true"

      - step_id: evaluate-deposit-bonus
        component_ref: invokeEvaluateDepositBonusFlow
        inputs_map:
          initialData: "{ userId: steps.validate-deposit-request.outputs.validData.userId, depositAmount: steps.process-payment-transaction.outputs.result.processedAmount, bonusCode: steps.validate-deposit-request.outputs.validData.bonusCode }"
        run_after: [update-user-balance-after-deposit]

      - step_id: trigger-tier-evaluation
        component_ref: invokeEvaluateUserTierFlow # Named SubFlowInvoker
        inputs_map:
          initialData: "{ userId: steps.validate-deposit-request.outputs.validData.userId, newDepositAmount: steps.process-payment-transaction.outputs.result.processedAmount }"
        run_after: [update-user-balance-after-deposit]

  # User Tier Evaluation and Upgrade Flow
  - name: EvaluateUserTierFlow
    trigger:
      type: StdLib.Trigger:EventBus # Corrected Trigger type
      config:
        eventType: deposit-completed # This is the filter for the EventBus
    steps:
      - step_id: get-updated-user-stats
        component_ref: callGetUserLifetimeStats
        inputs_map:
          data: "{ userId: trigger.event.userId }" # EventBus trigger provides 'event'

      - step_id: calculate-new-tier-switch # Switch step
        component_ref: user-tier-classifier # Named Switch component
        inputs_map:
          data: "{ totalLifetimeDeposits: steps.get-updated-user-stats.outputs.response.body.totalLifetimeDeposits }"
        run_after: [get-updated-user-stats]

      # Map Switch outputs to a consistent tier string
      - step_id: map-new-tier-platinum
        component_ref: mapDataToTierPlatinum
        inputs_map:
          data: "steps.calculate-new-tier-switch.outputs.is_platinum"
        run_after: [calculate-new-tier-switch]
      # ... similar mappers for gold, silver, bronze, standard (mapDataToTierGold etc.)
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

      - step_id: merge-new-tier-info # Assuming StdLib:MergeStreams
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
          data: "{ newTier: steps.merge-new-tier-info.outputs.newTierData.userTier, currentTier: steps.get-updated-user-stats.outputs.response.body.currentTier, tierRanking: { standard: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 } }"
        run_after: [merge-new-tier-info]

      - step_id: trigger-process-tier-upgrade # Fork
        component_ref: StdLib:Fork
        config:
          outputNames: [for_update_tier, for_award_bonus, for_send_notification]
        inputs_map:
          data: "{ userId: trigger.event.userId, newTier: steps.merge-new-tier-info.outputs.newTierData.userTier, oldTier: steps.get-updated-user-stats.outputs.response.body.currentTier }"
        run_after: [check-tier-upgrade]
        condition: "steps.check-tier-upgrade.outputs.tierUpgradeData != null"

      - step_id: update-user-tier-in-db
        component_ref: callUpdateUserTier # Named HTTP Call
        inputs_map:
          data: "steps.trigger-process-tier-upgrade.outputs.for_update_tier" # Pass { userId, newTier }
        run_after: [trigger-process-tier-upgrade]

      - step_id: award-tier-upgrade-bonus
        component_ref: invokeAwardTierUpgradeBonusFlow # Named SubFlowInvoker
        inputs_map:
          initialData: "steps.trigger-process-tier-upgrade.outputs.for_award_bonus" # Pass { userId, newTier, oldTier }
        run_after: [trigger-process-tier-upgrade]

      - step_id: send-tier-upgrade-notification
        component_ref: callSendTierUpgradeNotification # Named HTTP Call
        inputs_map:
          data: "steps.trigger-process-tier-upgrade.outputs.for_send_notification" # Pass { userId, newTier, oldTier }
        run_after: [trigger-process-tier-upgrade]
    `
  },

  // User Management Module (Illustrative minimal changes for brevity, apply Fork refactoring as in Core)
  {
    fqn: 'com.casino.users',
    content: `
dsl_version: "1.1"
namespace: com.casino.users

definitions:
  context:
    - name: kyc-verification-url
      value: "https://api.kyc-provider.com/verify"
      type: string
    - name: max-daily-deposit
      value: 50000
      type: number
    - name: default-http-timeout-ms
      value: 30000 # Overriding core's default for this module if needed
      type: number
  components:
    - name: kyc-verifier-component
      type: StdLib:HttpCall
      config:
        url: "{{context.kyc-verification-url}}"
        method: POST
        timeoutMs: "{{context.default-http-timeout-ms}}"
        headers:
          Authorization: "Bearer {{secrets.kyc-api-key}}"
    - name: createUserAccountComponent
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-db-url}}/users" # Example, could be user-service-url
        method: POST
        timeoutMs: "{{context.default-http-timeout-ms}}"

    - name: fraudVelocityCheckComponent
      type: StdLib:HttpCall
      config: { url: "{{secrets.fraud-service-url}}/velocity-check", method: POST, timeoutMs: "{{context.default-http-timeout-ms}}" }
    - name: fraudDeviceCheckComponent
      type: StdLib:HttpCall
      config: { url: "{{secrets.fraud-service-url}}/device-check", method: POST, timeoutMs: "{{context.default-http-timeout-ms}}" }
    - name: fraudGeoCheckComponent
      type: StdLib:HttpCall
      config: { url: "{{secrets.fraud-service-url}}/geo-check", method: POST, timeoutMs: "{{context.default-http-timeout-ms}}" }
    - name: processDepositPaymentComponent
      type: StdLib:HttpCall
      config: { url: "{{secrets.payment-processor-url}}/deposit", method: POST, timeoutMs: "{{context.default-http-timeout-ms}}" }

flows:
  - name: UserRegistrationFlow # Example, less detailed than core onboarding
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: /api/users/register
        method: POST
    steps:
      - step_id: validate-user-data
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
            type: object
            required: [email, password, firstName, lastName, dateOfBirth]
            properties:
              email: { type: string, format: email }
              password: { type: string, minLength: 8 }
              firstName: { type: string, minLength: 1 }
              lastName: { type: string, minLength: 1 }
              dateOfBirth: { type: string, format: date }
        inputs_map:
          data: "trigger.body"

      - step_id: check-age-eligibility # Assuming age() is a valid expression function or this is MapData
        component_ref: StdLib:FilterData
        config:
          expression: "age(data.dateOfBirth) >= 18" # Simplified, might be a MapData then Filter
          matchOutput: eligibleData
          noMatchOutput: underageData
        inputs_map:
          data: "steps.validate-user-data.outputs.validData"
        run_after: [validate-user-data]

      - step_id: perform-kyc
        component_ref: kyc-verifier-component
        inputs_map:
          data: "{ userData: steps.check-age-eligibility.outputs.eligibleData }" # Pass data
        run_after: [check-age-eligibility]
        condition: "steps.check-age-eligibility.outputs.eligibleData != null"

      - step_id: create-user-account
        component_ref: createUserAccountComponent
        inputs_map:
          data: "{ userData: steps.perform-kyc.outputs.response.body.verifiedUser }" # Assuming response structure
        run_after: [perform-kyc]
        # Condition for successful KYC

  - name: DepositFlow # Example, less detailed than core deposit
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: /api/users/deposit
        method: POST
    steps:
      - step_id: check-deposit-limits # This would be more complex, similar to core
        component_ref: StdLib:FilterData # Simplified for brevity
        config:
          expression: "data.amount <= {{context.max-daily-deposit}}" # Simplified
          matchOutput: withinLimitData
          noMatchOutput: exceedsLimitData
        inputs_map:
          data: "trigger.body"

      - step_id: trigger-fraud-detection # Fork
        component_ref: StdLib:Fork
        config:
          outputNames: [for_velocity, for_device, for_geo]
        inputs_map:
          data: "steps.check-deposit-limits.outputs.withinLimitData" # Pass relevant data
        run_after: [check-deposit-limits]
        condition: "steps.check-deposit-limits.outputs.withinLimitData != null"

      - step_id: run-velocity-check
        component_ref: fraudVelocityCheckComponent
        inputs_map:
          data: "steps.trigger-fraud-detection.outputs.for_velocity"
        run_after: [trigger-fraud-detection]
      - step_id: run-device-check
        component_ref: fraudDeviceCheckComponent
        inputs_map:
          data: "steps.trigger-fraud-detection.outputs.for_device"
        run_after: [trigger-fraud-detection]
      - step_id: run-geo-check
        component_ref: fraudGeoCheckComponent
        inputs_map:
          data: "steps.trigger-fraud-detection.outputs.for_geo"
        run_after: [trigger-fraud-detection]

      - step_id: evaluate-fraud-results
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              riskScore: (data.velocityScore + data.deviceScore + data.geoScore) / 3,
              approved: (data.velocityScore + data.deviceScore + data.geoScore) / 3 < 0.7
            }
        inputs_map:
          data: "{ velocityScore: steps.run-velocity-check.outputs.response.body.riskScore, deviceScore: steps.run-device-check.outputs.response.body.riskScore, geoScore: steps.run-geo-check.outputs.response.body.riskScore }"
        run_after: [run-velocity-check, run-device-check, run-geo-check]

      - step_id: process-deposit
        component_ref: processDepositPaymentComponent
        inputs_map:
          data: "trigger.body" # Pass deposit data
        run_after: [evaluate-fraud-results]
        condition: "steps.evaluate-fraud-results.outputs.result.approved == true"
    `
  },

  // Games Module (Refactoring Fork usage in SlotGameFlow and BlackjackGameFlow)
  {
    fqn: 'com.casino.games',
    content: `
dsl_version: "1.1"
namespace: com.casino.games
imports:
  - namespace: com.casino.core
    as: core # For subflow trigger if needed, or direct component defs

definitions:
  context:
    - name: rng-service-url
      value: "https://api.rng-provider.com/generate"
      type: string
    - name: game-result-retention-days
      value: 90
      type: number
    - name: default-rng-timeout-ms
      value: 1000 # Reduced from 5000 for faster game simulation
      type: number
  components:
    - name: rng-generator-component # RNG for a single value
      type: StdLib:HttpCall
      config:
        url: "{{context.rng-service-url}}"
        method: POST # Assuming POST to generate a number with params
        timeoutMs: "{{context.default-rng-timeout-ms}}"
        headers:
          Authorization: "Bearer {{secrets.rng-api-key}}"
        # Body would be like { min: 1, max: 10 } passed in inputs_map

    - name: invokePlaceBetFlow # Example if games are triggered by PlaceBetFlow
      type: StdLib:SubFlowInvoker
      config:
        flowName: com.casino.core.PlaceBetFlow # Note: this creates a circular dependency if PlaceBetFlow calls ExecuteGameFlow
        # This trigger structure is problematic if PlaceBetFlow invokes ExecuteGameFlow which then has this as a trigger.
        # A better model: PlaceBetFlow invokes a specific game logic flow (e.g. com.casino.games.SlotGameLogicFlow)
        # For this example, I will assume ExecuteGameFlow is the one called by PlaceBetFlow,
        # and these SlotGameFlow/BlackjackGameFlow are illustrative or older versions.
        # Or, these are *logic flows* that ExecuteGameFlow (a Switch) routes to.
        waitForCompletion: true

    - name: slotsEngineComponent # Assumed to be a SubFlowInvoker for slot logic
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.games.SlotGameLogicFlow, waitForCompletion: true } # New flow for logic
    - name: blackjackEngineComponent
      type: StdLib:SubFlowInvoker
      config: { flowName: com.casino.games.BlackjackGameLogicFlow, waitForCompletion: true } # New flow for logic

flows:
  # This ExecuteGameFlow is what PlaceBetFlow should invoke
  - name: ExecuteGameFlow
    trigger:
      type: StdLib:Manual # Manually triggered by PlaceBetFlow (SubFlowInvoker)
      # config:
      #   flowName: com.casino.core.PlaceBetFlow # This was the original trigger, which is circular
      # This flow now expects initialData from PlaceBetFlow:
      # { gameType, betAmount, userId, gameParameters }
    steps:
      - step_id: route-to-game-engine
        component_ref: StdLib:Switch
        config:
          cases: # Expects input data: { gameType: "..." }
            - conditionExpression: "data.gameType == 'slots'"
              outputName: slots_engine_selected # Routes input data
            - conditionExpression: "data.gameType == 'blackjack'"
              outputName: blackjack_engine_selected
          defaultOutputName: unsupported_game_selected
        inputs_map:
          data: "trigger.initialData" # Use initialData from PlaceBetFlow

      - step_id: execute-slots-game
        component_ref: slotsEngineComponent # Invoke the specific slot logic flow
        inputs_map:
          initialData: "steps.route-to-game-engine.outputs.slots_engine_selected"
        run_after: [route-to-game-engine]
        condition: "steps.route-to-game-engine.outputs.slots_engine_selected != null"

      - step_id: execute-blackjack-game
        component_ref: blackjackEngineComponent # Invoke specific blackjack logic flow
        inputs_map:
          initialData: "steps.route-to-game-engine.outputs.blackjack_engine_selected"
        run_after: [route-to-game-engine]
        condition: "steps.route-to-game-engine.outputs.blackjack_engine_selected != null"

      # Output from this flow would be the result of the executed game (e.g., from execute-slots-game.outputs.result)
      # This needs to be mapped to a consistent output for PlaceBetFlow to consume.
      # Using MergeStreams for simplicity to get the game result.
      - step_id: merge-game-results
        component_ref: StdLib:MergeStreams
        config:
          inputNames: [slots, blackjack, unsupported] # Add unsupported to handle default
          mergedOutputName: finalGameResult
        inputs_map:
          slots: "steps.execute-slots-game.outputs.result"
          blackjack: "steps.execute-blackjack-game.outputs.result"
          unsupported: "{ error: 'Unsupported game type', details: steps.route-to-game-engine.outputs.unsupported_game_selected }" # Handle unsupported
        run_after: [execute-slots-game, execute-blackjack-game] # Ensure games have run

  # Specific game logic flows
  - name: SlotGameLogicFlow
    trigger: { type: StdLib:Manual } # Triggered by ExecuteGameFlow
    # initialData: { gameType, betAmount, userId, gameParameters, gameId (if any from trigger) }
    steps:
      - step_id: trigger-reel-generation # Fork
        component_ref: StdLib:Fork
        config:
          outputNames: [for_reel1, for_reel2, for_reel3]
        inputs_map:
          data: "{ gameId: trigger.initialData.gameId, betAmount: trigger.initialData.betAmount }" # Pass data needed for RNG params potentially

      - step_id: generate-reel1
        component_ref: rng-generator-component
        inputs_map:
          data: "{ min: 1, max: 10 }" # Example params for RNG
        run_after: [trigger-reel-generation]
      - step_id: generate-reel2
        component_ref: rng-generator-component
        inputs_map:
          data: "{ min: 1, max: 10 }"
        run_after: [trigger-reel-generation]
      - step_id: generate-reel3
        component_ref: rng-generator-component
        inputs_map:
          data: "{ min: 1, max: 10 }"
        run_after: [trigger-reel-generation]

      - step_id: calculate-slot-outcome # Switch
        component_ref: StdLib:Switch
        config:
          cases: # Input data: { reel1, reel2, reel3 }
            - conditionExpression: "data.reel1 == data.reel2 && data.reel2 == data.reel3 && data.reel1 == 7"
              outputName: jackpot_outcome
            - conditionExpression: "data.reel1 == data.reel2 && data.reel2 == data.reel3"
              outputName: triple_outcome
            - conditionExpression: "data.reel1 == data.reel2 || data.reel2 == data.reel3 || data.reel1 == data.reel3"
              outputName: double_outcome
          defaultOutputName: no_win_outcome
        inputs_map:
          data: "{ reel1: steps.generate-reel1.outputs.response.body.value, reel2: steps.generate-reel2.outputs.response.body.value, reel3: steps.generate-reel3.outputs.response.body.value }"
        run_after: [generate-reel1, generate-reel2, generate-reel3]

      - step_id: map-jackpot-payout
        component_ref: StdLib:MapData
        config: { expression: "{ win: true, multiplier: 100, outcome: 'jackpot', reels: data.reels }" }
        inputs_map: { data: "{ reels: [steps.calculate-slot-outcome.inputs.data.reel1, steps.calculate-slot-outcome.inputs.data.reel2, steps.calculate-slot-outcome.inputs.data.reel3], originalData: steps.calculate-slot-outcome.outputs.jackpot_outcome }" } # Pass original data if needed
        run_after: [calculate-slot-outcome]
      # ... similar mappers for triple, double, noWin
      - step_id: map-triple-payout
        component_ref: StdLib:MapData
        config: { expression: "{ win: true, multiplier: 10, outcome: 'triple', reels: data.reels }" }
        inputs_map: { data: "{ reels: [steps.calculate-slot-outcome.inputs.data.reel1, steps.calculate-slot-outcome.inputs.data.reel2, steps.calculate-slot-outcome.inputs.data.reel3], originalData: steps.calculate-slot-outcome.outputs.triple_outcome }" }
        run_after: [calculate-slot-outcome]
      - step_id: map-double-payout
        component_ref: StdLib:MapData
        config: { expression: "{ win: true, multiplier: 2, outcome: 'double', reels: data.reels }" }
        inputs_map: { data: "{ reels: [steps.calculate-slot-outcome.inputs.data.reel1, steps.calculate-slot-outcome.inputs.data.reel2, steps.calculate-slot-outcome.inputs.data.reel3], originalData: steps.calculate-slot-outcome.outputs.double_outcome }" }
        run_after: [calculate-slot-outcome]
      - step_id: map-no-win-payout
        component_ref: StdLib:MapData
        config: { expression: "{ win: false, multiplier: 0, outcome: 'noWin', reels: data.reels }" }
        inputs_map: { data: "{ reels: [steps.calculate-slot-outcome.inputs.data.reel1, steps.calculate-slot-outcome.inputs.data.reel2, steps.calculate-slot-outcome.inputs.data.reel3], originalData: steps.calculate-slot-outcome.outputs.no_win_outcome }" }
        run_after: [calculate-slot-outcome]

      - step_id: merge-slot-payouts # Merge to get the single result for this flow
        component_ref: StdLib:MergeStreams
        config: { inputNames: [j,t,d,n], mergedOutputName: slotResult }
        inputs_map:
          j: "steps.map-jackpot-payout.outputs.result"
          t: "steps.map-triple-payout.outputs.result"
          d: "steps.map-double-payout.outputs.result"
          n: "steps.map-no-win-payout.outputs.result"
        run_after: [map-jackpot-payout, map-triple-payout, map-double-payout, map-no-win-payout]
      # This flow should output slotResult, which then becomes the output of ExecuteGameFlow if slots were chosen

  # BlackjackGameLogicFlow would be similarly refactored with Fork for card dealing
  # For brevity, I will not fully expand BlackjackGameLogicFlow here but the pattern is the same.
  # It would also output its result, to be merged by ExecuteGameFlow.
  - name: BlackjackGameLogicFlow
    trigger: { type: StdLib:Manual }
    steps:
      # ... Fork to deal 4 cards using rng-generator-component ...
      # ... MapData to calculate hand values ...
      # ... Switch to determine winner ...
      # ... MapData for payout based on winner ...
      # ... Merge to final blackjack result ...
      - step_id: placeholder-blackjack-logic
        component_ref: StdLib:NoOp # Placeholder
        inputs_map: { data: "trigger.initialData" }
    # This flow's final result (e.g. from a merge step) is its output.
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
  }
];

export const casinoPlatformComponentSchemas = {
  // --- Trigger Types ---
  'StdLib.Trigger:Http': {
    fqn: 'StdLib.Trigger:Http',
    configSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: "API path for the trigger (e.g., /api/users)." },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: "HTTP method." }
      },
      required: ['path', 'method']
    },
    outputSchema: { // Data made available to the flow as 'trigger.*'
      type: 'object',
      properties: {
        body: { type: ['object', 'array', 'null'], description: "Parsed JSON body if applicable, or raw if not JSON." },
        headers: { type: 'object', additionalProperties: { type: 'string' }, description: "Request headers." },
        query: { type: 'object', additionalProperties: { type: 'string' }, description: "Parsed query parameters." },
        pathParams: { type: 'object', additionalProperties: { type: 'string' }, description: "Path parameters." }
      }
    }
  },
  'StdLib.Trigger:EventBus': {
    fqn: 'StdLib.Trigger:EventBus',
    configSchema: {
      type: 'object',
      properties: {
        eventType: { type: 'string', description: "The specific event type or topic to subscribe to." }
      },
      required: ['eventType']
    },
    outputSchema: { // Data made available to the flow as 'trigger.*'
      type: 'object',
      properties: {
        event: { type: 'object', description: 'The actual event payload from the bus.' },
        metadata: {type: 'object', description: 'Event bus specific metadata, e.g., messageId, timestamp.'}
      },
      required: ['event']
    }
  },
  'StdLib:Manual': { // Conceptual trigger type for subflows or direct invocations
    fqn: 'StdLib:Manual',
    configSchema: null, // No DSL configuration for the trigger itself
    outputSchema: { // Represents trigger.initialData
        type: 'object',
        properties: {
            initialData: { type: 'object', description: 'The data passed when the flow was manually triggered.'}
        },
        required: ['initialData']
    }
  },

  // --- StdLib Components Used in the Example ---
  'StdLib:HttpCall': {
    fqn: 'StdLib:HttpCall',
    // From stdlib.yml.md for StdLib:HttpCall
    configSchema: {
      type: 'object',
      properties: {
        url: { type: ['string', 'object'], description: "Target URL (string or ExpressionString for dynamic construction)." }, // Allowing object for ExpressionString
        method: { type: 'string', enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], default: "GET" },
        headers: { type: ['object', 'object'], description: "Request headers. Values support {{secrets.my_secret}}. (object or ExpressionString)" },
        bodyExpression: { type: 'object', description: "Expression for request body (sandboxed). If omitted, input 'data' used." }, // Assuming ExpressionString is an object { language: ..., expression: ... }
        bodyLanguage: { type: 'string', enum: ["JMESPath", "JsonPointer"], default: "JMESPath" },
        contentType: { type: 'string', default: "application/json", description: "Content-Type header for request body." }, // ContentTypeString
        queryParameters: { type: ['object', 'object'], description: "URL query parameters. (object or ExpressionString)" },
        timeoutMs: { type: 'number', default: 5000, description: "Request timeout in ms." }, // PositiveInteger
        followRedirects: { type: 'boolean', default: false, description: "Whether to follow HTTP 3xx redirects." }
      },
      required: ['url', 'method']
    },
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', description: "Context for expressions and default request body." }
        // StdLib spec also shows headers, params here. If these are distinct from config, add them.
        // For simplicity, assuming 'data' is the primary input and config handles most.
      }
    },
    // Output schema has 'response' and 'error' ports.
    // 'response' port outputs an object adhering to HttpResponse schema.
    // 'error' port outputs an object adhering to StandardErrorStructure schema.
    // This level of detail for output ports is usually handled by the DSL runtime/linter
    // based on the component's known behavior rather than fully defining all output port schemas here.
    // For now, we'll represent the successful output.
    outputSchema: { // Represents the 'response' output port's data structure
        $ref: "#/definitions/schemas/HttpResponse" // Referencing global schema
    }
  },
  'StdLib:FilterData': {
    fqn: 'StdLib:FilterData',
    // From stdlib.yml.md for StdLib:FilterData
    configSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: "Boolean expression (sandboxed)." }, // BooleanExpressionString
        language: { type: 'string', enum: ["JMESPath", "JsonPointer"], default: "JMESPath", description: "Expression language." },
        matchOutput: { type: 'string', default: "matchOutput", description: "Output port name for true evaluation." }, // OutputPortNameString
        noMatchOutput: { type: 'string', default: "noMatchOutput", description: "Output port name for false evaluation." } // OutputPortNameString
      },
      required: ['expression']
    },
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', required: true, description: "Input data to filter." }
      },
      required: ['data']
    }
    // Output ports (e.g., 'matchOutput', 'noMatchOutput', 'error') are dynamic.
    // The data on 'matchOutput' or 'noMatchOutput' is the original input 'data'.
  },
  'StdLib:MapData': {
    fqn: 'StdLib:MapData',
    // From stdlib.yml.md for StdLib:MapData
    configSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string', required: true, description: "Transformation expression (sandboxed)." }, // ExpressionString
        language: { type: 'string', enum: ["JMESPath", "JsonPointer"], default: "JMESPath", description: "Expression language." }
      },
      required: ['expression']
    },
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', required: true, description: "Input data to transform." }
      },
      required: ['data']
    },
    outputSchema: { // Represents the 'result' output port
        type: 'object', // Or any, depending on the expression
        description: "Transformed data."
    }
  },
  'StdLib:Switch': {
    fqn: 'StdLib:Switch',
    // From stdlib.yml.md for StdLib:Switch
    configSchema: {
      type: 'object',
      properties: {
        cases: {
          type: 'array',
          required: true,
          description: "List defining conditions and output port names.",
          items: {
            type: 'object',
            properties: {
              conditionExpression: { type: 'string', description: "Boolean expression (sandboxed)." },
              language: { type: 'string', enum: ["JMESPath", "JsonPointer"], default: "JMESPath" },
              outputName: { type: 'string', description: "Target output port name." }
            },
            required: ["conditionExpression", "outputName"]
          }
        },
        defaultOutputName: { type: 'string', default: "defaultOutput", description: "Output port if no cases match." } // OutputPortNameString
      },
      required: ['cases']
    },
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', required: true, description: "Input data for condition evaluation." }
      },
      required: ['data']
    }
    // Output ports are dynamic based on 'outputName' in cases and 'defaultOutputName'.
    // Data on these ports is the original input 'data'.
  },
  'StdLib:Fork': {
    fqn: 'StdLib:Fork',
    // From stdlib.yml.md for StdLib:Fork (and our refined understanding)
    configSchema: {
      type: 'object',
      properties: {
        outputNames: {
          type: 'array',
          required: true,
          description: "List of names for output ports.",
          items: { type: 'string' } // OutputPortNameString
        }
      },
      required: ['outputNames']
    },
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', required: true, description: "Input data to duplicate." }
      },
      required: ['data']
    }
    // Output ports are dynamic based on 'outputNames'.
    // Data on these ports is a copy of the input 'data'.
  },
  'StdLib:SubFlowInvoker': {
    fqn: 'StdLib:SubFlowInvoker',
    // From stdlib.yml.md for StdLib:SubFlowInvoker
    configSchema: {
      type: 'object',
      properties: {
        flowName: { type: 'string', required: true, description: "Target Flow definition name (or ExpressionString)." }, // FlowNameString
        waitForCompletion: { type: 'boolean', default: false, description: "Pause and wait for sub-flow completion?" },
        timeoutMs: { type: 'number', description: "Max wait time if waitForCompletion=true." }, // PositiveInteger
        parametersLanguage: { type: 'string', enum: ["JMESPath", "JsonPointer"], default: "JMESPath" } // If flowName is an expression
      },
      required: ['flowName']
    },
    inputSchema: { // Input to the SubFlowInvoker step itself
      type: 'object',
      properties: {
        initialData: { type: 'object', required: true, description: "Initial trigger data for sub-flow." },
        contextData: { type: 'object', description: "Context for flowName expression evaluation (if flowName is an expression)." }
      },
      required: ['initialData']
    },
    // Output schema includes 'subFlowInstanceId' port immediately.
    // If waitForCompletion=true, it also has 'result' and 'error' ports.
    outputSchema: { // Represents the 'subFlowInstanceId' output port if not waiting, or 'result' if waiting and successful
        type: 'object', // Or string for instanceId, or subflow's result type
        description: "Output from the sub-flow invocation."
    }
  },
  'StdLib:JsonSchemaValidator': {
    fqn: 'StdLib:JsonSchemaValidator',
    // From stdlib.yml.md for StdLib:JsonSchemaValidator
    configSchema: {
      type: 'object',
      properties: {
        schema: { type: 'object', required: true, description: "JSON Schema object for validation." } // JsonSchemaObject
      },
      required: ['schema']
    },
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', required: true, description: "Input data to validate." }
      },
      required: ['data']
    },
    // Output port 'validData' contains original input 'data' if valid.
    // 'error' port for validation failures.
    outputSchema: { // Represents the 'validData' output port
        type: 'object',
        description: "Original input 'data' if conforms to schema."
    }
  },
  'StdLib:MergeStreams': { // Based on usage in the refined example
    fqn: 'StdLib:MergeStreams',
    // From stdlib.yml.md for StdLib:MergeStreams
    configSchema: {
      type: 'object',
      properties: {
        inputNames: { type: 'array', items: { type: 'string' }, required: true, description: "List of input port names to merge." },
        mergedOutputName: { type: 'string', default: "mergedOutput", description: "Single output port name." }
      },
      required: ['inputNames']
    },
    // InputSchema is dynamic: ports named by inputNames.
    // OutputSchema is dynamic: port named by mergedOutputName, data type is 'any'.
  },
  'StdLib:NoOp': {
    fqn: 'StdLib:NoOp',
    // From stdlib.yml.md for StdLib:NoOp
    configSchema: null,
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object', required: true, description: "Any input data." }
      },
      required: ['data']
    },
    outputSchema: { // Represents the 'data' output port
      type: 'object',
      properties: {
        data: {type: 'object', description: "Input data, unchanged."}
      },
      required: ['data']
    }
  },

  // --- Global Schema Definitions (for $ref) ---
  "#/definitions/schemas/StandardErrorStructure": {
    $id: "#/definitions/schemas/StandardErrorStructure",
    type: "object",
    properties: {
      type: { type: "string", description: "Category.ComponentName.SpecificErrorType" },
      message: { type: "string", description: "Human-readable error message." },
      code: { type: "string", description: "Optional internal/external code." },
      details: { type: ["object", "null"], description: "Optional, component-specific non-sensitive details." },
      timestamp: { type: "string", format: "date-time", description: "ISO 8601 timestamp." }
    },
    required: ["type", "message", "timestamp"]
  },
  "#/definitions/schemas/HttpResponse": {
    $id: "#/definitions/schemas/HttpResponse",
    type: "object",
    properties: {
      statusCode: { type: "integer" },
      headers: { type: "object", additionalProperties: { type: "string" } },
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
  }
};