import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Party } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { FileText, LogOut, Settings, Flag, ChevronRight, Activity, Shield, UserPlus, Users } from 'lucide-react';

interface AdminDashboardProps {
  db: any;
  updateDb: (db: any) => void;
  registerUser: (u: any) => void;
  addParty: (p: any) => void;
  updateSettings: (s: any) => void;
  onLogout: () => void;
  showAlert: (message: string, type: string) => void;
}

export function AdminDashboard({ db, addParty, registerUser, updateSettings, onLogout, showAlert }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'voters' | 'parties' | 'settings' | 'reports'>('voters');
  const [locationData, setLocationData] = useState<any[]>([]);
  const [newParty, setNewParty] = useState<Partial<Party>>({ name: '', symbol: '', description: '', manifesto: '', imageUrl: '', votes: 0 });
  const [showAuthModal, setShowAuthModal] = useState<{ show: boolean, action: 'start' | 'stop' | 'schedule', data?: any }>({ show: false, action: 'start' });
  const [authPasswords, setAuthPasswords] = useState(['', '', '', '']);

  const [newUser, setNewUser] = useState({ username: '', password: '', voterId: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleRegisterUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.voterId) return showAlert('All fields required', 'error');
    if (!photoFile) return showAlert('Voter Photo is REQUIRED', 'error');

    const reader = new FileReader();
    reader.readAsDataURL(photoFile);
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await registerUser({ ...newUser, photoBase64: base64, role: 'voter' });
        setNewUser({ username: '', password: '', voterId: '' });
        setPhotoFile(null);
        showAlert(`Voter ${newUser.username} registered!`, 'success');
      } catch (e: any) {
        showAlert(e.message || 'Registration Failed', 'error');
      }
    };
  };

  const handleAddParty = async () => {
    if (!newParty.name || !newParty.symbol) return showAlert('Party name/symbol required!', 'error');
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

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/analytics/location-turnout');
      const data = await res.json();
      if (data.results) setLocationData(data.results);
      else if (data.data) setLocationData(data.data);
    } catch (e) {
      console.error("Analytics fetch failed", e);
    }
  };

  const menuItems = [
    { id: 'voters', label: 'Voters Registry', icon: Users },
    { id: 'parties', label: 'Political Parties', icon: Flag },
    { id: 'reports', label: 'Turnout Reports', icon: FileText },
    { id: 'settings', label: 'Election Control', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-80 bg-[#003366] text-white flex flex-col shadow-2xl z-20 border-r border-[#FF9933]/50">
        <div className="p-8 bg-[#002244] border-b border-[#FF9933]/30">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-full shadow-lg flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/81/TamilNadu_Logo.svg" alt="TN Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter uppercase leading-none">Admin Panel</h1>
              <p className="text-[10px] text-[#FF9933] font-black uppercase tracking-widest mt-1">SEC TN Division</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 mt-6 space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (item.id === 'reports') fetchAnalytics();
              }}
              className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id
                ? 'bg-white/10 text-white shadow-lg border-2 border-[#FF9933]/50'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              <item.icon className={`w-5 h-5 mr-4 ${activeTab === item.id ? 'text-[#FF9933]' : 'text-slate-400 group-hover:text-[#FF9933]'}`} />
              <div className="text-left flex-1">
                <span className="block font-black text-xs tracking-[0.1em] uppercase">{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 text-[#FF9933]" />}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/10 bg-[#002244]/50">
          <Button onClick={onLogout} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg uppercase font-black text-[10px] tracking-[0.2em] rounded-xl h-12">
            <LogOut className="w-4 h-4 mr-2" /> Secure Logout
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-slate-50 overflow-hidden flex flex-col">
        <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm shrink-0">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Control Center</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Election Management Unit 2026</span>
            </div>
          </div>

          <div className={`px-5 py-2 rounded-2xl flex items-center gap-3 border-2 ${db.electionSettings.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <Activity className={`w-4 h-4 ${db.electionSettings.isActive ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-black uppercase tracking-widest">{db.electionSettings.isActive ? "System Live" : "System Inactive"}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              {activeTab === 'voters' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1">
                    <Card className="bg-white border-none shadow-2xl rounded-[2rem] overflow-hidden">
                      <div className="bg-[#003366] p-6 text-white">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-[#FF9933]" /> Register Voter
                        </h3>
                      </div>
                      <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-[#003366]">Full Name</Label>
                          <Input value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="h-12 rounded-lg border-slate-200 focus:ring-[#003366]" placeholder="Enter Full Name" />
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-[#003366]">EPIC Number</Label>
                          <Input value={newUser.voterId} onChange={e => setNewUser({ ...newUser, voterId: e.target.value })} className="h-12 rounded-lg border-slate-200 focus:ring-[#003366] font-mono uppercase" placeholder="Enter EPIC Number" />
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-[#003366]">Secret Password</Label>
                          <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black tracking-widest text-[#003366]">Biometric Data (Photo)</Label>
                          <div className="border-4 border-dashed border-slate-100 rounded-2xl p-6 text-center hover:bg-slate-50 hover:border-[#FF9933]/30 transition-all cursor-pointer relative overflow-hidden group">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                            />
                            {photoFile ? (
                              <div className="flex flex-col items-center gap-3">
                                <img src={URL.createObjectURL(photoFile)} className="w-24 h-24 rounded-2xl object-cover shadow-xl border-2 border-white" />
                                <span className="text-xs font-black text-green-600 uppercase tracking-widest truncate max-w-full italic">{photoFile.name}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-4 py-4">
                                <div className="p-4 bg-slate-50 rounded-full group-hover:bg-orange-50 transition-colors">
                                  <Users className="w-10 h-10 text-slate-300 group-hover:text-[#FF9933]" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Biometric Reference</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button onClick={handleRegisterUser} className="w-full bg-[#003366] hover:bg-[#002244] text-white font-black uppercase tracking-[0.2em] h-14 rounded-2xl shadow-xl shadow-blue-900/20">
                          Finalize Entry
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="lg:col-span-2">
                    <Card className="bg-white border-none shadow-xl rounded-[2rem] overflow-hidden">
                      <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black text-[#003366] uppercase tracking-[0.2em]">Live Registry ({db.users.filter((u: any) => u.role === 'voter').length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-[700px] overflow-y-auto">
                          <table className="w-full text-left">
                            <thead className="bg-[#003366] text-white text-[10px] font-black uppercase tracking-widest sticky top-0 z-10">
                              <tr>
                                <th className="p-6">Voter Identity</th>
                                <th className="p-6">EPIC Reference</th>
                                <th className="p-6 text-right">Vote Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {db.users.filter((u: any) => u.role === 'voter').map((user: any, i: number) => {
                                const voted = db.votes.some((v: any) => v.userId === user.voterId);
                                return (
                                  <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-6">
                                      <span className="font-black text-[#003366] uppercase">{user.username}</span>
                                    </td>
                                    <td className="p-6">
                                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg group-hover:bg-white transition-colors">{user.voterId}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                      {voted ?
                                        <span className="px-4 py-1.5 bg-green-500 text-white text-[10px] rounded-full font-black uppercase tracking-widest shadow-lg shadow-green-500/20">Recorded</span> :
                                        <span className="px-4 py-1.5 bg-slate-100 text-slate-400 text-[10px] rounded-full font-black uppercase tracking-widest">Awaiting</span>
                                      }
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'parties' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <Card className="bg-white border-none shadow-2xl rounded-[2rem] overflow-hidden">
                      <div className="bg-[#FF9933] p-6 text-white flex justify-between items-center">
                        <h3 className="text-lg font-black uppercase tracking-tight">Register Candidate Party</h3>
                        <Flag className="w-6 h-6 opacity-30" />
                      </div>
                      <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-[#003366]">Party Name</Label>
                            <Input placeholder="Enter Party Name" value={newParty.name} onChange={e => setNewParty({ ...newParty, name: e.target.value })} className="rounded-lg h-12" />
                          </div>
                          <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-[#003366]">Registry Code</Label>
                            <Input placeholder="Enter Symbol Code" value={newParty.symbol} onChange={e => setNewParty({ ...newParty, symbol: e.target.value })} className="rounded-lg h-12" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black text-[#003366]">Official Icon URL</Label>
                          <Input placeholder="Enter Image URL" value={newParty.imageUrl} onChange={e => setNewParty({ ...newParty, imageUrl: e.target.value })} className="rounded-lg h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-[10px] font-black text-[#003366]">Digital Manifesto</Label>
                          <Textarea placeholder="Enter manifesto details..." className="min-h-[120px] rounded-lg p-4 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#003366]" value={newParty.manifesto} onChange={e => setNewParty({ ...newParty, manifesto: e.target.value })} />
                        </div>
                        <Button onClick={handleAddParty} className="w-full bg-[#003366] hover:bg-[#002244] text-white font-black uppercase tracking-[0.2em] h-14 rounded-2xl shadow-xl shadow-blue-900/10">
                          Confirm Registration
                        </Button>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-4">
                      {db.parties.map((p: any, i: number) => (
                        <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 flex items-center gap-6 group">
                          <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 shadow-inner group-hover:bg-[#FF9933]/5 transition-colors overflow-hidden flex items-center justify-center border-2 border-white">
                            {p.imageUrl ?
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" /> :
                              <span className="text-3xl font-black text-slate-300">{p.name[0]}</span>
                            }
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-[#003366] uppercase tracking-tight leading-none">{p.name}</h4>
                            <p className="text-[10px] font-black text-[#FF9933] uppercase mt-2 tracking-widest">Verified Political Entity</p>
                          </div>
                          <div className="ml-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 italic">
                            {p.symbol}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto">
                  <Card className="bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden">
                    <div className="bg-[#D32F2F] p-10 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4 relative z-10">
                        <Shield className="w-10 h-10 text-white" /> Emergency Protocol
                      </h3>
                      <p className="mt-2 text-white/70 font-bold uppercase tracking-[0.2em] text-xs relative z-10">Secure Election Management Unit</p>
                    </div>
                    <CardContent className="p-12 space-y-12">
                      <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Status</div>
                          <div className={`text-4xl font-black uppercase tracking-tighter ${db.electionSettings.isActive ? "text-green-600" : "text-red-500"}`}>
                            {db.electionSettings.isActive ? "Station Open" : "Station Closed"}
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowAuthModal({ show: true, action: db.electionSettings.isActive ? 'stop' : 'start' })}
                          className={`h-20 px-10 rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 ${db.electionSettings.isActive ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-green-600 hover:bg-green-700 shadow-green-500/20"}`}
                        >
                          {db.electionSettings.isActive ? "FORCE STOP" : "MANUAL START"}
                        </Button>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-sm font-black text-[#003366] uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#FF9933]" /> Automatic Polling window
                        </h4>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="uppercase text-[10px] font-black text-slate-400">Opening Schedule (IST)</Label>
                            <Input type="datetime-local" id="sched-start" className="h-14 rounded-2xl bg-white border-2 border-slate-100" />
                          </div>
                          <div className="space-y-3">
                            <Label className="uppercase text-[10px] font-black text-slate-400">Closing Schedule (IST)</Label>
                            <Input type="datetime-local" id="sched-end" className="h-14 rounded-2xl bg-white border-2 border-slate-100" />
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            const s = (document.getElementById('sched-start') as HTMLInputElement).value;
                            const e = (document.getElementById('sched-end') as HTMLInputElement).value;
                            if (!s && !e) return showAlert('Valid times required', 'error');
                            setShowAuthModal({ show: true, action: 'schedule', data: { startTime: s ? new Date(s).toISOString() : null, endTime: e ? new Date(e).toISOString() : null } });
                          }}
                          className="w-full h-14 bg-white border-2 border-slate-200 text-[#003366] hover:bg-slate-50 font-black uppercase tracking-widest rounded-2xl transition-all"
                        >
                          Deploy Time Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-10">
                  <header className="flex items-center justify-between bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-blue-50 rounded-2xl">
                        <Activity className="w-10 h-10 text-[#003366]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Turnout Analytics</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time participation monitoring</p>
                      </div>
                    </div>
                    <Button onClick={fetchAnalytics} className="bg-[#003366] text-white font-black uppercase tracking-widest px-8 rounded-xl h-12 shadow-xl shadow-blue-900/10">Synchronize Data</Button>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="bg-white border-none shadow-xl rounded-[2.5rem] p-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">District Turnout / மாவட்ட வாரியாக</h4>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={locationData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="location" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#003366' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="voted" name="Recorded Votes" radius={[8, 8, 0, 0]} barSize={40}>
                              {locationData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#003366' : '#FF9933'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="bg-white border-none shadow-xl rounded-[2.5rem] p-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Participation Ratio</h4>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={locationData.filter(d => d.voted > 0)}
                              dataKey="voted"
                              nameKey="location"
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={120}
                              paddingAngle={10}
                            >
                              {locationData.map((_, index) => (
                                <Cell key={`cell-pie-${index}`} fill={index % 2 === 0 ? '#003366' : '#FF9933'} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none' }} />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>

                  <Card className="bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[#003366] text-white text-[10px] font-black uppercase tracking-[0.3em]">
                        <tr>
                          <th className="p-8">MANDATED Location</th>
                          <th className="p-8 text-center">Registries</th>
                          <th className="p-8 text-center">Cast Votes</th>
                          <th className="p-8 text-center">Turnout Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {locationData.map((loc, i) => (
                          <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                            <td className="p-8 font-black text-[#003366] flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#FF9933]"></div> {loc.location}
                            </td>
                            <td className="p-8 text-center font-mono text-slate-400 font-bold">{loc.total}</td>
                            <td className="p-8 text-center">
                              <span className="bg-[#003366]/5 px-4 py-1 rounded-lg text-[#003366] font-black text-sm">{loc.voted}</span>
                            </td>
                            <td className="p-8 text-center">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                  <div className={`h-full transition-all duration-1000 ${loc.percentage > 75 ? 'bg-green-500' : 'bg-[#FF9933]'}`} style={{ width: `${loc.percentage}%` }}></div>
                                </div>
                                <span className="text-xs font-black text-[#003366] min-w-[3rem] tracking-tighter">{loc.percentage}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global MFA Overlay */}
        {showAuthModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003366]/80 backdrop-blur-xl p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] shadow-full max-w-lg w-full overflow-hidden">
              <div className="bg-[#002244] p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF9933]/10 rounded-full -mr-16 -mt-16"></div>
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-inner">
                  <Shield className="w-12 h-12 text-[#FF9933]" />
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Vault Authorization</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] mt-3 italic">Identity Verification Required</p>
              </div>
              <div className="p-12 space-y-10">
                <div className="grid grid-cols-2 gap-6">
                  {authPasswords.map((p, i) => {
                    const labels = ['SEC1', 'SEC2', 'OBS1', 'ADM1'];
                    return (
                      <div key={i} className="space-y-3">
                        <Label className="text-[10px] uppercase font-black text-[#003366] tracking-widest pl-2">{labels[i]}</Label>
                        <Input type="password" value={p} onChange={e => {
                          const n = [...authPasswords]; n[i] = e.target.value; setAuthPasswords(n);
                        }} className="h-14 text-center text-xl font-mono focus:ring-4 focus:ring-[#FF9933]/20 rounded-2xl bg-slate-50 border-none shadow-inner" placeholder="••••" />
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest" onClick={() => setShowAuthModal({ show: false, action: 'start' })}>Abort</Button>
                  <Button className="flex-1 h-14 bg-[#003366] hover:bg-[#002244] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/20" onClick={async () => {
                    const { pass1, pass2, pass3, pass4 } = db.electionSettings;
                    if (authPasswords[0] === pass1 && authPasswords[1] === pass2 && authPasswords[2] === pass3 && authPasswords[3] === pass4) {
                      if (showAuthModal.action === 'start') await handleUpdateSettings({ isActive: true, startTime: new Date().toISOString() });
                      else if (showAuthModal.action === 'stop') await handleUpdateSettings({ isActive: false, endTime: new Date().toISOString() });
                      else if (showAuthModal.action === 'schedule') await handleUpdateSettings(showAuthModal.data);
                      setShowAuthModal({ show: false, action: 'start' });
                      setAuthPasswords(['', '', '', '']);
                    } else showAlert('SEGMENT KEY MISMATCH', 'error');
                  }}>Validate Keys</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;