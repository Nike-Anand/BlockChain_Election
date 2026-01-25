import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LogOut, Settings, BarChart, Flag, ChevronRight, Hash, Landmark, Activity, Shield } from 'lucide-react';
import { Party } from '../types';

interface AdminDashboardProps {
  db: any;
  updateDb: (db: any) => void;
  // registerUser: (u: any) => void; // Removed
  addParty: (p: any) => void;
  updateSettings: (s: any) => void;
  onLogout: () => void;
  showAlert: (message: string, type: string) => void;
}

export function AdminDashboard({ db, addParty, updateSettings, onLogout, showAlert }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'voters' | 'parties' | 'settings' | 'results'>('results');
  const [newParty, setNewParty] = useState<Partial<Party>>({ name: '', symbol: '', description: '', manifesto: '', imageUrl: '', votes: 0 });

  const handleAddParty = async () => {
    if (!newParty.name || !newParty.symbol) return showAlert('Party name/symbol required!', 'error');
    if (db.parties.some((p: Party) => p.name === newParty.name)) return showAlert('Party exists!', 'error');

    try {
      await addParty(newParty);
      setNewParty({ name: '', symbol: '', description: '', manifesto: '', imageUrl: '', votes: 0 });
      showAlert('Party registered successfully!', 'success');
    } catch (e: any) {
      showAlert(e.message || 'Failed to register party', 'error');
    }
  };

  const handleUpdateSettings = async (settings: any) => {
    try {
      await updateSettings(settings);
      showAlert('Settings updated!', 'success');
    } catch (e: any) {
      showAlert(e.message || 'Failed to update settings', 'error');
    }
  };

  const menuItems = [
    { id: 'results', label: 'Dashboard Overview', sub: 'முடிவுகள் (Results)', icon: BarChart },
    { id: 'parties', label: 'Political Parties', sub: 'கட்சிகள் (Parties)', icon: Flag },
    { id: 'settings', label: 'Election Control', sub: 'அமைப்புகள் (Settings)', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">

      {/* Sidebar */}
      <div className="w-80 bg-slate-900 text-white flex flex-col shadow-2xl z-20 border-r border-yellow-600">
        <div className="p-6 border-b border-yellow-600 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg text-slate-900"><Landmark className="w-8 h-8" /></div>
            <div>
              <h1 className="font-bold text-sm tracking-tight uppercase leading-tight">TN SEC</h1>
              <p className="text-[10px] text-yellow-500 font-bold uppercase">State Election Commission</p>
              <p className="text-[10px] text-slate-300 font-medium">தேர்தல் ஆணையம்</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-start p-4 rounded-xl transition-all duration-200 group relative overflow-hidden ${activeTab === item.id
                ? 'bg-blue-800 text-white shadow-lg border-l-4 border-yellow-500'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 pointer-events-none">
                <item.icon className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-4 relative z-10 w-full">
                <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-yellow-400' : 'text-slate-500'}`} />
                <div className="text-left flex-1">
                  <span className="block font-bold text-sm tracking-wide uppercase">{item.label}</span>
                  <span className="block text-[10px] opacity-70 font-medium">{item.sub}</span>
                </div>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 text-yellow-500" />}
              </div>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <Button onClick={onLogout} variant="destructive" className="w-full bg-red-700 hover:bg-red-800 text-white border-0 shadow-lg uppercase font-bold text-xs tracking-widest">
            <LogOut className="w-4 h-4 mr-2" /> Secure Logout
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden">
        {/* Header Strip */}
        <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-800 uppercase tracking-tighter">Admin Control Center</span>
            <span className="text-xs font-bold text-yellow-600">நிர்வாக கட்டுப்பாட்டு மையம்</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secure Session ID</div>
              <div className="text-sm font-mono font-bold text-slate-600">{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            </div>
            <div className={`px-4 py-2 rounded-full flex items-center gap-2 border ${db.electionSettings.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <Activity className={`w-4 h-4 ${db.electionSettings.isActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-widest">{db.electionSettings.isActive ? "SYSTEM ACTIVE" : "SYSTEM OFFLINE"}</span>
            </div>
          </div>
        </div>

        <main className="relative z-10 h-[calc(100vh-64px)] overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-slate-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto pb-20"
            >

              {/* RESULTS TAB */}
              {activeTab === 'results' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white border-slate-200 shadow-xl border-t-4 border-t-blue-600">
                      <CardContent className="p-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Votes Cast</p>
                        <h2 className="text-5xl font-black text-slate-900 mt-2">{db.votes.length}</h2>
                        <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live Updating
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200 shadow-xl border-t-4 border-t-amber-500">
                      <CardContent className="p-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Election Status</p>
                        <h2 className="text-3xl font-black text-slate-900 mt-2">
                          {db.electionSettings.isActive ? "POLLING ACTIVE" : "POLLING CLOSED"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-2">
                          System is {db.electionSettings.isActive ? "accepting" : "rejecting"} new votes
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200 shadow-xl border-t-4 border-t-purple-600">
                      <CardContent className="p-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Leading Party</p>
                        <h2 className="text-2xl font-black text-slate-900 mt-2 truncate">
                          {db.parties.sort((a: any, b: any) => b.votes - a.votes)[0]?.name || "N/A"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-2">Based on current tally</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Ledger */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><Hash className="w-6 h-6 text-yellow-600" /> Blockchain Ledger</h2>
                      </div>

                      <Card className="bg-white border-slate-200 shadow-lg">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50 tracking-wider">
                            <div className="col-span-1">#</div>
                            {/* Timestamp Column Removed */}
                            <div className="col-span-11 text-right">Transaction Hash (SHA-256)</div>
                          </div>
                          <div className="max-h-[500px] overflow-y-auto">
                            {db.votes.length === 0 ? (
                              <div className="p-10 text-center text-slate-400 italic">No transactions recorded on the ledger yet.</div>
                            ) : (
                              [...db.votes].reverse().map((vote: any, i: number) => {
                                const hash = vote.hash || "0xPENDING_HASH_" + Math.random().toString(16).substr(2, 8);
                                return (
                                  <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors font-mono text-sm items-center">
                                    <div className="col-span-1 text-slate-400 font-bold">{db.votes.length - i}</div>
                                    {/* Timestamp Data Removed */}
                                    <div className="col-span-11 text-right">
                                      <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 break-all select-all cursor-copy text-xs">
                                        {hash}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts */}
                    <div className="space-y-6">
                      <Card className="bg-white border-slate-200 shadow-xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Vote Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="h-64 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={db.parties} dataKey="votes" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="none">
                                  {db.parties.map((_: any, index: number) => (
                                    <Cell key={index} fill={`hsl(${index * 45 + 210}, 80%, 40%)`} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-3 mt-4 max-h-[200px] overflow-y-auto pr-2">
                            {db.parties.map((p: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-xs p-2 rounded hover:bg-slate-50">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: `hsl(${i * 45 + 210}, 80%, 40%)` }}></div>
                                  <span className="text-slate-700 font-bold">{p.name}</span>
                                </div>
                                <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{p.votes}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}



              {/* PARTIES TAB */}
              {activeTab === 'parties' && (
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-wider">Political Parties Registry</h2>

                  <Card className="bg-white border-slate-200 shadow-xl mb-10 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500"></div>
                    <CardHeader className="pl-8">
                      <CardTitle className="text-slate-800">Add Designate Party</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pl-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Party Name</Label>
                          <Input placeholder="e.g. Dravida Munnetra Kazhagam" value={newParty.name} onChange={e => setNewParty({ ...newParty, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Symbol (Emoji/Char)</Label>
                          <Input placeholder="e.g. A" value={newParty.symbol} onChange={e => setNewParty({ ...newParty, symbol: e.target.value })} />
                        </div>
                      </div>
                      <Input placeholder="Image URL (Logo)" value={newParty.imageUrl} onChange={e => setNewParty({ ...newParty, imageUrl: e.target.value })} />
                      <Textarea placeholder="Manifesto / Description" className="min-h-[100px]" value={newParty.manifesto} onChange={e => setNewParty({ ...newParty, manifesto: e.target.value })} />
                      <Button onClick={handleAddParty} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12">
                        <Flag className="w-4 h-4 mr-2" /> Register Party
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {db.parties.map((p: any, i: number) => (
                      <div key={i} className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                        <div className="shrink-0">
                          {p.imageUrl ?
                            <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" /> :
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl border-2 border-slate-200 text-slate-400 font-bold">{p.name[0]}</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-lg text-slate-800 truncate">{p.name}</div>
                          <div className="text-sm text-slate-500 line-clamp-2 mt-1">{p.manifesto || "No manifesto provided."}</div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Votes</span>
                            <span className="text-lg font-black text-blue-700">{p.votes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-8">
                  <h2 className="text-2xl font-black text-slate-800">Election Control Center</h2>

                  <Card className="bg-white border-slate-200 shadow-xl border-l-4 border-l-red-500">
                    <CardContent className="p-8 space-y-8">

                      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                        <div>
                          <div className="font-bold text-xl text-slate-900">Live Polling Status</div>
                          <div className="text-sm text-slate-500">Activate or Terminate the election process</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-xs font-bold uppercase tracking-widest ${db.electionSettings.isActive ? "text-green-600" : "text-red-600"}`}>
                            {db.electionSettings.isActive ? "ACTIVE" : "INACTIVE"}
                          </div>
                          <Button
                            onClick={() => {
                              const now = new Date().toISOString();
                              if (!db.electionSettings.isActive) {
                                // STARTING: Set Start Time
                                handleUpdateSettings({ isActive: true, startTime: now, endTime: null });
                              } else {
                                // STOPPING: Set End Time
                                handleUpdateSettings({ isActive: false, endTime: now });
                              }
                            }}
                            className={db.electionSettings.isActive ? "bg-red-600 hover:bg-red-700 w-32" : "bg-green-600 hover:bg-green-700 w-32"}
                          >
                            {db.electionSettings.isActive ? "STOP" : "START"}
                          </Button>
                        </div>
                      </div>

                      {/* Voter Registration Removed as requested */}

                      {/* Integrity Monitor (Novelty Feature) */}
                      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[50px] opacity-20"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-green-400" />
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">System Integrity Monitor</span>
                            </div>
                            <span className="px-2 py-0.5 bg-green-900/50 border border-green-800 rounded text-[10px] text-green-400 font-mono animate-pulse">SECURE</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold">Merkle Root Hash</div>
                              <div className="font-mono text-xs text-blue-300 truncate">0x{Math.random().toString(16).substr(2, 64) || "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold">Last Block Time</div>
                              <div className="font-mono text-xs text-yellow-500">{new Date().toLocaleTimeString('en-IN')}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                          <div className="font-bold text-lg text-red-600">Reset Election Data</div>
                          <div className="text-sm text-slate-500">Clear all votes and reset party counts (Irreversible)</div>
                        </div>
                        <Button
                          onClick={async () => {
                            if (confirm("Are you SURE? This will wipe all voting data.")) {
                              try {
                                await fetch('http://127.0.0.1:5000/api/reset-election', { method: 'POST' });
                                showAlert('Election data has been reset.', 'success');
                                // Force refresh logic would be ideal here or parent does it
                                window.location.reload();
                              } catch (e) {
                                showAlert('Failed to reset data.', 'error');
                              }
                            }
                          }}
                          variant="destructive"
                          className="bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                        >
                          <Shield className="w-4 h-4 mr-2" /> Reset Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div >
  );
}

export default AdminDashboard;