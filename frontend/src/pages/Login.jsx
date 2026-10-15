import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import backgroundImage from "../assets/greenshield-bg.png";

const API = "https://greenshield-2.onrender.com";

const css = `
* {
  box-sizing: border-box;
}

.gs-auth {
  min-height: 100vh;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f8faf8;
  font-family: Arial, Helvetica, sans-serif;
}

/* LEFT GREEN PANEL */




.gs-auth-side {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 55px 8%;
  color: #ffffff;

  /* Show the full background design */
  background-color: #003322;
  background-image: url(${backgroundImage});
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 100% 100%;
}



.gs-auth-side::before {
  content: "";
  position: absolute;
  width: 520px;
  height: 520px;
  top: -380px;
  left: -260px;
  border: 1px solid rgba(63,201,119,.18);
  border-radius: 50%;
  box-shadow:
    0 0 0 35px rgba(63,201,119,.025),
    0 0 0 75px rgba(63,201,119,.02);
  pointer-events: none;
}

.gs-auth-side::after {
  content: "";
  position: absolute;
  width: 650px;
  height: 300px;
  right: -400px;
  bottom: -230px;
  border: 2px solid rgba(32,180,93,.25);
  border-radius: 50%;
  transform: rotate(-18deg);
  pointer-events: none;
}

.gs-auth-logo {
  display: block;
  width: min(100%, 400px);
  max-height: 310px;
  object-fit: contain;
  margin: 0 auto 55px;
  position: relative;
  z-index: 1;
}

.gs-auth-side h1 {
  margin:0 0 20px;
  font-size: clamp(30px, 3vw, 44px);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -1.2px;
  position: relative;
  z-index: 1;
  margin-top:-45px
}

.gs-auth-side p {
  max-width: 520px;
  margin: 0;
  color: #e0eee7;
  font-size: 16px;
  line-height: 1.9;
  position: relative;
  z-index: 1;
}

.gs-auth-note {
  margin-top: auto;
  padding-top: 65px;
  font-size: 13px;
  color: #c2e8d2;
  position: relative;
  z-index: 1;
}

/* RIGHT FORM PANEL */
.gs-auth-main {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 55px 9%;
  background: linear-gradient(135deg, #ffffff, #f7faf7);
}

.gs-auth-card {
  width: 100%;
  max-width: 490px;
}

.gs-auth-card h2 {
  margin: 0 0 12px;
  color: #06452f;
  font-size: 36px;
  font-weight: 800;
}

.gs-auth-subtitle {
  margin: 0 0 36px;
  color: #74877d;
  font-size: 15px;
  line-height: 1.6;
}

.gs-auth-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.gs-auth-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gs-auth-field label {
  font-size: 14px;
  font-weight: 700;
  color: #073c2a;
}

.gs-auth-field input {
  width: 100%;
  height: 57px;
  padding: 0 17px;
  border: 1px solid #cfddd4;
  border-radius: 10px;
  outline: none;
  background: #ffffff;
  color: #193e2e;
  font-size: 14px;
  transition: border-color .2s, box-shadow .2s;
}

.gs-auth-field input::placeholder {
  color: #91a1b8;
}

.gs-auth-field input:focus {
  border-color: #087a45;
  box-shadow: 0 0 0 3px rgba(8,122,69,.1);
}

/* SHOW / HIDE PASSWORD */
.gs-password-wrapper {
  position: relative;
  width: 100%;
}

.gs-password-wrapper input {
  padding-right: 75px;
}

.gs-password-toggle {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #087541;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 8px 0;
}

.gs-password-toggle:hover {
  color: #056437;
}

.gs-password-toggle:focus-visible {
  outline: 2px solid #087541;
  outline-offset: 3px;
  border-radius: 3px;
}

/* BUTTON */
.gs-auth-button {
  width: 100%;
  min-height: 55px;
  margin-top: 5px;
  border: none;
  border-radius: 10px;
  background: #087541;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s, transform .2s;
}

.gs-auth-button:hover {
  background: #056437;
}

.gs-auth-button:active {
  transform: scale(.99);
}

.gs-auth-button:disabled {
  opacity: .7;
  cursor: not-allowed;
}

.gs-auth-switch {
  margin-top: 32px;
  color: #7c9185;
  font-size: 14px;
}

.gs-auth-switch a {
  color: #087541;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.gs-auth-error {
  margin: 0;
  color: #c62828;
  font-size: 14px;
  line-height: 1.5;
}

/* RESPONSIVE */
@media (max-width: 850px) {
  .gs-auth {
    grid-template-columns: 1fr;
  }

  .gs-auth-side {
    min-height: 400px;
    padding: 40px 7%;
  }

  .gs-auth-logo {
    width: min(100%, 280px);
    max-height: 200px;
    margin-bottom: 30px;
  }

  .gs-auth-side h1 {
    font-size: 30px;
  }

  .gs-auth-note {
    padding-top: 30px;
  }

  .gs-auth-main {
    min-height: auto;
    padding: 55px 7%;
  }
}

@media (max-width: 480px) {
  .gs-auth-side {
    min-height: 350px;
    padding: 32px 6%;
  }

  .gs-auth-side h1 {
    font-size: 27px;
  }

  .gs-auth-side p {
    font-size: 14px;
  }

  .gs-auth-card h2 {
    font-size: 31px;
  }

  .gs-auth-main {
    padding: 40px 6%;
  }
}
`;

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const switchMode = () => {
    setMode((previous) =>
      previous === "login" ? "register" : "login"
    );
    setError("");
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isLogin
        ? `${API}/api/auth/login`
        : `${API}/api/auth/register`;

      const body = isLogin
        ? {
            email: form.email,
            password: form.password,
          }
        : {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
          };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Something went wrong. Please try again."
        );
      }

      localStorage.setItem(
        "greenshieldUser",
        JSON.stringify(data)
      );

      navigate("/");
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Cannot reach the server. Start the Spring Boot backend on port 8080."
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>

      <div className="gs-auth">
        {/* Left green panel */}
        <section className="gs-auth-side">
          <img
            src={logo}
            alt="GreenShield logo"
            className="gs-auth-logo"
          />

          <h1>Know your risk. Stay safe.</h1>

          <p>
            Check the live flood, fire and cyclone risk in your area
            and get an SMS alert when it turns high.
          </p>

          <div className="gs-auth-note">
            Your phone number is used only for safety alerts.
          </div>
        </section>

        {/* Right login/register panel */}
        <main className="gs-auth-main">
          <div className="gs-auth-card">
            <h2>
              {isLogin ? "Log in" : "Create an account"}
            </h2>

            <p className="gs-auth-subtitle">
              {isLogin
                ? "Use the email and password you registered with."
                : "Register to receive GreenShield safety alerts."}
            </p>

            <form
              className="gs-auth-form"
              onSubmit={handleSubmit}
            >
              {!isLogin && (
                <>
                  <div className="gs-auth-field">
                    <label htmlFor="name">Full name</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="gs-auth-field">
                    <label htmlFor="phone">Phone number</label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </>
              )}

              <div className="gs-auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="gs-auth-field">
                <label htmlFor="password">Password</label>

                <div className="gs-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete={
                      isLogin
                        ? "current-password"
                        : "new-password"
                    }
                    required
                  />

                  <button
                    type="button"
                    className="gs-password-toggle"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <p className="gs-auth-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="gs-auth-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Log in"
                  : "Create account"}
              </button>
            </form>

            <div className="gs-auth-switch">
              {isLogin
                ? "New to GreenShield? "
                : "Already have an account? "}

              <a
                href={isLogin ? "#register" : "#login"}
                onClick={(e) => {
                  e.preventDefault();
                  switchMode();
                }}
              >
                {isLogin ? "Create an account" : "Log in"}
              </a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}