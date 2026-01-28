import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, UserCheck, ShieldCheck, Loader2, XCircle, CheckCircle, Download, Activity } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { ElectionCommission } from './components/ElectionCommission';
import { VotingBooth } from './components/VotingBooth';
import { useElection } from './hooks/useElection';
import { LivenessCheck } from './components/LivenessCheck';
import { verifyVoter } from './utils/voterVerification';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function App() {
  const {
    db,
    updateDb,
    addParty,
    registerUser,
    castVote,
    updateSettings,
    hasVoted
  } = useElection();
  const [view, setView] = useState('landing');
  const [epicNumber, setEpicNumber] = useState('');
  const [voterName, setVoterName] = useState('');
  const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });
  const [commLoginData, setCommLoginData] = useState({ username: '', password: '' });
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const showAlert = (message: string, type = 'error') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const handleAdminLogin = () => {
    if (!db) return;
    if (adminLoginData.username === db.admin.username && adminLoginData.password === db.admin.password) {
      setView('admin-dashboard');
      return;
    }
    showAlert('Invalid Admin Credentials');
  };

  const handleCommLogin = () => {
    if (!db) return;
    const comm = db.users.find((u: any) => u.role === 'commission');
    if (comm && commLoginData.username === comm.username && commLoginData.password === comm.password) {
      setView('commission-dashboard');
      return;
    }
    showAlert('Invalid Commission Credentials');
  };

  const handleEpicCheck = async () => {
    if (!epicNumber) {
      showAlert('Please enter EPIC Number / தயவுசெய்து EPIC எண்ணை உள்ளிடவும்');
      return;
    }

    // Check if Election is Active
    if (!db?.electionSettings.isActive) {
      showAlert('Election is NOT Active. Please wait for the administrator to start polling.', 'error');
      return;
    }

    // Check for Double Voting - Redirect to Receipt
    if (hasVoted(epicNumber)) {
      const pastVote = db?.votes.find(v => v.userId === epicNumber);
      if (pastVote) {
        setLoading(true);
        try {
          const name = await verifyVoter(epicNumber);
          setVoterName(name || "Voter");
          setTxHash(pastVote.hash || "Processing...");
          showAlert('Vote Record Found. Showing Receipt.', 'success');
          setView('success');
        } catch (error) {
          console.error(error);
          showAlert('Error retrieving voter details.');
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    setLoading(true);
    try {
      const name = await verifyVoter(epicNumber);
      if (!name) {
        showAlert('EPIC Number not found / EPIC எண் பட்டியலில் இல்லை');
        setLoading(false);
        return;
      }
      setVoterName(name);
      setView('liveness');
    } catch (error) {
      console.error(error);
      showAlert('Error verifying voter.');
    } finally {
      setLoading(false);
    }
  };

  const handleLivenessVerified = () => {
    setView('voting');
  };

  const handleVote = async (partyName: string) => {
    if (!db || loading) return;
    setLoading(true);

    try {
      // 1. Submit to Backend (Database + Blockchain)
      // We rely on the backend to execute the blockchain transaction and return the real hash.
      const result = await castVote({
        userId: epicNumber,
        partyName,
        boothId: 'ONLINE',
        hash: null
      });

      console.log('Vote Result:', result);

      if (result && result.tx_hash) {
        setTxHash(result.tx_hash);
      } else {
        setTxHash('Hash Pending / Not Returned');
      }
      setView('success');

    } catch (error: any) {
      console.error('Voting Error:', error);
      showAlert(error.message || 'Voting Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    const input = document.getElementById('receipt-card');
    if (!input) return;

    try {
      setLoading(true);
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Vote_Receipt_${epicNumber}.pdf`);
      showAlert('Receipt Downloaded Successfully', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to download receipt');
    } finally {
      setLoading(false);
    }
  };

  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'voting') {
      setTimeLeft(30); // Reset timer to 30s
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            showAlert('Session Timed Out / அமர்வு நேரம் முடிந்தது', 'error');
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view]);

  const handleLogout = () => {
    setEpicNumber('');
    setVoterName('');
    setView('landing');
    setAdminLoginData({ username: '', password: '' });
    setCommLoginData({ username: '', password: '' });
  };

  if (!db) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-8 p-12">
        <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl border-2 border-[#FF9933] p-4 relative animate-bounce overflow-hidden">
          <img src="/tn-emblem.png" alt="TN State Logo" className="w-full h-full object-contain" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter">தமிழ்நாடு மாநில தேர்தல் ஆணையம்</h2>
          <p className="text-[#FF9933] font-black uppercase tracking-[0.3em] text-sm">Tamil Nadu State Election Commission</p>
          <div className="mt-8 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#003366]" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Initialising Secure Systems</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/50 font-sans text-slate-800 relative overflow-x-hidden">

      {/* TN Govt Theme Header Stripe */}
      <div className="fixed top-0 inset-x-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-black z-50"></div>

      {/* Background Motifs */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/81/TamilNadu_Logo.svg')", backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '50%' }}></div>

      <div className="relative z-10">
        {alert.show && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
            <Alert className={`shadow-xl border-l-8 ${alert.type === 'error' ? 'bg-white border-l-red-600 text-red-900' : 'bg-white border-l-green-600 text-green-900'}`}>
              <AlertDescription className="font-bold flex items-center gap-3 text-lg">
                {alert.type === 'error' ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                {alert.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* HEADER - Global Futuristic Header */}
        {view !== 'admin-dashboard' && (
          <header className="bg-[#003366] border-b-2 border-[#FF9933]/50 p-4 sticky top-0 z-40 shadow-xl">
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-inner border-2 border-[#FF9933] overflow-hidden">
                <img src="/tn-emblem.png" alt="TN State Emblem" className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter leading-none uppercase">
                  தமிழ்நாடு மாநில தேர்தல் ஆணையம்
                </h1>
                <p className="text-[10px] md:text-xs font-bold text-[#FF9933] uppercase tracking-[0.2em] mt-1">
                  Tamil Nadu State Election Commission
                </p>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${db.electionSettings.isActive ? 'bg-green-600/10 border-green-500 text-green-400' : 'bg-red-600/10 border-red-500 text-red-400'}`}>
                  <Activity className={`w-4 h-4 ${db.electionSettings.isActive ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{db.electionSettings.isActive ? "Polling Active" : "Polling Closed"}</span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Landing / Voter Entry */}
        {(view === 'landing' || view === 'admin-login' || view === 'commission-login') && (
          <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white shadow-[0_50px_100px_rgba(0,51,102,0.15)] rounded-[3rem] overflow-hidden border-none text-center">
              <div className="bg-[#003366] p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <div className="w-24 h-24 bg-white rounded-3xl mx-auto mb-6 p-4 shadow-xl border-2 border-[#FF9933]">
                  <img src="/tn-emblem.png" alt="TN Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-3xl font-black text-white relative z-10 mb-2 uppercase tracking-tighter">
                  {view === 'landing' ? 'Voter Entry' :
                    view === 'admin-login' ? 'Admin Office' :
                      'Commission'}
                </h2>
                <p className="text-[#FF9933] font-black uppercase tracking-[0.3em] text-[10px] relative z-10">
                  {view === 'landing' ? 'அடையாளச் சரிபார்ப்பு' :
                    view === 'admin-login' ? 'நிர்வாக அணுகல்' :
                      'ஆணையர் அணுகல்'}
                </p>
              </div>

              <CardContent className="p-10 space-y-10">

                {view === 'landing' && (
                  <>
                    <div className="space-y-6 text-left">
                      <div className="space-y-4">
                        <Label className="text-[#003366] font-black uppercase text-[10px] tracking-widest pl-2">
                          EPIC Reference Identification / அடையாள எண்
                        </Label>
                        <div className="relative">
                          <Input
                            className="pl-14 h-16 text-2xl font-mono tracking-[0.2em] uppercase bg-slate-50 border-none rounded-2xl shadow-inner focus:ring-4 focus:ring-[#FF9933]/20 transition-all font-black"
                            placeholder="ABC1234567"
                            value={epicNumber}
                            onChange={(e) => setEpicNumber(e.target.value.toUpperCase())}
                          />
                          <UserCheck className="absolute left-5 top-5 text-[#003366] w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full h-16 text-lg font-black bg-[#003366] hover:bg-[#002244] text-white shadow-2xl shadow-blue-900/20 transition-all duration-300 rounded-2xl uppercase tracking-[0.2em]"
                      onClick={handleEpicCheck}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin mr-3 w-6 h-6" /> VERIFYING...
                        </>
                      ) : (
                        <>
                          AUTHENTICATE
                        </>
                      )}
                    </Button>
                  </>
                )}

                {view === 'admin-login' && (
                  <div className="space-y-8 text-left">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest pl-2">Security ID</Label>
                        <Input
                          className="h-14 bg-slate-50 border-none rounded-2xl shadow-inner font-black px-6"
                          value={adminLoginData.username}
                          onChange={(e) => setAdminLoginData({ ...adminLoginData, username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest pl-2">Passcode</Label>
                        <Input
                          type="password"
                          className="h-14 bg-slate-50 border-none rounded-2xl shadow-inner font-black px-6"
                          value={adminLoginData.password}
                          onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-14 bg-[#003366] hover:bg-[#002244] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/10"
                      onClick={handleAdminLogin}
                    >
                      Vault Entry
                    </Button>
                  </div>
                )}

                {view === 'commission-login' && (
                  <div className="space-y-8 text-left">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest pl-2">Inspectorate ID</Label>
                        <Input
                          className="h-14 bg-slate-50 border-none rounded-2xl shadow-inner font-black px-6"
                          value={commLoginData.username}
                          onChange={(e) => setCommLoginData({ ...commLoginData, username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest pl-2">Authorization Key</Label>
                        <Input
                          type="password"
                          className="h-14 bg-slate-50 border-none rounded-2xl shadow-inner font-black px-6"
                          value={commLoginData.password}
                          onChange={(e) => setCommLoginData({ ...commLoginData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-14 bg-[#003366] hover:bg-[#002244] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/10"
                      onClick={handleCommLogin}
                    >
                      Authorize Access
                    </Button>
                  </div>
                )}

                <div className="pt-8 border-t border-slate-100 flex flex-col gap-6">
                  {view === 'landing' ? (
                    <div className="flex items-center justify-center gap-10">
                      <button
                        onClick={() => setView('admin-login')}
                        className="text-[10px] font-black text-slate-400 hover:text-[#FF9933] flex flex-col items-center gap-2 uppercase tracking-[0.2em] transition-colors"
                      >
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-orange-50"><Lock className="w-4 h-4" /></div> Admin
                      </button>
                      <button
                        onClick={() => setView('commission-login')}
                        className="text-[10px] font-black text-slate-400 hover:text-[#003366] flex flex-col items-center gap-2 uppercase tracking-[0.2em] transition-colors"
                      >
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50"><ShieldCheck className="w-4 h-4" /></div> Board
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setView('landing')}
                      className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-[#003366]"
                    >
                      &larr; Voter Portal Entry
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'liveness' && (
          <LivenessCheck
            onVerified={handleLivenessVerified}
            onCancel={() => setView('landing')}
            voterId={epicNumber}
          />
        )}

        {view === 'voting' && (
          <div className="flex-1 flex flex-col pt-8 pb-20 bg-white">
            <div className="max-w-7xl mx-auto w-full px-4">
              {/* Security Header for Voting */}
              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 p-8 bg-[#003366] rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF9933]/10 rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-[#FF9933] uppercase tracking-[0.3em] mb-2">Secure Voting Interface</p>
                  <h1 className="text-4xl font-black text-white leading-none uppercase tracking-tighter">Cast Your Vote</h1>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center p-2">
                      <UserCheck className="w-full h-full text-[#FF9933]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/70 uppercase">Voter: {voterName}</p>
                      <p className="text-[10px] font-mono text-[#FF9933]">{epicNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-end">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[160px] text-center">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Session Expiry</p>
                    <p className={`text-4xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-[#FF9933]'}`}>
                      00:{timeLeft.toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-[2.5rem] p-4 md:p-8 border border-slate-100 shadow-inner">
                <VotingBooth
                  parties={db.parties}
                  onVote={handleVote}
                  onViewPartyInfo={() => { }}
                  isLoading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {view === 'success' && (
          <div className="min-h-[80vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-none shadow-[0_50px_100px_rgba(0,51,102,0.1)] relative overflow-hidden bg-white rounded-[3rem]">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#FF9933]"></div>

              {/* Receipt Content Wrapper for Capture */}
              <div id="receipt-card" className="bg-white">
                <CardContent className="text-center pt-12 pb-10 px-10 space-y-10">
                  <div className="w-24 h-24 bg-white rounded-2xl mx-auto p-4 shadow-xl border-2 border-[#FF9933]">
                    <img src="/tn-emblem.png" alt="TN Logo" className="w-full h-full object-contain" />
                  </div>

                  <div>
                    <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter leading-none mb-2">வாக்களித்ததிற்கு நன்றி</h2>
                    <p className="text-[10px] text-[#FF9933] font-black uppercase tracking-[0.3em]">Vote Recorded Successfully</p>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-left relative shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest">Digital Audit Certificate</p>
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voter Identity</span>
                        <span className="text-sm font-black text-[#003366] uppercase">{voterName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EPIC Reference</span>
                        <span className="text-sm font-black text-[#003366] font-mono">{epicNumber}</span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Hash</span>
                        <div className="p-3 bg-white rounded-xl border border-slate-100 break-all font-mono text-[10px] text-[#FF9933] shadow-sm leading-relaxed">
                          {txHash || "AUTHENTICATION PENDING..."}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Timestamp</span>
                        <span className="text-[10px] font-black text-[#003366] uppercase">{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4" data-html2canvas-ignore="true">
                    <Button
                      onClick={handleDownloadReceipt}
                      className="w-full h-16 bg-[#003366] hover:bg-[#002244] text-white font-black tracking-widest uppercase rounded-2xl shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 transition-all"
                    >
                      <Download className="w-5 h-5" /> EXPORT AUDIT PDF
                    </Button>
                    <Button
                      onClick={handleLogout}
                      className="w-full h-14 bg-white border-2 border-slate-100 text-slate-400 hover:text-[#003366] hover:bg-slate-50 font-black tracking-widest uppercase rounded-2xl transition-all"
                    >
                      EXIT AUTHORIZED SESSION
                    </Button>
                  </div>

                </CardContent>
              </div>
            </Card>
          </div>
        )}

        {view === 'admin-dashboard' && (
          <AdminDashboard
            db={db}
            updateDb={updateDb}
            addParty={addParty}
            registerUser={registerUser}
            updateSettings={updateSettings}
            onLogout={handleLogout}
            showAlert={showAlert}
          />
        )}

        {view === 'commission-dashboard' && (
          <ElectionCommission
            db={db}
            onLogout={handleLogout}
            showAlert={showAlert}
          />
        )}
      </div>
    </div>
  );
}

export default App;
