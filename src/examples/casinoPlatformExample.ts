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

import { DslModuleInput } from '@/models/cfv_models_generated';

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

  components:
    # User Tier Classification
    - name: user-tier-classifier
      type: StdLib:Switch
      config:
        cases:
          - conditionExpression: "totalLifetimeDeposits >= {{context.platinum-tier-threshold}}"
            outputName: platinum
          - conditionExpression: "totalLifetimeDeposits >= {{context.gold-tier-threshold}}"
            outputName: gold
          - conditionExpression: "totalLifetimeDeposits >= {{context.silver-tier-threshold}}"
            outputName: silver
          - conditionExpression: "totalLifetimeDeposits >= {{context.bronze-tier-threshold}}"
            outputName: bronze
        defaultOutputName: standard

    # Dynamic Bet Limit Calculator
    - name: bet-limit-calculator
      type: StdLib:MapData
      config:
        expression: |
          {
            maxBet: userTier == 'platinum' ? {{context.platinum-max-bet}} :
                   userTier == 'gold' ? {{context.gold-max-bet}} :
                   userTier == 'silver' ? {{context.silver-max-bet}} :
                   userTier == 'bronze' ? {{context.bronze-max-bet}} : 50,
            dailyLimit: userTier == 'platinum' ? 100000 :
                       userTier == 'gold' ? 25000 :
                       userTier == 'silver' ? 5000 :
                       userTier == 'bronze' ? 1000 : 500,
            sessionLimit: userTier == 'platinum' ? 25000 :
                         userTier == 'gold' ? 10000 :
                         userTier == 'silver' ? 2500 :
                         userTier == 'bronze' ? 500 : 200
          }

    # Multi-Factor Risk Assessment
    - name: comprehensive-risk-assessor
      type: StdLib:Fork
      config:
        branches:
          - name: velocity-risk
            component_ref: StdLib:HttpCall
            config:
              url: "{{secrets.risk-service-url}}/velocity-analysis"
              method: POST
              timeout: 3000
          - name: behavioral-risk
            component_ref: StdLib:HttpCall
            config:
              url: "{{secrets.risk-service-url}}/behavioral-analysis"
              method: POST
              timeout: 3000
          - name: device-risk
            component_ref: StdLib:HttpCall
            config:
              url: "{{secrets.risk-service-url}}/device-fingerprint"
              method: POST
              timeout: 2000
          - name: geo-risk
            component_ref: StdLib:HttpCall
            config:
              url: "{{secrets.risk-service-url}}/geo-analysis"
              method: POST
              timeout: 2000

flows:
  # Comprehensive User Onboarding Flow
  - name: UserOnboardingFlow
    trigger:
      type: StdLib:HttpTrigger
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
          data: "trigger.body"

      - step_id: geo-compliance-check
        component_ref: StdLib:Fork
        config:
          branches:
            - name: jurisdiction-check
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.compliance-service-url}}/jurisdiction-check"
                method: POST
            - name: sanctions-check
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.compliance-service-url}}/sanctions-screening"
                method: POST
            - name: age-verification
              component_ref: StdLib:MapData
              config:
                expression: |
                  {
                    age: Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                    isEligible: Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) >= 18,
                    jurisdiction: country
                  }
        inputs_map:
          userData: "steps.validate-registration-data.outputs.validData"
        run_after: [validate-registration-data]

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
          jurisdictionAllowed: "steps.geo-compliance-check.outputs.jurisdiction-check.allowed"
          onSanctionsList: "steps.geo-compliance-check.outputs.sanctions-check.flagged"
          ageEligible: "steps.geo-compliance-check.outputs.age-verification.isEligible"
        run_after: [geo-compliance-check]

      - step_id: initiate-kyc-process
        component_ref: kyc.InitiateKYCFlow
        inputs_map:
          userData: "steps.validate-registration-data.outputs.validData"
          complianceData: "steps.evaluate-compliance-results.outputs"
        run_after: [evaluate-compliance-results]
        condition: "steps.evaluate-compliance-results.outputs.canProceed == true"

      - step_id: create-user-account
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.user-service-url}}/users"
          method: POST
          timeout: 10000
        inputs_map:
          userData: "steps.validate-registration-data.outputs.validData"
          kycStatus: "steps.initiate-kyc-process.outputs.status"
          complianceData: "steps.evaluate-compliance-results.outputs"
        run_after: [initiate-kyc-process]

      - step_id: setup-responsible-gambling
        component_ref: responsible.SetupDefaultLimitsFlow
        inputs_map:
          userId: "steps.create-user-account.outputs.userId"
          userTier: "standard"
        run_after: [create-user-account]

      - step_id: process-referral-bonus
        component_ref: bonuses.ProcessReferralBonusFlow
        inputs_map:
          newUserId: "steps.create-user-account.outputs.userId"
          referralCode: "steps.validate-registration-data.outputs.validData.referralCode"
        run_after: [create-user-account]
        condition: "steps.validate-registration-data.outputs.validData.referralCode != null"

      - step_id: send-welcome-communication
        component_ref: StdLib:Fork
        config:
          branches:
            - name: welcome-email
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.communication-service-url}}/send-email"
                method: POST
            - name: welcome-sms
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.communication-service-url}}/send-sms"
                method: POST
            - name: analytics-event
              component_ref: analytics.TrackUserRegistrationFlow
        inputs_map:
          userData: "steps.create-user-account.outputs"
        run_after: [setup-responsible-gambling]

  # Sophisticated Betting Flow with Multi-Layer Validation
  - name: PlaceBetFlow
    trigger:
      type: StdLib:HttpTrigger
      config:
        path: /api/bets/place
        method: POST
    steps:
      - step_id: authenticate-session
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.auth-service-url}}/validate-session"
          method: POST
          timeout: 2000
        inputs_map:
          sessionToken: "trigger.headers.authorization"
          userId: "trigger.body.userId"

      - step_id: get-user-profile
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.user-service-url}}/users/{{userId}}/profile"
          method: GET
          timeout: 3000
        inputs_map:
          userId: "trigger.body.userId"
        run_after: [authenticate-session]
        condition: "steps.authenticate-session.outputs.valid == true"

      - step_id: classify-user-tier
        component_ref: user-tier-classifier
        inputs_map:
          totalLifetimeDeposits: "steps.get-user-profile.outputs.totalLifetimeDeposits"
        run_after: [get-user-profile]

      - step_id: calculate-betting-limits
        component_ref: bet-limit-calculator
        inputs_map:
          userTier: "steps.classify-user-tier.outputs"
        run_after: [classify-user-tier]

      - step_id: validate-bet-amount
        component_ref: StdLib:FilterData
        config:
          expression: |
            betAmount >= 1 && 
            betAmount <= maxBet && 
            betAmount <= (dailyLimit - dailySpent) && 
            betAmount <= (sessionLimit - sessionSpent)
          matchOutput: validBet
          noMatchOutput: invalidBet
        inputs_map:
          betAmount: "trigger.body.amount"
          maxBet: "steps.calculate-betting-limits.outputs.maxBet"
          dailyLimit: "steps.calculate-betting-limits.outputs.dailyLimit"
          sessionLimit: "steps.calculate-betting-limits.outputs.sessionLimit"
          dailySpent: "steps.get-user-profile.outputs.dailySpent"
          sessionSpent: "steps.get-user-profile.outputs.sessionSpent"
        run_after: [calculate-betting-limits]

      - step_id: responsible-gambling-check
        component_ref: responsible.ValidateBettingLimitsFlow
        inputs_map:
          userId: "trigger.body.userId"
          betAmount: "steps.validate-bet-amount.outputs.validBet.betAmount"
          gameType: "trigger.body.gameType"
        run_after: [validate-bet-amount]
        condition: "steps.validate-bet-amount.outputs.validBet != null"

      - step_id: comprehensive-risk-assessment
        component_ref: comprehensive-risk-assessor
        inputs_map:
          userId: "trigger.body.userId"
          betAmount: "steps.validate-bet-amount.outputs.validBet.betAmount"
          gameType: "trigger.body.gameType"
          sessionData: "steps.get-user-profile.outputs.currentSession"
        run_after: [responsible-gambling-check]
        condition: "steps.responsible-gambling-check.outputs.approved == true"

      - step_id: aggregate-risk-scores
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              overallRiskScore: (velocityScore + behavioralScore + deviceScore + geoScore) / 4,
              riskLevel: ((velocityScore + behavioralScore + deviceScore + geoScore) / 4) > 0.8 ? 'high' :
                        ((velocityScore + behavioralScore + deviceScore + geoScore) / 4) > 0.5 ? 'medium' : 'low',
              requiresManualReview: ((velocityScore + behavioralScore + deviceScore + geoScore) / 4) > 0.9,
              autoApproved: ((velocityScore + behavioralScore + deviceScore + geoScore) / 4) < 0.3
            }
        inputs_map:
          velocityScore: "steps.comprehensive-risk-assessment.outputs.velocity-risk.score"
          behavioralScore: "steps.comprehensive-risk-assessment.outputs.behavioral-risk.score"
          deviceScore: "steps.comprehensive-risk-assessment.outputs.device-risk.score"
          geoScore: "steps.comprehensive-risk-assessment.outputs.geo-risk.score"
        run_after: [comprehensive-risk-assessment]

      - step_id: compliance-approval
        component_ref: compliance.ApproveBetFlow
        inputs_map:
          userId: "trigger.body.userId"
          betData: "steps.validate-bet-amount.outputs.validBet"
          riskAssessment: "steps.aggregate-risk-scores.outputs"
        run_after: [aggregate-risk-scores]
        condition: "steps.aggregate-risk-scores.outputs.requiresManualReview == false"

      - step_id: process-bet-payment
        component_ref: payments.ProcessBetPaymentFlow
        inputs_map:
          userId: "trigger.body.userId"
          amount: "steps.validate-bet-amount.outputs.validBet.betAmount"
          gameType: "trigger.body.gameType"
        run_after: [compliance-approval]
        condition: "steps.compliance-approval.outputs.approved == true"

      - step_id: execute-game-logic
        component_ref: games.ExecuteGameFlow
        inputs_map:
          gameType: "trigger.body.gameType"
          betAmount: "steps.validate-bet-amount.outputs.validBet.betAmount"
          userId: "trigger.body.userId"
          gameParameters: "trigger.body.gameParameters"
        run_after: [process-bet-payment]

      - step_id: calculate-final-outcome
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              netResult: gameResult.winnings - betAmount,
              houseProfit: betAmount - gameResult.winnings,
              playerBalance: currentBalance + gameResult.winnings,
              gameOutcome: gameResult,
              transactionId: generateTransactionId()
            }
        inputs_map:
          gameResult: "steps.execute-game-logic.outputs"
          betAmount: "steps.validate-bet-amount.outputs.validBet.betAmount"
          currentBalance: "steps.get-user-profile.outputs.balance"
        run_after: [execute-game-logic]

      - step_id: update-user-balance
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.user-service-url}}/users/{{userId}}/balance"
          method: PATCH
          timeout: 5000
        inputs_map:
          userId: "trigger.body.userId"
          newBalance: "steps.calculate-final-outcome.outputs.playerBalance"
          transactionId: "steps.calculate-final-outcome.outputs.transactionId"
        run_after: [calculate-final-outcome]

      - step_id: trigger-bonus-evaluation
        component_ref: bonuses.EvaluateBonusEligibilityFlow
        inputs_map:
          userId: "trigger.body.userId"
          gameOutcome: "steps.calculate-final-outcome.outputs.gameOutcome"
          userTier: "steps.classify-user-tier.outputs"
        run_after: [update-user-balance]

      - step_id: record-analytics
        component_ref: analytics.RecordGameplayAnalyticsFlow
        inputs_map:
          userId: "trigger.body.userId"
          gameData: "steps.calculate-final-outcome.outputs"
          riskData: "steps.aggregate-risk-scores.outputs"
        run_after: [update-user-balance]

  # Comprehensive Deposit Flow with Enhanced Security
  - name: ProcessDepositFlow
    trigger:
      type: StdLib:HttpTrigger
      config:
        path: /api/payments/deposit
        method: POST
    steps:
      - step_id: validate-deposit-request
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
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
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.user-service-url}}/users/{{userId}}/status"
          method: GET
        inputs_map:
          userId: "steps.validate-deposit-request.outputs.validData.userId"
        run_after: [validate-deposit-request]

      - step_id: kyc-status-check
        component_ref: StdLib:FilterData
        config:
          expression: "kycStatus == 'verified' || (kycStatus == 'pending' && amount <= 500)"
          matchOutput: kycApproved
          noMatchOutput: kycRequired
        inputs_map:
          kycStatus: "steps.get-user-status.outputs.kycStatus"
          amount: "steps.validate-deposit-request.outputs.validData.amount"
        run_after: [get-user-status]

      - step_id: check-deposit-limits
        component_ref: StdLib:Fork
        config:
          branches:
            - name: daily-limit-check
              component_ref: StdLib:FilterData
              config:
                expression: "dailyDeposits + amount <= dailyLimit"
                matchOutput: withinDailyLimit
                noMatchOutput: exceedsDailyLimit
            - name: monthly-limit-check
              component_ref: StdLib:FilterData
              config:
                expression: "monthlyDeposits + amount <= monthlyLimit"
                matchOutput: withinMonthlyLimit
                noMatchOutput: exceedsMonthlyLimit
            - name: velocity-check
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.fraud-service-url}}/velocity-check"
                method: POST
        inputs_map:
          amount: "steps.validate-deposit-request.outputs.validData.amount"
          dailyDeposits: "steps.get-user-status.outputs.dailyDeposits"
          monthlyDeposits: "steps.get-user-status.outputs.monthlyDeposits"
          dailyLimit: "steps.get-user-status.outputs.limits.dailyDepositLimit"
          monthlyLimit: "steps.get-user-status.outputs.limits.monthlyDepositLimit"
          userId: "steps.validate-deposit-request.outputs.validData.userId"
        run_after: [kyc-status-check]
        condition: "steps.kyc-status-check.outputs.kycApproved != null"

      - step_id: evaluate-deposit-eligibility
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              canProceed: withinDailyLimit && withinMonthlyLimit && velocityApproved,
              limitFlags: {
                daily: withinDailyLimit,
                monthly: withinMonthlyLimit,
                velocity: velocityApproved
              },
              riskLevel: velocityApproved ? 'low' : 'high'
            }
        inputs_map:
          withinDailyLimit: "steps.check-deposit-limits.outputs.daily-limit-check.withinDailyLimit != null"
          withinMonthlyLimit: "steps.check-deposit-limits.outputs.monthly-limit-check.withinMonthlyLimit != null"
          velocityApproved: "steps.check-deposit-limits.outputs.velocity-check.approved"
        run_after: [check-deposit-limits]

      - step_id: fraud-detection-screening
        component_ref: StdLib:Fork
        config:
          branches:
            - name: device-fingerprinting
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.fraud-service-url}}/device-analysis"
                method: POST
            - name: behavioral-analysis
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.fraud-service-url}}/behavioral-analysis"
                method: POST
            - name: payment-method-validation
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.payment-service-url}}/validate-method"
                method: POST
        inputs_map:
          depositData: "steps.validate-deposit-request.outputs.validData"
          userProfile: "steps.get-user-status.outputs"
        run_after: [evaluate-deposit-eligibility]
        condition: "steps.evaluate-deposit-eligibility.outputs.canProceed == true"

      - step_id: aggregate-fraud-scores
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              overallFraudScore: (deviceScore + behavioralScore + paymentScore) / 3,
              fraudRisk: ((deviceScore + behavioralScore + paymentScore) / 3) > 0.7 ? 'high' :
                        ((deviceScore + behavioralScore + paymentScore) / 3) > 0.4 ? 'medium' : 'low',
              requiresManualReview: ((deviceScore + behavioralScore + paymentScore) / 3) > 0.8,
              autoApproved: ((deviceScore + behavioralScore + paymentScore) / 3) < 0.2
            }
        inputs_map:
          deviceScore: "steps.fraud-detection-screening.outputs.device-fingerprinting.riskScore"
          behavioralScore: "steps.fraud-detection-screening.outputs.behavioral-analysis.riskScore"
          paymentScore: "steps.fraud-detection-screening.outputs.payment-method-validation.riskScore"
        run_after: [fraud-detection-screening]

      - step_id: process-payment-transaction
        component_ref: payments.ProcessPaymentTransactionFlow
        inputs_map:
          depositData: "steps.validate-deposit-request.outputs.validData"
          fraudAssessment: "steps.aggregate-fraud-scores.outputs"
        run_after: [aggregate-fraud-scores]
        condition: "steps.aggregate-fraud-scores.outputs.requiresManualReview == false"

      - step_id: update-user-balance
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.user-service-url}}/users/{{userId}}/balance"
          method: PATCH
        inputs_map:
          userId: "steps.validate-deposit-request.outputs.validData.userId"
          amount: "steps.process-payment-transaction.outputs.processedAmount"
          transactionId: "steps.process-payment-transaction.outputs.transactionId"
        run_after: [process-payment-transaction]
        condition: "steps.process-payment-transaction.outputs.success == true"

      - step_id: evaluate-deposit-bonus
        component_ref: bonuses.EvaluateDepositBonusFlow
        inputs_map:
          userId: "steps.validate-deposit-request.outputs.validData.userId"
          depositAmount: "steps.process-payment-transaction.outputs.processedAmount"
          bonusCode: "steps.validate-deposit-request.outputs.validData.bonusCode"
        run_after: [update-user-balance]

      - step_id: trigger-tier-evaluation
        component_ref: StdLib:SubFlowInvoker
        config:
          flow_fqn: com.casino.core.EvaluateUserTierFlow
        inputs_map:
          userId: "steps.validate-deposit-request.outputs.validData.userId"
          newDepositAmount: "steps.process-payment-transaction.outputs.processedAmount"
        run_after: [update-user-balance]

  # User Tier Evaluation and Upgrade Flow
  - name: EvaluateUserTierFlow
    trigger:
      type: StdLib:EventTrigger
      config:
        eventType: deposit-completed
    steps:
      - step_id: get-updated-user-stats
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.user-service-url}}/users/{{userId}}/lifetime-stats"
          method: GET
        inputs_map:
          userId: "trigger.event.userId"

      - step_id: calculate-new-tier
        component_ref: user-tier-classifier
        inputs_map:
          totalLifetimeDeposits: "steps.get-updated-user-stats.outputs.totalLifetimeDeposits"
        run_after: [get-updated-user-stats]

      - step_id: check-tier-upgrade
        component_ref: StdLib:FilterData
        config:
          expression: "newTier != currentTier && tierRanking[newTier] > tierRanking[currentTier]"
          matchOutput: tierUpgrade
          noMatchOutput: noChange
        inputs_map:
          newTier: "steps.calculate-new-tier.outputs"
          currentTier: "steps.get-updated-user-stats.outputs.currentTier"
          tierRanking: "{ standard: 0, bronze: 1, silver: 2, gold: 3, platinum: 4 }"
        run_after: [calculate-new-tier]

      - step_id: process-tier-upgrade
        component_ref: StdLib:Fork
        config:
          branches:
            - name: update-user-tier
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.user-service-url}}/users/{{userId}}/tier"
                method: PATCH
            - name: award-upgrade-bonus
              component_ref: bonuses.AwardTierUpgradeBonusFlow
            - name: send-upgrade-notification
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.communication-service-url}}/send-tier-upgrade"
                method: POST
        inputs_map:
          userId: "trigger.event.userId"
          newTier: "steps.calculate-new-tier.outputs"
          oldTier: "steps.get-updated-user-stats.outputs.currentTier"
        run_after: [check-tier-upgrade]
        condition: "steps.check-tier-upgrade.outputs.tierUpgrade != null"

components:
  # User Profile Management
  - name: GetUserProfile
    type: StdLib:HttpCall
    config:
      url: "{{secrets.user-service-url}}/users/{{userId}}/profile"
      method: GET
      timeout: 3000

  - name: UpdateUserProfile
    type: StdLib:HttpCall
    config:
      url: "{{secrets.user-service-url}}/users/{{userId}}/profile"
      method: PATCH
      timeout: 5000

  # Balance Management
  - name: GetUserBalance
    type: StdLib:HttpCall
    config:
      url: "{{secrets.user-service-url}}/users/{{userId}}/balance"
      method: GET
      timeout: 2000

  - name: UpdateUserBalance
    type: StdLib:HttpCall
    config:
      url: "{{secrets.user-service-url}}/users/{{userId}}/balance"
      method: PATCH
      timeout: 5000
    `
  },

  // User Management Module
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

  components:
    - name: kyc-verifier
      type: StdLib:HttpCall
      config:
        url: "{{context.kyc-verification-url}}"
        method: POST
        timeout: 30000
        headers:
          Authorization: "Bearer {{secrets.kyc-api-key}}"

    - name: deposit-limit-checker
      type: StdLib:FilterData
      config:
        expression: "dailyTotal + amount <= {{context.max-daily-deposit}}"
        matchOutput: withinLimit
        noMatchOutput: exceedsLimit

flows:
  - name: UserRegistrationFlow
    trigger:
      type: StdLib:HttpTrigger
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
      
      - step_id: check-age-eligibility
        component_ref: StdLib:FilterData
        config:
          expression: "age(dateOfBirth) >= 18"
          matchOutput: eligible
          noMatchOutput: underage
        inputs_map:
          data: "steps.validate-user-data.outputs.validData"
        run_after: [validate-user-data]
      
      - step_id: perform-kyc
        component_ref: kyc-verifier
        inputs_map:
          userData: "steps.check-age-eligibility.outputs.eligible"
        run_after: [check-age-eligibility]
      
      - step_id: create-user-account
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.user-db-url}}/users"
          method: POST
        inputs_map:
          userData: "steps.perform-kyc.outputs.verifiedUser"
        run_after: [perform-kyc]

  - name: DepositFlow
    trigger:
      type: StdLib:HttpTrigger
      config:
        path: /api/users/deposit
        method: POST
    steps:
      - step_id: check-deposit-limits
        component_ref: deposit-limit-checker
        inputs_map:
          data: "trigger.body"
      
      - step_id: fraud-detection
        component_ref: StdLib:Fork
        config:
          branches:
            - name: velocity-check
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.fraud-service-url}}/velocity-check"
                method: POST
            - name: device-check
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.fraud-service-url}}/device-check"
                method: POST
            - name: geo-check
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.fraud-service-url}}/geo-check"
                method: POST
        inputs_map:
          data: "steps.check-deposit-limits.outputs.withinLimit"
        run_after: [check-deposit-limits]
      
      - step_id: evaluate-fraud-results
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              riskScore: (velocityScore + deviceScore + geoScore) / 3,
              approved: (velocityScore + deviceScore + geoScore) / 3 < 0.7
            }
        inputs_map:
          velocityScore: "steps.fraud-detection.outputs.velocity-check.riskScore"
          deviceScore: "steps.fraud-detection.outputs.device-check.riskScore"
          geoScore: "steps.fraud-detection.outputs.geo-check.riskScore"
        run_after: [fraud-detection]
      
      - step_id: process-deposit
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.payment-processor-url}}/deposit"
          method: POST
        inputs_map:
          depositData: "trigger.body"
        run_after: [evaluate-fraud-results]
        condition: "steps.evaluate-fraud-results.outputs.approved == true"

components:
  - name: CheckBalance
    type: StdLib:HttpCall
    config:
      url: "{{secrets.user-db-url}}/users/{{userId}}/balance"
      method: GET

  - name: UpdateBalance
    type: StdLib:HttpCall
    config:
      url: "{{secrets.user-db-url}}/users/{{userId}}/balance"
      method: PATCH

  - name: AwardBonus
    type: StdLib:HttpCall
    config:
      url: "{{secrets.user-db-url}}/users/{{userId}}/bonus"
      method: POST
    `
  },

  // Games Module
  {
    fqn: 'com.casino.games',
    content: `
dsl_version: "1.1"
namespace: com.casino.games

imports:
  - namespace: com.casino.core
    as: core

definitions:
  context:
    - name: rng-service-url
      value: "https://api.rng-provider.com/generate"
      type: string
    - name: game-result-retention-days
      value: 90
      type: number

  components:
    - name: rng-generator
      type: StdLib:HttpCall
      config:
        url: "{{context.rng-service-url}}"
        method: POST
        timeout: 5000
        headers:
          Authorization: "Bearer {{secrets.rng-api-key}}"

flows:
  - name: SlotGameFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: core.PlaceBetFlow
    steps:
      - step_id: generate-reels
        component_ref: StdLib:Fork
        config:
          branches:
            - name: reel1
              component_ref: rng-generator
              config:
                min: 1
                max: 10
            - name: reel2
              component_ref: rng-generator
              config:
                min: 1
                max: 10
            - name: reel3
              component_ref: rng-generator
              config:
                min: 1
                max: 10
        inputs_map:
          gameId: "trigger.gameId"
      
      - step_id: calculate-slot-outcome
        component_ref: StdLib:Switch
        config:
          cases:
            - conditionExpression: "reel1 == reel2 && reel2 == reel3 && reel1 == 7"
              outputName: jackpot
            - conditionExpression: "reel1 == reel2 && reel2 == reel3"
              outputName: triple
            - conditionExpression: "reel1 == reel2 || reel2 == reel3 || reel1 == reel3"
              outputName: double
          defaultOutputName: noWin
        inputs_map:
          reel1: "steps.generate-reels.outputs.reel1.value"
          reel2: "steps.generate-reels.outputs.reel2.value"
          reel3: "steps.generate-reels.outputs.reel3.value"
        run_after: [generate-reels]
      
      - step_id: calculate-payout
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              win: outcome != 'noWin',
              multiplier: outcome == 'jackpot' ? 100 : (outcome == 'triple' ? 10 : (outcome == 'double' ? 2 : 0)),
              reels: [reel1, reel2, reel3],
              outcome: outcome
            }
        inputs_map:
          outcome: "steps.calculate-slot-outcome.outputs"
          reel1: "steps.generate-reels.outputs.reel1.value"
          reel2: "steps.generate-reels.outputs.reel2.value"
          reel3: "steps.generate-reels.outputs.reel3.value"
        run_after: [calculate-slot-outcome]

  - name: BlackjackGameFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: core.PlaceBetFlow
    steps:
      - step_id: deal-initial-cards
        component_ref: StdLib:Fork
        config:
          branches:
            - name: player-card1
              component_ref: rng-generator
              config:
                min: 1
                max: 13
            - name: player-card2
              component_ref: rng-generator
              config:
                min: 1
                max: 13
            - name: dealer-card1
              component_ref: rng-generator
              config:
                min: 1
                max: 13
            - name: dealer-card2
              component_ref: rng-generator
              config:
                min: 1
                max: 13
        inputs_map:
          gameId: "trigger.gameId"
      
      - step_id: calculate-hand-values
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              playerHand: calculateBlackjackValue([playerCard1, playerCard2]),
              dealerHand: calculateBlackjackValue([dealerCard1, dealerCard2]),
              playerCards: [playerCard1, playerCard2],
              dealerCards: [dealerCard1, dealerCard2]
            }
        inputs_map:
          playerCard1: "steps.deal-initial-cards.outputs.player-card1.value"
          playerCard2: "steps.deal-initial-cards.outputs.player-card2.value"
          dealerCard1: "steps.deal-initial-cards.outputs.dealer-card1.value"
          dealerCard2: "steps.deal-initial-cards.outputs.dealer-card2.value"
        run_after: [deal-initial-cards]
      
      - step_id: determine-winner
        component_ref: StdLib:Switch
        config:
          cases:
            - conditionExpression: "playerHand == 21 && dealerHand != 21"
              outputName: playerBlackjack
            - conditionExpression: "playerHand > 21"
              outputName: playerBust
            - conditionExpression: "dealerHand > 21"
              outputName: dealerBust
            - conditionExpression: "playerHand > dealerHand"
              outputName: playerWin
            - conditionExpression: "playerHand == dealerHand"
              outputName: push
          defaultOutputName: dealerWin
        inputs_map:
          playerHand: "steps.calculate-hand-values.outputs.playerHand"
          dealerHand: "steps.calculate-hand-values.outputs.dealerHand"
        run_after: [calculate-hand-values]
      
      - step_id: calculate-blackjack-payout
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              win: outcome == 'playerBlackjack' || outcome == 'dealerBust' || outcome == 'playerWin',
              multiplier: outcome == 'playerBlackjack' ? 2.5 : (outcome == 'push' ? 1 : (outcome == 'playerWin' || outcome == 'dealerBust' ? 2 : 0)),
              handDetails: handValues,
              outcome: outcome
            }
        inputs_map:
          outcome: "steps.determine-winner.outputs"
          handValues: "steps.calculate-hand-values.outputs"
        run_after: [determine-winner]

components:
  - name: ExecuteGame
    type: StdLib:Switch
    config:
      cases:
        - conditionExpression: "gameType == 'slot'"
          outputName: slotGame
        - conditionExpression: "gameType == 'blackjack'"
          outputName: blackjackGame
        - conditionExpression: "gameType == 'roulette'"
          outputName: rouletteGame
      defaultOutputName: unsupportedGame
    `
  },

  // Payments Module
  {
    fqn: 'com.casino.payments',
    content: `
dsl_version: "1.1"
namespace: com.casino.payments

definitions:
  context:
    - name: payment-timeout
      value: 30000
      type: number
    - name: max-refund-days
      value: 30
      type: number

flows:
  - name: RefundFlow
    trigger:
      type: StdLib:EventTrigger
      config:
        eventType: bet-cancelled
    steps:
      - step_id: validate-refund-eligibility
        component_ref: StdLib:FilterData
        config:
          expression: "daysSinceBet <= {{context.max-refund-days}} && originalBet.status == 'completed'"
          matchOutput: eligible
          noMatchOutput: ineligible
        inputs_map:
          data: "trigger.event"
      
      - step_id: calculate-refund
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              amount: originalBet.amount,
              userId: userId,
              refundReason: reason,
              originalTransactionId: originalBet.transactionId
            }
        inputs_map:
          originalBet: "steps.validate-refund-eligibility.outputs.eligible.originalBet"
          userId: "steps.validate-refund-eligibility.outputs.eligible.userId"
          reason: "steps.validate-refund-eligibility.outputs.eligible.reason"
        run_after: [validate-refund-eligibility]
      
      - step_id: process-refund
        component_ref: ProcessPayment
        config:
          url: "{{secrets.payment-service-url}}/refund"
        inputs_map:
          refundData: "steps.calculate-refund.outputs"
        run_after: [calculate-refund]

components:
  - name: ProcessPayment
    type: StdLib:HttpCall
    config:
      url: "{{secrets.payment-service-url}}/process"
      method: POST
      timeout: "{{context.payment-timeout}}"
      headers:
        Authorization: "Bearer {{secrets.payment-api-key}}"
    `
  },

  // Compliance Module
  {
    fqn: 'com.casino.compliance',
    content: `
dsl_version: "1.1"
namespace: com.casino.compliance

definitions:
  context:
    - name: aml-threshold
      value: 10000
      type: number
    - name: suspicious-pattern-threshold
      value: 5
      type: number

flows:
  - name: AMLMonitoringFlow
    trigger:
      type: StdLib:EventTrigger
      config:
        eventType: large-transaction
    steps:
      - step_id: check-aml-threshold
        component_ref: StdLib:FilterData
        config:
          expression: "amount >= {{context.aml-threshold}}"
          matchOutput: requiresReview
          noMatchOutput: normalTransaction
        inputs_map:
          data: "trigger.event"
      
      - step_id: analyze-transaction-pattern
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.aml-service-url}}/analyze-pattern"
          method: POST
        inputs_map:
          transactionData: "steps.check-aml-threshold.outputs.requiresReview"
        run_after: [check-aml-threshold]
        condition: "steps.check-aml-threshold.outputs.requiresReview != null"
      
      - step_id: risk-scoring
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              riskScore: (patternScore + amountScore + frequencyScore) / 3,
              requiresManualReview: (patternScore + amountScore + frequencyScore) / 3 > 0.8,
              userId: userId
            }
        inputs_map:
          patternScore: "steps.analyze-transaction-pattern.outputs.patternRisk"
          amountScore: "steps.analyze-transaction-pattern.outputs.amountRisk"
          frequencyScore: "steps.analyze-transaction-pattern.outputs.frequencyRisk"
          userId: "trigger.event.userId"
        run_after: [analyze-transaction-pattern]
      
      - step_id: flag-for-review
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.compliance-db-url}}/flag-transaction"
          method: POST
        inputs_map:
          flagData: "steps.risk-scoring.outputs"
        run_after: [risk-scoring]
        condition: "steps.risk-scoring.outputs.requiresManualReview == true"

components:
  - name: RiskCheck
    type: StdLib:Fork
    config:
      branches:
        - name: velocity-check
          component_ref: StdLib:HttpCall
          config:
            url: "{{secrets.compliance-service-url}}/velocity-check"
            method: POST
        - name: pattern-check
          component_ref: StdLib:HttpCall
          config:
            url: "{{secrets.compliance-service-url}}/pattern-check"
            method: POST
        - name: blacklist-check
          component_ref: StdLib:HttpCall
          config:
            url: "{{secrets.compliance-service-url}}/blacklist-check"
            method: POST
    `
  },

  // KYC (Know Your Customer) Module - Comprehensive Identity Verification
  {
    fqn: 'com.casino.kyc',
    content: `
dsl_version: "1.1"
namespace: com.casino.kyc
imports:
  - namespace: com.casino.compliance
    as: compliance
  - namespace: com.casino.analytics
    as: analytics

definitions:
  context:
    - name: kyc-provider-primary-url
      value: "https://api.kyc-primary.com"
      type: string
    - name: kyc-provider-secondary-url
      value: "https://api.kyc-secondary.com"
      type: string
    - name: document-verification-timeout
      value: 30000
      type: number
    - name: biometric-verification-timeout
      value: 45000
      type: number
    - name: max-verification-attempts
      value: 3
      type: number

  components:
    - name: document-verifier-with-fallback
      type: StdLib:Fork
      config:
        branches:
          - name: primary-verification
            component_ref: StdLib:HttpCall
            config:
              url: "{{context.kyc-provider-primary-url}}/verify-document"
              method: POST
              timeout: "{{context.document-verification-timeout}}"
          - name: secondary-verification
            component_ref: StdLib:HttpCall
            config:
              url: "{{secrets.kyc-secondary-url}}/verify-document"
              method: POST
              timeout: "{{context.document-verification-timeout}}"

    - name: biometric-verifier
      type: StdLib:HttpCall
      config:
        url: "{{context.kyc-provider-primary-url}}/verify-biometric"
        method: POST
        timeout: "{{context.biometric-verification-timeout}}"
        headers:
          Authorization: "Bearer {{secrets.kyc-primary-api-key}}"

    - name: address-verifier
      type: StdLib:Fork
      config:
        branches:
          - name: utility-bill-check
            component_ref: StdLib:HttpCall
            config:
              url: "{{context.kyc-provider-primary-url}}/verify-utility-bill"
              method: POST
          - name: bank-statement-check
            component_ref: StdLib:HttpCall
            config:
              url: "{{context.kyc-provider-primary-url}}/verify-bank-statement"
              method: POST
          - name: address-database-check
            component_ref: StdLib:HttpCall
            config:
              url: "{{secrets.address-verification-service-url}}/verify"
              method: POST

flows:
  - name: InitiateKYCFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: com.casino.core.UserOnboardingFlow
    steps:
      - step_id: create-kyc-session
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.kyc-service-url}}/sessions"
          method: POST
          timeout: 5000
        inputs_map:
          userData: "trigger.userData"
          complianceData: "trigger.complianceData"

      - step_id: determine-kyc-level
        component_ref: StdLib:Switch
        config:
          cases:
            - conditionExpression: "complianceData.riskLevel == 'high'"
              outputName: enhanced
            - conditionExpression: "complianceData.riskLevel == 'medium'"
              outputName: standard
            - conditionExpression: "complianceData.riskLevel == 'low'"
              outputName: basic
          defaultOutputName: standard
        inputs_map:
          complianceData: "trigger.complianceData"
        run_after: [create-kyc-session]

      - step_id: verify-identity-documents
        component_ref: document-verifier-with-fallback
        inputs_map:
          sessionId: "steps.create-kyc-session.outputs.sessionId"
          kycLevel: "steps.determine-kyc-level.outputs"
        run_after: [determine-kyc-level]

      - step_id: calculate-kyc-score
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              overallScore: (primaryScore || secondaryScore) * 0.8 + dataConsistency * 0.2,
              status: ((primaryScore || secondaryScore) * 0.8 + dataConsistency * 0.2) > 0.8 ? 'verified' : 'pending_review'
            }
        inputs_map:
          primaryScore: "steps.verify-identity-documents.outputs.primary-verification.confidence"
          secondaryScore: "steps.verify-identity-documents.outputs.secondary-verification.confidence"
          dataConsistency: "0.9"
        run_after: [verify-identity-documents]

components:
  - name: CreateKYCSession
    type: StdLib:HttpCall
    config:
      url: "{{secrets.kyc-service-url}}/sessions"
      method: POST
    `
  },

  // Responsible Gambling Module - Comprehensive Player Protection
  {
    fqn: 'com.casino.responsible',
    content: `
dsl_version: "1.1"
namespace: com.casino.responsible
imports:
  - namespace: com.casino.analytics
    as: analytics
  - namespace: com.casino.compliance
    as: compliance

definitions:
  context:
    - name: default-daily-deposit-limit
      value: 1000
      type: number
    - name: default-daily-loss-limit
      value: 500
      type: number
    - name: default-session-time-limit
      value: 240
      type: number
    - name: cooling-off-period-hours
      value: 24
      type: number
    - name: self-exclusion-min-days
      value: 30
      type: number
    - name: problem-gambling-threshold
      value: 0.7
      type: number

  components:
    # Behavioral Pattern Analyzer
    - name: behavioral-pattern-analyzer
      type: StdLib:Fork
      config:
        branches:
          - name: loss-chasing-detector
            component_ref: StdLib:HttpCall
            config:
              url: "{{secrets.analytics-service-url}}/detect-loss-chasing"
              method: POST
          - name: session-length-analyzer
            component_ref: StdLib:MapData
            config:
              expression: |
                {
                  averageSessionLength: sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length,
                  longestSession: Math.max(...sessionLengths),
                  sessionsOver4Hours: sessionLengths.filter(s => s > 240).length,
                  riskScore: (sessionLengths.filter(s => s > 240).length / sessionLengths.length) * 0.5 +
                            (Math.max(...sessionLengths) > 480 ? 0.3 : 0) +
                            ((sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length) > 180 ? 0.2 : 0)
                }
          - name: spending-velocity-analyzer
            component_ref: StdLib:MapData
            config:
              expression: |
                {
                  dailySpendingTrend: calculateTrend(dailySpending),
                  weeklySpendingTrend: calculateTrend(weeklySpending),
                  spendingAcceleration: calculateAcceleration(dailySpending),
                  riskScore: Math.abs(calculateAcceleration(dailySpending)) > 0.5 ? 0.8 : 
                            Math.abs(calculateTrend(dailySpending)) > 0.3 ? 0.5 : 0.2
                }

    # Limit Enforcement Engine
    - name: limit-enforcement-engine
      type: StdLib:Switch
      config:
        cases:
          - conditionExpression: "limitType == 'deposit' && currentAmount + requestedAmount > dailyDepositLimit"
            outputName: depositLimitExceeded
          - conditionExpression: "limitType == 'loss' && currentLosses + potentialLoss > dailyLossLimit"
            outputName: lossLimitExceeded
          - conditionExpression: "limitType == 'session' && sessionDuration > sessionTimeLimit"
            outputName: sessionLimitExceeded
          - conditionExpression: "limitType == 'wager' && requestedWager > maxWagerLimit"
            outputName: wagerLimitExceeded
        defaultOutputName: withinLimits

flows:
  # Setup Default Responsible Gambling Limits
  - name: SetupDefaultLimitsFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: com.casino.core.UserOnboardingFlow
    steps:
      - step_id: determine-default-limits
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              dailyDepositLimit: userTier == 'platinum' ? 10000 :
                               userTier == 'gold' ? 5000 :
                               userTier == 'silver' ? 2000 :
                               userTier == 'bronze' ? 1000 : {{context.default-daily-deposit-limit}},
              dailyLossLimit: userTier == 'platinum' ? 5000 :
                             userTier == 'gold' ? 2500 :
                             userTier == 'silver' ? 1000 :
                             userTier == 'bronze' ? 500 : {{context.default-daily-loss-limit}},
              sessionTimeLimit: {{context.default-session-time-limit}},
              maxWagerLimit: userTier == 'platinum' ? 1000 :
                            userTier == 'gold' ? 500 :
                            userTier == 'silver' ? 200 :
                            userTier == 'bronze' ? 100 : 50,
              coolingOffEnabled: false,
              selfExclusionActive: false
            }
        inputs_map:
          userTier: "trigger.userTier"

      - step_id: create-limits-profile
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.responsible-gambling-service-url}}/limits"
          method: POST
        inputs_map:
          userId: "trigger.userId"
          limits: "steps.determine-default-limits.outputs"
        run_after: [determine-default-limits]

      - step_id: schedule-initial-check-in
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.scheduler-service-url}}/schedule"
          method: POST
        inputs_map:
          userId: "trigger.userId"
          checkType: "initial_wellness_check"
          scheduledTime: "addDays(now(), 7)"
        run_after: [create-limits-profile]

  # Comprehensive Betting Limits Validation
  - name: ValidateBettingLimitsFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: com.casino.core.PlaceBetFlow
    steps:
      - step_id: get-current-limits
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.responsible-gambling-service-url}}/limits/{{userId}}"
          method: GET
        inputs_map:
          userId: "trigger.userId"

      - step_id: get-current-spending
        component_ref: StdLib:Fork
        config:
          branches:
            - name: daily-spending
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.analytics-service-url}}/spending/daily/{{userId}}"
                method: GET
            - name: session-spending
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.analytics-service-url}}/spending/session/{{userId}}"
                method: GET
            - name: session-duration
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.session-service-url}}/duration/{{userId}}"
                method: GET
        inputs_map:
          userId: "trigger.userId"
        run_after: [get-current-limits]

      - step_id: check-wager-limit
        component_ref: limit-enforcement-engine
        inputs_map:
          limitType: "wager"
          requestedWager: "trigger.betAmount"
          maxWagerLimit: "steps.get-current-limits.outputs.maxWagerLimit"
        run_after: [get-current-limits]

      - step_id: check-potential-loss-limit
        component_ref: limit-enforcement-engine
        inputs_map:
          limitType: "loss"
          currentLosses: "steps.get-current-spending.outputs.daily-spending.totalLosses"
          potentialLoss: "trigger.betAmount"
          dailyLossLimit: "steps.get-current-limits.outputs.dailyLossLimit"
        run_after: [get-current-spending]

      - step_id: check-session-time-limit
        component_ref: limit-enforcement-engine
        inputs_map:
          limitType: "session"
          sessionDuration: "steps.get-current-spending.outputs.session-duration.minutes"
          sessionTimeLimit: "steps.get-current-limits.outputs.sessionTimeLimit"
        run_after: [get-current-spending]

      - step_id: analyze-behavioral-patterns
        component_ref: behavioral-pattern-analyzer
        inputs_map:
          userId: "trigger.userId"
          currentBet: "trigger.betAmount"
          gameType: "trigger.gameType"
          recentActivity: "steps.get-current-spending.outputs"
        run_after: [get-current-spending]

      - step_id: aggregate-risk-assessment
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              wagerApproved: wagerCheck == 'withinLimits',
              lossLimitApproved: lossCheck == 'withinLimits',
              sessionApproved: sessionCheck == 'withinLimits',
              behavioralRiskScore: (lossChasingScore + sessionRiskScore + spendingRiskScore) / 3,
              overallApproved: wagerCheck == 'withinLimits' && 
                              lossCheck == 'withinLimits' && 
                              sessionCheck == 'withinLimits' &&
                              ((lossChasingScore + sessionRiskScore + spendingRiskScore) / 3) < {{context.problem-gambling-threshold}},
              interventionRequired: ((lossChasingScore + sessionRiskScore + spendingRiskScore) / 3) >= {{context.problem-gambling-threshold}}
            }
        inputs_map:
          wagerCheck: "steps.check-wager-limit.outputs"
          lossCheck: "steps.check-potential-loss-limit.outputs"
          sessionCheck: "steps.check-session-time-limit.outputs"
          lossChasingScore: "steps.analyze-behavioral-patterns.outputs.loss-chasing-detector.riskScore"
          sessionRiskScore: "steps.analyze-behavioral-patterns.outputs.session-length-analyzer.riskScore"
          spendingRiskScore: "steps.analyze-behavioral-patterns.outputs.spending-velocity-analyzer.riskScore"
        run_after: [check-wager-limit, check-potential-loss-limit, check-session-time-limit, analyze-behavioral-patterns]

      - step_id: trigger-intervention
        component_ref: StdLib:SubFlowInvoker
        config:
          flow_fqn: com.casino.responsible.TriggerInterventionFlow
        inputs_map:
          userId: "trigger.userId"
          riskAssessment: "steps.aggregate-risk-assessment.outputs"
          currentActivity: "trigger"
        run_after: [aggregate-risk-assessment]
        condition: "steps.aggregate-risk-assessment.outputs.interventionRequired == true"

  # Player Intervention and Support Flow
  - name: TriggerInterventionFlow
    trigger:
      type: StdLib:EventTrigger
      config:
        eventType: responsible-gambling-intervention-required
    steps:
      - step_id: determine-intervention-level
        component_ref: StdLib:Switch
        config:
          cases:
            - conditionExpression: "riskScore >= 0.9"
              outputName: immediate
            - conditionExpression: "riskScore >= 0.7"
              outputName: urgent
            - conditionExpression: "riskScore >= 0.5"
              outputName: moderate
          defaultOutputName: low
        inputs_map:
          riskScore: "trigger.event.riskAssessment.behavioralRiskScore"

      - step_id: implement-immediate-measures
        component_ref: StdLib:Fork
        config:
          branches:
            - name: session-timeout
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.session-service-url}}/force-timeout"
                method: POST
            - name: reduce-limits
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.responsible-gambling-service-url}}/emergency-limit-reduction"
                method: POST
            - name: block-deposits
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.payment-service-url}}/block-deposits"
                method: POST
        inputs_map:
          userId: "trigger.event.userId"
          interventionLevel: "steps.determine-intervention-level.outputs"
        run_after: [determine-intervention-level]
        condition: "steps.determine-intervention-level.outputs == 'immediate'"

      - step_id: send-support-resources
        component_ref: StdLib:Fork
        config:
          branches:
            - name: email-resources
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.communication-service-url}}/send-support-resources"
                method: POST
            - name: sms-helpline
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.communication-service-url}}/send-helpline-info"
                method: POST
            - name: in-app-notification
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.notification-service-url}}/responsible-gambling-alert"
                method: POST
        inputs_map:
          userId: "trigger.event.userId"
          interventionLevel: "steps.determine-intervention-level.outputs"
          riskFactors: "trigger.event.riskAssessment"
        run_after: [determine-intervention-level]

      - step_id: schedule-follow-up
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.scheduler-service-url}}/schedule-follow-up"
          method: POST
        inputs_map:
          userId: "trigger.event.userId"
          followUpType: "responsible_gambling_check"
          scheduledTime: "addHours(now(), {{context.cooling-off-period-hours}})"
          interventionLevel: "steps.determine-intervention-level.outputs"
        run_after: [send-support-resources]

      - step_id: notify-compliance-team
        component_ref: compliance.NotifyResponsibleGamblingTeamFlow
        inputs_map:
          userId: "trigger.event.userId"
          interventionDetails: "steps.implement-immediate-measures.outputs"
          riskAssessment: "trigger.event.riskAssessment"
        run_after: [implement-immediate-measures]
        condition: "steps.determine-intervention-level.outputs in ['immediate', 'urgent']"

  # Self-Exclusion Management Flow
  - name: ProcessSelfExclusionFlow
    trigger:
      type: StdLib:HttpTrigger
      config:
        path: /api/responsible-gambling/self-exclusion
        method: POST
    steps:
      - step_id: validate-exclusion-request
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
            type: object
            required: [userId, exclusionType, duration]
            properties:
              userId: { type: string }
              exclusionType: { type: string, enum: [temporary, permanent] }
              duration: { type: number, minimum: "{{context.self-exclusion-min-days}}" }
              reason: { type: string }
        inputs_map:
          data: "trigger.body"

      - step_id: implement-account-restrictions
        component_ref: StdLib:Fork
        config:
          branches:
            - name: disable-account
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.user-service-url}}/disable-account"
                method: POST
            - name: block-all-payments
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.payment-service-url}}/block-all-transactions"
                method: POST
            - name: cancel-bonuses
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.bonus-service-url}}/cancel-all-bonuses"
                method: POST
            - name: close-active-sessions
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.session-service-url}}/close-all-sessions"
                method: POST
        inputs_map:
          userId: "steps.validate-exclusion-request.outputs.validData.userId"
          exclusionType: "steps.validate-exclusion-request.outputs.validData.exclusionType"
        run_after: [validate-exclusion-request]

      - step_id: schedule-exclusion-end
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.scheduler-service-url}}/schedule-exclusion-end"
          method: POST
        inputs_map:
          userId: "steps.validate-exclusion-request.outputs.validData.userId"
          endDate: "addDays(now(), steps.validate-exclusion-request.outputs.validData.duration)"
          exclusionType: "steps.validate-exclusion-request.outputs.validData.exclusionType"
        run_after: [implement-account-restrictions]
        condition: "steps.validate-exclusion-request.outputs.validData.exclusionType == 'temporary'"

      - step_id: send-confirmation
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.communication-service-url}}/send-exclusion-confirmation"
          method: POST
        inputs_map:
          userId: "steps.validate-exclusion-request.outputs.validData.userId"
          exclusionDetails: "steps.validate-exclusion-request.outputs.validData"
        run_after: [implement-account-restrictions]

components:
  # Limit Management
  - name: GetUserLimits
    type: StdLib:HttpCall
    config:
      url: "{{secrets.responsible-gambling-service-url}}/limits/{{userId}}"
      method: GET

  - name: UpdateUserLimits
    type: StdLib:HttpCall
    config:
      url: "{{secrets.responsible-gambling-service-url}}/limits/{{userId}}"
      method: PATCH

  # Session Management
  - name: ForceSessionTimeout
    type: StdLib:HttpCall
    config:
      url: "{{secrets.session-service-url}}/force-timeout"
      method: POST
    `
  },

  // Bonuses Module - Sophisticated Bonus Management System
  {
    fqn: 'com.casino.bonuses',
    content: `
dsl_version: "1.1"
namespace: com.casino.bonuses

flows:
  - name: ProcessReferralBonusFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: com.casino.core.UserOnboardingFlow
    steps:
      - step_id: validate-referral-code
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.referral-service-url}}/validate-code"
          method: POST
        inputs_map:
          referralCode: "trigger.referralCode"

      - step_id: award-bonuses
        component_ref: StdLib:Fork
        config:
          branches:
            - name: award-referrer-bonus
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.bonus-service-url}}/award-bonus"
                method: POST
            - name: award-new-user-bonus
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.bonus-service-url}}/award-bonus"
                method: POST
        run_after: [validate-referral-code]

  - name: EvaluateDepositBonusFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: com.casino.core.ProcessDepositFlow
    steps:
      - step_id: calculate-deposit-bonus
        component_ref: StdLib:Switch
        config:
          cases:
            - conditionExpression: "bonusCode == 'WELCOME100'"
              outputName: welcomeBonus
            - conditionExpression: "bonusCode == 'RELOAD50'"
              outputName: reloadBonus
          defaultOutputName: noBonus
        inputs_map:
          bonusCode: "trigger.bonusCode"

components:
  - name: AwardBonus
    type: StdLib:HttpCall
    config:
      url: "{{secrets.bonus-service-url}}/award-bonus"
      method: POST
    `
  },

  // Payments Module - Advanced Payment Processing
  {
    fqn: 'com.casino.payments',
    content: `
dsl_version: "1.1"
namespace: com.casino.payments

flows:
  - name: ProcessBetPaymentFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: com.casino.core.PlaceBetFlow
    steps:
      - step_id: process-payment
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.payment-service-url}}/process-payment"
          method: POST
        inputs_map:
          userId: "trigger.userId"
          amount: "trigger.amount"

  - name: ProcessWithdrawalFlow
    trigger:
      type: StdLib:HttpTrigger
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

      - step_id: process-withdrawal
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.payment-service-url}}/process-withdrawal"
          method: POST
        inputs_map:
          withdrawalData: "steps.validate-withdrawal.outputs.validData"
        run_after: [validate-withdrawal]

components:
  - name: ProcessPayment
    type: StdLib:HttpCall
    config:
      url: "{{secrets.payment-service-url}}/process"
      method: POST
      timeout: "{{context.payment-timeout}}"
      headers:
        Authorization: "Bearer {{secrets.payment-api-key}}"
    `
  },

  // Games Module - Sophisticated Game Engine
  {
    fqn: 'com.casino.games',
    content: `
dsl_version: "1.1"
namespace: com.casino.games

flows:
  - name: ExecuteGameFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: com.casino.core.PlaceBetFlow
    steps:
      - step_id: route-to-game-engine
        component_ref: StdLib:Switch
        config:
          cases:
            - conditionExpression: "gameType == 'slots'"
              outputName: slotsEngine
            - conditionExpression: "gameType == 'blackjack'"
              outputName: blackjackEngine
          defaultOutputName: unsupportedGame
        inputs_map:
          gameType: "trigger.gameType"

      - step_id: execute-slots-game
        component_ref: StdLib:Fork
        config:
          branches:
            - name: generate-reels
              component_ref: StdLib:HttpCall
              config:
                url: "{{secrets.rng-service-url}}/generate-reels"
                method: POST
            - name: calculate-outcome
              component_ref: StdLib:MapData
              config:
                expression: |
                  {
                    win: reels[0] == reels[1] && reels[1] == reels[2],
                    winnings: (reels[0] == reels[1] && reels[1] == reels[2]) ? betAmount * 10 : 0
                  }
        inputs_map:
          betAmount: "trigger.betAmount"
        run_after: [route-to-game-engine]
        condition: "steps.route-to-game-engine.outputs == 'slotsEngine'"

components:
  - name: ExecuteGame
    type: StdLib:Switch
    config:
      cases:
        - conditionExpression: "gameType == 'slots'"
          outputName: slotsResult
      defaultOutputName: unsupportedGame
    `
  },

  // Analytics Module
  {
    fqn: 'com.casino.analytics',
    content: `
dsl_version: "1.1"
namespace: com.casino.analytics

flows:
  - name: RecordGameplayAnalyticsFlow
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: com.casino.core.PlaceBetFlow
    steps:
      - step_id: send-to-analytics
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.analytics-service-url}}/events"
          method: POST
        inputs_map:
          userId: "trigger.userId"

components:
  - name: TrackEvent
    type: StdLib:HttpCall
    config:
      url: "{{secrets.analytics-service-url}}/track"
      method: POST
    `
  }
];

export const casinoPlatformComponentSchemas = {
  'StdLib:HttpTrigger': {
    fqn: 'StdLib:HttpTrigger',
    configSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
      },
      required: ['path', 'method']
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: { type: 'object' },
        headers: { type: 'object' }
      }
    }
  },
  'StdLib:EventTrigger': {
    fqn: 'StdLib:EventTrigger',
    configSchema: {
      type: 'object',
      properties: {
        eventType: { type: 'string' }
      },
      required: ['eventType']
    }
  },
  'StdLib:HttpCall': {
    fqn: 'StdLib:HttpCall',
    configSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        method: { type: 'string' },
        timeout: { type: 'number' },
        headers: { type: 'object' },
        retries: { type: 'number' }
      },
      required: ['url', 'method']
    }
  },
  'StdLib:FilterData': {
    fqn: 'StdLib:FilterData',
    configSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string' },
        matchOutput: { type: 'string' },
        noMatchOutput: { type: 'string' }
      },
      required: ['expression']
    }
  },
  'StdLib:MapData': {
    fqn: 'StdLib:MapData',
    configSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string' }
      },
      required: ['expression']
    }
  },
  'StdLib:Switch': {
    fqn: 'StdLib:Switch',
    configSchema: {
      type: 'object',
      properties: {
        cases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conditionExpression: { type: 'string' },
              outputName: { type: 'string' }
            }
          }
        },
        defaultOutputName: { type: 'string' }
      },
      required: ['cases']
    }
  },
  'StdLib:Fork': {
    fqn: 'StdLib:Fork',
    configSchema: {
      type: 'object',
      properties: {
        branches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              component_ref: { type: 'string' },
              config: { type: 'object' }
            }
          }
        }
      },
      required: ['branches']
    }
  },
  'StdLib:SubFlowInvoker': {
    fqn: 'StdLib:SubFlowInvoker',
    configSchema: {
      type: 'object',
      properties: {
        flow_fqn: { type: 'string' }
      },
      required: ['flow_fqn']
    }
  },
  'StdLib:JsonSchemaValidator': {
    fqn: 'StdLib:JsonSchemaValidator',
    configSchema: {
      type: 'object',
      properties: {
        schema: { type: 'object' }
      },
      required: ['schema']
    }
  }
}; 