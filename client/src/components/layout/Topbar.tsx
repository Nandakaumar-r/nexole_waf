import { useState } from "react";

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex justify-between items-center py-4 px-6">
        <div className="flex items-center md:hidden">
          <button className="text-slate hover:text-primary focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex-1 mx-4 flex justify-center md:justify-start">
          <div className="relative w-full max-w-lg">
            <input 
              type="text" 
              placeholder="Search logs, rules, IP addresses..." 
              className="w-full py-2 pl-10 pr-4 text-sm text-slate bg-slate-lighter rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="text-slate hover:text-primary focus:outline-none relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent"></span>
          </button>
          <div className="w-px h-6 bg-slate-lighter"></div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Admin</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
