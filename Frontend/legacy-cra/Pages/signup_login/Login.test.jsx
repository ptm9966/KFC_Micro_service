import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "./Login";
import { BrowserRouter } from "react-router-dom";

const mockLoginWithRedirect = jest.fn();

process.env.REACT_APP_AUTH0_DOMAIN = "test-auth0-domain";
process.env.REACT_APP_AUTH0_CLIENT_ID = "test-auth0-client-id";
window.alert = jest.fn();

jest.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    loginWithRedirect: mockLoginWithRedirect,
    logout: jest.fn(),
    user: null,
  }),
}));

jest.mock("@chakra-ui/react", () => ({
  Box: ({ children }) => <div>{children}</div>,
  Button: ({ children, onClick, type, ...props }) => (
    <button type={type} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => false,
}));

test("renders an Auth0 login button for the login page", () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

  const authButton = screen.getByRole("button", { name: /continue with auth0/i });
  expect(authButton).toBeInTheDocument();

  fireEvent.click(authButton);
  expect(mockLoginWithRedirect).toHaveBeenCalled();
});
