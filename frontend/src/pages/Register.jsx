import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { CreditCard, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const { registerCompany } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Verification code fields
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verifying, setVerifying] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await registerCompany(data.name, data.email, data.password, data.companyName);
      setSuccessMsg('Registration successful! A verification email has been dispatched to your email inbox. Click the verification link in your email or paste the token string below.');
      setVerificationMode(true);
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setErrorMsg('');
    try {
      await api.post('/auth/verify-email', { token: verificationToken });
      setSuccessMsg('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Verification failed. Please check the token.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-950">
      <div className="w-full max-w-lg space-y-8 glass-card border border-white/5 bg-slate-900/40 p-8 rounded-3xl shadow-xl">
        <div className="flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight text-glow-brand">
            Onboard Company Admin
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Or{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
              login with your credentials
            </Link>
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!verificationMode ? (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="block w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  placeholder="John Doe"
                />
                {errors.name && <p className="mt-1 text-[11px] text-rose-400 font-semibold">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  {...register('companyName', { required: 'Company name is required' })}
                  className="block w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  placeholder="Acme Corp"
                />
                {errors.companyName && <p className="mt-1 text-[11px] text-rose-400 font-semibold">{errors.companyName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                Admin Work Email
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="block w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm transition-all"
                placeholder="admin@acme.com"
              />
              {errors.email && <p className="mt-1 text-[11px] text-rose-400 font-semibold">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required', 
                  minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                })}
                className="block w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm transition-all"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-[11px] text-rose-400 font-semibold">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold tracking-wide mt-4"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Get Started'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleVerifyToken}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Paste Verification Token
              </label>
              <input
                type="text"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                required
                className="block w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-white text-center tracking-widest text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono"
                placeholder="verification-token-string"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="btn-gradient flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold tracking-wide"
            >
              {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
