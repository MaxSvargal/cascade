'use client';

import AnimatedHeaderBackground from '@/components/AnimatedHeaderBackground';
import {ChatUI} from '@/components/ChatUI';
import { WorkspaceUI } from '@/components/WorkspaceUI ';

export default function LandingPage() {

  return (
    <div className="min-h-screen text-white font-inter">
      {/* Scrollable Background Layer - Moves with content */}
      <div className="fixed inset-0 pointer-events-none">
        <AnimatedHeaderBackground />
      </div>

      {/* Main Content Container - Natural document flow */}
      <div className="relative">
        {/* Header */}
        <header className="sticky z-50 top-0 border-b border-gray-800/30 backdrop-blur-xl bg-black/30 backdrop-saturate-150">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <img 
                  src="/images/cascade-logo.png" 
                  alt="Neon"
                  className="h-5 w-auto"
                />
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <div className="relative group">
                  <button className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
                    Product
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div className="relative group">
                  <button className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
                    Solutions
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Docs
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Pricing
                </a>
                <div className="relative group">
                  <button className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center">
                    Company
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </nav>

              {/* CTA Buttons */}
              {/* <div className="flex items-center space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Log In
                </a>
                <button className="bg-[#00E599] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#00E599]/90 transition-colors duration-200">
                  Sign Up
                </button>
              </div> */}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex items-center overflow-hidden h-[90vh]">
          <div className="max-w-7xl mx-auto px-4 pt-[18vh] sm:px-6 lg:px-8 flex flex-col items-center justify-between justify-items-end">
            <div className="text-center">
              {/* Hero Badge */}
              {/* <div className="inline-flex items-center px-4 py-2 bg-gray-900/80 border border-gray-700/50 rounded-full text-sm text-gray-300 mb-8 backdrop-blur-sm">
                <span className="inline-block w-2 h-2 bg-[#00E599] rounded-full mr-2 animate-pulse"></span>
                Netlify DB just shipped, powered by Neon
              </div> */}

              {/* Main Headline */}
              {/* <h2 className="text-6xl md:text-7xl">
                <span className="block bg-gradient-to-r from-[#00E599] to-[#00ffbb] bg-clip-text text-transparent drop-shadow-lg leading-snug">
                  Cascade
                </span>
              </h2> */}
              <h1 className="text-5xl md:text-6xl mb-8 mt-10 leading-snug">
                <span className="text-white drop-shadow-lg">The</span>
                <span className="bg-gradient-to-r from-[#00E5BF] to-[#00ffbb] bg-clip-text text-transparent drop-shadow-lg leading-snug mx-3">
                AI-Native
                </span>
                <span className="text-white drop-shadow-lg">Process Compiler</span>
              </h1>

              {/* Subheadline */}
              <p className="text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed drop-shadow-md">
              Describe your business process in English.
              <span className="bg-gradient-to-r from-[#8cbeb4] to-[#dfe2e1] bg-clip-text text-transparent drop-shadow-lg leading-snug mx-1">Cascade</span> 
              AI Agent will compile it into a fault-tolerant, observable, and durable application.
              </p>

              {/* Hero CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <button className="bg-[#00E599] text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00E599]/90 transition-all duration-200 shadow-lg shadow-[#00E599]/25 backdrop-blur-sm">
                  Try Demo
                </button>
                <button className="border border-gray-500/20 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-500/25 hover:bg-gray-900/20 transition-colors duration-200 backdrop-blur-sm shadow-lg shadow-gray-800/20">
                  Talk to Us
                </button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto mt-[15vh]">
                <div className="bg-black/30 border border-gray-900/50 rounded-lg p-6 text-center backdrop-blur-sm">
                  <span className="text-gray-300 text-md break-all">
                  Cascade is the platform that pairs an intelligent AI partner 
                  with a durable execution engine<br/> Temporal is trusted by the world's top companies and battle-tested at scale. 
                  <br/>Start describing your business goals, and let your AI co-pilot handle the rest.
                  </span>
                </div>
              </div>
          </div>
        </section>


        {/* Feature Sections */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


            {/* Business Intent to Application Section */}
            <div className="mb-[10vh]">
              <div className="text-center mb-16">
                <h2 className="relative text-6xl mb-6 drop-shadow-lg">
                  <span className="mr-[34%] font-bold bg-gradient-to-r from-[#47e3af] to-[#00ffd9] bg-clip-text text-transparent">
                    From Business Intent
                  </span>
                  <span className="absolute left-[40%] pt-14 pl-2 bg-gradient-to-r from-[#00E599] to-[#04e151] bg-clip-text text-transparent">
                    to Resilient Application
                  </span>
                </h2>
                <p className="mt-[10vh] mb-[7vh] text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
                  Building reliable applications is traditionally a slow, complex process of translating business needs into fragile, imperative code. Cascade changes the paradigm.
                </p>
              </div>

              {/* Comparison Cards */}
              <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* The Old Way */}
                <div className="bg-gradient-to-br from-red-950/20 to-black/70 p-8 rounded-2xl border border-red-900/30 relative overflow-hidden backdrop-blur-lg">
                  
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl text-white">The Old Way</h3>
                  </div>
                  
                  <p className="text-gray-400 mb-6 text-lg">A Chain of Manual Handoffs</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-300">
                        <span className="text-red-300 font-medium">Business ideas get lost in translation.</span> Product specs are misinterpreted by engineers, leading to slow development cycles and rework.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-300">
                        <span className="text-red-300 font-medium">Critical logic is hidden in code.</span> Your most important business rules are buried across multiple services, making them impossible to see, audit, or improve.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-300">
                        <span className="text-red-300 font-medium">Simple changes require complex engineering.</span> A small tweak to a business rule can take weeks, as developers navigate a brittle web of interconnected services.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-red-900/30">
                    <div className="flex items-center text-red-300 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Weeks to months for changes
                    </div>
                  </div>
                </div>

                {/* The Cascade Way */}
                <div className="bg-gradient-to-br from-[#00E599]/20 to-black backdrop-blur-lg p-8 rounded-2xl border border-green-800/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#00e572] to-[#00eaff]"></div>
                  
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-[#00E599]/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-[#00E599]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl text-white">The Cascade Way</h3>
                  </div>
                  
                  <p className="text-gray-200 mb-6 text-lg">An Intelligent, Automated Platform</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#00E599] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-300">
                        <span className="text-[#00E599] font-medium">Achieve perfect alignment.</span> Your business logic is captured in a clear, declarative Flow that is generated by AI and is readable by everyone, ensuring the final application is exactly what you intended.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#00E599] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-300">
                        <span className="text-[#00E599] font-medium">Make your processes visible and auditable.</span> Every Flow is a visual, living diagram of your business. You can see, test, and verify the logic at a glance, ensuring correctness and compliance.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#00E599] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-300">
                        <span className="text-[#00E599] font-medium">Innovate at the speed of your business.</span> Because Flows are declarative, changes are simple and safe. Your teams can evolve processes in minutes, not months.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-[#00E599]/30">
                    <div className="flex items-center text-[#00E599] text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Minutes to hours for changes
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center mt-12">
                <a href="#" className="text-[#00E599] hover:text-[#00E599]/80 font-medium inline-flex items-center text-lg">
                  See Cascade in Action
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* AI Agent Interface Section */}
            <div className="mb-32 mt-48">
              <div className="text-center mb-8">
              <h2 className="relative text-6xl mb-6">
                  <span className="mr-[34%] font-bold bg-gradient-to-r from-[#47e3af] to-[#00ffd9] bg-clip-text text-transparent">
                  The AI Agent is Your
                  </span>
                  <span className="absolute left-[40%] pt-14 pl-2 bg-gradient-to-r from-[#00E599] to-[#00e549] bg-clip-text text-transparent leading-tight drop-shadow-lg">
                  New Interface to Building
                  </span>
                </h2>
                <p className="pt-28 pb-10 text-xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
                  Cascade is built around a core belief: you should work on your business, not on the plumbing. Our AI Agent is the primary interface to the platform's power.
                </p>
              </div>

              {/* AI Interface Preview */}
              <ChatUI />

              {/* Three Column Layout */}
              <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto my-24">
                {/* The AI Agent */}
                <div className="bg-gradient-to-br from-[#00E599]/10 to-black p-8 rounded-2xl border border-[#00E599]/5 relative overflow-hidden">
                  
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-[#00E599]/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-[#00E599]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl text-white font-semibold">The AI Agent</h3>
                  </div>
                  
                  
                  
                  <p className="text-gray-300 leading-relaxed">
                    <span className="text-[#00E599] font-medium mb-4">Your Process Partner. </span>
                    A co-pilot that understands orchestration.<br/><br/>Describe your  goal, and the agent translates it into a blueprint. Ask it to "add a fault-tolerant circuit breaker" or "identify the performance bottleneck," and it intelligently refactors the logic for you. More than a tool, it's your active partner for building, debugging, and optimizing complex systems, even suggesting improvements based on live monitoring and telemetry data.
                  </p>
                </div>

                {/* The Flow */}
                <div className="bg-gradient-to-br from-blue-900/20 to-black p-8 rounded-2xl border border-blue-900/20 
                relative overflow-hidden backdrop-blur-lg">
                  
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl text-white font-semibold">The Flow</h3>
                  </div>
                  
                  
                  
                  <p className="text-gray-300 leading-relaxed">
                  <span className="text-blue-300 font-medium mb-4">The AI's Blueprint. </span>
                  A language designed for LLM.<br/><br/>We prevent AI "hallucinations" by grounding the agent in what it knows: its core domain of distributed orchestration and your project-specific knowledge base. It uses this knowledge to operate on our clean, YAML-based DSL. Because this language is declarative and has no hidden side effects, the agent can reason about the blueprint with 100% accuracy. It's a fully auditable format that eliminates ambiguity and ensures predictable results.
                  </p>
                </div>

                {/* The Workflow */}
                <div className="bg-gradient-to-br from-purple-950/20 to-black p-8 rounded-2xl border border-purple-900/30 relative overflow-hidden">
                  
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl text-white font-semibold">The Workflow</h3>
                  </div>
                  
                  
                  
                  <p className="text-gray-300 leading-relaxed">
                  <span className="text-purple-300 font-medium mb-4">The Compiled Application. </span>
                  Durable, fault-tolerant execution.<br/><br/>Every Flow is compiled into a durable, self-healing Workflow that runs on battle-tested, open-source Temporal engine. It automatically preserves state through every step, allowing it to survive infrastructure failures and resume exactly where it left off. This isn't just execution; it's a guarantee of fault-tolerant performance that runs precisely as designed, every single time, no matter the conditions.
                  </p>
                </div>
              </div>

              {/* Workspace UI Preview */}
              <WorkspaceUI />

            </div>

            {/* Standard Library Section */}
            <div className="mb-8">
              <div className="text-center mb-16">
                <h2 className="relative text-6xl mb-6">
                  <span className="mr-[34%] font-bold bg-gradient-to-r from-[#47e3af] to-[#00ffd9] bg-clip-text text-transparent text-6xl">
                  Your Complete Toolkit
                  </span>
                  <span className="absolute left-[30%] pt-14 pl-2 bg-gradient-to-r from-[#00E599] to-[#00e549] bg-clip-text text-transparent leading-tight text-5xl">
                  for Building Resilient Applications
                  </span>
                </h2>
                <p className="mt-36 mb-20 text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
                  The Cascade AI can build such powerful, complex Flows because it operates with a rich palette of trusted building blocks of Standard Library. It's more than just a set of tools; it's a complete, curated vocabulary for modern business processes.
                </p>
              </div>

              {/* Hexagonal Grid Layout */}
              <div className="mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Complete Coverage - Large Card */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-gray-600/10 to-black p-8 rounded-2xl border border-gray-100/10 relative overflow-hidden backdrop-blur-lg">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#000000] to-[#cfcfcf] opacity-10"></div>
                    
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gray-100/20 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-2xl text-white font-semibold">Complete Coverage for Real-World Use Cases</h3>
                    </div>
                    
                    <p className="text-gray-300 text-sm leading-relaxed mb-6">
                      The <code className="bg-gray-800/50 px-2 py-1 rounded">StdLib</code> gives you and the AI the exact tools needed for any task, from simple data mapping to complex, multi-service transactions. Its comprehensive coverage means you don't have to reinvent the wheel. <span className="text-white">Reliability patterns</span> like retries and circuit breakers are simple attributes on a component, not complex wrappers you have to build yourself.
                    </p>

                    {/* Enhanced Component Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-100/20 hover:border-gray-100/40 transition-colors">
                        <div className="text-gray-50 text-sm font-medium mb-1">Core Logic & Flow Control</div>
                        <div className="text-gray-400 text-xs mb-2">MapData, Switch, FilterData, AggregateData</div>
                        <div className="text-gray-500 text-xs">+ structural blocks like parallel, try-catch</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-100/20 hover:border-gray-100/40 transition-colors">
                        <div className="text-gray-50 text-sm font-medium mb-1">External Integrations</div>
                        <div className="text-gray-400 text-xs mb-2">HttpCall, DatabaseQuery, MessageQueue</div>
                        <div className="text-gray-500 text-xs">+ plugins for Kafka, SQS, gRPC, etc.</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-100/20 hover:border-gray-100/40 transition-colors">
                        <div className="text-gray-50 text-sm font-medium mb-1">Long-Running Processes</div>
                        <div className="text-gray-400 text-xs mb-2">WaitForEvent, Timer, SagaCoordinator</div>
                        <div className="text-gray-500 text-xs">Orchestrate processes lasting days or months</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-100/20 hover:border-gray-100/40 transition-colors">
                        <div className="text-gray-50 text-sm font-medium mb-1">Enterprise Security</div>
                        <div className="text-gray-400 text-xs mb-2">Authenticate, Authorize, Encrypt</div>
                        <div className="text-gray-500 text-xs">Delegate to secure backends like KMS/HSM</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-100/20 hover:border-gray-100/40 transition-colors">
                        <div className="text-gray-50 text-sm font-medium mb-1">Data Validation & Serialization</div>
                        <div className="text-gray-400 text-xs mb-2">JsonSchemaValidator, DataSerializer</div>
                        <div className="text-gray-500 text-xs">Support JSON, Protobuf, Avro formats</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 border border-gray-100/20 hover:border-gray-100/40 transition-colors">
                        <div className="text-gray-50 text-sm font-medium mb-1">SaaS Platform Primitives</div>
                        <div className="text-gray-400 text-xs mb-2">ProcessPayment, SendEmail, QuotaCheck</div>
                        <div className="text-gray-500 text-xs">Build full-featured platforms quickly</div>
                      </div>
                    </div>
                  </div>

                  {/* Safe Autonomy - Tall Card */}
                  <div className="bg-gradient-to-br from-orange-950/20 to-black p-8 rounded-2xl border border-orange-900/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500/50 to-yellow-500/50"></div>
                    
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-xl text-white font-semibold">Safe Autonomy</h3>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed mb-6">
                      Every StdLib component has a strict, machine-readable schema. This is the key to governance.
                    </p>

                    {/* Governance Features */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                        <span className="text-gray-300 text-sm">Approved components only</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                        <span className="text-gray-300 text-sm">Zero configuration drift</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                        <span className="text-gray-300 text-sm">Automatic validation</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mr-3"></div>
                        <span className="text-gray-300 text-sm">Sandboxed WASM execution</span>
                      </div>
                    </div>
                  </div>

                  {/* Reliability Patterns */}
                  <div className="bg-gradient-to-br from-blue-950/20 to-black p-6 rounded-2xl border border-blue-900/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-cyan-500/50"></div>
                    
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <h3 className="text-lg text-white font-semibold">Reliability Patterns</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-blue-300 text-sm">• Circuit Breakers</div>
                      <div className="text-blue-300 text-sm">• Exponential Backoff</div>
                      <div className="text-blue-300 text-sm">• Timeout Handling</div>
                      <div className="text-blue-300 text-sm">• Dead Letter Queues</div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="bg-gradient-to-br from-purple-950/20 to-black p-6 rounded-2xl border border-purple-900/30 relative overflow-hidden backdrop-blur-lg">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 to-pink-500/50"></div>
                    
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg text-white font-semibold">Performance</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-purple-300 text-sm">• Auto-scaling</div>
                      <div className="text-purple-300 text-sm">• Load Balancing</div>
                      <div className="text-purple-300 text-sm">• Caching Strategies</div>
                      <div className="text-purple-300 text-sm">• Resource Optimization</div>
                    </div>
                  </div>

                  {/* Data Handling & Validation */}
                  <div className="bg-gradient-to-br from-green-950/20 to-black p-6 rounded-2xl border border-green-900/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/50 to-emerald-500/50"></div>
                    
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg text-white font-semibold">Data Validation</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-green-300 text-sm">• Schema Validation</div>
                      <div className="text-green-300 text-sm">• Data Serialization</div>
                      <div className="text-green-300 text-sm">• Format Conversion</div>
                      <div className="text-green-300 text-sm">• Type Safety</div>
                    </div>
                  </div>

                  {/* Enterprise Security */}
                  <div className="bg-gradient-to-br from-red-950/20 to-black p-6 rounded-2xl border border-red-900/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 to-pink-500/50"></div>
                    
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg text-white font-semibold">Enterprise Security</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-red-300 text-sm">• Authentication</div>
                      <div className="text-red-300 text-sm">• Authorization</div>
                      <div className="text-red-300 text-sm">• Encryption</div>
                      <div className="text-red-300 text-sm">• Key Management</div>
                    </div>
                  </div>

                  {/* AI-Powered Workflows */}
                  <div className="bg-gradient-to-br from-indigo-950/20 to-black p-6 rounded-2xl border border-indigo-900/30 relative overflow-hidden backdrop-blur-lg">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/50 to-purple-500/50"></div>
                    
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-lg text-white font-semibold">AI Integration</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-indigo-300 text-sm">• LLM Generation</div>
                      <div className="text-indigo-300 text-sm">• Text Classification</div>
                      <div className="text-indigo-300 text-sm">• Smart Agents</div>
                      <div className="text-indigo-300 text-sm">• Content Analysis</div>
                    </div>
                  </div>

                  {/* Observability & Auditing */}
                  <div className="bg-gradient-to-br from-yellow-950/20 to-black p-6 rounded-2xl border border-yellow-900/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/50 to-orange-500/50"></div>
                    
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg text-white font-semibold">Observability</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-yellow-300 text-sm">• Structured Logging</div>
                      <div className="text-yellow-300 text-sm">• Custom Metrics</div>
                      <div className="text-yellow-300 text-sm">• Audit Trails</div>
                      <div className="text-yellow-300 text-sm">• Performance Tracing</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transformation in Practice Section */}
            <div className="mb-32">
              {/* Before/After Comparison */}
              <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* Your Prompt */}
                <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-2xl border border-gray-700/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500/50 to-gray-400/50"></div>
                  
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl text-white font-semibold">Your Prompt to the AI Agent</h3>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 border border-gray-600/30 mb-6">
                    <p className="text-gray-300 leading-relaxed">
                      <span className="text-white font-medium">You say:</span><br/><br/>
                      "For my e-commerce app, create a flow that triggers after a first-time successful order. First, run a fraud check. If the check passes and the user is in the US, grant them a 5% discount coupon for their next order."
                    </p>
                  </div>

                  <div className="border-t border-gray-600/30 pt-4">
                    <p className="text-gray-400 text-sm mb-3">The AI generates a Flow using StdLib components:</p>
                    <div className="bg-black/50 rounded-lg p-3 border border-gray-600/20">
                    <pre className='max-h-72 overflow-y-auto'><code className="language-cascade-flow text-xs overflow-x-auto whitespace-pre-wrap">
{`dsl_version: "1.0"
namespace: "acme.promotions"
flows:
  - name: "PostOrderCouponGrant"
    trigger:
      # Highlight: Listens for a specific business event
      type: "StdLib.Trigger:EventBus"
      config:
        eventTypePattern: "order.completed.first_time"
    steps:
      - step_id: "check_fraud_score"
        type: "StdLib:HttpCall"
        config:
          url: "https://api.fraud-check.io/v2/assess"
          method: "POST"
          headers:
            Authorization: "Bearer secrets.fraud_check_api_key"
          # Highlight: Automatically adds resilience
          retryPolicy:
            maxRetries: 3
            initialIntervalMs: 500
        inputs:
          data:
            orderId: "trigger.event.payload.orderId"
            userId: "trigger.event.payload.userId"
            
      - step_id: "evaluate_and_grant"
        type: "StdLib:Switch"
        config:
          cases:
            - outputName: "grant_coupon"
              # Highlight: Implements the exact business logic
              conditionExpression: >
                steps.check_fraud_score.response.body.risk == 'low' &&
                trigger.event.payload.user.country == 'US'
          defaultOutputName: "do_nothing"
        inputs:
          data: "{}" # Context for the switch

      - step_id: "grant_coupon"
        type: "Integration.ExternalServiceAdapter"
        config:
          # Highlight: Uses a secure, pre-configured plugin
          adapterType: "CrmAdapter:Salesforce"
          operation: "CreateCoupon"
        inputs:
          requestData:
            userId: "trigger.event.payload.userId"
            discountPercent: 5
            expiresInDays: 30`}
            </code>
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Compiled Reality */}
                <div className="bg-gradient-to-br from-green-800/30 to-black p-8 rounded-2xl border border-green-800/5 relative overflow-hidden backdrop-blur-lg">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#2ed682] to-[#00ede9]"></div>
                  
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-[#00E599]/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl text-white font-semibold">The Compiled Reality</h3>
                  </div>
                  
                  <p className="text-gray-400 mb-6 text-xl">What Cascade Manages for You</p>
                  
                  <div className="space-y-4">
                    <p className="text-white font-medium mb-4">A Resilient, Multi-Step Application, including:</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-[#00E599] mr-3 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-200 text-sm">A declarative <strong>EventBus Trigger</strong> that subscribes to the `order.completed.first_time` event, decoupling this logic from your core order service.</p>
                      </div>
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-[#00E599] mr-3 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-200 text-sm">Resilient <strong>API calls with automatic retries</strong> for the fraud check, specified in the `retryPolicy`, ensuring transient network errors don't break the flow.</p>
                      </div>
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-[#00E599] mr-3 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-200 text-sm">Structured, multi-path logic using `StdLib:Switch` to precisely evaluate both fraud status and country code in a single, readable step.</p>
                      </div>
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-[#00E599] mr-3 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-200 text-sm">Secure, plugin-based integration with your CRM via `ExternalServiceAdapter`, using secrets management (`secrets.*`) to keep API keys safe.</p>
                      </div>
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-[#00E599] mr-3 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-200 text-sm">Full state persistence, meaning the flow can be paused, retried, or resumed at any step, even if the underlying servers restart.</p>
                      </div>
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-[#00E599] mr-3 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-200 text-sm">A complete, visual audit trail for every execution, showing exactly which path was taken and what data was used.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Toolkit Section */}
            <div className="mb-32">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-[#00E599] to-[#00B8FF] bg-clip-text text-transparent">
                    The Complete Toolkit for AI-Native Development.
                  </span>
                </h2>
                <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                  Cascade provides the integrated tools you need to build faster and more reliably than ever before.
                </p>
              </div>

              {/* Toolkit Grid */}
              <div className="max-w-6xl mx-auto mb-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      title: "AI Agent with RAG, Process Generation, and Fleet Management",
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      ),
                      gradient: "from-[#00E599]/10 to-black",
                      border: "border-[#00E599]/30",
                      accent: "from-[#00E599] to-[#00B8FF]"
                    },
                    {
                      title: "Managed SaaS Cloud & Open-Source Self-Hosted Runtime",
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                      ),
                      gradient: "from-blue-950/20 to-black",
                      border: "border-blue-900/30",
                      accent: "from-blue-500/50 to-cyan-500/50"
                    },
                    {
                      title: "Visual Editor with Live Debugger",
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      ),
                      gradient: "from-purple-950/20 to-black",
                      border: "border-purple-900/30",
                      accent: "from-purple-500/50 to-pink-500/50"
                    },
                    {
                      title: "Low-Code Extensibility with Secure WASM Modules",
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                      gradient: "from-orange-950/20 to-black",
                      border: "border-orange-900/30",
                      accent: "from-orange-500/50 to-yellow-500/50"
                    },
                    {
                      title: "Built-in Observability, Tracing, and Auditing",
                      icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      ),
                      gradient: "from-green-950/20 to-black",
                      border: "border-green-900/30",
                      accent: "from-green-500/50 to-emerald-500/50"
                    }
                  ].map((tool, index) => (
                    <div key={index} className={`bg-gradient-to-br ${tool.gradient} p-6 rounded-2xl border ${tool.border} relative overflow-hidden ${index === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tool.accent}`}></div>
                      
                      <div className="flex items-center mb-4">
                        <div className="text-white mr-3">{tool.icon}</div>
                        <h3 className="text-lg text-white font-semibold leading-tight">{tool.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center">
                <p className="text-2xl text-gray-300 mb-8 font-medium">
                  Ready to stop writing code and start solving problems?
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="bg-[#00E599] text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00E599]/90 transition-all duration-200 shadow-lg shadow-[#00E599]/25">
                    Try the AI Agent Now
                  </button>
                  <button className="border border-gray-500/20 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-500/25 hover:bg-gray-900/20 transition-colors duration-200 backdrop-blur-sm shadow-lg shadow-gray-800/20">
                    Read the Documentation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Logos */}
        <section className="py-20 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500 mb-12 text-lg">Trusted in production by thousands of teams</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-80 hover:opacity-100 transition-opacity duration-300">
              {[
                { name: 'Zimmer Biomet', logo: '/images/companies/zimmer-biomet-logo.svg' },
                { name: 'Retool', logo: '/images/companies/retool-logo.svg' },
                { name: 'Boston Consulting Group', logo: '/images/companies/bcg-logo.svg' },
                { name: 'Outfront Media', logo: '/images/companies/outfront-media-logo.svg' },
                { name: 'Replit', logo: '/images/companies/replit-logo.svg' }
              ].map((company) => (
                <div key={company.name} className="flex flex-col items-center group">
                  <div className="mb-4 transition-transform duration-200 group-hover:scale-110">
                    <img 
                      src={company.logo} 
                      alt={company.name}
                      className="h-10 w-auto filter brightness-75 group-hover:brightness-100 transition-all duration-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Example Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">
                Works with <span className="bg-gradient-to-r from-[#00E599] to-[#00B8FF] bg-clip-text text-transparent">your stack</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Integrate it into your language or framework within minutes and unlock a simpler developer workflow.
              </p>
            </div>

            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {['Next.js', 'Drizzle', 'Prisma', 'Python', 'Ruby', 'Rust', 'Go', 'Node.js'].map((tech) => (
                  <span key={tech} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-[#00E599]/50 transition-colors">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-gray-500 text-sm">JavaScript</div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
{`import { neon } from '@neondatabase/serverless';

export async function GET() {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql("SELECT * FROM posts");

    return Response.json({ rows })
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#00E599] to-[#00B8FF] bg-clip-text text-transparent">
                Lightning fast. Edge ready.
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              The Neon serverless driver, designed for fast queries over HTTP
            </p>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 max-w-4xl mx-auto">
              <div className="bg-black rounded-lg p-6 mb-6">
                <pre className="text-left text-gray-300 font-mono text-sm">
{`import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://usr:pass@proj.us-east-2.aws.neon.tech/db');
const posts = await sql('SELECT * FROM posts');`}
                </pre>
              </div>
              <button className="bg-[#00E599] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#00E599]/90 transition-colors duration-200">
                Get the Serverless Driver
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">
                Better database. <span className="bg-gradient-to-r from-[#00E599] to-[#00B8FF] bg-clip-text text-transparent">For modern workflows.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Instant read replicas',
                  description: 'They scale down to zero when idle and don\'t use additional storage.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )
                },
                {
                  title: 'Easy database ops via API',
                  description: 'Manage thousands of databases programmatically.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                {
                  title: 'Point-in-time recovery',
                  description: 'Up to 30 days granularity down to the transaction or second.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                },
                {
                  title: 'AI Applications',
                  description: 'HNSW index algorithm streamlines performance for vector search.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )
                },
                {
                  title: 'Database-per-tenant',
                  description: 'Scale to fleets of thousands of databases without touching a server.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )
                },
                {
                  title: '100% Postgres',
                  description: 'Not a fork, not a rewrite. Trusted Postgres with serverless benefits.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700 hover:border-[#00E599]/50 transition-all duration-200 group">
                  <div className="text-white mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#00E599] transition-colors">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">
                Industry leaders <span className="bg-gradient-to-r from-[#00E599] to-[#00B8FF] bg-clip-text text-transparent">trust Neon</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  quote: "Neon allows us to develop much faster than we've even been used to",
                  author: "Alex Klarfeld",
                  role: "CEO and co-founder of Supergood.ai",
                  company: "Supergood.ai",
                  avatar: "/images/testimonials/alex-klarfeld.svg"
                },
                {
                  quote: "Neon's serverless philosophy is aligned with our vision: no infrastructure to manage, no servers to provision, no database cluster to maintain",
                  author: "Edouard Bonlieu",
                  role: "Co-founder at Koyeb",
                  company: "Koyeb",
                  avatar: "/images/testimonials/edouard-bonlieu.svg"
                },
                {
                  quote: "The killer feature that convinced us to use Neon was branching: it keeps our engineering velocity high",
                  author: "Léonard Henriquez",
                  role: "Co-founder and CTO, Topo.io",
                  company: "Topo.io",
                  avatar: "/images/testimonials/leonard-henriquez.svg"
                },
                {
                  quote: "We've been able to automate virtually all database tasks via the Neon API, saving us a tremendous amount of time and engineering effort",
                  author: "Himanshu Bhandoh",
                  role: "Software Engineer at Retool",
                  company: "Retool",
                  avatar: "/images/testimonials/himanshu-bhandoh.svg"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl border border-gray-700 hover:border-[#00E599]/30 transition-all duration-300 hover:transform hover:scale-105">
                  <blockquote className="text-lg text-gray-300 mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="mr-4">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full"
                      />
                    </div>
                    <div>
                      <div className="text-white font-medium">{testimonial.author}</div>
                      <div className="text-gray-500 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Features of tomorrow. <span className="bg-gradient-to-r from-[#00E599] to-[#00B8FF] bg-clip-text text-transparent">Available today.</span>
            </h2>
            <button className="bg-[#00E599] text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00E599]/90 transition-all duration-200 shadow-lg shadow-[#00E599]/25">
              Get Started
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-16 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="mb-4">
                  <img 
                    src="/images/neon-logo.svg" 
                    alt="Neon"
                    className="h-8 w-auto"
                  />
                </div>
                <p className="text-gray-500 text-sm mb-4">All systems operational</p>
                <p className="text-gray-500 text-sm">Made in SF and the World</p>
                <p className="text-gray-500 text-sm mt-8">Copyright Ⓒ 2022 – 2025 Neon, Inc.</p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  {['About', 'Blog', 'Careers', 'Contact Sales', 'Partners', 'Security'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-sm">
                  {['Docs', 'Changelog', 'Support', 'Community Guides', 'PostgreSQL Tutorial', 'Creators'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Compliance</h4>
                <ul className="space-y-2 text-sm">
                  {['SOC 2 Certified', 'ISO 27001 Certified', 'GDPR Compliant', 'HIPAA Compliant', 'Trust Center'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-gray-500 hover:text-white transition-colors duration-200">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
                </div>
              </div>

            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <a href="#" className="hover:text-white transition-colors duration-200">Terms</a>
                <a href="#" className="hover:text-white transition-colors duration-200">Privacy</a>
                <a href="#" className="hover:text-white transition-colors duration-200">Security</a>
                <a href="#" className="hover:text-white transition-colors duration-200">Status</a>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-gray-500 text-sm">Discord</span>
                <span className="bg-[#00E599] text-black px-2 py-1 rounded text-xs font-medium">18.5k</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 