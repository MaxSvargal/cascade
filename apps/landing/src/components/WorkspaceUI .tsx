import React from 'react';

// Static star field with pre-calculated positions to avoid SSR/client mismatch
export const WorkspaceUI = () => {
    return (
      <div className="max-w-7xl mx-auto mb-20">
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
                cascade.ai/workspace/customer-onboarding
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-[#00E599] text-black px-3 py-1 rounded text-xs font-medium">
                Deploy
              </button>
                                       <button className="text-gray-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                 </svg>
               </button>
            </div>
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex h-[600px]">
          {/* Left Sidebar - Flow List */}
          <div className="w-64 bg-gray-900/50 border-r border-gray-700/50 p-4">
            <div className="mb-4">
              <h3 className="text-white font-medium mb-3">Flows</h3>
                                       <button className="w-full bg-[#00E599]/20 border border-[#00E599]/30 rounded-lg px-3 py-2 text-[#00E599] text-sm font-medium">
                 + New Flow
               </button>
            </div>
            
            <div className="space-y-2">
              <div className="bg-[#00E599]/20 border border-[#00E599]/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">Customer Onboarding</span>
                  <div className="w-2 h-2 bg-[#00E599] rounded-full animate-pulse"></div>
                </div>
                <div className="text-gray-400 text-xs">Active • 3 steps</div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Payment Processing</span>
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                </div>
                <div className="text-gray-500 text-xs">Draft • 5 steps</div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">User Notifications</span>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <div className="text-gray-500 text-xs">Running • 2 steps</div>
              </div>
            </div>
            
                                   <div className="mt-6">
               <h4 className="text-gray-400 text-sm font-medium mb-3">Recent Activity</h4>
               <div className="space-y-3">
                 <div className="flex items-start space-x-2">
                   <div className="text-[#00E599] text-sm mt-0.5">✓</div>
                   <div className="text-xs text-gray-500">
                     <div>Flow deployed</div>
                     <div>2m ago</div>
                   </div>
                 </div>
                 <div className="flex items-start space-x-2">
                   <div className="text-yellow-400 text-sm mt-0.5">⚠</div>
                   <div className="text-xs text-gray-500">
                     <div>Retry triggered</div>
                     <div>5m ago</div>
                   </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Center - Flow Graph */}
          <div className="flex-1 bg-gray-950/50 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            
                                   {/* Flow Components */}
             <div className="relative p-8 h-full">
               {/* Start Node */}
               <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pl-5">
                 <div className="bg-green-500/20 border-2 border-green-500 rounded-full w-12 h-12 flex items-center justify-center">
                   <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                   </svg>
                 </div>
                 <div className="text-xs text-gray-400 mt-1 ml-[-12px] text-left">HTTP Trigger</div>
               </div>

               {/* Welcome Email Node - Selected */}
               <div className="absolute top-36 left-1/2 transform -translate-x-1/2">
                 <div className="bg-[#00E599]/20 border-2 border-[#00E599] rounded-lg p-4 min-w-[180px] shadow-lg shadow-[#00E599]/25">
                   <div className="flex items-center mb-2">
                     <svg className="w-4 h-4 text-[#00E599] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                     <span className="text-white text-sm font-medium">Send Welcome Email</span>
                   </div>
                   <div className="text-xs text-gray-400">StdLib:SendEmail</div>
                   <div className="flex items-center mt-2">
                     <div className="w-2 h-2 bg-[#00E599] rounded-full mr-2 animate-pulse"></div>
                     <span className="text-[#00E599] text-xs">Processing</span>
                   </div>
                 </div>
               </div>

               {/* Create Account Node */}
               <div className="absolute top-72 left-1/2 transform -translate-x-1/2">
                 <div className="bg-blue-500/20 border-2 border-blue-500 rounded-lg p-4 min-w-[180px]">
                   <div className="flex items-center mb-2">
                     <svg className="w-4 h-4 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                     </svg>
                     <span className="text-white text-sm font-medium">Create Account</span>
                   </div>
                   <div className="text-xs text-gray-400">StdLib:CreateUser</div>
                   <div className="flex items-center mt-2">
                     <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                     <span className="text-gray-400 text-xs">Waiting</span>
                   </div>
                 </div>
               </div>

               {/* Process Payment Node */}
               <div className="absolute top-[432px] left-1/2 transform -translate-x-1/2">
                 <div className="bg-purple-500/20 border-2 border-purple-500 rounded-lg p-4 min-w-[180px]">
                   <div className="flex items-center mb-2">
                     <svg className="w-4 h-4 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z" />
                     </svg>
                     <span className="text-white text-sm font-medium">Process Payment</span>
                   </div>
                   <div className="text-xs text-gray-400">StdLib:ProcessPayment</div>
                   <div className="flex items-center mt-2">
                     <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                     <span className="text-gray-400 text-xs">Pending</span>
                   </div>
                 </div>
               </div>

               {/* Connection Lines */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                 <defs>
                   <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                     <polygon points="0 0, 6 2, 0 4" fill="#6B7280" />
                   </marker>
                 </defs>
                 {/* Start to Welcome Email - from bottom of Start node to top of Welcome Email node */}
                 <line x1="50%" y1="100" x2="50%" y2="144" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
                 {/* Welcome Email to Create Account - from bottom of Welcome Email to top of Create Account */}
                 <line x1="50%" y1="248" x2="50%" y2="288" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
                 {/* Create Account to Process Payment - from bottom of Create Account to top of Process Payment */}
                 <line x1="50%" y1="392" x2="50%" y2="432" stroke="#6B7280" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
               </svg>
             </div>
            
                                   {/* Zoom Controls */}
             <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
               <button className="bg-gray-800/80 border border-gray-600/50 rounded p-2 text-gray-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                 </svg>
               </button>
               <button className="bg-gray-800/80 border border-gray-600/50 rounded p-2 text-gray-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                 </svg>
               </button>
             </div>
          </div>

          {/* Right Sidebar - Component Info & Debug */}
          <div className="w-80 bg-gray-900/50 border-l border-gray-700/50 p-4">
            {/* Component Details */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-[#00E599] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-white font-medium">Send Welcome Email</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm">Template</label>
                  <div className="bg-gray-800/50 border border-gray-600/50 rounded px-3 py-2 text-white text-sm">
                    welcome_new_user
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Retry Policy</label>
                  <div className="bg-gray-800/50 border border-gray-600/50 rounded px-3 py-2 text-white text-sm">
                    exponential_backoff
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Circuit Breaker</label>
                  <div className="flex items-center justify-between bg-gray-800/50 border border-gray-600/50 rounded px-3 py-2">
                    <span className="text-white text-sm">Enabled</span>
                    <div className="w-2 h-2 bg-[#00E599] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Interface */}
            <div className="border-t border-gray-700/50 pt-4">
              <h4 className="text-white font-medium mb-3">Debug Console</h4>
              
              <div className="bg-black/50 rounded-lg p-3 mb-4 h-32 overflow-y-auto">
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-[#00E599]">[12:34:56] Starting email send...</div>
                  <div className="text-blue-400">[12:34:57] Template loaded: welcome_new_user</div>
                  <div className="text-yellow-400">[12:34:58] Retry attempt 1/3</div>
                  <div className="text-[#00E599]">[12:34:59] Email sent successfully</div>
                  <div className="text-gray-500">[12:35:00] Moving to next step...</div>
                </div>
              </div>
              
                                       <div className="flex space-x-2">
                 <button className="flex-1 bg-[#00E599]/20 border border-[#00E599]/30 rounded px-3 py-2 text-[#00E599] text-sm font-medium">
                   Retry Step
                 </button>
                 <button className="flex-1 bg-red-500/20 border border-red-500/30 rounded px-3 py-2 text-red-400 text-sm font-medium">
                   Skip Step
                 </button>
               </div>
            </div>

            {/* Execution Stats */}
            <div className="border-t border-gray-700/50 pt-4 mt-4">
              <h4 className="text-white font-medium mb-3">Execution Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-[#00E599]">98.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Duration</span>
                  <span className="text-white">1.2s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Executions</span>
                  <span className="text-white">1,247</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
}