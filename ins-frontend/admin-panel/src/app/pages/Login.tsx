import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/AdminComponents';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/admin.service';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await authService.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2 text-[#2E3440]">I Need Someone</h1>
          <p className="text-[#4C566A]">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E9F0] p-8">
          <h2 className="text-xl font-semibold mb-6 text-[#2E3440]">Sign In</h2>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2E3440] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E9F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 bg-white"
                placeholder="admin@ineedsomeone.com"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#2E3440] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E9F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 bg-white"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-[#E5E9F0] mr-2"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span className="text-sm text-[#4C566A]">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setForgotEmail(email); setForgotSent(false); }}
                className="text-sm text-[#5B7CFA] hover:text-[#4A6BE8]"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <Button variant="primary" className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#4C566A]">
            Admin access only. No public sign-up available.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-2 text-[#2E3440]">Reset Password</h2>
            {forgotSent ? (
              <div>
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                  Password reset email sent. Please check your inbox.
                </p>
                <Button variant="primary" className="w-full" onClick={() => setShowForgotPassword(false)}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p className="text-sm text-[#4C566A] mb-4">Enter your email address and we'll send you a link to reset your password.</p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E9F0] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30"
                  placeholder="admin@ineedsomeone.com"
                  required
                />
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowForgotPassword(false)} type="button">Cancel</Button>
                  <Button variant="primary" className="flex-1" disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}