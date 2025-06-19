import React from 'react';
import { SyntaxHighlighter } from './SyntaxHighlighter';

export const ChatUI = () => {
    return (
        <SyntaxHighlighter>
            <div className="max-w-5xl mx-auto mb-20">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
              {/* Browser Header */}
              <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700/50">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-700/50 rounded-lg px-3 py-1 text-sm text-gray-400">
                      cascade.ai/agent
                    </div>
                  </div>
                </div>
              </div>

              {/* Interface Content */}
              <div className="p-6">
                {/* Chat Interface */}
                <div className="space-y-4 mb-6">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-[#00E599]/20 border border-[#00E599]/30 rounded-2xl px-4 py-3 max-w-lg">
                      <p className="text-white text-sm">
                        Create a customer onboarding flow: database account creation → Stripe payment ($29.99) → SendGrid welcome email. Make payment resilient to failures.
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-4 py-3 max-w-2xl">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-[#00E599]/20 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-[#00E599]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <span className="text-[#00E599] text-sm font-medium">Cascade Agent</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        I'll create a CustomerOnboarding flow with HTTP trigger, database adapter, Stripe payment with retry policy, and SendGrid email.
                      </p>
                      
                      {/* Generated Flow Preview */}
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-xs">Generated Flow</span>
                        </div>
                        <pre><code className="language-cascade-flow text-xs overflow-x-auto whitespace-pre-wrap">
{`flows:
  - name: "CustomerOnboarding"
    trigger:
      type: StdLib.Trigger:Http
      config:
        path: "/api/v1/signup"
        method: "POST"
    steps:
      - step_id: "create_account"
        type: Integration.ExternalServiceAdapter
        config:
          adapterType: "App:Postgres"
        inputs:
          requestData:
            name: "{{trigger.body.fullName}}"
            email: "{{trigger.body.email}}"

      - step_id: "process_payment"
        type: Billing.ProcessPayment
        config:
          gatewayType: "Stripe"
          retryPolicy:
            maxRetries: 3
            backoffMultiplier: 2.0
        inputs:
          amount: "{{trigger.body.amount}}"
          currency: "USD"
          paymentMethodId: "{{trigger.body.paymentToken}}"

      - step_id: "send_welcome_email"
        type: Communication.SendEmail
        config:
          serviceType: "SendGrid"
          fromAddress: "noreply@acme.com"
        inputs:
          toAddresses: "trigger.body.email"
          templateId: "d-welcome-template"`}
                        </code></pre>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Message */}
                  <div className="flex justify-end">
                    <div className="bg-[#00E599]/20 border border-[#00E599]/30 rounded-2xl px-4 py-3 max-w-md">
                      <p className="text-white text-sm">
                        Add a circuit breaker to the email service too
                      </p>
                    </div>
                  </div>

                  {/* AI Update Response */}
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-4 py-3 max-w-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-[#00E599]/20 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-[#00E599]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <span className="text-[#00E599] text-sm font-medium">Cascade Agent</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Added circuit breaker to email step for better resilience:
                      </p>
                      
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-600/30">
                        <pre><code className="language-cascade-flow text-xs overflow-x-auto">
{`      - step_id: "send_welcome_email"
        config:
          serviceType: "SendGrid"
          circuitBreaker:
            failureThreshold: 5
            resetTimeoutMs: 60000`}
                        </code></pre>
                      </div>
                      
                      <p className="text-gray-200 text-sm mt-2">
                        Do you want to refine or ready to save this blueprint?
                      </p>
                    </div>
                  </div>

                  {/* User Save and Deploy Request */}
                  <div className="flex justify-end">
                    <div className="bg-[#00E599]/20 border border-[#00E599]/30 rounded-2xl px-4 py-3 max-w-xs">
                      <p className="text-white text-sm">Save and deploy it</p>
                    </div>
                  </div>

                  {/* AI Tool Call 1: Save Blueprint */}
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-4 py-3 max-w-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <span className="text-blue-400 text-sm font-medium">Tool Call: Save Blueprint</span>
                      </div>
                      <p className="text-blue-400 text-sm mt-2">
                        Blueprint saved as <code className="bg-gray-700/50 px-1 rounded text-xs">App.CustomerOnnboarding-v1</code>
                      </p>
                    </div>
                  </div>

                  {/* AI Tool Call 2: Deploy */}
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-4 py-3 max-w-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="text-purple-400 text-sm font-medium">Tool Call: Deploy Flow</span>
                      </div>
                      <p className="text-purple-400 text-sm mt-2">
                        Flow <code className="bg-gray-700/50 px-1 rounded text-xs">App.CustomerOnnboarding-v1</code> deployed <br/>With ID <code className="bg-gray-700/50 px-1 rounded text-xs">#9a1a4fbc-d795-42e5-b6f1-b2def4b49ae3</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Update Response */}
                <div className="flex justify-start">
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-4 py-3 max-w-xxl">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-[#00E599]/20 rounded-full flex items-center justify-center mr-2">
                        <svg className="w-3 h-3 text-[#00E599]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-[#00E599] text-sm font-medium">Cascade Agent</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">
                      Ok, I saved it as a new <strong>App.CustomerOnnboarding-v1</strong> and deployed it successfully.
                    </p>
                  </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-700/50 pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-800/50 rounded-lg border border-gray-600/50 px-4 py-2">
                      <div className="flex items-center">
                        <span className="text-gray-500 text-sm">Create another workflow or modify this one...</span>
                        <div className="ml-auto w-2 h-4 bg-[#00E599] animate-pulse"></div>
                      </div>
                    </div>
                    <button className="bg-[#00E599] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#00E599]/90 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SyntaxHighlighter>
    )
}