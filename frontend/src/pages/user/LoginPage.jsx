import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../../api/client";
import { saveAuthData } from "../../auth/tokenStorage";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await apiRequest("/auth/login/", {
        method: "POST",
        body: JSON.stringify(formData),
        skipAuth: true,
      });

      saveAuthData(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          CodeGuide
        </p>

        <h1 className="mt-3 text-3xl font-bold">Login</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button className="w-full rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300">
            Login
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          New to CodeGuide?{" "}
          <Link to="/register" className="text-cyan-400 hover:underline">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
