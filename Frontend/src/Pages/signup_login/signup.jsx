import React, { useEffect, useState } from "react";
import "./Signup.css"
import { Link, useNavigate } from "react-router-dom";
import { Box, Button } from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";
import { USERS_API_BASE_URL } from "../../config/api";
const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const { loginWithRedirect, isAuthenticated, user } = useAuth0();
  let navigate = useNavigate();

  const handleAuth0Signup = () => {
    const auth0Domain = process.env.REACT_APP_AUTH0_DOMAIN;
    const auth0ClientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
    const auth0CallbackUrl = process.env.REACT_APP_AUTH0_CALLBACK_URL || window.location.origin;

    if (!auth0Domain || !auth0ClientId) {
      alert("Auth0 is not configured yet. Add REACT_APP_AUTH0_DOMAIN and REACT_APP_AUTH0_CLIENT_ID to your frontend .env file.");
      return;
    }

    const redirectConfig = {
      authorizationParams: {
        screen_hint: "signup",
        redirect_uri: auth0CallbackUrl,
      },
    };

    if (typeof loginWithRedirect === "function") {
      loginWithRedirect(redirectConfig);
      return;
    }

    const authUrl = new URL(`https://${auth0Domain}/authorize`);
    authUrl.searchParams.set("client_id", auth0ClientId);
    authUrl.searchParams.set("redirect_uri", auth0CallbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("screen_hint", "signup");
    window.location.href = authUrl.toString();
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      const authUser = {
        name: user.name,
        email: user.email,
        picture: user.picture,
        authProvider: "auth0",
        sub: user.sub,
      };
      localStorage.setItem("user", JSON.stringify(authUser));
      navigate("/menu");
    }
  }, [isAuthenticated, user, navigate]);

  async function registerUser(event) {
    event.preventDefault();
    const response = await fetch(`${USERS_API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        mobile,
        password,
      }),
    });
    const data = await response.json();
    if (response.ok && data) {
        console.log(data);
      localStorage.removeItem("user");
      alert(data.message);
      navigate("/login", { replace: true });
    } else {
      alert(data.message || "Signup failed");
    }
    console.log("data:", data);
  }
  return (
    <>
    <div className="outerSection">
      <Box w={["95%","70%","50%","30%"]} className="signupsection">
        <div className="signupmainbox">
          <h1 id="signupTitle">CREATE AN ACCOUNT</h1>
          <div className="signupformdiv">
            <form onSubmit={registerUser} className="signupform">
              <div className="input-data">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {/* <div className="underline"></div> */}
                <label>Name*</label>
              </div>
              <div id="signuperrorBox"></div>
              <div className="input-data">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {/* <div className="underline"></div> */}
                <label>Email*</label>
              </div>
              <div id="signuperrorBox"></div>
              <div className="input-data">
                <input
                  type="tel"
                  name="mobile"
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
                {/* <div className="underline"></div> */}
                <label>Mobile*</label>
              </div>
              <div id="signuperrorBox"></div>
              <div className="input-data">
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength="6"
                  required
                />
                {/* <div className="underline"></div> */}
                <label>Password*</label>
              </div>
              <div id="signuperrorBox"></div>
              <div className="checkifrequired">
                <div className="checkBoxflex">
                  <div className="checkBoxDiv">
                    <input type="checkbox" name="checkbox" id="checkboxtick" />
                  </div>
                  <div className="checkBoxText">
                    <p>
                      By selecting the box, you agree to our{" "}
                      <span className="cLink">Privacy Policy</span> and{" "}
                      <span className="cLink">Terms of Use.</span>
                    </p>
                  </div>
                </div>
                <div className="checkBoxflex">
                  <div className="checkBoxDiv">
                    <input type="checkbox" name="checkbox" id="checkboxtick2" />
                  </div>
                  <div className="checkBoxText">
                    <p>Sign up for Email updates and Promotions</p>
                  </div>
                </div>
              </div>
              <div className="signupBtndiv">
                <input type="submit" value="Create Account" />
              </div>
              <div className="signupBtndiv" style={{ marginTop: "12px" }}>
                <Button
                  type="button"
                  width="100%"
                  colorScheme="purple"
                  onClick={handleAuth0Signup}
                >
                  Continue with Auth0
                </Button>
              </div>
              <div className="redirecttologin">
                <p className="redirectlogintext">
                  Already a member?
                  <Link to={"/login"}>
                    <span className="redirectloginlink">Log In</span>
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </Box>
      </div>
    </>
  );
};

export default SignUp;
